import { Difficulty } from "@/lib/sudoku/types";

export type RoomStatus = "lobby" | "countdown" | "racing" | "finished" | "closed";
export type MemberStatus = "joined" | "ready" | "racing" | "finished" | "left" | "disconnected";

export interface RoomMemberView {
  profileId: string;
  seat: number;
  isHost: boolean;
  isReady: boolean;
  status: MemberStatus;
  connected: boolean;
  username: string;
  equipped: Record<string, string>;
  correctCells: number;
  finishTimeMs: number | null;
  placement: number | null;
}

export interface RoomView {
  id: string;
  code: string;
  status: RoomStatus;
  difficulty: Difficulty;
  maxPlayers: number;
  rated: boolean;
  timeLimitS: number;
  hostProfileId: string;
  members: RoomMemberView[];
  matchId: string | null;
  serverNow: string;
  matchStartAt: string | null;
  matchEndAt: string | null;
}

export interface MatchStateView {
  id: string;
  roomId: string;
  difficulty: Difficulty;
  givens: string;
  status: "countdown" | "racing" | "finished" | "aborted";
  rated: boolean;
  timeLimitS: number;
  startAt: string;
  endAt: string | null;
  serverNow: string;
  results: {
    profileId: string;
    username: string;
    placement: number | null;
    finishTimeMs: number | null;
    mistakes: number;
    correctCells: number;
    completed: boolean;
    ratingChange: number | null;
  }[];
}

export const HEARTBEAT_STALE_MS = 12_000;
