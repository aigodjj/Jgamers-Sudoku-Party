import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaignProgress, puzzleRecords } from "@/db/schema";
import { CAMPAIGN_LEVELS, CAMPAIGN_COMPLETION_COINS, getLevelDef, isFirstLevel } from "@/lib/campaign/levels";
import { computeStars, getDifficultyConfig } from "@/lib/sudoku/difficulty";
import { getOrGeneratePuzzle } from "@/lib/sudoku/generator";
import { parseBoardString, Board } from "@/lib/sudoku/types";
import { isBoardComplete } from "@/lib/sudoku/validator";
import { evaluateAndApplyAchievements } from "./achievementService";

export interface CampaignLevelView {
  id: string;
  stage: string;
  stageIndex: number;
  levelInStage: number;
  index: number;
  unlocked: boolean;
  completed: boolean;
  stars: number;
  bestTimeMs: number | null;
  bestMistakes: number | null;
}

export async function getCampaignView(profileId: string): Promise<CampaignLevelView[]> {
  const rows = await db.select().from(campaignProgress).where(eq(campaignProgress.profileId, profileId));
  const byLevel = new Map(rows.map((r) => [r.levelId, r]));

  const result: CampaignLevelView[] = [];
  let previousCompleted = true; // first level always unlocked
  for (const level of CAMPAIGN_LEVELS) {
    const progress = byLevel.get(level.id);
    const unlocked = isFirstLevel(level.id) || previousCompleted;
    result.push({
      id: level.id,
      stage: level.stage,
      stageIndex: level.stageIndex,
      levelInStage: level.levelInStage,
      index: level.index,
      unlocked,
      completed: progress?.completed ?? false,
      stars: progress?.stars ?? 0,
      bestTimeMs: progress?.bestTimeMs ?? null,
      bestMistakes: progress?.bestMistakes ?? null,
    });
    previousCompleted = progress?.completed ?? false;
  }
  return result;
}

export async function isLevelUnlocked(profileId: string, levelId: string): Promise<boolean> {
  const view = await getCampaignView(profileId);
  return view.find((l) => l.id === levelId)?.unlocked ?? false;
}

export function getPuzzleForLevel(levelId: string) {
  const def = getLevelDef(levelId);
  if (!def) return null;
  return getOrGeneratePuzzle(def.seed, def.stage);
}

export interface CompleteLevelInput {
  board: Board;
  timeMs: number;
  mistakes: number;
  hintsUsed: number;
}

export type CompleteLevelResult =
  | { ok: false; reason: "locked" | "not_found" | "invalid_solution" }
  | {
      ok: true;
      stars: number;
      coinsAwarded: number;
      isNewBest: boolean;
      newlyUnlockedAchievements: Awaited<ReturnType<typeof evaluateAndApplyAchievements>>;
    };

export async function completeLevel(profileId: string, levelId: string, input: CompleteLevelInput): Promise<CompleteLevelResult> {
  const def = getLevelDef(levelId);
  if (!def) return { ok: false, reason: "not_found" };

  const unlocked = await isLevelUnlocked(profileId, levelId);
  if (!unlocked) return { ok: false, reason: "locked" };

  const puzzle = getOrGeneratePuzzle(def.seed, def.stage);
  const solution = parseBoardString(puzzle.solution);

  if (!isBoardComplete(input.board, solution)) {
    return { ok: false, reason: "invalid_solution" };
  }

  const timeSeconds = Math.max(1, Math.round(input.timeMs / 1000));
  const stars = computeStars(def.stage, timeSeconds, input.mistakes, input.hintsUsed);

  const [existing] = await db
    .select()
    .from(campaignProgress)
    .where(and(eq(campaignProgress.profileId, profileId), eq(campaignProgress.levelId, levelId)));

  const isNewBest = !existing || !existing.bestTimeMs || input.timeMs < existing.bestTimeMs;
  const bestStars = Math.max(stars, existing?.stars ?? 0);
  const firstCompletion = !existing?.completed;

  if (existing) {
    await db
      .update(campaignProgress)
      .set({
        completed: true,
        stars: bestStars,
        bestTimeMs: isNewBest ? input.timeMs : existing.bestTimeMs,
        bestMistakes:
          existing.bestMistakes === null || input.mistakes < existing.bestMistakes
            ? input.mistakes
            : existing.bestMistakes,
        bestHints:
          existing.bestHints === null || input.hintsUsed < existing.bestHints ? input.hintsUsed : existing.bestHints,
        attempts: existing.attempts + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(campaignProgress.profileId, profileId), eq(campaignProgress.levelId, levelId)));
  } else {
    await db.insert(campaignProgress).values({
      profileId,
      levelId,
      completed: true,
      stars: bestStars,
      bestTimeMs: input.timeMs,
      bestMistakes: input.mistakes,
      bestHints: input.hintsUsed,
      attempts: 1,
    });
  }

  await db.insert(puzzleRecords).values({
    profileId,
    mode: "campaign",
    refId: levelId,
    difficulty: def.stage,
    timeMs: input.timeMs,
    mistakes: input.mistakes,
    hintsUsed: input.hintsUsed,
    completed: true,
  });

  let coinsAwarded = 0;
  if (firstCompletion) {
    coinsAwarded = CAMPAIGN_COMPLETION_COINS[def.stage];
  } else if (isNewBest) {
    coinsAwarded = Math.round(CAMPAIGN_COMPLETION_COINS[def.stage] / 4);
  }

  if (coinsAwarded > 0) {
    const { addCoins } = await import("./profileService");
    await addCoins(profileId, coinsAwarded);
  }

  const newlyUnlockedAchievements = await evaluateAndApplyAchievements(profileId);

  return { ok: true, stars: bestStars, coinsAwarded, isNewBest, newlyUnlockedAchievements };
}

export function difficultyLabelOf(levelId: string) {
  const def = getLevelDef(levelId);
  if (!def) return null;
  return getDifficultyConfig(def.stage).labelKey;
}

