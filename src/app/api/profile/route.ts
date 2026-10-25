import { requireProfileId } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { getOrCreateProfile, updateProfile, getEquippedMap } from "@/lib/services/profileService";
import { getRatingProfile } from "@/lib/services/ratingService";

export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const profile = await getOrCreateProfile(profileId);
    const [equipped, rating] = await Promise.all([getEquippedMap(profileId), getRatingProfile(profileId)]);
    return jsonOk({ profile, equipped, rating });
  });
}

export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.username === "string" && body.username.trim().length > 0) {
      updates.username = body.username.trim().slice(0, 20);
    }
    if (typeof body.soundEnabled === "boolean") updates.soundEnabled = body.soundEnabled;
    if (body.theme === "light" || body.theme === "dark") updates.theme = body.theme;
    const profile = await updateProfile(profileId, updates);
    return jsonOk({ profile });
  });
}
