import { requireProfileId } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getProfileStats } from "@/lib/services/statsService";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const stats = await getProfileStats(profileId);
    return jsonOk({ stats });
  });
}
