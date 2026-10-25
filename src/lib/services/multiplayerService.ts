import { and, eq, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import {
  multiplayerMatches,
  multiplayerMatchResults,
  multiplayerRoomMembers,
  multiplayerRooms,
  profiles,
} from "@/db/schema";
import { pickRandomPuzzleForMatch } from "@/lib/multiplayer/puzzlePool";
import { Difficulty } from "@/lib/sudoku/types";
import { parseBoardString, Board } from "@/lib/sudoku/types";
import { isBoardComplete, countCorrectCells } from "@/lib/sudoku/validator";
import { getEquippedMap } from "./profileService";
import { applyRatedMatchResults, recordUnratedParticipation } from "./ratingService";
import { evaluateAndApplyAchievements } from "./achievementService";
import type { MatchStateView, RoomMemberView, RoomView } from "@/lib/multiplayer/types";
import { HEARTBEAT_STALE_MS } from "@/lib/multiplayer/types";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const COUNTDOWN_MS = 5000;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

export class MultiplayerError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export interface CreateRoomInput {
  difficulty: Difficulty;
  maxPlayers: number;
  rated: boolean;
  timeLimitS: number;
}

export async function createRoom(hostProfileId: string, input: CreateRoomInput) {
  const maxPlayers = Math.min(4, Math.max(2, input.maxPlayers));
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateCode();
    try {
      const [room] = await db
        .insert(multiplayerRooms)
        .values({
          id: randomUUID(),
          code,
          hostProfileId,
          status: "lobby",
          difficulty: input.difficulty,
          maxPlayers,
          rated: input.rated,
          timeLimitS: Math.min(1800, Math.max(120, input.timeLimitS)),
        })
        .returning();

      await db.insert(multiplayerRoomMembers).values({
        roomId: room.id,
        profileId: hostProfileId,
        seat: 0,
        isHost: true,
        isReady: false,
        status: "joined",
      });

      return room;
    } catch {
      // unique constraint collision on code - retry with a new one
      continue;
    }
  }
  throw new MultiplayerError("room_creation_failed", "無法建立房間，請再試一次");
}

async function fetchRoomByCode(code: string) {
  const [room] = await db
    .select()
    .from(multiplayerRooms)
    .where(eq(multiplayerRooms.code, code.toUpperCase()));
  return room ?? null;
}

async function fetchMembers(roomId: string) {
  return db.select().from(multiplayerRoomMembers).where(eq(multiplayerRoomMembers.roomId, roomId));
}

export async function joinRoom(code: string, profileId: string) {
  const room = await fetchRoomByCode(code);
  if (!room) throw new MultiplayerError("not_found", "找不到房間，請確認房號是否正確");
  if (room.status === "closed") throw new MultiplayerError("closed", "房間已關閉");

  const members = await fetchMembers(room.id);
  const existing = members.find((m) => m.profileId === profileId);
  if (existing) {
    if (existing.status === "left") {
      await db
        .update(multiplayerRoomMembers)
        .set({ status: "joined", lastSeenAt: new Date() })
        .where(eq(multiplayerRoomMembers.id, existing.id));
    }
    return room;
  }

  if (room.status !== "lobby") {
    throw new MultiplayerError("in_progress", "比賽已經開始，無法加入");
  }

  const activeMembers = members.filter((m) => m.status !== "left");
  if (activeMembers.length >= room.maxPlayers) {
    throw new MultiplayerError("full", "房間已滿");
  }

  const usedSeats = new Set(activeMembers.map((m) => m.seat));
  let seat = 0;
  while (usedSeats.has(seat)) seat++;

  await db.insert(multiplayerRoomMembers).values({
    roomId: room.id,
    profileId,
    seat,
    isHost: false,
    isReady: false,
    status: "joined",
  });

  return room;
}

export async function leaveRoom(code: string, profileId: string) {
  const room = await fetchRoomByCode(code);
  if (!room) return;
  const members = await fetchMembers(room.id);
  const member = members.find((m) => m.profileId === profileId);
  if (!member) return;

  await db
    .update(multiplayerRoomMembers)
    .set({ status: "left" })
    .where(eq(multiplayerRoomMembers.id, member.id));

  const remaining = members.filter((m) => m.profileId !== profileId && m.status !== "left");

  if (member.isHost && remaining.length > 0) {
    const nextHost = remaining.sort((a, b) => a.seat - b.seat)[0];
    await db.update(multiplayerRoomMembers).set({ isHost: true }).where(eq(multiplayerRoomMembers.id, nextHost.id));
    await db.update(multiplayerRooms).set({ hostProfileId: nextHost.profileId }).where(eq(multiplayerRooms.id, room.id));
  }

  if (remaining.length === 0 && room.status !== "racing" && room.status !== "countdown") {
    await db.update(multiplayerRooms).set({ status: "closed", updatedAt: new Date() }).where(eq(multiplayerRooms.id, room.id));
  }
}

