"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Swords, Shirt, Trophy, UserRound, Settings, CalendarDays, Coins, Sparkles } from "lucide-react";
import { useT } from "@/i18n";

const links = [
  { href: "/", key: "nav.home", Icon: Home },
  { href: "/campaign", key: "nav.campaign", Icon: Map },
  { href: "/daily", key: "nav.daily", Icon: CalendarDays },
  { href: "/multiplayer", key: "nav.multiplayer", Icon: Swords },
  { href: "/wardrobe", key: "nav.wardrobe", Icon: Shirt },
  { href: "/achievements", key: "nav.achievements", Icon: Trophy },
  { href: "/profile", key: "nav.profile", Icon: UserRound },
  { href: "/settings", key: "nav.settings", Icon: Settings },
];
export function Navbar() {
  const t = useT();
  const pathname = usePathname();
  return <header className="site-header sticky top-0 z-30 border-b border-white/70 bg-[#fffaff]/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-2.5"><span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-400 text-white shadow-md shadow-violet-200"><Sparkles size={21}/></span><span className="hidden sm:block"><strong className="block text-sm font-black text-slate-800">{t("app.name")}</strong><span className="text-[11px] font-semibold text-slate-400">{t("app.tagline")}</span></span></Link>
      <nav className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto sm:justify-center sm:gap-1.5" aria-label={t("nav.primaryNavigation")}>{links.map(({ href, key, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
        return <Link key={href} href={href} title={t(key)} aria-label={t(key)} className={`grid size-10 shrink-0 place-items-center rounded-xl transition sm:flex sm:w-auto sm:gap-2 sm:px-3 ${active ? "bg-violet-100 text-violet-700" : "text-slate-500 hover:bg-violet-50 hover:text-violet-600"}`}><Icon size={18}/><span className="hidden text-xs font-bold xl:inline">{t(key)}</span></Link>;
      })}</nav>
      <Link href="/wardrobe" className="hidden shrink-0 items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-600 sm:flex"><Coins size={16}/>{t("common.coins")}</Link>
    </div>
  </header>;
}
