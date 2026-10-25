
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Coins,
  Gamepad2,
  Map,
  Shirt,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { useT } from "@/i18n";
import { apiFetch } from "@/lib/api/client";
import { AvatarSVG } from "@/components/avatar/AvatarSVG";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface ProfileData {
  profile: { username: string; coins: number; isGuest: boolean };
  equipped: Record<string, string>;
  rating?: { rating: number; rank?: string };
}

interface Level {
  id: string;
  unlocked: boolean;
  completed: boolean;
  stars: number;
  index: number;
}

const quickLinks = [
  {
    href: "/campaign",
    key: "home.continueCampaign",
    icon: Map,
    label: "STORY MODE",
    tint: "from-sky-400 to-blue-600",
    shadow: "shadow-blue-200",
    border: "border-sky-200",
  },
  {
    href: "/multiplayer",
    key: "home.playMultiplayer",
    icon: Swords,
    label: "VERSUS BATTLE",
    tint: "from-pink-400 to-rose-500",
    shadow: "shadow-pink-200",
    border: "border-pink-200",
  },
  {
    href: "/daily",
    key: "home.dailyChallenge",
    icon: CalendarDays,
    label: "DAILY CHALLENGE",
    tint: "from-amber-300 to-orange-500",
    shadow: "shadow-amber-200",
    border: "border-amber-200",
  },
  {
    href: "/wardrobe",
    key: "home.wardrobe",
    icon: Shirt,
    label: "DRESS UP",
    tint: "from-violet-400 to-purple-600",
    shadow: "shadow-violet-200",
    border: "border-violet-200",
  },
  {
    href: "/achievements",
    key: "home.achievements",
    icon: Trophy,
    label: "ACHIEVEMENTS",
    tint: "from-emerald-400 to-green-600",
    shadow: "shadow-emerald-200",
    border: "border-emerald-200",
  },
];

