export type AchievementConditionType =
  | "puzzles_completed"
  | "flawless_solve"
  | "speed_solve"
  | "hint_free"
  | "campaign_stage"
  | "mp_wins"
  | "mp_matches_played"
  | "cosmetics_unlocked";

export interface AchievementDef {
  id: string;
  category: "solo" | "campaign" | "multiplayer" | "collection";
  titleKey: string;
  descKey: string;
  conditionType: AchievementConditionType;
  conditionValue: number;
  rewardCoins: number;
  rewardCosmeticId?: string;
  icon: string;
  sortOrder: number;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first_steps",
    category: "solo",
    titleKey: "achievement.firstSteps.title",
    descKey: "achievement.firstSteps.desc",
    conditionType: "puzzles_completed",
    conditionValue: 1,
    rewardCoins: 50,
    rewardCosmeticId: "hair-buzz",
    icon: "sparkles",
    sortOrder: 0,
  },
  {
    id: "puzzle_explorer",
    category: "solo",
    titleKey: "achievement.puzzleExplorer.title",
    descKey: "achievement.puzzleExplorer.desc",
    conditionType: "puzzles_completed",
    conditionValue: 10,
    rewardCoins: 100,
    rewardCosmeticId: "dress-party",
    icon: "compass",
    sortOrder: 1,
  },
  {
    id: "persistent_solver",
    category: "solo",
    titleKey: "achievement.persistentSolver.title",
    descKey: "achievement.persistentSolver.desc",
    conditionType: "puzzles_completed",
    conditionValue: 50,
    rewardCoins: 250,
    icon: "medal",
    sortOrder: 2,
  },
  {
    id: "flawless_solve",
    category: "solo",
    titleKey: "achievement.flawless.title",
    descKey: "achievement.flawless.desc",
    conditionType: "flawless_solve",
    conditionValue: 1,
    rewardCoins: 80,
    rewardCosmeticId: "face-cool",
    icon: "gem",
    sortOrder: 3,
  },
  {
    id: "speed_solver",
    category: "solo",
    titleKey: "achievement.speedSolver.title",
    descKey: "achievement.speedSolver.desc",
    conditionType: "speed_solve",
    conditionValue: 1,
    rewardCoins: 100,
    rewardCosmeticId: "glasses-sun",
    icon: "zap",
    sortOrder: 4,
  },
  {
    id: "hint_free",
    category: "solo",
    titleKey: "achievement.hintFree.title",
    descKey: "achievement.hintFree.desc",
    conditionType: "hint_free",
    conditionValue: 1,
    rewardCoins: 60,
    icon: "brain",
    sortOrder: 5,
  },
  {
    id: "campaign_champion",
    category: "campaign",
    titleKey: "achievement.campaignChampion.title",
    descKey: "achievement.campaignChampion.desc",
    conditionType: "campaign_stage",
    conditionValue: 3,
    rewardCoins: 300,
    rewardCosmeticId: "hat-crown",
    icon: "crown",
    sortOrder: 6,
  },
  {
    id: "first_victory",
    category: "multiplayer",
    titleKey: "achievement.firstVictory.title",
    descKey: "achievement.firstVictory.desc",
    conditionType: "mp_wins",
    conditionValue: 1,
    rewardCoins: 150,
    icon: "trophy",
    sortOrder: 7,
  },
  {
    id: "race_veteran",
    category: "multiplayer",
    titleKey: "achievement.raceVeteran.title",
    descKey: "achievement.raceVeteran.desc",
    conditionType: "mp_matches_played",
    conditionValue: 20,
    rewardCoins: 200,
    rewardCosmeticId: "accessory-wings",
    icon: "flag",
    sortOrder: 8,
  },
  {
    id: "racing_champion",
    category: "multiplayer",
    titleKey: "achievement.racingChampion.title",
    descKey: "achievement.racingChampion.desc",
    conditionType: "mp_wins",
    conditionValue: 10,
    rewardCoins: 400,
    icon: "award",
    sortOrder: 9,
  },
  {
    id: "fashion_collector",
    category: "collection",
    titleKey: "achievement.fashionCollector.title",
    descKey: "achievement.fashionCollector.desc",
    conditionType: "cosmetics_unlocked",
    conditionValue: 15,
    rewardCoins: 150,
    icon: "shirt",
    sortOrder: 10,
  },
];

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_DEFS.find((a) => a.id === id);
}

/** Seconds threshold under which a solve counts toward the "Speed Solver" achievement (medium+ difficulty). */
export const SPEED_SOLVER_THRESHOLD_SECONDS = 240;
