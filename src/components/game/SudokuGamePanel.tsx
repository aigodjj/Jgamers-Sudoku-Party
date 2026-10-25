"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, HeartCrack, Lightbulb, Pause, Play, RotateCcw, Undo2, Redo2 } from "lucide-react";
import { useSudokuGame } from "@/lib/sudoku/useSudokuGame";
import { parseBoardString, type Difficulty } from "@/lib/sudoku/types";
import { useT } from "@/i18n";
import { formatDuration } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SudokuBoard } from "./SudokuBoard";
import { NumberPad } from "./NumberPad";

export interface VictoryDetails { stars?: number; coinsAwarded?: number; placement?: number; message?: string }

export function SudokuGamePanel({ title, difficulty, givens, solution, onComplete, onExit, victoryDetails, multiplayer = false, onBoardChange }: {
  title: string;
  difficulty: Difficulty;
  givens: string;
  solution?: string;
  onComplete: (info: { board: string; timeMs: number; mistakes: number; hintsUsed: number }) => void | boolean | Promise<void | boolean>;
  onExit?: () => void;
  victoryDetails?: VictoryDetails | null;
  multiplayer?: boolean;
  onBoardChange?: (board: string, mistakes: number) => void;
}) {
  const t = useT();
  const [restartOpen, setRestartOpen] = useState(false);
  const solved = useMemo(() => solution ? parseBoardString(solution) : null, [solution]);
  const game = useSudokuGame({ givens, solution, maxMistakes: 3, maxHints: 3, onComplete });
  useEffect(() => { onBoardChange?.(game.board.map(String).join(""), game.mistakes); }, [game.board, game.mistakes, onBoardChange]);
  const remainingByDigit = useMemo(() => Array.from({ length: 9 }, (_, i) => Math.max(0, 9 - game.board.filter((v) => v === i + 1).length)), [game.board]);
  const blocked = game.isPaused || game.isValidating || game.isCompleted || game.isDefeated;
  const elapsed = formatDuration(game.elapsedMs);

  return <div className="mx-auto w-full max-w-6xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">{onExit && <button onClick={onExit} className="rounded-2xl bg-white p-3 text-slate-600 shadow-sm hover:bg-violet-50" aria-label={t("common.back")}><ArrowLeft size={20} /></button>}<div className="min-w-0"><h1 className="truncate text-2xl font-black text-slate-800 sm:text-3xl">{title}</h1><p className="mt-1 text-sm font-semibold text-slate-500">{t(`difficulty.${difficulty}`)}</p></div></div>
      <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm"><Clock3 size={18} className="text-violet-500" /><span className="font-mono text-lg font-black tabular-nums text-slate-700">{elapsed}</span></div>
    </header>

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2"><div className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-500">♥ {t("sudoku.mistakesCount", { count: game.mistakes, max: game.maxMistakes })}</div><div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-600"><Lightbulb className="mr-1 inline" size={15} />{t("sudoku.hintsUsed", { count: game.hintsUsed, max: game.maxHints })}</div><div className="rounded-xl bg-sky-50 px-3 py-2 text-sm font-bold text-sky-600">{game.filledCount}/81</div></div>
        <div className="relative">
          <SudokuBoard board={game.board} notes={game.notes} fixedMask={game.fixedMask} selected={game.selected} relatedCells={game.relatedCells} sameValueCells={game.sameValueCells} conflicts={game.conflicts} wrongCells={game.wrongCells} hintedCells={game.hintedCells} onSelect={game.select} disabled={game.isPaused || game.isCompleted || game.isDefeated} />
          {game.isPaused && <div className="absolute inset-0 grid place-items-center rounded-xl bg-white/85 backdrop-blur-sm"><div className="text-center"><Pause size={36} className="mx-auto text-violet-500"/><p className="mt-2 text-xl font-black text-slate-700">{t("sudoku.paused")}</p><Button className="mt-4" onClick={game.togglePause}><Play size={16}/>{t("sudoku.resume")}</Button></div></div>}
          {game.isValidating && <div className="absolute inset-0 grid place-items-center rounded-xl bg-white/75 backdrop-blur-sm"><div className="text-center"><div className="mx-auto size-9 animate-spin rounded-full border-4 border-violet-100 border-t-violet-500"/><p className="mt-3 font-black text-slate-700">{t("game.checkingSolution")}</p></div></div>}
        </div>
        <div className="flex flex-wrap justify-center gap-2"><Button variant="secondary" disabled={!game.canUndo || blocked} onClick={game.undo}><Undo2 size={16}/>{t("sudoku.undo")}</Button><Button variant="secondary" disabled={!game.canRedo || blocked} onClick={game.redo}><Redo2 size={16}/>{t("sudoku.redo")}</Button><Button variant="secondary" disabled={game.isCompleted || game.isDefeated} onClick={game.togglePause}>{game.isPaused ? <Play size={16}/> : <Pause size={16}/>}{game.isPaused ? t("sudoku.resume") : t("sudoku.pause")}</Button><Button variant="ghost" disabled={multiplayer} onClick={() => setRestartOpen(true)}><RotateCcw size={16}/>{t("sudoku.restart")}</Button></div>
      </div>
      <div className="space-y-4">
        <NumberPad mode={game.mode} setMode={game.setMode} onInput={game.inputDigit} onErase={game.erase} disabled={blocked} remainingByDigit={remainingByDigit} />
        <Card className="!p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-extrabold text-slate-700">{t("sudoku.hint")}</h2><span className="text-xs font-bold text-slate-400">{Math.max(0, game.maxHints - game.hintsUsed)} / {game.maxHints}</span></div><Button className="w-full" variant="secondary" onClick={game.useHint} disabled={!solved || blocked || game.hintsUsed >= game.maxHints}><Lightbulb size={17}/>{t("sudoku.hint")}</Button><p className="mt-3 text-xs leading-relaxed text-slate-400">{t("game.keyboardTip")}</p></Card>
      </div>
    </div>

    <Modal open={game.isDefeated} title={t("sudoku.defeatTitle")} onClose={game.restart} footer={<><Button variant="secondary" onClick={game.restart}>{t("sudoku.restart")}</Button>{onExit && <Button onClick={onExit}>{t("common.back")}</Button>}</>}>
      <div className="py-3 text-center"><HeartCrack size={44} className="mx-auto text-rose-400"/><p className="mt-3 text-slate-600">{t("game.mistakeLimitReached")}</p></div>
    </Modal>
    <Modal open={game.isCompleted} title={t("sudoku.victoryTitle")} onClose={onExit} footer={<>{onExit && <Button variant="secondary" onClick={onExit}>{t("common.back")}</Button>}<Button onClick={game.restart}>{t("sudoku.playAgain")}</Button></>}>
      <div className="py-2 text-center"><div className="mb-3 text-5xl">🎉</div><p className="font-semibold text-slate-600">{victoryDetails?.message ?? t("sudoku.victorySubtitle")}</p><p className="mt-3 font-mono text-xl font-black text-violet-600">{elapsed}</p>{victoryDetails?.stars !== undefined && <p className="mt-3 text-2xl text-amber-400">{"★".repeat(victoryDetails.stars)}{"☆".repeat(Math.max(0, 3 - victoryDetails.stars))}</p>}{victoryDetails?.coinsAwarded !== undefined && <p className="mt-2 font-bold text-amber-600">🪙 +{victoryDetails.coinsAwarded}</p>}{victoryDetails?.placement !== undefined && <p className="mt-2 font-bold text-violet-600">{t("multiplayer.placement")}: #{victoryDetails.placement}</p>}</div>
    </Modal>
    <Modal open={restartOpen} title={t("sudoku.restartConfirmTitle")} onClose={() => setRestartOpen(false)} footer={<><Button variant="secondary" onClick={() => setRestartOpen(false)}>{t("common.cancel")}</Button><Button onClick={() => { game.restart(); setRestartOpen(false); }}>{t("sudoku.restart")}</Button></>}><p className="text-slate-600">{t("sudoku.restartConfirmBody")}</p></Modal>
  </div>;
}
