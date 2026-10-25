"use client";
import type { Board } from "@/lib/sudoku/types";
import { Cell } from "./Cell";

export function SudokuBoard({ board, notes, fixedMask, selected, relatedCells, sameValueCells, conflicts, wrongCells, hintedCells, onSelect, disabled = false }: {
  board: Board;
  notes: Set<number>[];
  fixedMask: boolean[];
  selected: number | null;
  relatedCells: Set<number>;
  sameValueCells: Set<number>;
  conflicts: Set<number>;
  wrongCells: Set<number>;
  hintedCells: Set<number>;
  onSelect: (index: number) => void;
  disabled?: boolean;
}) {
  return <div className={`mx-auto w-full max-w-[min(92vw,34rem)] rounded-xl border-2 border-violet-300 bg-violet-200 p-0.5 shadow-[0_14px_30px_rgba(124,58,237,.12)] ${disabled ? "pointer-events-none opacity-60" : ""}`}>
    <div className="grid grid-cols-9 overflow-hidden rounded-lg bg-white">
      {board.map((value, index) => <Cell key={index} index={index} value={value} notes={notes[index]} fixed={fixedMask[index]} selected={selected === index} related={relatedCells.has(index)} sameValue={sameValueCells.has(index)} conflict={conflicts.has(index)} wrong={wrongCells.has(index)} hinted={hintedCells.has(index)} onSelect={onSelect} />)}
    </div>
  </div>;
}
