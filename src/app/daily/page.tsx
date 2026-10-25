"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Flame, Trophy } from "lucide-react";
import { useT } from "@/i18n";
import { apiFetch, formatDuration } from "@/lib/api/client";
import { solveUnique } from "@/lib/sudoku/solver";
import { boardToString, parseBoardString, type Difficulty } from "@/lib/sudoku/types";
import { SudokuGamePanel, type VictoryDetails } from "@/components/game/SudokuGamePanel";
import { Card } from "@/components/ui/Card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";

interface DailyData { date: string; difficulty: Difficulty; givens: string; completedToday: boolean; todayResult: {timeMs:number;mistakes:number} | null; streak: number; bestTimeMs: number | null; timezone: string }
interface DailyResult { streak: number; coinsAwarded: number }
export default function DailyPage() {
  const t = useT();
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [details, setDetails] = useState<VictoryDetails | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(() => apiFetch<DailyData>("/api/daily").then(setDaily).catch((e: unknown) => setError(e instanceof Error ? e.message : t("errors.generic"))), [t]);
  useEffect(() => { void refresh(); }, [refresh]);
  const solution = useMemo(() => { if (!daily) return undefined; const board = solveUnique(parseBoardString(daily.givens)); return board ? boardToString(board) : undefined; }, [daily]);
  const onComplete = useCallback(async (info: { board: string; timeMs: number; mistakes: number; hintsUsed: number }) => {
    try {
      const result = await apiFetch<DailyResult>("/api/daily/complete", { method: "POST", body: JSON.stringify({ board: info.board, timeMs: info.timeMs, mistakes: info.mistakes }) });
      setDetails({ coinsAwarded: result.coinsAwarded, message: `${t("daily.streak")}: ${result.streak}` });
      setDaily((current) => current ? { ...current, completedToday: true, streak: result.streak, todayResult: { timeMs: info.timeMs, mistakes: info.mistakes } } : current);
    } catch (e) { setError(e instanceof Error ? e.message : t("errors.generic")); }
  }, [t]);
  if (!daily || !solution) return <PageWrapper><Spinner/>{error && <Toast message={error} onClose={() => setError("")}/>}</PageWrapper>;
  return <PageWrapper className="space-y-6">
    <header><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-extrabold text-rose-500"><CalendarDays size={14}/>{daily.date} · {t("daily.timezoneShort")}</div><h1 className="text-3xl font-black text-slate-800 sm:text-4xl">{t("daily.title")}</h1><p className="mt-2 text-slate-500">{t("daily.subtitle")}</p></header>
    <div className="grid gap-3 sm:grid-cols-3"><Card className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-orange-50 text-orange-500"><Flame size={24}/></span><div><div className="text-xs font-bold text-slate-400">{t("daily.streak")}</div><div className="text-2xl font-black text-slate-800">{daily.streak}</div></div></Card><Card className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-500"><Trophy size={24}/></span><div><div className="text-xs font-bold text-slate-400">{t("daily.personalBest")}</div><div className="text-2xl font-black text-slate-800">{formatDuration(daily.bestTimeMs)}</div></div></Card><Card className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-500"><CheckCircle2 size={24}/></span><div><div className="text-xs font-bold text-slate-400">{t("daily.completeReward")}</div><div className="mt-1 text-sm font-extrabold text-emerald-600">{t("daily.rewardPending")}</div></div></Card></div>
    {daily.completedToday ? <Card className="py-12 text-center"><CheckCircle2 size={54} className="mx-auto text-emerald-500"/><h2 className="mt-4 text-2xl font-black text-slate-800">{t("daily.alreadyCompleted")}</h2><p className="mt-2 text-slate-500">{t("daily.comeBackTomorrow")}</p>{daily.todayResult && <p className="mt-4 font-mono text-xl font-black text-violet-600">{formatDuration(daily.todayResult.timeMs)}</p>}<Link href="/campaign" className="mt-6 inline-flex rounded-2xl bg-violet-500 px-5 py-3 font-bold text-white">{t("campaign.title")}</Link></Card> : <SudokuGamePanel title={t("daily.title")} difficulty={daily.difficulty} givens={daily.givens} solution={solution} onComplete={onComplete} onExit={() => window.location.assign("/")} victoryDetails={details}/>}
    <p className="text-center text-xs font-semibold text-slate-400">{t("daily.timezoneNote")}</p>
    {error && <Toast message={error} onClose={() => setError("")}/>}
  </PageWrapper>;
}
