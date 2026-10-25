import { requireProfileId } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/respond";
import { updateProgress } from "@/lib/services/multiplayerService";
import { parseBoardString } from "@/lib/sudoku/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    if (typeof body.board !== "string" || body.board.length !== 81) {
      return jsonError(400, "盤面資料格式錯誤", "invalid_body");
    }
    const mistakes = Math.max(0, Number(body.mistakes) || 0);
    await updateProgress(id, profileId, parseBoardString(body.board), mistakes);
    return jsonOk({ ok: true });
  });
}
