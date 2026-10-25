import { requireProfileId } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getRatingHistory, getRatingProfile } from "@/lib/services/ratingService";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const [profile, history] = await Promise.all([getRatingProfile(profileId), getRatingHistory(profileId)]);
    return jsonOk({ profile, history });
  });
}