export async function setReady(code: string, profileId: string, ready: boolean) {
  const room = await fetchRoomByCode(code);
  if (!room) throw new MultiplayerError("not_found", "找不到房間");
  if (room.status !== "lobby") throw new MultiplayerError("in_progress", "比賽已經開始");
  await db
    .update(multiplayerRoomMembers)
    .set({ isReady: ready, lastSeenAt: new Date() })
    .where(and(eq(multiplayerRoomMembers.roomId, room.id), eq(multiplayerRoomMembers.profileId, profileId)));
}

export async function heartbeat(code: string, profileId: string) {
  const room = await fetchRoomByCode(code);
  if (!room) return;
  await db
    .update(multiplayerRoomMembers)
    .set({ lastSeenAt: new Date() })
    .where(and(eq(multiplayerRoomMembers.roomId, room.id), eq(multiplayerRoomMembers.profileId, profileId)));
}

export async function startMatch(code: string, hostProfileId: string) {
  const room = await fetchRoomByCode(code);
  if (!room) throw new MultiplayerError("not_found", "找不到房間");
  if (room.hostProfileId !== hostProfileId) throw new MultiplayerError("not_host", "只有房主可以開始比賽");
  if (room.status !== "lobby") throw new MultiplayerError("in_progress", "比賽已經開始");

  const members = (await fetchMembers(room.id)).filter((m) => m.status !== "left");
  if (members.length < 2) throw new MultiplayerError("not_enough_players", "至少需要兩位玩家才能開始");
  const allReady = members.every((m) => m.isHost || m.isReady);
  if (!allReady) throw new MultiplayerError("not_ready", "還有玩家尚未準備完成");

  const puzzle = pickRandomPuzzleForMatch(room.difficulty as Difficulty);
  const startAt = new Date(Date.now() + COUNTDOWN_MS);
  const matchId = randomUUID();

  await db.insert(multiplayerMatches).values({
    id: matchId,
    roomId: room.id,
    difficulty: room.difficulty,
    puzzleGivens: puzzle.givens,
    puzzleSolution: puzzle.solution,
    rated: room.rated,
    timeLimitS: room.timeLimitS,
    startAt,
    status: "countdown",
  });

  await db
    .update(multiplayerRooms)
    .set({ status: "countdown", matchId, updatedAt: new Date() })
    .where(eq(multiplayerRooms.id, room.id));

  await db
    .update(multiplayerRoomMembers)
    .set({ status: "racing" })
    .where(and(eq(multiplayerRoomMembers.roomId, room.id), ne(multiplayerRoomMembers.status, "left")));

  return matchId;
}

export async function rematch(code: string, hostProfileId: string) {
  const room = await fetchRoomByCode(code);
  if (!room) throw new MultiplayerError("not_found", "找不到房間");
  if (room.hostProfileId !== hostProfileId) throw new MultiplayerError("not_host", "只有房主可以重新開始");
  await db
    .update(multiplayerRooms)
    .set({ status: "lobby", matchId: null, updatedAt: new Date() })
    .where(eq(multiplayerRooms.id, room.id));
  await db
    .update(multiplayerRoomMembers)
    .set({ isReady: false, status: "joined" })
    .where(and(eq(multiplayerRoomMembers.roomId, room.id), ne(multiplayerRoomMembers.status, "left")));
}

async function fetchMatch(matchId: string) {
  const [match] = await db.select().from(multiplayerMatches).where(eq(multiplayerMatches.id, matchId));
  return match ?? null;
}

async function fetchResults(matchId: string) {
  return db.select().from(multiplayerMatchResults).where(eq(multiplayerMatchResults.matchId, matchId));
}

