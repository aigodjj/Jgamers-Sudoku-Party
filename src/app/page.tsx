"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Coins, Gamepad2, Map, Shirt, Sparkles, Swords, Trophy } from "lucide-react";
import { useT } from "@/i18n";
import { apiFetch } from "@/lib/api/client";
import { AvatarSVG } from "@/components/avatar/AvatarSVG";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface ProfileData { profile: { username: string; coins: number; isGuest: boolean }; equipped: Record<string,string>; rating?: { rating: number; rank?: string } }
interface Level { id: string; unlocked: boolean; completed: boolean; stars: number; index: number }
const quickLinks = [
  { href: "/campaign", key: "home.continueCampaign", icon: Map, tint: "from-violet-500 to-purple-400" },
  { href: "/multiplayer", key: "home.playMultiplayer", icon: Swords, tint: "from-pink-500 to-rose-400" },
  { href: "/daily", key: "home.dailyChallenge", icon: CalendarDays, tint: "from-sky-500 to-cyan-400" },
  { href: "/wardrobe", key: "home.wardrobe", icon: Shirt, tint: "from-amber-500 to-orange-400" },
  { href: "/achievements", key: "home.achievements", icon: Trophy, tint: "from-emerald-500 to-teal-400" },
];
export default function HomePage() {
  const t = useT();
  const [data, setData] = useState<ProfileData | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([apiFetch<ProfileData>("/api/profile"), apiFetch<{ levels: Level[] }>("/api/campaign")])
      .then(([profile, campaign]) => { setData(profile); setLevels(campaign.levels); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : t("errors.generic")));
  }, [t]);
  if (!data && !error) return <PageWrapper><Spinner/></PageWrapper>;
  const completed = levels.filter((level) => level.completed).length;
  const nextLevel = levels.find((level) => level.unlocked && !level.completed) ?? levels.at(-1);
  return <PageWrapper className="space-y-7">
    {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-600">{error}</div>}
    {data && <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-100 via-pink-50 to-sky-100 p-5 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -right-8 -top-12 size-48 rounded-full bg-white/50 blur-2xl"/><div className="pointer-events-none absolute bottom-0 right-24 size-28 rounded-full bg-pink-200/50 blur-2xl"/>
      <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-violet-600"><Sparkles size={14}/>{t("app.tagline")}</div><h1 className="max-w-2xl text-3xl font-black leading-tight text-slate-800 sm:text-5xl">{t("home.greeting", { name: data.profile.username })}</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">{t("home.subtitle")}</p>
          <div className="mt-5 flex flex-wrap gap-3"><Link href={nextLevel ? `/campaign/${nextLevel.id}` : "/campaign"} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-600">{t("home.continueCampaign")}<ArrowRight size={17}/></Link><Link href="/multiplayer" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-pink-50"><Swords size={17}/>{t("home.playMultiplayer")}</Link></div>
        </div>
        <div className="flex items-center justify-center gap-4 md:flex-col"><div className="grid size-40 place-items-center rounded-[2rem] border border-white bg-white/75 shadow-xl shadow-violet-100 sm:size-48"><AvatarSVG config={data.equipped} size={138}/></div><div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm"><Coins className="text-amber-500" size={20}/><div><div className="text-xs font-bold text-slate-400">{t("home.coins")}</div><div className="text-xl font-black tabular-nums text-slate-800">{data.profile.coins}</div></div></div></div>
      </div>
    </section>}

    <section className="grid gap-4 md:grid-cols-3"><Card className="md:col-span-2"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black text-slate-800">{t("home.campaignProgress")}</h2><p className="mt-1 text-sm text-slate-500">{t("campaign.stageProgress", { done: completed, total: levels.length })}</p></div><div className="grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Map size={22}/></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-violet-50"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-400 transition-all" style={{ width: `${levels.length ? completed / levels.length * 100 : 0}%` }}/></div><div className="mt-3 flex justify-between text-xs font-bold text-slate-400"><span>{completed} / {levels.length}</span><span>{Math.round(levels.length ? completed / levels.length * 100 : 0)}%</span></div></Card><Card className="flex flex-col justify-between bg-gradient-to-br from-amber-50 to-pink-50"><div className="flex items-start justify-between"><div><h2 className="font-black text-slate-800">{t("daily.title")}</h2><p className="mt-1 text-sm text-slate-500">{t("daily.subtitle")}</p></div><CalendarDays className="text-rose-400" size={24}/></div><Link href="/daily" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-rose-500">{t("daily.play")}<ArrowRight size={16}/></Link></Card></section>

    <section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-black text-slate-800">{t("home.quickActions")}</h2><p className="mt-1 text-sm text-slate-500">{t("home.subtitle")}</p></div><Gamepad2 size={24} className="text-violet-400"/></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{quickLinks.map(({href,key,icon:Icon,tint})=><Link key={href} href={href} className="group flex items-center gap-3 rounded-3xl border border-white bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><span className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tint} text-white shadow-md`}><Icon size={22}/></span><span className="min-w-0 flex-1 text-sm font-extrabold text-slate-700">{t(key)}</span><ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500"/></Link>)}</div></section>
    {data && <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-400"><CheckCircle2 size={14}/>{data.profile.isGuest ? t("profile.guestNotice") : t("home.subtitle")}</p>}
  </PageWrapper>;
}
