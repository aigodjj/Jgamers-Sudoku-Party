import { requireProfileId } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { computeStreak, getDailyStatus, getOrCreateDailyChallenge, getTaipeiDateString } from "@/lib/services/dailyService";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const dateStr = getTaipeiDateString();
    const challenge = await getOrCreateDailyChallenge(dateStr);
    const { completion, history } = await getDailyStatus(profileId, dateStr);
    const streak = computeStreak(
      history.map((h) => ({ date: h.date, completed: h.completed })),
      dateStr,
    );

    return jsonOk({
      date: dateStr,
      difficulty: challenge.difficulty,
      givens: challenge.givens,
      completedToday: !!completion?.rewardClaimed,
      todayResult: completion
        ? { timeMs: completion.timeMs, mistakes: completion.mistakes }
        : null,
      streak,
      bestTimeMs: history.filter((h) => h.completed).reduce<number | null>((best, h) => (best === null || h.timeMs < best ? h.timeMs : best), null),
      timezone: "Asia/Taipei",
    });
  });
}
