"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Map, Settings, Shirt, Swords, Trophy, UserRound } from "lucide-react";
import { useT } from "@/i18n";

const navItems = [
  ["/", "nav.home", Home], ["/campaign", "nav.campaign", Map], ["/daily", "nav.daily", CalendarDays],
  ["/multiplayer", "nav.multiplayer", Swords], ["/wardrobe", "nav.wardrobe", Shirt],
  ["/achievements", "nav.achievements", Trophy], ["/profile", "nav.profile", UserRound], ["/settings", "nav.settings", Settings],
] as const;
export function Sidebar() {
  const t = useT(); const pathname = usePathname();
  return <aside className="hidden w-56 shrink-0 self-start rounded-3xl border border-white bg-white/80 p-3 shadow-sm xl:block"><nav className="space-y-1" aria-label={t("nav.sidebarNavigation")}>{navItems.map(([href,key,Icon])=>{const active=href==="/"?pathname==="/":pathname===href||pathname.startsWith(`${href}/`);return <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${active?"bg-violet-100 text-violet-700":"text-slate-500 hover:bg-violet-50 hover:text-violet-600"}`}><Icon size={18}/>{t(key)}</Link>;})}</nav></aside>;
}