async function finalizeMatch(matchId: string) {
  const match = await fetchMatch(matchId);
  if (!match || match.status === "finished") return;

  const updated = await db
    .update(multiplayerMatches)
    .set({ status: "finished", endAt: new Date() })
    .where(and(eq(multiplayerMatches.id, matchId), ne(multiplayerMatches.status, "finished")))
    .returning();
  if (updated.length === 0) return; // another request already finalized this match

  const members = await fetchMembers(match.roomId);
  let results = await fetchResults(matchId);

  for (const member of members) {
    if (!results.find((r) => r.profileId === member.profileId)) {
      await db.insert(multiplayerMatchResults).values({
        matchId,
        profileId: member.profileId,
        completed: false,
        correctCells: 0,
      });
    }
  }
  results = await fetchResults(matchId);

  const placed = results.filter((r) => r.placement !== null).sort((a, b) => (a.placement! - b.placement!));
  const dnf = results.filter((r) => r.placement === null).sort((a, b) => b.correctCells - a.correctCells);
  let nextPlacement = placed.length > 0 ? Math.max(...placed.map((r) => r.placement!)) + 1 : 1;
  for (const r of dnf) {
    await db.update(multiplayerMatchResults).set({ placement: nextPlacement }).where(eq(multiplayerMatchResults.id, r.id));
    nextPlacement++;
  }

  await db.update(multiplayerRooms).set({ status: "finished", updatedAt: new Date() }).where(eq(multiplayerRooms.id, match.roomId));

  if (match.rated) {
    await applyRatedMatchResults(matchId);
  } else {
    await recordUnratedParticipation(matchId);
  }

  for (const member of members) {
    await evaluateAndApplyAchievements(member.profileId);
  }
}

async function maybeFinalizeByTimeout(matchId: string) {
  const match = await fetchMatch(matchId);
  if (!match || match.status === "finished") return;
  const deadline = match.startAt.getTime() + match.timeLimitS * 1000;
  if (Date.now() >= deadline) {
    await finalizeMatch(matchId);
  }
}

export type SubmitResult =
  | { ok: true; correct: true; placement: number; finishTimeMs: number }
  | { ok: true; correct: false }
  | { ok: false; reason: string };

export async function submitSolution(
  matchId: string,
  profileId: string,
  board: Board,
  mistakes: number,
  hintsUsed: number,
): Promise<SubmitResult> {
  const match = await fetchMatch(matchId);
  if (!match) return { ok: false, reason: "not_found" };
  await maybeFinalizeByTimeout(matchId);
  const freshMatch = await fetchMatch(matchId);
  if (!freshMatch) return { ok: false, reason: "not_found" };
  if (freshMatch.status === "finished") return { ok: false, reason: "match_finished" };
  if (Date.now() < freshMatch.startAt.getTime()) return { ok: false, reason: "not_started" };

  const members = await fetchMembers(freshMatch.roomId);
  const member = members.find((m) => m.profileId === profileId);
  if (!member) return { ok: false, reason: "not_a_participant" };

  const existingResults = await fetchResults(matchId);
  const existing = existingResults.find((r) => r.profileId === profileId);
  if (existing?.completed) {
    return { ok: true, correct: true, placement: existing.placement ?? 1, finishTimeMs: existing.finishTimeMs ?? 0 };
  }

  const solution = parseBoardString(freshMatch.puzzleSolution);
  if (!isBoardComplete(board, solution)) {
    const correctCells = countCorrectCells(board, solution);
    if (existing) {
      await db
        .update(multiplayerMatchResults)
        .set({ correctCells, mistakes })
        .where(eq(multiplayerMatchResults.id, existing.id));
    } else {
      await db.insert(multiplayerMatchResults).values({ matchId, profileId, correctCells, mistakes, completed: false });
    }
    return { ok: true, correct: false };
  }

  const finishTimeMs = Date.now() - freshMatch.startAt.getTime();
  const placement = existingResults.filter((r) => r.completed).length + 1;

  if (existing) {
    await db
      .update(multiplayerMatchResults)
      .set({
        completed: true,
        placement,
        finishTimeMs,
        mistakes,
        hintsUsed,
        correctCells: 81,
        submittedAt: new Date(),
      })
      .where(eq(multiplayerMatchResults.id, existing.id));
  } else {
    await db.insert(multiplayerMatchResults).values({
      matchId,
      profileId,
      completed: true,
      placement,
      finishTimeMs,
      mistakes,
      hintsUsed,
      correctCells: 81,
      submittedAt: new Date(),
    });
  }

  await db
    .update(multiplayerRoomMembers)
    .set({ status: "finished" })
    .where(eq(multiplayerRoomMembers.id, member.id));

  const activeMembers = members.filter((m) => m.status !== "left");
  const resultsAfter = await fetchResults(matchId);
  const allFinished = activeMembers.every((m) => resultsAfter.find((r) => r.profileId === m.profileId)?.completed);
  if (allFinished) {
    await finalizeMatch(matchId);
  }

  return { ok: true, correct: true, placement, finishTimeMs };
}

/**
 * Updates live progress + acts as a heartbeat. `correctCells` is computed
 * HERE on the server by comparing the submitted board against the
 * server-held solution - the client never learns which specific cells are
 * right or wrong, only its own aggregate correct-cell count, which keeps
 * the authoritative solution private while still showing live progress.
 */