export default function HomePage() {
  const t = useT();
  const [data, setData] = useState<ProfileData | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<ProfileData>("/api/profile"),
      apiFetch<{ levels: Level[] }>("/api/campaign"),
    ])
      .then(([profile, campaign]) => {
        setData(profile);
        setLevels(campaign.levels);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : t("errors.generic")),
      );
  }, [t]);

  if (!data && !error) {
    return (
      <PageWrapper>
        <div className="flex min-h-64 items-center justify-center rounded-3xl border-2 border-sky-100 bg-white/90 shadow-sm">
          <Spinner />
        </div>
      </PageWrapper>
    );
  }

  const completed = levels.filter((level) => level.completed).length;
  const nextLevel =
    levels.find((level) => level.unlocked && !level.completed) ??
    levels.at(-1);

  const progress = levels.length
    ? Math.round((completed / levels.length) * 100)
    : 0;

  return (
    <PageWrapper className="space-y-7 pb-8">
      {error && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"
        >
          {error}
        </div>
      )}

      {/* Hero / Main menu */}
      {data && (
        <section className="relative isolate overflow-hidden rounded-[2rem] border-2 border-white bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 p-5 shadow-[0_8px_0_#2457b7] sm:p-8 lg:p-10">
          {/* Decorative bubbles */}
          <div className="pointer-events-none absolute -right-8 -top-10 -z-10 size-48 rounded-full border-[18px] border-white/10 bg-cyan-200/20" />
          <div className="pointer-events-none absolute right-28 top-12 -z-10 size-12 rounded-full bg-yellow-300/80 shadow-[0_0_30px_rgb(255_220_74_/_35%)]" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 -z-10 size-40 rounded-full bg-pink-300/20 blur-2xl" />
          <div className="pointer-events-none absolute right-8 top-1/2 -z-10 size-5 rounded-full bg-white/70" />
          <div className="pointer-events-none absolute bottom-12 right-1/3 -z-10 size-3 rounded-full bg-yellow-200" />

          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-white/70 bg-white/95 px-3 py-2 text-xs font-black text-blue-700 shadow-sm">
                <Sparkles size={15} className="text-amber-500" />
                {t("app.tagline")}
              </div>

              <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
                {t("home.greeting", { name: data.profile.username })}
              </h1>

              <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-blue-50 sm:text-base">
                {t("home.subtitle")}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={
                    nextLevel ? `/campaign/${nextLevel.id}` : "/campaign"
                  }
                  className="group inline-flex min-h-12 items-center gap-2 rounded-2xl border-2 border-yellow-200 bg-gradient-to-b from-yellow-200 to-amber-400 px-5 py-3 text-sm font-black text-amber-950 shadow-[0_5px_0_#c88617] transition-all hover:-translate-y-0.5 hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_#c88617]"
                >
                  <Gamepad2 size={19} />
                  {t("home.continueCampaign")}
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  href="/multiplayer"
                  className="group inline-flex min-h-12 items-center gap-2 rounded-2xl border-2 border-white/80 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-[0_5px_0_#c6dcff] transition-all hover:-translate-y-0.5 hover:bg-sky-50 active:translate-y-1 active:shadow-none"
                >
                  <Swords size={18} className="text-pink-500" />
                  {t("home.playMultiplayer")}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>

            {/* Character and currency */}
            <div className="flex items-center justify-center gap-4 md:flex-col">
              <div className="relative">
                <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-yellow-200 via-pink-200 to-cyan-200 opacity-90 blur-sm" />
                <div className="relative grid size-36 place-items-center rounded-[2rem] border-[4px] border-white bg-gradient-to-br from-white to-sky-100 shadow-xl sm:size-48">
                  <AvatarSVG config={data.equipped} size={138} />
                </div>
                <div className="absolute -right-3 -top-3 grid size-10 place-items-center rounded-2xl border-2 border-white bg-yellow-300 text-amber-800 shadow-md">
                  <Sparkles size={21} />
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3 rounded-2xl border-2 border-white bg-white px-4 py-3 shadow-[0_4px_0_rgb(36_52_91_/_15%)]">
                <div className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                  <Coins size={23} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500">
                    {t("home.coins")}
                  </div>
                  <div className="text-xl font-black tabular-nums text-slate-800">
                    {data.profile.coins.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Progress and daily challenge */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-sky-100 bg-white shadow-[0_5px_0_rgb(35_83_156_/_10%)] md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {t("home.campaignProgress")}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {t("campaign.stageProgress", {
                  done: completed,
                  total: levels.length,
                })}
              </p>
            </div>
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-sky-200 bg-sky-100 text-sky-700">
              <Map size={23} />
            </div>
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full border-2 border-sky-100 bg-sky-50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-extrabold text-slate-500">
            <span>
              {completed} / {levels.length}
            </span>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-sky-700">
              {progress}%
            </span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between border-2 border-amber-200 bg-gradient-to-br from-yellow-50 via-amber-50 to-pink-50 shadow-[0_5px_0_rgb(217_157_40_/_15%)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-800">
                {t("daily.title")}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {t("daily.subtitle")}
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl border-2 border-amber-200 bg-white text-orange-500">
              <CalendarDays size={23} />
            </div>
          </div>

          <Link
            href="/daily"
            className="mt-5 inline-flex items-center gap-2 self-start rounded-xl border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-black text-orange-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-100"
          >
            {t("daily.play")}
            <ArrowRight size={16} />
          </Link>
        </Card>
      </section>

      {/* Quick game modes */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-800 sm:text-2xl">
              {t("home.quickActions")}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {t("home.subtitle")}
            </p>
          </div>
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl border-2 border-violet-200 bg-violet-100 text-violet-600">
            <Gamepad2 size={24} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {quickLinks.map(
            ({ href, key, icon: Icon, tint, label, shadow, border }) => (
              <Link
                key={href}
                href={href}
                className={`group relative flex min-h-28 items-center gap-3 overflow-hidden rounded-3xl border-2 ${border} bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${shadow}`}
              >
                <div
                  className={`grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-white bg-gradient-to-br ${tint} text-white shadow-md transition-transform duration-200 group-hover:rotate-3 group-hover:scale-105`}
                >
                  <Icon size={25} strokeWidth={2.5} />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="mb-1 block text-[9px] font-black tracking-widest text-slate-400">
                    {label}
                  </span>
                  <span className="block text-sm font-black leading-snug text-slate-800">
                    {t(key)}
                  </span>
                </div>

                <ArrowRight
                  size={17}
                  className="shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500"
                />

                <div className="pointer-events-none absolute -bottom-5 -right-4 size-16 rounded-full bg-slate-50/80 transition-transform group-hover:scale-150" />
              </Link>
            ),
          )}
        </div>
      </section>

      {/* Account status */}
      {data && (
        <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-500">
          <CheckCircle2 size={14} className="text-emerald-500" />
          {data.profile.isGuest
            ? t("profile.guestNotice")
            : t("home.subtitle")}
        </p>
      )}
    </PageWrapper>
  );
}
