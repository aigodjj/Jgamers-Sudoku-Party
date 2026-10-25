import { Board, BOARD_SIZE, BOX_SIZE, cellIndex } from "./types";

export interface ValidationResult {
  valid: boolean;
  conflicts: Set<number>; // indexes of cells involved in a conflict
}

/**
 * Checks the *currently filled* cells of a board for Sudoku rule violations.
 * Empty cells (0) are ignored. This is used for live mistake highlighting -
 * it does NOT require the board to be complete.
 */
export function findConflicts(board: Board): Set<number> {
  const conflicts = new Set<number>();

  const checkGroup = (indices: number[]) => {
    const seen = new Map<number, number[]>();
    for (const idx of indices) {
      const v = board[idx];
      if (v === 0) continue;
      const arr = seen.get(v) ?? [];
      arr.push(idx);
      seen.set(v, arr);
    }
    for (const arr of seen.values()) {
      if (arr.length > 1) arr.forEach((i) => conflicts.add(i));
    }
  };

  for (let r = 0; r < BOARD_SIZE; r++) {
    checkGroup(Array.from({ length: BOARD_SIZE }, (_, c) => cellIndex(r, c)));
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    checkGroup(Array.from({ length: BOARD_SIZE }, (_, r) => cellIndex(r, c)));
  }
  for (let br = 0; br < BOX_SIZE; br++) {
    for (let bc = 0; bc < BOX_SIZE; bc++) {
      const indices: number[] = [];
      for (let r = 0; r < BOX_SIZE; r++) {
        for (let c = 0; c < BOX_SIZE; c++) {
          indices.push(cellIndex(br * BOX_SIZE + r, bc * BOX_SIZE + c));
        }
      }
      checkGroup(indices);
    }
  }

  return conflicts;
}

export function isBoardValidSoFar(board: Board): boolean {
  return findConflicts(board).size === 0;
}

/**
 * A puzzle is only "complete" when every cell is filled AND the board
 * exactly matches the known-correct solution. This avoids the bug of
 * treating "all cells filled" as automatically solved.
 */
export function isBoardComplete(board: Board, solution: Board): boolean {
  if (board.length !== 81 || solution.length !== 81) return false;
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) return false;
    if (board[i] !== solution[i]) return false;
  }
  return true;
}

export function countFilledCells(board: Board): number {
  return board.reduce<number>((acc, v) => acc + (v !== 0 ? 1 : 0), 0);
}

/** Number of cells that are filled AND correct, vs. the solution (used for multiplayer progress). */
export function countCorrectCells(board: Board, solution: Board): number {
  let count = 0;
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0 && board[i] === solution[i]) count++;
  }
  return count;
}
