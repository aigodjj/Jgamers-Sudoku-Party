import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  achievements,
  campaignProgress,
  multiplayerMatchResults,
  playerAchievements,
  puzzleRecords,
} from "@/db/schema";
import { ACHIEVEMENT_DEFS, getAchievementDef } from "@/lib/achievements/defs";
import { evaluateAchievements, PlayerStatsSnapshot } from "@/lib/achievements/service";
import { CAMPAIGN_LEVELS } from "@/lib/campaign/levels";
import { DIFFICULTIES } from "@/lib/sudoku/difficulty";
import { addCoins } from "./profileService";
import { getOwnedCosmeticIds } from "./profileService";
import { getCosmeticDef } from "@/lib/cosmetics/catalog";
import { grantCosmetic } from "./cosmeticService";
import { SPEED_SOLVER_THRESHOLD_SECONDS } from "@/lib/achievements/defs";

export async function computeStatsSnapshot(profileId: string): Promise<PlayerStatsSnapshot> {
  const records = await db.select().from(puzzleRecords).where(eq(puzzleRecords.profileId, profileId));
  const completed = records.filter((r) => r.completed);

  const puzzlesCompleted = completed.length;
  const flawlessSolves = completed.filter((r) => r.mistakes === 0).length;
  const hintFreeSolves = completed.filter((r) => r.hintsUsed === 0).length;
  const speedSolves = completed.filter((r) => r.timeMs <= SPEED_SOLVER_THRESHOLD_SECONDS * 1000).length;

  const progress = await db.select().from(campaignProgress).where(eq(campaignProgress.profileId, profileId));
  let maxCampaignStageIndex = -1;
  for (const stage of DIFFICULTIES) {
    const levelsInStage = CAMPAIGN_LEVELS.filter((l) => l.stageIndex === stage.order);
    const allDone = levelsInStage.every((lvl) =>
      progress.some((p) => p.levelId === lvl.id && p.completed),
    );
    if (allDone) maxCampaignStageIndex = stage.order;
  }

  const mpResults = await db
    .select()
    .from(multiplayerMatchResults)
    .where(eq(multiplayerMatchResults.profileId, profileId));
  const mpMatchesPlayed = mpResults.filter((r) => r.submittedAt !== null || r.completed).length;
  const mpWins = mpResults.filter((r) => r.placement === 1).length;

  const owned = await getOwnedCosmeticIds(profileId);
  let cosmeticsUnlocked = 0;
  for (const id of owned) {
    const def = getCosmeticDef(id);
    if (def && def.unlockType !== "default") cosmeticsUnlocked++;
  }

  return {
    puzzlesCompleted,
    flawlessSolves,
    hintFreeSolves,
    speedSolves,
    maxCampaignStageIndex,
    mpWins,
    mpMatchesPlayed,
    cosmeticsUnlocked,
  };
}

export interface AchievementUnlockEvent {
  id: string;
  titleKey: string;
  rewardCoins: number;
  rewardCosmeticId?: string;
}

/**
 * Recomputes achievement progress from validated gameplay records and
 * persists it. Rewards (coins / cosmetics) are granted exactly once per
 * achievement, guarded by the `unlocked` flag already stored in the DB.
 */
export async function evaluateAndApplyAchievements(profileId: string): Promise<AchievementUnlockEvent[]> {
  const stats = await computeStatsSnapshot(profileId);
  const existing = await db
    .select()
    .from(playerAchievements)
    .where(eq(playerAchievements.profileId, profileId));
  const unlockedIds = new Set(existing.filter((e) => e.unlocked).map((e) => e.achievementId));

  const evaluations = evaluateAchievements(stats, unlockedIds);
  const newlyUnlocked: AchievementUnlockEvent[] = [];

  for (const evalResult of evaluations) {
    const row = existing.find((e) => e.achievementId === evalResult.id);
    const def = getAchievementDef(evalResult.id);
    if (!def) continue;

    if (row) {
      if (evalResult.justUnlocked) {
        await db
          .update(playerAchievements)
          .set({ progress: evalResult.progress, unlocked: true, unlockedAt: new Date() })
          .where(and(eq(playerAchievements.profileId, profileId), eq(playerAchievements.achievementId, evalResult.id)));
      } else if (row.progress !== evalResult.progress) {
        await db
          .update(playerAchievements)
          .set({ progress: evalResult.progress })
          .where(and(eq(playerAchievements.profileId, profileId), eq(playerAchievements.achievementId, evalResult.id)));
      }
    } else {
      await db.insert(playerAchievements).values({
        profileId,
        achievementId: evalResult.id,
        progress: evalResult.progress,
        unlocked: evalResult.justUnlocked,
        unlockedAt: evalResult.justUnlocked ? new Date() : null,
      });
    }

    if (evalResult.justUnlocked) {
      if (def.rewardCoins > 0) await addCoins(profileId, def.rewardCoins);
      if (def.rewardCosmeticId) await grantCosmetic(profileId, def.rewardCosmeticId, "achievement");
      newlyUnlocked.push({
        id: def.id,
        titleKey: def.titleKey,
        rewardCoins: def.rewardCoins,
        rewardCosmeticId: def.rewardCosmeticId,
      });
    }
  }

  return newlyUnlocked;
}

export interface AchievementView {
  id: string;
  category: string;
  titleKey: string;
  descKey: string;
  icon: string;
  conditionValue: number;
  rewardCoins: number;
  rewardCosmeticId?: string;
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export async function getAchievementsView(profileId: string): Promise<AchievementView[]> {
  const existing = await db
    .select()
    .from(playerAchievements)
    .where(eq(playerAchievements.profileId, profileId));

  return ACHIEVEMENT_DEFS.map((def) => {
    const row = existing.find((e) => e.achievementId === def.id);
    return {
      id: def.id,
      category: def.category,
      titleKey: def.titleKey,
      descKey: def.descKey,
      icon: def.icon,
      conditionValue: def.conditionValue,
      rewardCoins: def.rewardCoins,
      rewardCosmeticId: def.rewardCosmeticId,
      progress: row?.progress ?? 0,
      unlocked: row?.unlocked ?? false,
      unlockedAt: row?.unlockedAt ? row.unlockedAt.toISOString() : null,
    };
  }).sort((a, b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? 1 : -1));
}

// Ensure the static achievements catalog rows exist in the DB (idempotent),
// used by the seed script.
export async function seedAchievementsCatalog(): Promise<void> {
  for (const def of ACHIEVEMENT_DEFS) {
    await db
      .insert(achievements)
      .values({
        id: def.id,
        category: def.category,
        titleKey: def.titleKey,
        descKey: def.descKey,
        conditionType: def.conditionType,
        conditionValue: def.conditionValue,
        rewardCoins: def.rewardCoins,
        rewardCosmeticId: def.rewardCosmeticId,
        icon: def.icon,
        sortOrder: def.sortOrder,
      })
      .onConflictDoUpdate({
        target: achievements.id,
        set: {
          category: def.category,
          titleKey: def.titleKey,
          descKey: def.descKey,
          conditionType: def.conditionType,
          conditionValue: def.conditionValue,
          rewardCoins: def.rewardCoins,
          rewardCosmeticId: def.rewardCosmeticId,
          icon: def.icon,
          sortOrder: def.sortOrder,
        },
      });
  }
}

