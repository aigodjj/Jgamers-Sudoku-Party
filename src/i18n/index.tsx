"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import zhTW from "./zh-TW.json";
import en from "./en.json";

export type Locale = "zh-TW" | "en";
export const DEFAULT_LOCALE: Locale = "zh-TW";
const DICTIONARIES: Record<Locale, unknown> = { "zh-TW": zhTW, en };

function lookup(dict: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = dict;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) current = (current as Record<string, unknown>)[part];
    else return undefined;
  }
  return typeof current === "string" ? current : undefined;
}
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] !== undefined ? String(vars[key]) : `{${key}}`);
}
interface LocaleContextValue { locale: Locale; setLocale: (locale: Locale) => void; t: (key: string, vars?: Record<string, string | number>) => string }
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children, locale: initialLocale = DEFAULT_LOCALE }: { children: React.ReactNode; locale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("jgamers-locale");
      if (saved === "en" || saved === "zh-TW") setLocale(saved);
    } catch { /* localStorage can be disabled by the browser */ }
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem("jgamers-locale", locale); } catch { /* no-op */ }
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);
  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const value = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES[DEFAULT_LOCALE], key) ?? key;
    return interpolate(value, vars);
  }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useT must be used within a LocaleProvider");
  return ctx.t;
}
export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx.locale;
}
export function useSetLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useSetLocale must be used within a LocaleProvider");
  return ctx.setLocale;
}
