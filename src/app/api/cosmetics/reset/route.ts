import { requireProfileId } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { resetAppearance } from "@/lib/services/cosmeticService";

export const dynamic = "force-dynamic";

export async function POST() {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    await resetAppearance(profileId);
    return jsonOk({ reset: true });
  });
}
