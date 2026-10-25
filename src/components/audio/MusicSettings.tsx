
"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useMusic } from "./MusicProvider";

export function MusicSettings() {
  const { isPlaying, volume, setVolume, togglePlayback } = useMusic();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">背景音樂</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            全站播放，切換頁面時不會重新開始
          </p>
        </div>

        <button
          type="button"
          data-music-control
          onClick={() => void togglePlayback()}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              暫停
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              播放
            </>
          )}
        </button>
      </div>

      <div className="mt-6">
        <label
          htmlFor="background-music-volume"
          className="mb-3 flex items-center gap-2 text-sm font-medium"
        >
          <Volume2 className="h-4 w-4" />
          音量：{Math.round(volume * 100)}%
        </label>

        <input
          id="background-music-volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="w-full cursor-pointer accent-violet-600"
        />

        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>靜音</span>
          <span>最大音量</span>
        </div>
      </div>
    </section>
  );
}
