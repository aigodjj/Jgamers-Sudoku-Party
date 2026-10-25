
"use client";

import { Hash, Pencil, Eraser } from "lucide-react";
import type { CellValue } from "@/lib/sudoku/types";
import type { SelectMode } from "@/lib/sudoku/useSudokuGame";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n";

export function NumberPad({
  mode,
  setMode,
  onInput,
  onErase,
  disabled = false,
  remainingByDigit,
}: {
  mode: SelectMode;
  setMode: (mode: SelectMode) => void;
  onInput: (value: CellValue) => void;
  onErase: () => void;
  disabled?: boolean;
  remainingByDigit?: number[];
}) {
  const t = useT();

  const digitColors = [
    "from-sky-400 to-blue-500 shadow-blue-200",
    "from-emerald-400 to-green-500 shadow-green-200",
    "from-amber-300 to-orange-400 shadow-orange-200",
    "from-pink-400 to-rose-500 shadow-rose-200",
    "from-violet-400 to-purple-500 shadow-purple-200",
    "from-cyan-400 to-teal-500 shadow-teal-200",
    "from-orange-400 to-red-400 shadow-red-200",
    "from-indigo-400 to-blue-500 shadow-indigo-200",
    "from-fuchsia-400 to-pink-500 shadow-pink-200",
  ];

  return (
    <div className="mx-auto w-full max-w-[min(92vw,34rem)] space-y-3">
      {/* 數字按鍵 */}
      <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onInput((i + 1) as CellValue)}
            aria-label={`${i + 1}`}
            className={`
              group relative flex min-h-11 flex-col
              items-center justify-center
              rounded-xl border-2 border-white/90
              bg-gradient-to-b ${digitColors[i]}
              py-1.5 font-number text-lg font-black text-white
              shadow-[0_3px_0_rgba(30,64,175,0.18)]
              transition duration-150
              hover:-translate-y-0.5 hover:brightness-105
              hover:shadow-md active:translate-y-0.5
              active:shadow-none
              focus-visible:outline-none
              focus-visible:ring-4 focus-visible:ring-yellow-300
              disabled:cursor-not-allowed disabled:opacity-40
              sm:min-h-14 sm:rounded-2xl sm:text-xl
            `}
          >
            <span className="drop-shadow-sm">{i + 1}</span>

            {remainingByDigit && (
              <span className="text-[10px] font-bold leading-tight text-white/80 sm:text-[11px]">
                {remainingByDigit[i]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 操作按鈕 */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={mode === "note" ? "primary" : "secondary"}
          disabled={disabled}
          onClick={() => setMode(mode === "note" ? "digit" : "note")}
        >
          <Pencil size={16} />
          {t("sudoku.notes")}
        </Button>

        <Button
          variant="secondary"
          disabled={disabled}
          onClick={onErase}
        >
          <Eraser size={16} />
          {t("sudoku.erase")}
        </Button>

        <Button
          variant={mode === "digit" ? "secondary" : "ghost"}
          disabled={disabled}
          onClick={() => setMode("digit")}
        >
          <Hash size={16} />
          {t("sudoku.selectNumber")}
        </Button>
      </div>
    </div>
  );
}
