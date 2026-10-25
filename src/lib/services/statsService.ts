import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaignProgress, puzzleRecords } from "@/db/schema";
import { DIFFICULTIES, getDifficultyConfig } from "@/lib/sudoku/difficulty";
import { Difficulty } from "@/lib/sudoku/types";
import { CAMPAIGN_LEVELS } from "@/lib/campaign/levels";
import { getRatingProfile } from "./ratingService";
import { getAchievementsView } from "./achievementService";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

export interface DifficultyTimeStats {
  difficulty: Difficulty;
  completedCount: number;
  averageMs: number | null;
  medianMs: number | null;
  bestMs: number | null;
}

export interface SkillProfile {
  speed: number;
  accuracy: number;
  consistency: number;
  competitiveAbility: number;
  endurance: number;
  hasEnoughData: boolean;
}

export interface ProfileStats {
  totalPuzzlesCompleted: number;
  campaignCompleted: number;
  campaignTotal: number;
  timesByDifficulty: DifficultyTimeStats[];
  errorFreeRate: number;
  hintUsageRate: number;
  firstSubmissionCorrectRate: number;
  multiplayer: {
    matchesPlayed: number;
    matchesCompleted: number;
    wins: number;
    winRate: number;
    completionRate: number;
  };
  achievementsUnlocked: number;
  achievementsTotal: number;
  recentTrend: "improving" | "stable" | "declining" | "insufficient_data";
  skillProfile: SkillProfile;
}

/**
 * Computes derived statistics from validated gameplay records only
 * (puzzle_records / campaign_progress / player_rating). Never derived from
 * client-claimed values that bypassed server validation.
 */
export async function getProfileStats(profileId: string): Promise<ProfileStats> {
  const records = await db.select().from(puzzleRecords).where(eq(puzzleRecords.profileId, profileId));
  const completed = records.filter((r) => r.completed);

  const timesByDifficulty: DifficultyTimeStats[] = DIFFICULTIES.map((d) => {
    const inDiff = completed.filter((r) => r.difficulty === d.id).map((r) => r.timeMs);
    return {
      difficulty: d.id,
      completedCount: inDiff.length,
      averageMs: inDiff.length ? Math.round(mean(inDiff)) : null,
      medianMs: median(inDiff),
      bestMs: inDiff.length ? Math.min(...inDiff) : null,
    };
  });

  const errorFreeRate = completed.length ? completed.filter((r) => r.mistakes === 0).length / completed.length : 0;
  const hintUsageRate = completed.length ? completed.filter((r) => r.hintsUsed > 0).length / completed.length : 0;
  const firstSubmissionCorrectRate = errorFreeRate; // a mistake-free solve implies the final submission was correct on the first full attempt

  const progressRows = await db.select().from(campaignProgress).where(eq(campaignProgress.profileId, profileId));
  const campaignCompleted = progressRows.filter((r) => r.completed).length;

  const rating = await getRatingProfile(profileId);
  const achievementsView = await getAchievementsView(profileId);

  // Recent performance trend: normalize each completed record's time against
  // the difficulty's "2-star" baseline so puzzles of different difficulty
  // can be compared fairly, then compare the most recent few against the
  // ones before them.
  const normalized = completed
    .slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((r) => {
      const config = getDifficultyConfig(r.difficulty as Difficulty);
      const baselineMs = config.starTimeThresholds[1] * 1000;
      return (r.timeMs / baselineMs) * 100; // lower is better/faster
    });

  let recentTrend: ProfileStats["recentTrend"] = "insufficient_data";
  if (normalized.length >= 6) {
    const recent = normalized.slice(-5);
    const previous = normalized.slice(-10, -5);
    const recentAvg = mean(recent);
    const previousAvg = mean(previous.length ? previous : normalized.slice(0, -5));
    if (recentAvg < previousAvg * 0.95) recentTrend = "improving";
    else if (recentAvg > previousAvg * 1.05) recentTrend = "declining";
    else recentTrend = "stable";
  }

  // --- Skill profile (documented, configurable heuristics) ---
  const speedScores = completed.map((r) => {
    const config = getDifficultyConfig(r.difficulty as Difficulty);
    const baselineSeconds = config.starTimeThresholds[1];
    const ratio = r.timeMs / 1000 / baselineSeconds;
    return Math.max(0, Math.min(100, 100 * (1.5 - ratio)));
  });
  const speed = speedScores.length ? Math.round(mean(speedScores)) : 0;
  const accuracy = Math.round(errorFreeRate * 100);
  const consistency = speedScores.length >= 3 ? Math.round(Math.max(0, 100 - stddev(speedScores))) : 0;
  const competitiveAbility = Math.round(Math.max(0, Math.min(100, ((rating.rating - 800) / 1400) * 100)));
  const endurance =
    rating.matchesPlayed >= 5 ? Math.round(Math.max(0, Math.min(100, rating.matchesPlayed > 0 ? (rating.matchesCompleted / rating.matchesPlayed) * 100 : 0))) : 0;

  const hasEnoughData = completed.length >= 3;

  return {
    totalPuzzlesCompleted: completed.length,
    campaignCompleted,
    campaignTotal: CAMPAIGN_LEVELS.length,
    timesByDifficulty,
    errorFreeRate,
    hintUsageRate,
    firstSubmissionCorrectRate,
    multiplayer: {
      matchesPlayed: rating.matchesPlayed,
      matchesCompleted: rating.matchesCompleted,
      wins: rating.wins,
      winRate: rating.winRate,
      completionRate: rating.matchesPlayed > 0 ? rating.matchesCompleted / rating.matchesPlayed : 0,
    },
    achievementsUnlocked: achievementsView.filter((a) => a.unlocked).length,
    achievementsTotal: achievementsView.length,
    recentTrend,
    skillProfile: { speed, accuracy, consistency, competitiveAbility, endurance, hasEnoughData },
  };
}
