// Core Sudoku types shared across the app.
// A board is represented as a flat 81-length string / array, row-major,
// using '0' or '.' for empty cells unless noted otherwise.

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Board = CellValue[]; // length 81, row-major (row*9+col)

export type Difficulty =
  | "beginner"
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "master";

export interface Puzzle {
  /** 81-char string, '0' = empty */
  givens: string;
  /** 81-char string, the unique solution */
  solution: string;
  difficulty: Difficulty;
  /** deterministic identifier, e.g. seed or level id */
  id: string;
}

export interface SudokuMistakeInfo {
  row: number;
  col: number;
  value: CellValue;
}

export const BOARD_SIZE = 9;
export const BOX_SIZE = 3;
export const TOTAL_CELLS = 81;

export function parseBoardString(s: string): Board {
  const out: CellValue[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const ch = s[i];
    const n = ch === "." || ch === "0" || ch === undefined ? 0 : Number(ch);
    out.push((Number.isFinite(n) ? n : 0) as CellValue);
  }
  return out;
}

export function boardToString(board: Board): string {
  return board.map((c) => String(c)).join("");
}

export function cellIndex(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

export function rowOf(index: number): number {
  return Math.floor(index / BOARD_SIZE);
}

export function colOf(index: number): number {
  return index % BOARD_SIZE;
}

export function boxOf(index: number): number {
  const r = rowOf(index);
  const c = colOf(index);
  return Math.floor(r / BOX_SIZE) * BOX_SIZE + Math.floor(c / BOX_SIZE);
}
