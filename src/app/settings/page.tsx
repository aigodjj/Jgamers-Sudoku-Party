"use client";

import { useEffect, useState } from "react";
import {
  Globe2,
  Moon,
  Music2,
  Pause,
  Play,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLocale, useSetLocale, useT } from "@/i18n";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Toast } from "@/components/ui/Toast";
import { useMusic } from "@/components/audio/MusicProvider";

interface SettingsProfile {
  theme: string;
  soundEnabled: boolean;
  locale: string;
}

export default function SettingsPage() {
  const t = useT();
  const locale = useLocale();
  const setLocale = useSetLocale();

  const {
    isPlaying,
    togglePlayback,
    volume,
    setVolume,
  } = useMusic();

  const [settings, setSettings] = useState<SettingsProfile | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiFetch<{ profile: SettingsProfile }>("/api/profile")
      .then((result) => {
        if (cancelled) return;

        setSettings(result.profile);
        document.documentElement.dataset.theme = result.profile.theme;

        try {
          window.localStorage.setItem("jgamers-theme", result.profile.theme);
        } catch {
          // Ignore localStorage errors.
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : t("errors.generic"));
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const update = async (patch: Partial<SettingsProfile>) => {
    if (!settings || busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await apiFetch<{ profile: SettingsProfile }>(
        "/api/profile",
        {
          method: "PATCH",
          body: JSON.stringify(patch),
        },
      );

      setSettings(result.profile);
      document.documentElement.dataset.theme = result.profile.theme;

      try {
        window.localStorage.setItem("jgamers-theme", result.profile.theme);
      } catch {
        // Ignore localStorage errors.
      }

      setNotice(t("common.save"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.generic"));
    } finally {
      setBusy(false);
    }
  };

  if (!settings) {
    return (
      <PageWrapper>
        <Spinner />
        {error && (
          <Toast message={error} onClose={() => setError("")} />
        )}
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6">
      <header>
        <p className="text-sm font-extrabold uppercase tracking-[.18em] text-violet-500">
          {t("nav.settings")}
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-800 sm:text-4xl">
          {t("settings.title")}
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 主題設定 */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-500">
              <Sun size={22} />
            </div>
            <div>
              <h2 className="font-black text-slate-800">
                {t("settings.theme")}
              </h2>
              <p className="text-sm text-slate-500">
                {t("settings.about")}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void update({ theme: "light" })}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-4 font-bold transition ${
                settings.theme !== "dark"
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-slate-100 bg-slate-50 text-slate-500"
              }`}
            >
              <Sun size={18} />
              {t("settings.light")}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void update({ theme: "dark" })}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-4 font-bold transition ${
                settings.theme === "dark"
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-slate-100 bg-slate-50 text-slate-500"
              }`}
            >
              <Moon size={18} />
              {t("settings.dark")}
            </button>
          </div>
        </Card>

        {/* 遊戲音效設定：與背景音樂分開 */}
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-pink-50 text-pink-500">
              <Volume2 size={22} />
            </div>
            <div>
              <h2 className="font-black text-slate-800">
                {t("settings.sound")}
              </h2>
              <p className="text-sm text-slate-500">
                {settings.soundEnabled
                  ? t("settings.soundOn")
                  : t("settings.soundOff")}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Music2 className="text-violet-500" size={21} />
              ) : (
                <VolumeX className="text-slate-400" size={21} />
              )}
              <span className="font-bold text-slate-700">
                {t("settings.sound")}
              </span>
            </div>

            <button
              type="button"
              disabled={busy}
              role="switch"
              aria-label={t("settings.sound")}
              aria-checked={settings.soundEnabled}
              onClick={() =>
                void update({
                  soundEnabled: !settings.soundEnabled,
                })
              }
              className={`relative h-7 w-12 rounded-full transition ${
                settings.soundEnabled ? "bg-violet-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${
                  settings.soundEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </Card>

        {/* 背景音樂設定 */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-500">
              <Music2 size={22} />
            </div>
            <div>
              <h2 className="font-black text-slate-800">背景音樂</h2>
              <p className="text-sm text-slate-500">
                切換頁面時持續播放，並調整音樂音量。
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-5 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center">
            <button
              type="button"
              data-music-control
              onClick={() => void togglePlayback()}
              aria-label={isPlaying ? "暫停背景音樂" : "播放背景音樂"}
              className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 font-extrabold text-white shadow-[0_3px_0_#6d28d9] transition hover:bg-violet-600 active:translate-y-0.5 active:shadow-none"
            >
              {isPlaying ? <Pause size={19} /> : <Play size={19} />}
              {isPlaying ? "暫停音樂" : "播放音樂"}
            </button>

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label
                  htmlFor="background-music-volume"
                  className="flex items-center gap-2 text-sm font-bold text-slate-700"
                >
                  {volume === 0 ? (
                    <VolumeX size={18} />
                  ) : (
                    <Volume2 size={18} />
                  )}
                  音樂音量
                </label>

                <span className="text-sm font-black tabular-nums text-violet-600">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              <input
                id="background-music-volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) =>
                  setVolume(Number(event.target.value))
                }
                aria-label="背景音樂音量"
                className="w-full cursor-pointer accent-violet-500"
              />

              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>靜音</span>
                <span>最大音量</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 語言設定 */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-500">
              <Globe2 size={22} />
            </div>
            <div>
              <h2 className="font-black text-slate-800">
                {t("settings.language")}
              </h2>
              <p className="text-sm text-slate-500">
                {t("settings.languageNote")}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setLocale("zh-TW")}
              className={`rounded-2xl border p-4 text-left transition ${
                locale === "zh-TW"
                  ? "border-violet-300 bg-violet-50"
                  : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <div className="font-extrabold text-slate-800">繁體中文</div>
              <div className="mt-1 text-xs text-slate-400">
                Traditional Chinese
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded-2xl border p-4 text-left transition ${
                locale === "en"
                  ? "border-violet-300 bg-violet-50"
                  : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <div className="font-extrabold text-slate-800">English</div>
              <div className="mt-1 text-xs text-slate-400">
                English interface
              </div>
            </button>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="font-black text-slate-800">
          {t("settings.about")}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {t("app.name")} · {t("app.tagline")}
        </p>
      </Card>

      {error && (
        <Toast message={error} onClose={() => setError("")} />
      )}

      {notice && (
        <Toast
          message={notice}
          type="success"
          onClose={() => setNotice("")}
        />
      )}
    </PageWrapper>
  );
}
