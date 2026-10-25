"use client";
import { useEffect, useMemo, useState } from "react";
import { LockKeyhole, Sparkles, Trophy } from "lucide-react";
import { useT } from "@/i18n";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";

interface Achievement { id: string; category: string; titleKey: string; descKey: string; icon: string; conditionValue: number; rewardCoins: number; progress: number; unlocked: boolean; unlockedAt: string | null }
export default function AchievementsPage() {
  const t = useT();
  const [items, setItems] = useState<Achievement[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  useEffect(() => { apiFetch<{ achievements: Achievement[] }>("/api/achievements").then(v => setItems(v.achievements)).catch((e: unknown) => setError(e instanceof Error ? e.message : t("errors.generic"))); }, [t]);
  const filtered = useMemo(() => (items ?? []).filter(a => filter === "all" || a.category === filter), [items, filter]);
  if (!items) return <PageWrapper><Spinner/>{error && <Toast message={error} onClose={() => setError("")}/>}</PageWrapper>;
  const unlocked = items.filter(a=>a.unlocked).length;
  const categories = ["all", "solo", "campaign", "multiplayer", "collection"];
  return <PageWrapper className="space-y-6">
    <header><p className="text-sm font-extrabold uppercase tracking-[.18em] text-amber-500">{t("nav.achievements")}</p><h1 className="mt-2 text-3xl font-black text-slate-800 sm:text-4xl">{t("achievements.title")}</h1><p className="mt-2 text-slate-500">{t("achievements.subtitle")}</p></header>
    <Card className="bg-gradient-to-br from-amber-50 via-pink-50 to-violet-50"><div className="flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-white text-amber-500 shadow-sm"><Trophy size={28}/></div><div className="flex-1"><div className="text-2xl font-black text-slate-800">{unlocked} / {items.length}</div><div className="text-sm font-semibold text-slate-500">{t("achievements.unlocked")}</div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-pink-400" style={{width:`${items.length ? unlocked / items.length * 100 : 0}%`}}/></div></div><Sparkles className="text-pink-400" size={28}/></div></Card>
    <div className="flex flex-wrap gap-2">{categories.map(c=><button key={c} onClick={()=>setFilter(c)} className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${filter===c ? "bg-violet-500 text-white" : "bg-white text-slate-500 hover:bg-violet-50"}`}>{c === "all" ? t("achievements.categories.all") : t(`achievements.categories.${c}`)}</button>)}</div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item)=>{
      const percentage = item.unlocked ? 100 : Math.min(100, Math.max(0, item.progress / Math.max(1,item.conditionValue) * 100));
      return <Card key={item.id} className={`relative flex gap-4 !p-4 sm:!p-5 ${item.unlocked ? "ring-1 ring-emerald-100" : ""}`}><div className={`grid size-14 shrink-0 place-items-center rounded-2xl text-2xl ${item.unlocked ? "bg-emerald-50" : "bg-slate-100 grayscale"}`}>{item.unlocked ? item.icon === "gem" ? "💎" : item.icon === "zap" ? "⚡" : item.icon === "medal" ? "🏅" : item.icon === "compass" ? "🧭" : item.icon === "brain" ? "🧠" : item.icon === "trophy" ? "🏆" : "✨" : <LockKeyhole size={22} className="text-slate-400"/>}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="font-black text-slate-800">{t(item.titleKey)}</h2>{item.unlocked && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-600">{t("achievements.unlocked")}</span>}</div><p className="mt-1 text-sm leading-relaxed text-slate-500">{t(item.descKey)}</p><div className="mt-3 flex justify-between text-xs font-bold text-slate-400"><span>{t("achievements.progress")}</span><span>{item.unlocked ? item.conditionValue : Math.min(item.progress,item.conditionValue)} / {item.conditionValue}</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.unlocked ? "bg-emerald-400" : "bg-violet-400"}`} style={{width:`${percentage}%`}}/></div><div className="mt-3 flex items-center justify-between gap-2 text-xs"><span className="font-bold text-amber-600">🪙 {item.rewardCoins}</span>{item.unlockedAt && <span className="text-right font-semibold text-slate-400">{t("achievements.unlockedOn",{date:new Date(item.unlockedAt).toLocaleDateString()})}</span>}</div></div></Card>;
    })}</div>
    {error && <Toast message={error} onClose={() => setError("")}/>}
  </PageWrapper>;
}
