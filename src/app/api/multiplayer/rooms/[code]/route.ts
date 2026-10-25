import { requireProfileId } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getRoomView, MultiplayerError } from "@/lib/services/multiplayerService";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  return withErrorHandling(async () => {
    await requireProfileId();
    const { code } = await params;
    try {
      const room = await getRoomView(code);
      return jsonOk({ room });
    } catch (err) {
      if (err instanceof MultiplayerError) return jsonError(404, err.message, err.code);
      throw err;
    }
  });
}
