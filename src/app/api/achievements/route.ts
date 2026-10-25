import { requireProfileId } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getAchievementsView } from "@/lib/services/achievementService";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const achievements = await getAchievementsView(profileId);
    return jsonOk({ achievements });
  });
}
