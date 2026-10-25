import { requireProfileId } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/api/respond";
import { createRoom } from "@/lib/services/multiplayerService";
import { Difficulty } from "@/lib/sudoku/types";
import { DIFFICULTIES } from "@/lib/sudoku/difficulty";
import { getOrCreateProfile } from "@/lib/services/profileService";

export const dynamic = "force-dynamic";

const VALID_DIFFICULTIES = new Set(DIFFICULTIES.map((d) => d.id));

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const profileId = await requireProfileId();
    await getOrCreateProfile(profileId);
    const body = await req.json().catch(() => ({}));

    const difficulty: Difficulty = VALID_DIFFICULTIES.has(body.difficulty) ? body.difficulty : "easy";
    const maxPlayers = Number(body.maxPlayers) || 4;
    const rated = body.rated !== false;
    const timeLimitS = Number(body.timeLimitS) || 900;

    const room = await createRoom(profileId, { difficulty, maxPlayers, rated, timeLimitS });
    return jsonOk({ code: room.code });
  });
}
