import { requireProfileId } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/respond";
import { submitSolution } from "@/lib/services/multiplayerService";
import { parseBoardString } from "@/lib/sudoku/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const { id } = await params;
    const body = await req.json();

    if (typeof body.board !== "string" || body.board.length !== 81) {
      return jsonError(400, "盤面資料格式錯誤", "invalid_body");
    }

    const result = await submitSolution(
      id,
      profileId,
      parseBoardString(body.board),
      Math.max(0, Number(body.mistakes) || 0),
      Math.max(0, Number(body.hintsUsed) || 0),
    );

    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: "找不到這場比賽",
        match_finished: "比賽已經結束",
        not_started: "比賽尚未開始",
        not_a_participant: "你不是這場比賽的參賽者",
      };
      return jsonError(400, messages[result.reason] ?? "提交失敗", result.reason);
    }

    return jsonOk(result);
  });
}
