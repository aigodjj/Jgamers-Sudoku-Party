"use client";
import { Hash, Pencil, Eraser } from "lucide-react";
import type { CellValue } from "@/lib/sudoku/types";
import type { SelectMode } from "@/lib/sudoku/useSudokuGame";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n";

export function NumberPad({ mode, setMode, onInput, onErase, disabled = false, remainingByDigit }: {
  mode: SelectMode;
  setMode: (mode: SelectMode) => void;
  onInput: (value: CellValue) => void;
  onErase: () => void;
  disabled?: boolean;
  remainingByDigit?: number[];
}) {
  const t = useT();
  return <div className="mx-auto w-full max-w-[min(92vw,34rem)] space-y-2.5">
    <div className="grid grid-cols-9 gap-1 sm:gap-1.5">{Array.from({ length: 9 }, (_, i) => <button key={i} type="button" disabled={disabled} onClick={() => onInput((i + 1) as CellValue)} className="flex min-h-10 flex-col items-center justify-center rounded-xl bg-white py-2 text-lg font-black text-violet-600 shadow-sm ring-1 ring-violet-100 transition hover:bg-violet-500 hover:text-white active:scale-95 disabled:opacity-40 sm:min-h-12 sm:text-xl">{i + 1}{remainingByDigit && <span className="text-[9px] font-semibold opacity-50">{remainingByDigit[i]}</span>}</button>)}</div>
    <div className="grid grid-cols-3 gap-2">
      <Button variant={mode === "note" ? "primary" : "secondary"} disabled={disabled} onClick={() => setMode(mode === "note" ? "digit" : "note")}><Pencil size={16} />{t("sudoku.notes")}</Button>
      <Button variant="secondary" disabled={disabled} onClick={onErase}><Eraser size={16} />{t("sudoku.erase")}</Button>
      <Button variant={mode === "digit" ? "secondary" : "ghost"} disabled={disabled} onClick={() => setMode("digit")}><Hash size={16} />{t("sudoku.selectNumber")}</Button>
    </div>
  </div>;
}
