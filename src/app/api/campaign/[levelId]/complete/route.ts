import { requireProfileId } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/respond";
import { completeLevel } from "@/lib/services/campaignService";
import { parseBoardString } from "@/lib/sudoku/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ levelId: string }> }) {
  return withErrorHandling(async () => {
    const { levelId } = await params;
    const profileId = await requireProfileId();
    const body = await req.json();

    if (typeof body.board !== "string" || body.board.length !== 81) {
      return jsonError(400, "盤面資料格式錯誤", "invalid_body");
    }

    const result = await completeLevel(profileId, levelId, {
      board: parseBoardString(body.board),
      timeMs: Math.max(0, Number(body.timeMs) || 0),
      mistakes: Math.max(0, Number(body.mistakes) || 0),
      hintsUsed: Math.max(0, Number(body.hintsUsed) || 0),
    });

    if (!result.ok) {
      const messages: Record<string, string> = {
        locked: "這個關卡尚未解鎖",
        not_found: "找不到這個關卡",
        invalid_solution: "盤面尚未正確完成，再檢查看看吧！",
      };
      return jsonError(400, messages[result.reason], result.reason);
    }

    return jsonOk(result);
  });
}
