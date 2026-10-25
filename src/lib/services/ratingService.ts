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

  return rows.map((r) => ({
    ...r,
    rank: getRankInfo(r.rating, r.placementMatches),
  }));
}