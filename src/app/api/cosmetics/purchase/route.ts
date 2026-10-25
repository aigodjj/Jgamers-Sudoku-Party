import { requireProfileId } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/respond";
import { purchaseCosmetic } from "@/lib/services/cosmeticService";
import { evaluateAndApplyAchievements } from "@/lib/services/achievementService";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const body = await req.json();
    if (typeof body.cosmeticId !== "string") return jsonError(400, "缺少商品代碼", "invalid_body");

    const result = await purchaseCosmetic(profileId, body.cosmeticId);
    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: "找不到這個商品",
        already_owned: "你已經擁有這個商品了",
        not_purchasable: "這個商品無法用金幣購買",
        insufficient_coins: "金幣不足",
      };
      return jsonError(400, messages[result.reason], result.reason);
    }

    const newlyUnlockedAchievements = await evaluateAndApplyAchievements(profileId);
    return jsonOk({ coins: result.coins, newlyUnlockedAchievements });
  });
}
