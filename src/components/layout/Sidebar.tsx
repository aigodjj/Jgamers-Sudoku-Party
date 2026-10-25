
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  Map,
  Settings,
  Shirt,
  Swords,
  Trophy,
  UserRound,
} from "lucide-react";
import { useT } from "@/i18n";

const navItems = [
  { href: "/", key: "nav.home", Icon: Home, color: "blue" },
  { href: "/campaign", key: "nav.campaign", Icon: Map, color: "green" },
  { href: "/daily", key: "nav.daily", Icon: CalendarDays, color: "yellow" },
  { href: "/multiplayer", key: "nav.multiplayer", Icon: Swords, color: "pink" },
  { href: "/wardrobe", key: "nav.wardrobe", Icon: Shirt, color: "purple" },
  { href: "/achievements", key: "nav.achievements", Icon: Trophy, color: "yellow" },
  { href: "/leaderboard", key: "nav.leaderboard", Icon: Trophy, color: "yellow" },
  { href: "/profile", key: "nav.profile", Icon: UserRound, color: "green" },
  { href: "/settings", key: "nav.settings", Icon: Settings, color: "blue" },
];

const activeColors: Record<string, string> = {
  blue: "border-sky-200 bg-sky-100 text-sky-700",
  green: "border-emerald-200 bg-emerald-100 text-emerald-700",
  yellow: "border-amber-200 bg-amber-100 text-amber-700",
  pink: "border-pink-200 bg-pink-100 text-pink-700",
  purple: "border-violet-200 bg-violet-100 text-violet-700",
};

export function Sidebar() {
  const t = useT();
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 self-start rounded-3xl border-2 border-sky-100 bg-white/95 p-3 shadow-[0_5px_0_rgb(35_83_156_/_10%)] xl:block">
      <div className="mb-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-white shadow-[0_3px_0_#2457b7]">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-100">
          JGAMERS PARTY
        </div>
        <div className="mt-1 text-sm font-black">
          {t("nav.sidebarNavigation")}
        </div>
      </div>

      <nav className="space-y-1.5" aria-label={t("nav.sidebarNavigation")}>
        {navItems.map(({ href, key, Icon, color }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "group flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-sm font-extrabold transition-all duration-150",
                active
                  ? `${activeColors[color]} shadow-[0_3px_0_rgb(36_52_91_/_10%)]`
                  : "border-transparent text-slate-500 hover:-translate-y-0.5 hover:border-sky-100 hover:bg-sky-50 hover:text-sky-700",
              ].join(" ")}
            >
              <span
                className={[
                  "grid size-8 shrink-0 place-items-center rounded-xl transition-transform duration-150 group-hover:scale-110",
                  active ? "bg-white/80" : "bg-slate-100 group-hover:bg-white",
                ].join(" ")}
              >
                <Icon size={18} strokeWidth={active ? 2.8 : 2.2} />
              </span>

              <span className="min-w-0 flex-1">{t(key)}</span>

              {active && (
                <span className="size-2 shrink-0 rounded-full bg-current" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 px-3 py-3 text-center">
        <p className="text-xs font-black text-sky-700">PLAY · PUZZLE · PARTY</p>
        <p className="mt-1 text-[10px] font-semibold text-slate-500">
          Sudoku fun with friends!
        </p>
      </div>
    </aside>
  );
}
