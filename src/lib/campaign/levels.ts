import { Difficulty } from "../sudoku/types";
import { DIFFICULTIES } from "../sudoku/difficulty";

export interface CampaignLevelDef {
  id: string;
  stage: Difficulty;
  stageIndex: number;
  levelInStage: number;
  index: number; // flat order across the whole campaign
  seed: string;
}

const LEVELS_PER_STAGE = 4;

export const CAMPAIGN_LEVELS: CampaignLevelDef[] = DIFFICULTIES.flatMap((stage) =>
  Array.from({ length: LEVELS_PER_STAGE }, (_, i) => {
    const levelInStage = i + 1;
    return {
      id: `${stage.id}-${levelInStage}`,
      stage: stage.id,
      stageIndex: stage.order,
      levelInStage,
      index: stage.order * LEVELS_PER_STAGE + i,
      seed: `campaign:${stage.id}:${levelInStage}`,
    };
  }),
).sort((a, b) => a.index - b.index);

export function getLevelDef(levelId: string): CampaignLevelDef | undefined {
  return CAMPAIGN_LEVELS.find((l) => l.id === levelId);
}

export function getNextLevel(levelId: string): CampaignLevelDef | undefined {
  const current = getLevelDef(levelId);
  if (!current) return undefined;
  return CAMPAIGN_LEVELS.find((l) => l.index === current.index + 1);
}

export function isFirstLevel(levelId: string): boolean {
  const def = getLevelDef(levelId);
  return !!def && def.index === 0;
}

export const CAMPAIGN_COMPLETION_COINS: Record<Difficulty, number> = {
  beginner: 20,
  easy: 30,
  medium: 45,
  hard: 65,
  expert: 90,
  master: 120,
};
