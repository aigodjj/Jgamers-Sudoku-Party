import { requireProfileId } from "@/lib/auth/session";
import { jsonError, jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getMatchStateView, MultiplayerError } from "@/lib/services/multiplayerService";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requireProfileId();
    const { id } = await params;
    try {
      const match = await getMatchStateView(id);
      return jsonOk({ match });
    } catch (err) {
      if (err instanceof MultiplayerError) return jsonError(404, err.message, err.code);
      throw err;
    }
  });
}
