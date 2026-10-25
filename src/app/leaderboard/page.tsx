
"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  profileId: string;
  username: string;
  rating: number;
  wins: number;
  matchesCompleted: number;
  placementMatches: number;
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/leaderboard", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("排行榜載入失敗，請稍後再試。");
        }

        const payload = await response.json();
        const entries =
          payload.leaderboard ??
          payload.data?.leaderboard ??
          payload.result?.leaderboard;

        if (!Array.isArray(entries)) {
          throw new Error("排行榜資料格式不正確。");
        }

        if (!cancelled) {
          setPlayers(entries.slice(0, 10));
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "排行榜載入失敗。",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <div className="mb-3 text-5xl">🏆</div>
          <h1 className="text-3xl font-black tracking-wide text-indigo-800 sm:text-4xl">
            段位排行榜
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-600 sm:text-base">
            挑戰最強玩家，爭奪排行榜前十名！
          </p>
        </header>

        <section className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-xl shadow-indigo-200/50">
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white sm:px-7">
            <h2 className="text-lg font-extrabold">⭐ TOP 10 PLAYERS</h2>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
              段位評分
            </span>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center">
              <div className="mb-3 animate-bounce text-4xl">🎮</div>
              <p className="font-bold text-slate-500">正在載入排行榜…</p>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <p className="font-bold text-red-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white transition hover:bg-indigo-700"
              >
                重新載入
              </button>
            </div>
          ) : players.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mb-3 text-4xl">🌟</div>
              <p className="font-bold text-slate-600">
                還沒有排行榜資料，快來參加段位對戰吧！
              </p>
            </div>
          ) : (
            <div className="divide-y divide-indigo-50">
              {players.map((player, index) => (
                <div
                  key={player.profileId}
                  className={`flex items-center gap-3 px-4 py-4 transition hover:bg-indigo-50/70 sm:gap-5 sm:px-7 ${
                    index < 3 ? "bg-amber-50/40" : ""
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-number text-lg font-black ${
                      index === 0
                        ? "bg-amber-300 text-amber-950 shadow-md shadow-amber-200"
                        : index === 1
                          ? "bg-slate-200 text-slate-700"
                          : index === 2
                            ? "bg-orange-200 text-orange-900"
                            : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {index < 3 ? medals[index] : index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-slate-800">
                      {player.username || "Player"}
                    </p>
                    <p className="mt-1 font-number text-xs text-slate-500 sm:text-sm">
                      已完成 {player.matchesCompleted} 場 · 勝場{" "}
                      {player.wins}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xl font-black tabular-nums text-indigo-700 sm:text-2xl">
                      {player.rating.toLocaleString()}
                    </p>
                    <p className="text-xs font-bold text-slate-400">
                      RATING
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-indigo-100 bg-indigo-50/70 px-5 py-4 text-center text-xs text-slate-500 sm:text-sm">
            排名依目前段位評分排列；同分時依勝場及完成場數排序。
          </div>
        </section>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-indigo-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span>←</span> 返回首頁
          </a>
        </div>
      </div>
    </main>
  );
}
