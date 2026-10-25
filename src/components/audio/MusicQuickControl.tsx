
"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useMusic } from "./MusicProvider";

export function MusicQuickControl() {
  const { isPlaying, volume, togglePlayback } = useMusic();

  return (
    <button
      type="button"
      data-music-control
      onClick={() => void togglePlayback()}
      aria-label={isPlaying ? "Pause background music" : "Play background music"}
      title={isPlaying ? "Pause background music" : "Play background music"}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
    >
      {volume === 0 ? (
        <VolumeX className="h-5 w-5 shrink-0" />
      ) : isPlaying ? (
        <Volume2 className="h-5 w-5 shrink-0" />
      ) : (
        <VolumeX className="h-5 w-5 shrink-0" />
      )}

      <span className="flex-1 text-left">
        背景音樂
      </span>

      {isPlaying ? (
        <Pause className="h-4 w-4 shrink-0" />
      ) : (
        <Play className="h-4 w-4 shrink-0" />
      )}
    </button>
  );
}
