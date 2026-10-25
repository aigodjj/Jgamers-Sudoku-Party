import { requireProfileId } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { heartbeat } from "@/lib/services/multiplayerService";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const { code } = await params;
    await heartbeat(code, profileId);
    return jsonOk({ ok: true });
  });
}
