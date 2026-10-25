
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getLeaderboard } from "@/lib/services/ratingService";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const leaderboard = await getLeaderboard(10);
    return jsonOk({ leaderboard });
  });
}
