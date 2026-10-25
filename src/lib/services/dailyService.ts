import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyChallengeCompletions, dailyChallenges } from "@/db/schema";
import { generatePuzzle } from "@/lib/sudoku/generator";
import { parseBoardString, Board } from "@/lib/sudoku/types";
import { isBoardComplete } from "@/lib/sudoku/validator";
import { Difficulty } from "@/lib/sudoku/types";
import { evaluateAndApplyAchievements } from "./achievementService";
import { addCoins } from "./profileService";

// Timezone policy: the daily challenge "day" boundary is Asia/Taipei (UTC+8),
// matching the game's primary audience. This is intentionally independent of
// the player's browser timezone so everyone gets the same puzzle on the same
// physical date in Taiwan.
export const DAILY_TIMEZONE = "Asia/Taipei";

export function getTaipeiDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // yyyy-mm-dd
}

const DAILY_DIFFICULTY_CYCLE: Difficulty[] = ["easy", "medium", "medium", "hard", "hard", "medium", "easy"];

function difficultyForDate(dateStr: string): Difficulty {
  const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  return DAILY_DIFFICULTY_CYCLE[day];
}

export async function getOrCreateDailyChallenge(dateStr: string) {
  const [existing] = await db.select().from(dailyChallenges).where(eq(dailyChallenges.date, dateStr));
  if (existing) return existing;

  const difficulty = difficultyForDate(dateStr);
  const puzzle = generatePuzzle(`daily:${dateStr}`, difficulty);

  const [created] = await db
    .insert(dailyChallenges)
    .values({ date: dateStr, givens: puzzle.givens, solution: puzzle.solution, difficulty })
    .onConflictDoNothing()
    .returning();

  if (created) return created;
  const [row] = await db.select().from(dailyChallenges).where(eq(dailyChallenges.date, dateStr));
  return row;
}

export async function getDailyStatus(profileId: string, dateStr: string) {
  const [completion] = await db
    .select()
    .from(dailyChallengeCompletions)
    .where(and(eq(dailyChallengeCompletions.profileId, profileId), eq(dailyChallengeCompletions.date, dateStr)));

  const history = await db
    .select()
    .from(dailyChallengeCompletions)
    .where(eq(dailyChallengeCompletions.profileId, profileId))
    .orderBy(desc(dailyChallengeCompletions.date))
    .limit(60);

  return { completion, history };
}

export function computeStreak(history: { date: string; completed: boolean }[], todayStr: string): number {
  const completedDates = new Set(history.filter((h) => h.completed).map((h) => h.date));
  let streak = 0;
  const cursor = new Date(`${todayStr}T00:00:00Z`);
  // If today isn't completed yet, start counting from yesterday so an
  // in-progress streak still shows correctly before today's puzzle is done.
  if (!completedDates.has(todayStr)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!completedDates.has(key)) break;
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export type CompleteDailyResult =
  | { ok: false; reason: "already_completed" | "invalid_solution" | "not_found" }
  | { ok: true; streak: number; coinsAwarded: number; newlyUnlockedAchievements: Awaited<ReturnType<typeof evaluateAndApplyAchievements>> };

export async function completeDaily(
  profileId: string,
  dateStr: string,
  input: { board: Board; timeMs: number; mistakes: number },
): Promise<CompleteDailyResult> {
  const challenge = await getOrCreateDailyChallenge(dateStr);
  if (!challenge) return { ok: false, reason: "not_found" };

  const [existing] = await db
    .select()
    .from(dailyChallengeCompletions)
    .where(and(eq(dailyChallengeCompletions.profileId, profileId), eq(dailyChallengeCompletions.date, dateStr)));
  if (existing?.rewardClaimed) return { ok: false, reason: "already_completed" };

  const solution = parseBoardString(challenge.solution);
  if (!isBoardComplete(input.board, solution)) {
    return { ok: false, reason: "invalid_solution" };
  }

  const history = await db
    .select()
    .from(dailyChallengeCompletions)
    .where(eq(dailyChallengeCompletions.profileId, profileId));
  const streak = computeStreak(
    [...history.map((h) => ({ date: h.date, completed: h.completed })), { date: dateStr, completed: true }],
    dateStr,
  );

  if (existing) {
    await db
      .update(dailyChallengeCompletions)
      .set({ timeMs: input.timeMs, mistakes: input.mistakes, completed: true, streakCount: streak, rewardClaimed: true })
      .where(eq(dailyChallengeCompletions.id, existing.id));
  } else {
    await db.insert(dailyChallengeCompletions).values({
      profileId,
      date: dateStr,
      timeMs: input.timeMs,
      mistakes: input.mistakes,
      completed: true,
      streakCount: streak,
      rewardClaimed: true,
    });
  }

  const { puzzleRecords } = await import("@/db/schema");
  await db.insert(puzzleRecords).values({
    profileId,
    mode: "daily",
    refId: dateStr,
    difficulty: challenge.difficulty,
    timeMs: input.timeMs,
    mistakes: input.mistakes,
    hintsUsed: 0,
    completed: true,
  });

  const baseCoins = 40;
  const streakBonus = Math.min(60, streak * 5);
  const coinsAwarded = baseCoins + streakBonus;
  await addCoins(profileId, coinsAwarded);

  const newlyUnlockedAchievements = await evaluateAndApplyAchievements(profileId);

  return { ok: true, streak, coinsAwarded, newlyUnlockedAchievements };
}
