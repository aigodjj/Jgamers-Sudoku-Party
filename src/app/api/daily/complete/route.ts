import { requireProfileId } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/respond";
import { completeDaily, getTaipeiDateString } from "@/lib/services/dailyService";
import { parseBoardString } from "@/lib/sudoku/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const body = await req.json();
    if (typeof body.board !== "string" || body.board.length !== 81) {
      return jsonError(400, "盤面資料格式錯誤", "invalid_body");
    }

    const dateStr = getTaipeiDateString();
    const result = await completeDaily(profileId, dateStr, {
      board: parseBoardString(body.board),
      timeMs: Math.max(0, Number(body.timeMs) || 0),
      mistakes: Math.max(0, Number(body.mistakes) || 0),
    });

    if (!result.ok) {
      const messages: Record<string, string> = {
        already_completed: "今日挑戰已完成，明天再來吧！",
        invalid_solution: "盤面尚未正確完成，再檢查看看吧！",
        not_found: "找不到今日的挑戰",
      };
      return jsonError(400, messages[result.reason], result.reason);
    }

    return jsonOk(result);
  });
}
