import { requireProfileId } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/respond";
import { equipCosmetic, unequip } from "@/lib/services/cosmeticService";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const body = await req.json();

    if (body.unequipCategory && typeof body.unequipCategory === "string") {
      const result = await unequip(profileId, body.unequipCategory);
      if (!result.ok) return jsonError(400, "這個類別無法取消裝備", result.reason);
      return jsonOk({ unequipped: body.unequipCategory });
    }

    if (typeof body.cosmeticId !== "string") return jsonError(400, "缺少商品代碼", "invalid_body");
    const result = await equipCosmetic(profileId, body.cosmeticId);
    if (!result.ok) {
      const messages: Record<string, string> = { not_found: "找不到這個商品", not_owned: "尚未擁有這個商品" };
      return jsonError(400, messages[result.reason], result.reason);
    }
    return jsonOk({ equipped: body.cosmeticId });
  });
}
