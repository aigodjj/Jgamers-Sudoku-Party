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

export function Cell({ index, value, notes, fixed, selected, related, sameValue, conflict, wrong, hinted, onSelect }: SudokuCellProps) {
  const t = useT();
  const row = Math.floor(index / 9);
  const col = index % 9;
  const classes = [
    "relative grid aspect-square min-w-0 place-items-center border-r border-b border-violet-100 p-0 text-base font-bold transition-colors sm:text-xl",
    col === 8 ? "border-r-0" : col % 3 === 2 ? "border-r-2 border-r-violet-300" : "",
    row === 8 ? "border-b-0" : row % 3 === 2 ? "border-b-2 border-b-violet-300" : "",
    fixed ? "bg-violet-50 text-slate-800" : "bg-white text-violet-600",
    related ? "bg-sky-50" : "",
    sameValue && !selected ? "bg-amber-100" : "",
    hinted ? "bg-emerald-100 text-emerald-700" : "",
    conflict || wrong ? "bg-rose-100 text-rose-600" : "",
    selected ? "z-10 rounded-md bg-violet-200 ring-2 ring-inset ring-violet-500" : "hover:bg-violet-100",
  ].filter(Boolean).join(" ");
  return <button type="button" className={classes} onClick={() => onSelect(index)} aria-label={value ? t("game.cellFilledLabel", { row: row + 1, col: col + 1, value }) : t("game.cellEmptyLabel", { row: row + 1, col: col + 1 })} aria-pressed={selected}>
    {value !== 0 ? <span>{value}</span> : <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-[1px] text-[7px] font-medium leading-none text-slate-400 sm:text-[10px]">{Array.from({ length: 9 }, (_, i) => <span key={i} className="grid place-items-center">{notes.has(i + 1) ? i + 1 : ""}</span>)}</span>}
  </button>;
}
