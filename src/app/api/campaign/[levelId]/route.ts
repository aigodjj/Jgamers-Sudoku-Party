import { requireProfileId } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getPuzzleForLevel, isLevelUnlocked } from "@/lib/services/campaignService";
import { getLevelDef } from "@/lib/campaign/levels";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ levelId: string }> }) {
  return withErrorHandling(async () => {
    const { levelId } = await params;
    const profileId = await requireProfileId();
    const def = getLevelDef(levelId);
    if (!def) return jsonError(404, "找不到這個關卡", "not_found");

    const unlocked = await isLevelUnlocked(profileId, levelId);
    if (!unlocked) return jsonError(403, "這個關卡尚未解鎖", "locked");

    const puzzle = getPuzzleForLevel(levelId);
    if (!puzzle) return jsonError(404, "找不到這個關卡", "not_found");

    return jsonOk({
      levelId,
      difficulty: puzzle.difficulty,
      givens: puzzle.givens,
      stageIndex: def.stageIndex,
      levelInStage: def.levelInStage,
    });
  });
}
