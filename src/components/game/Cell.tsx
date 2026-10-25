
"use client";

import type { CellValue } from "@/lib/sudoku/types";
import { useT } from "@/i18n";

export interface SudokuCellProps {
  index: number;
  value: CellValue;
  notes: Set<number>;
  fixed: boolean;
  selected: boolean;
  related: boolean;
  sameValue: boolean;
  conflict: boolean;
  wrong: boolean;
  hinted: boolean;
  onSelect: (index: number) => void;
}

export function Cell({
  index,
  value,
  notes,
  fixed,
  selected,
  related,
  sameValue,
  conflict,
  wrong,
  hinted,
  onSelect,
}: SudokuCellProps) {
  const t = useT();
  const row = Math.floor(index / 9);
  const col = index % 9;

  const classes = [
    // 基本格子：清爽白底與細緻格線
    "relative grid aspect-square min-w-0 place-items-center p-0",
    "border-r border-b border-sky-100",
    "text-base font-black transition-colors duration-100",
    "focus-visible:z-20 focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
    "sm:text-xl",

    // 3×3 宮格分隔線
    col === 8
      ? "border-r-0"
      : col % 3 === 2
        ? "border-r-[3px] border-r-sky-400"
        : "",
    row === 8
      ? "border-b-0"
      : row % 3 === 2
        ? "border-b-[3px] border-b-sky-400"
        : "",

    // 固定數字與玩家輸入
    fixed
      ? "bg-slate-50 text-slate-800"
      : "bg-white text-blue-600",

    // 同一行、列與宮格
    related && !selected
      ? "bg-sky-100"
      : "",

    // 相同數字
    sameValue && !selected
      ? "bg-amber-200 text-amber-900"
      : "",

    // 提示格
    hinted
      ? "bg-emerald-100 text-emerald-800"
      : "",

    // 錯誤或衝突格
    conflict || wrong
      ? "bg-rose-100 text-rose-700"
      : "",

    // 目前選取的格子
    selected
      ? "z-10 bg-yellow-200 text-blue-800 ring-2 ring-inset ring-orange-400"
      : "hover:bg-sky-50 active:bg-sky-200",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      onClick={() => onSelect(index)}
      aria-label={
        value
          ? t("game.cellFilledLabel", {
              row: row + 1,
              col: col + 1,
              value,
            })
          : t("game.cellEmptyLabel", {
              row: row + 1,
              col: col + 1,
            })
      }
      aria-pressed={selected}
    >
      {value !== 0 ? (
        <span
          className={`
            relative z-[1] leading-none
            ${fixed ? "text-slate-800" : "text-blue-600"}
            ${selected ? "!text-blue-800" : ""}
            ${conflict || wrong ? "!text-rose-700" : ""}
            ${hinted ? "!text-emerald-800" : ""}
            ${sameValue && !selected ? "!text-amber-900" : ""}
          `}
        >
          {value}
        </span>
      ) : (
        <span
          className="
            grid h-full w-full grid-cols-3 grid-rows-3
            p-[1px] text-[8px] font-bold leading-none
            text-slate-500 sm:text-[10px]
          "
        >
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="grid place-items-center">
              {notes.has(i + 1) ? i + 1 : ""}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
