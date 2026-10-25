import { generatePuzzle } from "@/lib/sudoku/generator";
import { Difficulty, Puzzle } from "@/lib/sudoku/types";

/**
 * Draws a fresh, validated (unique-solution) puzzle for a multiplayer match.
 * Every call produces a new random seed, so this behaves like an effectively
 * unlimited "eligible puzzle pool" rather than a small fixed set, while still
 * going through the same validated generator used everywhere else in the
 * game (guaranteeing a unique solution).
 */
export function pickRandomPuzzleForMatch(difficulty: Difficulty): Puzzle {
  const seed = `mp:${difficulty}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  return generatePuzzle(seed, difficulty);
}
