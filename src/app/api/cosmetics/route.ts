import { requireProfileId } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getWardrobeView } from "@/lib/services/cosmeticService";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const items = await getWardrobeView(profileId);
    return jsonOk({ items });
  });
}
