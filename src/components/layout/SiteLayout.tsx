"use client";
import { useEffect, type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { apiFetch } from "@/lib/api/client";

export function SiteLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("jgamers-theme");
      if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
    } catch { /* local storage may be unavailable */ }
    apiFetch<{ profile: { theme: string } }>("/api/profile")
      .then(({ profile }) => {
        const theme = profile.theme === "dark" ? "dark" : "light";
        document.documentElement.dataset.theme = theme;
        try { window.localStorage.setItem("jgamers-theme", theme); } catch { /* no-op */ }
      })
      .catch(() => { /* keep the local/default theme if the profile is temporarily unavailable */ });
  }, []);
  return <div className="app-shell min-h-screen text-slate-800"><Navbar /><div className="mx-auto flex w-full max-w-[100rem] items-start gap-4 px-3 sm:px-6 lg:px-8"><Sidebar /><div className="min-w-0 flex-1">{children}</div></div></div>;
}
