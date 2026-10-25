
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  multiplayerMatchResults,
  playerRating,
  ratingHistory,
  profiles,
} from "@/db/schema";
import {
  ALGO_VERSION,
  computeFfaRatingChanges,
  DEFAULT_STARTING_RATING,
  type FfaRatingInput,
} from "@/lib/rating/elo";
import { getRankInfo } from "@/lib/rating/ranks";

export async function getOrCreateRatingRow(profileId: string) {
  const [existing] = await db
    .select()
    .from(playerRating)
    .where(eq(playerRating.profileId, profileId));

  if (existing) return existing;

  const [created] = await db
    .insert(playerRating)
    .values({
      profileId,
      rating: DEFAULT_STARTING_RATING,
      seasonBestRating: DEFAULT_STARTING_RATING,
      lifetimeBestRating: DEFAULT_STARTING_RATING,
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const [row] = await db
    .select()
    .from(playerRating)
    .where(eq(playerRating.profileId, profileId));

  if (!row) {
    throw new Error(`Failed to create rating row for profile ${profileId}`);
  }

  return row;
}

export interface RatingProfileView {
  profileId: string;
  username: string;
  rating: number;
  rank: ReturnType<typeof getRankInfo>;
  matchesPlayed: number;
  matchesCompleted: number;
  wins: number;
  winRate: number;
  seasonBestRating: number;
  lifetimeBestRating: number;
  placementMatches: number;
}

export async function getRatingProfile(
  profileId: string,
): Promise<RatingProfileView> {
  const row = await getOrCreateRatingRow(profileId);

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId));

  const rank = getRankInfo(row.rating, row.placementMatches);

  return {
    profileId,
    username: profile?.username ?? "Player",
    rating: row.rating,
    rank,
    matchesPlayed: row.matchesPlayed,
    matchesCompleted: row.matchesCompleted,
    wins: row.wins,
    winRate:
      row.matchesCompleted > 0 ? row.wins / row.matchesCompleted : 0,
    seasonBestRating: row.seasonBestRating,
    lifetimeBestRating: row.lifetimeBestRating,
    placementMatches: row.placementMatches,
  };
}

export async function getRatingHistory(profileId: string, limit = 20) {
  return db
    .select()
    .from(ratingHistory)
    .where(eq(ratingHistory.profileId, profileId))
    .orderBy(desc(ratingHistory.createdAt))
    .limit(limit);
}

/**
 * Returns players with the highest ratings first.
 */
export async function getLeaderboard(limit = 10) {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));

  const rows = await db
    .select({
      profileId: playerRating.profileId,
      rating: playerRating.rating,
      wins: playerRating.wins,
      matchesCompleted: playerRating.matchesCompleted,
      placementMatches: playerRating.placementMatches,
      username: profiles.username,
    })
    .from(playerRating)
    .innerJoin(profiles, eq(profiles.id, playerRating.profileId))
    .orderBy(
      desc(playerRating.rating),
      desc(playerRating.wins),
      desc(playerRating.matchesCompleted),
    )
    .limit(safeLimit);

  return rows.map((row) => ({
    ...row,
    rank: getRankInfo(row.rating, row.placementMatches),
  }));
}

/**
 * Applies rating changes for a finished rated match.
 * Already processed results are not applied again.
 */
export async function applyRatedMatchResults(
  matchId: string,
): Promise<void> {
  const results = await db
    .select()
    .from(multiplayerMatchResults)
    .where(eq(multiplayerMatchResults.matchId, matchId));

  if (results.length === 0) return;
  if (results.every((result) => result.ratingAfter !== null)) return;

  const ratingRows = await Promise.all(
    results.map((result) => getOrCreateRatingRow(result.profileId)),
  );

  const inputs: FfaRatingInput[] = results.map((result, index) => ({
    profileId: result.profileId,
    ratingBefore: ratingRows[index].rating,
    placement: result.placement ?? results.length,
    matchesPlayedBeforeThisMatch: ratingRows[index].matchesPlayed,
  }));

  const changes = computeFfaRatingChanges(inputs);

  for (const change of changes) {
    const ratingRow = ratingRows.find(
      (row) => row.profileId === change.profileId,
    );
    const resultRow = results.find(
      (row) => row.profileId === change.profileId,
    );

    if (!ratingRow || !resultRow) continue;

    await db
      .update(multiplayerMatchResults)
      .set({
        ratingBefore: change.ratingBefore,
        ratingAfter: change.ratingAfter,
        ratingChange: change.ratingChange,
      })
      .where(eq(multiplayerMatchResults.id, resultRow.id));

    await db.insert(ratingHistory).values({
      profileId: change.profileId,
      matchId,
      ratingBefore: change.ratingBefore,
      ratingAfter: change.ratingAfter,
      ratingChange: change.ratingChange,
      algoVersion: ALGO_VERSION,
    });

    const won = resultRow.placement === 1;

    await db
      .update(playerRating)
      .set({
        rating: change.ratingAfter,
        matchesPlayed: ratingRow.matchesPlayed + 1,
        matchesCompleted:
          ratingRow.matchesCompleted + (resultRow.completed ? 1 : 0),
        wins: ratingRow.wins + (won ? 1 : 0),
        placementMatches: ratingRow.placementMatches + 1,
        seasonBestRating: Math.max(
          ratingRow.seasonBestRating,
          change.ratingAfter,
        ),
        lifetimeBestRating: Math.max(
          ratingRow.lifetimeBestRating,
          change.ratingAfter,
        ),
        updatedAt: new Date(),
      })
      .where(eq(playerRating.profileId, change.profileId));
  }
}

/**
 * Unrated matches do not change rating.
 */
export async function recordUnratedParticipation(
  matchId: string,
): Promise<void> {
  const results = await db
    .select()
    .from(multiplayerMatchResults)
    .where(eq(multiplayerMatchResults.matchId, matchId));

  for (const result of results) {
    if (result.ratingAfter !== null) continue;

    await getOrCreateRatingRow(result.profileId);
  }
}
