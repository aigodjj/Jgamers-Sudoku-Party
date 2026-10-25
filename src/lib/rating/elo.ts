// Elo-style rating algorithm adapted for free-for-all (2-4 player) Sudoku
// races. Documented so the method is transparent and testable.
//
// Algorithm ("elo-ffa-v1"):
//   For every ordered pair of players (i, j) in the match:
//     expected_i = 1 / (1 + 10 ^ ((Rj - Ri) / 400))
//     actual_i   = 1   if i placed better than j
//                  0.5 if tied
//                  0   if i placed worse than j
//   delta_i = K_i * sum_j(actual_i - expected_i) / (n - 1)
//
// Dividing by (n-1) keeps the magnitude of a rating change roughly
// comparable to a standard 1v1 Elo update regardless of player count.
//
// K-factor: players with fewer than PLACEMENT_MATCHES_REQUIRED completed
// rated matches are "provisional" and use a larger K so their rating
// converges quickly; established players use a smaller, steadier K.

export const PLACEMENT_MATCHES_REQUIRED = 5;
export const PROVISIONAL_K = 48;
export const ESTABLISHED_K = 24;
export const DEFAULT_STARTING_RATING = 1000;
export const ALGO_VERSION = "elo-ffa-v1";

export interface FfaRatingInput {
  profileId: string;
  ratingBefore: number;
  /** 1 = winner / best placement, higher numbers = worse placement. Ties share the same placement number. */
  placement: number;
  matchesPlayedBeforeThisMatch: number;
}

export interface FfaRatingResult {
  profileId: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  kFactor: number;
}

function kFactorFor(matchesPlayedBeforeThisMatch: number): number {
  return matchesPlayedBeforeThisMatch < PLACEMENT_MATCHES_REQUIRED ? PROVISIONAL_K : ESTABLISHED_K;
}

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function computeFfaRatingChanges(players: FfaRatingInput[]): FfaRatingResult[] {
  const n = players.length;
  if (n < 2) {
    return players.map((p) => ({
      profileId: p.profileId,
      ratingBefore: p.ratingBefore,
      ratingAfter: p.ratingBefore,
      ratingChange: 0,
      kFactor: 0,
    }));
  }

  return players.map((p) => {
    let scoreDelta = 0;
    for (const opponent of players) {
      if (opponent.profileId === p.profileId) continue;
      const expected = expectedScore(p.ratingBefore, opponent.ratingBefore);
      let actual: number;
      if (p.placement < opponent.placement) actual = 1;
      else if (p.placement > opponent.placement) actual = 0;
      else actual = 0.5;
      scoreDelta += actual - expected;
    }
    const k = kFactorFor(p.matchesPlayedBeforeThisMatch);
    const rawChange = (k * scoreDelta) / (n - 1);
    const ratingChange = Math.round(rawChange);
    return {
      profileId: p.profileId,
      ratingBefore: p.ratingBefore,
      ratingAfter: Math.max(0, p.ratingBefore + ratingChange),
      ratingChange,
      kFactor: k,
    };
  });
}