export async function updateProgress(matchId: string, profileId: string, board: Board, mistakes: number) {
  const match = await fetchMatch(matchId);
  if (!match) return;
  const solution = parseBoardString(match.puzzleSolution);
  const correctCells = countCorrectCells(board, solution);

  const results = await fetchResults(matchId);
  const existing = results.find((r) => r.profileId === profileId);
  if (existing?.completed) {
    await db
      .update(multiplayerRoomMembers)
      .set({ lastSeenAt: new Date() })
      .where(and(eq(multiplayerRoomMembers.roomId, match.roomId), eq(multiplayerRoomMembers.profileId, profileId)));
    return;
  }
  if (existing) {
    await db
      .update(multiplayerMatchResults)
      .set({ correctCells, mistakes })
      .where(eq(multiplayerMatchResults.id, existing.id));
  } else {
    await db.insert(multiplayerMatchResults).values({ matchId, profileId, correctCells, mistakes, completed: false });
  }
  await db
    .update(multiplayerRoomMembers)
    .set({ lastSeenAt: new Date() })
    .where(and(eq(multiplayerRoomMembers.roomId, match.roomId), eq(multiplayerRoomMembers.profileId, profileId)));
}

async function buildMemberViews(roomId: string, matchId: string | null): Promise<RoomMemberView[]> {
  const members = await fetchMembers(roomId);
  const active = members.filter((m) => m.status !== "left").sort((a, b) => a.seat - b.seat);
  const results = matchId ? await fetchResults(matchId) : [];
  const now = Date.now();

  const views: RoomMemberView[] = [];
  for (const m of active) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, m.profileId));
    const equipped = await getEquippedMap(m.profileId);
    const result = results.find((r) => r.profileId === m.profileId);
    views.push({
      profileId: m.profileId,
      seat: m.seat,
      isHost: m.isHost,
      isReady: m.isReady,
      status: m.status as RoomMemberView["status"],
      connected: now - m.lastSeenAt.getTime() < HEARTBEAT_STALE_MS,
      username: profile?.username ?? "玩家",
      equipped,
      correctCells: result?.correctCells ?? 0,
      finishTimeMs: result?.finishTimeMs ?? null,
      placement: result?.placement ?? null,
    });
  }
  return views;
}

export async function getRoomView(code: string): Promise<RoomView> {
  const room = await fetchRoomByCode(code);
  if (!room) throw new MultiplayerError("not_found", "找不到房間");

  if (room.matchId) {
    await maybeFinalizeByTimeout(room.matchId);
  }
  const freshRoom = await fetchRoomByCode(code);
  if (!freshRoom) throw new MultiplayerError("not_found", "找不到房間");

  let match = null;
  if (freshRoom.matchId) {
    match = await fetchMatch(freshRoom.matchId);
  }

  const members = await buildMemberViews(freshRoom.id, freshRoom.matchId);

  return {
    id: freshRoom.id,
    code: freshRoom.code,
    status: freshRoom.status as RoomView["status"],
    difficulty: freshRoom.difficulty as Difficulty,
    maxPlayers: freshRoom.maxPlayers,
    rated: freshRoom.rated,
    timeLimitS: freshRoom.timeLimitS,
    hostProfileId: freshRoom.hostProfileId,
    members,
    matchId: freshRoom.matchId,
    serverNow: new Date().toISOString(),
    matchStartAt: match ? match.startAt.toISOString() : null,
    matchEndAt: match?.endAt ? match.endAt.toISOString() : null,
  };
}

export async function getMatchStateView(matchId: string): Promise<MatchStateView> {
  await maybeFinalizeByTimeout(matchId);
  const match = await fetchMatch(matchId);
  if (!match) throw new MultiplayerError("not_found", "找不到比賽");

  const results = await fetchResults(matchId);
  const resultsView = await Promise.all(
    results.map(async (r) => {
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, r.profileId));
      return {
        profileId: r.profileId,
        username: profile?.username ?? "玩家",
        placement: r.placement,
        finishTimeMs: r.finishTimeMs,
        mistakes: r.mistakes,
        correctCells: r.correctCells,
        completed: r.completed,
        ratingChange: r.ratingChange,
      };
    }),
  );

  return {
    id: match.id,
    roomId: match.roomId,
    difficulty: match.difficulty as Difficulty,
    givens: match.puzzleGivens,
    status: match.status as MatchStateView["status"],
    rated: match.rated,
    timeLimitS: match.timeLimitS,
    startAt: match.startAt.toISOString(),
    endAt: match.endAt ? match.endAt.toISOString() : null,
    serverNow: new Date().toISOString(),
    results: resultsView,
  };
}

export async function getRoomIdForMatch(matchId: string): Promise<string | null> {
  const match = await fetchMatch(matchId);
  return match?.roomId ?? null;
}
