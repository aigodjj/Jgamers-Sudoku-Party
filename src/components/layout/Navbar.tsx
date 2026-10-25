
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Map,
  Swords,
  Shirt,
  Trophy,
  UserRound,
  Settings,
  CalendarDays,
  Coins,
  Sparkles,
} from "lucide-react";
import { useT } from "@/i18n";

const links = [
  { href: "/", key: "nav.home", Icon: Home, color: "blue" },
  { href: "/campaign", key: "nav.campaign", Icon: Map, color: "green" },
  { href: "/daily", key: "nav.daily", Icon: CalendarDays, color: "yellow" },
  { href: "/multiplayer", key: "nav.multiplayer", Icon: Swords, color: "pink" },
  { href: "/wardrobe", key: "nav.wardrobe", Icon: Shirt, color: "purple" },
  { href: "/achievements", key: "nav.achievements", Icon: Trophy, color: "yellow" },
  { href: "/profile", key: "nav.profile", Icon: UserRound, color: "green" },
  { href: "/settings", key: "nav.settings", Icon: Settings, color: "blue" },
];

const activeColors: Record<string, string> = {
  blue: "bg-sky-100 text-sky-700 ring-sky-300",
  green: "bg-emerald-100 text-emerald-700 ring-emerald-300",
  yellow: "bg-amber-100 text-amber-700 ring-amber-300",
  pink: "bg-pink-100 text-pink-700 ring-pink-300",
  purple: "bg-violet-100 text-violet-700 ring-violet-300",
};

export function Navbar() {
  const t = useT();
  const pathname = usePathname();

  return (
    <header className="site-header sticky top-0 z-30 border-b-2 border-sky-100 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[100rem] items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label={t("app.name")}
        >
          <span className="grid size-11 place-items-center rounded-2xl border-2 border-white bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 text-white shadow-[0_4px_0_#2457b7] transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105">
            <Sparkles size={23} strokeWidth={2.8} />
          </span>

          <span className="hidden sm:block">
            <strong className="block text-sm font-black tracking-tight text-slate-800">
              {t("app.name")}
            </strong>
            <span className="mt-0.5 block text-[11px] font-bold text-sky-600">
              {t("app.tagline")}
            </span>
          </span>
        </Link>

        {/* Main navigation */}
        <nav
          className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto py-1 sm:justify-center sm:gap-1.5"
          aria-label={t("nav.primaryNavigation")}
        >
          {links.map(({ href, key, Icon, color }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={href}
                href={href}
                title={t(key)}
                aria-label={t(key)}
                aria-current={active ? "page" : undefined}
                className={[
                  "group relative grid size-10 shrink-0 place-items-center rounded-xl border-2 transition-all duration-150 sm:flex sm:h-10 sm:w-auto sm:gap-2 sm:px-3",
                  active
                    ? `${activeColors[color]} border-current shadow-[0_3px_0_rgb(36_52_91_/_12%)]`
                    : "border-transparent text-slate-500 hover:-translate-y-0.5 hover:border-sky-100 hover:bg-sky-50 hover:text-sky-700",
                ].join(" ")}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.8 : 2.2}
                  className="transition-transform duration-150 group-hover:scale-110"
                />

                <span className="hidden text-xs font-extrabold xl:inline">
                  {t(key)}
                </span>

                {active && (
                  <span className="absolute -bottom-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-current sm:hidden" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Coins */}
        <Link
          href="/wardrobe"
          className="group flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-amber-200 bg-gradient-to-b from-yellow-100 to-amber-50 px-2.5 py-2 text-xs font-black text-amber-700 shadow-[0_3px_0_#edc35d] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#edc35d] active:translate-y-0.5 active:shadow-none sm:gap-2 sm:px-3"
        >
          <span className="grid size-6 place-items-center rounded-lg bg-yellow-300 text-amber-800 transition-transform group-hover:rotate-12">
            <Coins size={15} strokeWidth={2.8} />
          </span>
          <span className="hidden sm:inline">{t("common.coins")}</span>
        </Link>
      </div>
    </header>
  );
}
