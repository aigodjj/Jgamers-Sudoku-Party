import { Board, BOARD_SIZE, BOX_SIZE, CellValue, TOTAL_CELLS, cellIndex } from "./types";

function candidatesFor(board: Board, row: number, col: number): number[] {
  const used = new Set<number>();
  for (let c = 0; c < BOARD_SIZE; c++) used.add(board[cellIndex(row, c)]);
  for (let r = 0; r < BOARD_SIZE; r++) used.add(board[cellIndex(r, col)]);
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      used.add(board[cellIndex(r, c)]);
    }
  }
  const out: number[] = [];
  for (let v = 1; v <= 9; v++) if (!used.has(v)) out.push(v);
  return out;
}

/** Finds the empty cell with the fewest candidates (helps performance & is used by generator). */
function findBestEmptyCell(board: Board): { index: number; candidates: number[] } | null {
  let best: { index: number; candidates: number[] } | null = null;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i] !== 0) continue;
    const row = Math.floor(i / BOARD_SIZE);
    const col = i % BOARD_SIZE;
    const candidates = candidatesFor(board, row, col);
    if (!best || candidates.length < best.candidates.length) {
      best = { index: i, candidates };
      if (candidates.length === 0) return best;
    }
  }
  return best;
}

export interface SolveOptions {
  /** randomize candidate order (used for generating full random boards) */
  randomize?: boolean;
  rng?: () => number;
  /** stop after finding this many solutions (used for uniqueness checks) */
  maxSolutions?: number;
}

/**
 * Backtracking solver. Returns all solutions found (up to maxSolutions).
 */
export function solve(board: Board, options: SolveOptions = {}): Board[] {
  const { randomize = false, rng = Math.random, maxSolutions = 1 } = options;
  const solutions: Board[] = [];
  const working = board.slice();

  function backtrack(): boolean {
    if (solutions.length >= maxSolutions) return true;
    const next = findBestEmptyCell(working);
    if (!next) {
      solutions.push(working.slice());
      return solutions.length >= maxSolutions;
    }
    if (next.candidates.length === 0) return false;

    let candidates = next.candidates;
    if (randomize) {
      candidates = candidates.slice();
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
    }

    for (const v of candidates) {
      working[next.index] = v as CellValue;
      if (backtrack()) return true;
      working[next.index] = 0;
    }
    return false;
  }

  backtrack();
  return solutions;
}

export function solveUnique(board: Board): Board | null {
  const solutions = solve(board, { maxSolutions: 1 });
  return solutions[0] ?? null;
}

export function countSolutions(board: Board, cap = 2): number {
  return solve(board, { maxSolutions: cap }).length;
}

export function hasUniqueSolution(board: Board): boolean {
  return countSolutions(board, 2) === 1;
}

/** Generates a fully solved random board using a seeded RNG for determinism. */
export function generateFullSolution(rng: () => number): Board {
  const empty: Board = new Array(TOTAL_CELLS).fill(0) as Board;
  const solved = solve(empty, { randomize: true, rng, maxSolutions: 1 });
  return solved[0];
}
