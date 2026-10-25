
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
const ENABLED_KEY = "jgamers-music-enabled";
const TRACK_KEY = "jgamers-music-track";

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const currentTrack =
    PLAYLIST[currentTrackIndex] ?? PLAYLIST[0];

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
    } catch {
      // localStorage may be unavailable.
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    if (hydrated) {
      try {
        localStorage.setItem(VOLUME_KEY, String(volume));
      } catch {
        // Ignore storage errors.
      }
    }
  }, [volume, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(TRACK_KEY, String(currentTrackIndex));
    } catch {
      // Ignore storage errors.
    }
  }, [currentTrackIndex, hydrated]);

  // 切歌時更新音源；若原本正在播放，就接著播放下一首。
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hydrated || !isPlaying) return;

    audio.load();
    audio.play().catch((error: unknown) => {
      setIsPlaying(false);
      console.warn("Background music playback failed.", error);
    });
  }, [currentTrackIndex, hydrated]); // 刻意不監聽 isPlaying

  const setVolume = useCallback((nextVolume: number) => {
    if (!Number.isFinite(nextVolume)) return;
    setVolumeState(Math.min(1, Math.max(0, nextVolume)));
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);

      try {
        localStorage.setItem(ENABLED_KEY, "false");
      } catch {
        // Ignore storage errors.
      }
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);

      try {
        localStorage.setItem(ENABLED_KEY, "true");
      } catch {
        // Ignore storage errors.
      }
    } catch (error) {
      setIsPlaying(false);
      console.warn(
        "Background music could not start. Check the audio files and browser autoplay policy.",
        error,
      );
    }
  }, []);

  const playTrack = useCallback(async (index: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= PLAYLIST.length) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (index === currentTrackIndex) {
      if (audio.paused) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          setIsPlaying(false);
          console.warn("Background music playback failed.", error);
        }
      }
      return;
    }

    setCurrentTrackIndex(index);

    // 讓新曲目載入後開始播放。
    audio.pause();
    setIsPlaying(false);

    try {
      localStorage.setItem(ENABLED_KEY, "true");
    } catch {
      // Ignore storage errors.
    }

    // 切換索引後由下一個 effect 載入曲目。
    // 對手動選曲，使用者點擊即代表播放意圖。
    setIsPlaying(true);
  }, [currentTrackIndex]);

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
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
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
