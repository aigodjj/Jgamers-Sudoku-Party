import { ACHIEVEMENT_DEFS, AchievementConditionType } from "./defs";

export interface PlayerStatsSnapshot {
  puzzlesCompleted: number;
  flawlessSolves: number;
  speedSolves: number;
  hintFreeSolves: number;
  maxCampaignStageIndex: number; // -1 if none completed, else highest fully-cleared stage index
  mpWins: number;
  mpMatchesPlayed: number;
  cosmeticsUnlocked: number;
}

function progressFor(type: AchievementConditionType, stats: PlayerStatsSnapshot): number {
  switch (type) {
    case "puzzles_completed":
      return stats.puzzlesCompleted;
    case "flawless_solve":
      return stats.flawlessSolves;
    case "speed_solve":
      return stats.speedSolves;
    case "hint_free":
      return stats.hintFreeSolves;
    case "campaign_stage":
      return stats.maxCampaignStageIndex + 1; // convert -1-based index to count of cleared stages
    case "mp_wins":
      return stats.mpWins;
    case "mp_matches_played":
      return stats.mpMatchesPlayed;
    case "cosmetics_unlocked":
      return stats.cosmeticsUnlocked;
    default:
      return 0;
  }
}

export interface AchievementEvaluation {
  id: string;
  progress: number;
  target: number;
  justUnlocked: boolean;
}

/**
 * Pure function: given current stats + the set of achievement ids already
 * unlocked, determines progress for every achievement and which ones should
 * newly unlock. The caller (API route) is responsible for persisting results
 * and granting rewards exactly once.
 */
export function evaluateAchievements(
  stats: PlayerStatsSnapshot,
  alreadyUnlockedIds: Set<string>,
): AchievementEvaluation[] {
  return ACHIEVEMENT_DEFS.map((def) => {
    const progress = Math.min(progressFor(def.conditionType, stats), def.conditionValue);
    const meetsCondition = progressFor(def.conditionType, stats) >= def.conditionValue;
    const wasUnlocked = alreadyUnlockedIds.has(def.id);
    return {
      id: def.id,
      progress,
      target: def.conditionValue,
      justUnlocked: meetsCondition && !wasUnlocked,
    };
  });
}
