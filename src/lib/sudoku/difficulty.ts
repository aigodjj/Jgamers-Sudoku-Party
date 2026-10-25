import { Difficulty } from "./types";

export interface DifficultyConfig {
  id: Difficulty;
  labelKey: string;
  /** Approximate number of clues (givens) left on the board. Lower = harder. */
  clues: number;
  /** Star thresholds in seconds for 3/2/1 star performance (campaign scoring). */
  starTimeThresholds: [number, number, number];
  /** Max mistakes allowed while still earning 3 stars. */
  starMistakeThreshold: number;
  order: number;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: "beginner",
    labelKey: "difficulty.beginner",
    clues: 45,
    starTimeThresholds: [180, 300, 480],
    starMistakeThreshold: 1,
    order: 0,
  },
  {
    id: "easy",
    labelKey: "difficulty.easy",
    clues: 40,
    starTimeThresholds: [240, 360, 600],
    starMistakeThreshold: 1,
    order: 1,
  },
  {
    id: "medium",
    labelKey: "difficulty.medium",
    clues: 34,
    starTimeThresholds: [360, 540, 800],
    starMistakeThreshold: 2,
    order: 2,
  },
  {
    id: "hard",
    labelKey: "difficulty.hard",
    clues: 30,
    starTimeThresholds: [480, 720, 1080],
    starMistakeThreshold: 2,
    order: 3,
  },
  {
    id: "expert",
    labelKey: "difficulty.expert",
    clues: 27,
    starTimeThresholds: [600, 900, 1350],
    starMistakeThreshold: 3,
    order: 4,
  },
  {
    id: "master",
    labelKey: "difficulty.master",
    clues: 24,
    starTimeThresholds: [720, 1080, 1620],
    starMistakeThreshold: 3,
    order: 5,
  },
];

export function getDifficultyConfig(id: Difficulty): DifficultyConfig {
  const found = DIFFICULTIES.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown difficulty: ${id}`);
  return found;
}

export function computeStars(
  difficulty: Difficulty,
  timeSeconds: number,
  mistakes: number,
  hintsUsed: number,
): number {
  const config = getDifficultyConfig(difficulty);
  if (mistakes > config.starMistakeThreshold * 3 || hintsUsed > 5) return 1;

  let stars = 1;
  const [t3, t2] = config.starTimeThresholds;
  if (timeSeconds <= t3 && mistakes <= config.starMistakeThreshold && hintsUsed === 0) {
    stars = 3;
  } else if (timeSeconds <= t2 && mistakes <= config.starMistakeThreshold + 1 && hintsUsed <= 2) {
    stars = 2;
  }
  return stars;
}
