"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Track = {
  title: string;
  src: string;
};

const PLAYLIST: Track[] = [
  { title: "背景音樂 1", src: "/audio/bgm-1.mp3" },
  { title: "背景音樂 2", src: "/audio/bgm-2.mp3" },
  { title: "背景音樂 3", src: "/audio/bgm-3.mp3" },
  { title: "背景音樂 4", src: "/audio/bgm-4.mp3" },
];

type MusicContextValue = {
  isPlaying: boolean;
  volume: number;
  currentTrack: Track;
  currentTrackIndex: number;
  playlist: Track[];
  togglePlayback: () => Promise<void>;
  setVolume: (volume: number) => void;
  playTrack: (index: number) => Promise<void>;
};

const MusicContext = createContext<MusicContextValue | null>(null);

const VOLUME_KEY = "jgamers-music-volume";
const TRACK_KEY = "jgamers-music-track";
const ENABLED_KEY = "jgamers-music-enabled";

function isNotAllowedError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "NotAllowedError"
  );
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Start automatically after the browser has received a user gesture.
  const shouldPlayRef = useRef(true);
  const hasPlaybackPermissionRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const currentTrack = PLAYLIST[currentTrackIndex] ?? PLAYLIST[0];

  // 讀取玩家之前儲存的音量與曲目。
  // 每次進入遊戲都預設嘗試播放，不受之前暫停狀態影響。
  useEffect(() => {
    try {
      const savedVolume = localStorage.getItem(VOLUME_KEY);
      const savedTrack = localStorage.getItem(TRACK_KEY);

      if (savedVolume !== null) {
        const parsed = Number(savedVolume);

        if (Number.isFinite(parsed)) {
          setVolumeState(Math.min(1, Math.max(0, parsed)));
        }
      }

      if (savedTrack !== null) {
        const parsed = Number(savedTrack);

        if (
          Number.isInteger(parsed) &&
          parsed >= 0 &&
          parsed < PLAYLIST.length
        ) {
          setCurrentTrackIndex(parsed);
        }
      }

      // 下次進入遊戲時，預設重新啟動 BGM。
      localStorage.setItem(ENABLED_KEY, "true");
    } catch {
      // localStorage 可能無法使用。
    }

    shouldPlayRef.current = true;
    setHydrated(true);
  }, []);

  // 設定音量，並記住玩家的選擇。
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    if (hydrated) {
      try {
        localStorage.setItem(VOLUME_KEY, String(volume));
      } catch {
        // 忽略儲存錯誤。
      }
    }
  }, [volume, hydrated]);

  // 記住目前曲目。
  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(TRACK_KEY, String(currentTrackIndex));
    } catch {
      // 忽略儲存錯誤。
    }
  }, [currentTrackIndex, hydrated]);

  // Load tracks immediately, but only autoplay after playback was user-enabled.
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !hydrated) return;

    audio.volume = volume;
    audio.load();

    if (!shouldPlayRef.current || !hasPlaybackPermissionRef.current) return;

    audio.play().catch((error: unknown) => {
      setIsPlaying(false);

      if (!isNotAllowedError(error)) {
        console.warn("背景音樂無法自動播放。", error);
      }
    });
  }, [currentTrackIndex, hydrated]);

  // Browsers may block playback until a pointer or keyboard gesture occurs.
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !hydrated || isPlaying || !shouldPlayRef.current) return;

    const startAfterInteraction = (event: Event) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-music-control]")
      ) {
        return;
      }

      if (!shouldPlayRef.current || !audio.paused) return;

      audio.play().catch((error: unknown) => {
        setIsPlaying(false);

        if (!isNotAllowedError(error)) {
          console.warn("背景音樂無法播放。", error);
        }
      });
    };

    document.addEventListener("pointerdown", startAfterInteraction);
    document.addEventListener("keydown", startAfterInteraction);

    return () => {
      document.removeEventListener("pointerdown", startAfterInteraction);
      document.removeEventListener("keydown", startAfterInteraction);
    };
  }, [hydrated, isPlaying]);

  const setVolume = useCallback((nextVolume: number) => {
    if (!Number.isFinite(nextVolume)) return;

    setVolumeState(Math.min(1, Math.max(0, nextVolume)));
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      shouldPlayRef.current = false;
      audio.pause();
      setIsPlaying(false);

      try {
        localStorage.setItem(ENABLED_KEY, "false");
      } catch {
        // 忽略儲存錯誤。
      }

      return;
    }

    shouldPlayRef.current = true;

    try {
      await audio.play();

      setIsPlaying(true);

      try {
        localStorage.setItem(ENABLED_KEY, "true");
      } catch {
        // 忽略儲存錯誤。
      }
    } catch (error) {
      setIsPlaying(false);

      if (!isNotAllowedError(error)) {
        console.warn("背景音樂無法播放。", error);
      }
    }
  }, []);

  const playTrack = useCallback(
    async (index: number) => {
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= PLAYLIST.length
      ) {
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      shouldPlayRef.current = true;

      if (index === currentTrackIndex) {
        try {
          await audio.play();
          setIsPlaying(true);

          try {
            localStorage.setItem(ENABLED_KEY, "true");
          } catch {
            // 忽略儲存錯誤。
          }
        } catch (error) {
          setIsPlaying(false);
          if (!isNotAllowedError(error)) {
            console.warn("背景音樂播放失敗。", error);
          }
        }

        return;
      }

      try {
        localStorage.setItem(ENABLED_KEY, "true");
      } catch {
        // 忽略儲存錯誤。
      }

      setCurrentTrackIndex(index);
    },
    [currentTrackIndex],
  );

  return (
    <MusicContext.Provider
      value={{
        isPlaying,
        volume,
        currentTrack,
        currentTrackIndex,
        playlist: PLAYLIST,
        togglePlayback,
        setVolume,
        playTrack,
      }}
    >
      {children}

      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload="auto"
        onPlay={() => {
          hasPlaybackPermissionRef.current = true;
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          // 播完後自動播放下一首，最後一首播完則回到第一首。
          shouldPlayRef.current = true;
          setCurrentTrackIndex((index) => (index + 1) % PLAYLIST.length);
        }}
        onError={() => {
          setIsPlaying(false);
          console.error(`無法載入背景音樂：${currentTrack.src}`);
        }}
      />
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);

  if (!context) {
    throw new Error("useMusic must be used inside MusicProvider");
  }

  return context;
}