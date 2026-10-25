import { requireProfileId } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getCampaignView } from "@/lib/services/campaignService";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const levels = await getCampaignView(profileId);
    return jsonOk({ levels });
  });
}
