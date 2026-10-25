import { SeededRandom } from "./rng";
import { generateFullSolution, hasUniqueSolution } from "./solver";
import { Board, boardToString, Difficulty, Puzzle, TOTAL_CELLS } from "./types";
import { getDifficultyConfig } from "./difficulty";

/**
 * Generates a Sudoku puzzle deterministically from a seed string.
 * The same seed always produces the same givens + solution, which lets the
 * server regenerate (and therefore validate) a puzzle without persisting it,
 * while still giving every player of a campaign level / daily challenge the
 * identical board.
 *
 * Strategy: build a full solved grid with a seeded random backtracking fill,
 * then remove cells one at a time (in random order) as long as the puzzle
 * keeps a *unique* solution, until we reach the clue target for the
 * requested difficulty (or can't safely remove more).
 */
export function generatePuzzle(seed: string, difficulty: Difficulty): Puzzle {
  const rng = new SeededRandom(seed);
  const config = getDifficultyConfig(difficulty);

  const solution = generateFullSolution(() => rng.next());
  const givensBoard: Board = solution.slice();

  const order = rng.shuffle(Array.from({ length: TOTAL_CELLS }, (_, i) => i));

  let clueCount = TOTAL_CELLS;
  for (const idx of order) {
    if (clueCount <= config.clues) break;
    const backup = givensBoard[idx];
    if (backup === 0) continue;
    givensBoard[idx] = 0;
    if (hasUniqueSolution(givensBoard)) {
      clueCount--;
    } else {
      givensBoard[idx] = backup;
    }
  }

  return {
    id: seed,
    difficulty,
    givens: boardToString(givensBoard),
    solution: boardToString(solution),
  };
}

const puzzleCache = new Map<string, Puzzle>();

/** Cached wrapper since generation (especially for low clue counts) is CPU-heavy. */
export function getOrGeneratePuzzle(seed: string, difficulty: Difficulty): Puzzle {
  const key = `${seed}:${difficulty}`;
  const cached = puzzleCache.get(key);
  if (cached) return cached;
  const puzzle = generatePuzzle(seed, difficulty);
  puzzleCache.set(key, puzzle);
  return puzzle;
}
