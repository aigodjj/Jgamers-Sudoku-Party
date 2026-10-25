"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LockKeyhole, Play, Star, Trophy } from "lucide-react";
import { useT } from "@/i18n";
import { apiFetch, formatDuration } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Spinner } from "@/components/ui/Spinner";

interface Level { id: string; stage: string; stageIndex: number; levelInStage: number; index: number; unlocked: boolean; completed: boolean; stars: number; bestTimeMs: number | null }
export default function CampaignPage() {
  const t = useT();
  const [levels, setLevels] = useState<Level[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch<{ levels: Level[] }>("/api/campaign").then((v) => setLevels(v.levels)).catch((e: unknown) => setError(e instanceof Error ? e.message : t("errors.generic"))); }, [t]);
  const stages = useMemo(() => levels?.reduce<Record<string, Level[]>>((acc, level) => { (acc[level.stage] ??= []).push(level); return acc; }, {}) ?? {}, [levels]);
  if (!levels && !error) return <PageWrapper><Spinner/></PageWrapper>;
  return <PageWrapper className="space-y-7">
    <header><p className="text-sm font-extrabold uppercase tracking-[.18em] text-violet-500">{t("app.name")}</p><h1 className="mt-2 text-3xl font-black text-slate-800 sm:text-4xl">{t("campaign.title")}</h1><p className="mt-2 max-w-2xl text-slate-500">{t("campaign.subtitle")}</p></header>
    {error && <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-600">{error}</p>}
    {levels && <Card><div className="flex items-center gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-500"><Trophy size={24}/></div><div className="flex-1"><h2 className="font-black text-slate-800">{t("home.campaignProgress")}</h2><p className="text-sm text-slate-500">{t("campaign.stageProgress", { done: levels.filter((l) => l.completed).length, total: levels.length })}</p></div><div className="text-right"><div className="text-xl font-black text-amber-500">{levels.reduce((n,l)=>n+l.stars,0)}</div><div className="text-xs font-bold text-slate-400">{t("campaign.stars")}</div></div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-violet-50"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-400" style={{width:`${levels.length ? levels.filter(l=>l.completed).length/levels.length*100 : 0}%`}}/></div></Card>}
    {Object.entries(stages).sort(([a], [b]) => (levels?.find(l=>l.stage===a)?.stageIndex ?? 0) - (levels?.find(l=>l.stage===b)?.stageIndex ?? 0)).map(([stage, stageLevels], stageNumber) => <section key={stage} className="space-y-3"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 text-violet-600 font-black">{stageNumber + 1}</div><div><h2 className="text-xl font-black text-slate-800">{t(`difficulty.${stage}`)}</h2><p className="text-sm text-slate-500">{t("campaign.stageProgress", { done: stageLevels.filter(l=>l.completed).length, total: stageLevels.length })}</p></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{stageLevels.map((level) => <Link key={level.id} href={level.unlocked ? `/campaign/${level.id}` : "#locked"} aria-disabled={!level.unlocked} onClick={(event: { preventDefault: () => void }) => {if (!level.unlocked) event.preventDefault();}} className={`relative overflow-hidden rounded-3xl border p-4 transition ${level.unlocked ? "border-white bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg" : "cursor-not-allowed border-slate-100 bg-slate-100/80 opacity-70"}`}><div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-2xl text-lg font-black ${level.completed ? "bg-emerald-100 text-emerald-600" : level.unlocked ? "bg-violet-100 text-violet-600" : "bg-slate-200 text-slate-400"}`}>{level.levelInStage}</span>{level.unlocked ? <Play size={18} className="text-violet-500"/> : <LockKeyhole size={18} className="text-slate-400"/>}</div><h3 className="mt-4 font-extrabold text-slate-700">{t("campaign.level", { n: level.levelInStage })}</h3><p className="mt-1 min-h-5 text-xs font-semibold text-slate-400">{level.completed ? t("campaign.completed") : level.unlocked ? t("campaign.play") : t("campaign.locked")}</p><div className="mt-3 flex items-center gap-0.5 text-amber-400">{Array.from({length:3},(_,i)=><Star key={i} size={15} fill={i < level.stars ? "currentColor" : "none"} className={i < level.stars ? "" : "text-slate-300"}/>)}</div>{level.bestTimeMs !== null && <p className="mt-2 text-xs font-bold text-slate-400">{t("campaign.bestTime")}: {formatDuration(level.bestTimeMs)}</p>}</Link>)}</div></section>)}
  </PageWrapper>;
}
