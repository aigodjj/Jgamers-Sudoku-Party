
"use client";

import type { Board } from "@/lib/sudoku/types";
import { Cell } from "./Cell";

export function SudokuBoard({
  board,
  notes,
  fixedMask,
  selected,
  relatedCells,
  sameValueCells,
  conflicts,
  wrongCells,
  hintedCells,
  onSelect,
  disabled = false,
}: {
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
  return (
    <div
      className={`
        relative mx-auto w-full max-w-[min(92vw,34rem)]
        rounded-[1.15rem] p-[4px]
        bg-gradient-to-br from-sky-400 via-blue-500 to-violet-500
        shadow-[0_8px_0_#2563a8,0_16px_30px_rgba(37,99,235,0.22)]
        transition-all duration-200
        ${disabled ? "pointer-events-none opacity-60 grayscale-[0.25]" : ""}
      `}
    >
      {/* 裝飾外框 */}
      <div className="rounded-[0.9rem] bg-white/70 p-[3px]">
        {/* 棋盤本體 */}
        <div
          className="
            grid grid-cols-9 overflow-hidden
            rounded-[0.7rem]
            bg-sky-200
            ring-1 ring-inset ring-white/80
          "
        >
          {board.map((value, index) => (
            <Cell
              key={index}
              index={index}
              value={value}
              notes={notes[index]}
              fixed={fixedMask[index]}
              selected={selected === index}
              related={relatedCells.has(index)}
              sameValue={sameValueCells.has(index)}
              conflict={conflicts.has(index)}
              wrong={wrongCells.has(index)}
              hinted={hintedCells.has(index)}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
