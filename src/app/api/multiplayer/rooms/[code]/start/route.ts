import { requireProfileId } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getRoomView, MultiplayerError, startMatch } from "@/lib/services/multiplayerService";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const { code } = await params;
    try {
      const matchId = await startMatch(code, profileId);
      const room = await getRoomView(code);
      return jsonOk({ matchId, room });
    } catch (err) {
      if (err instanceof MultiplayerError) return jsonError(400, err.message, err.code);
      throw err;
    }
  });
}
