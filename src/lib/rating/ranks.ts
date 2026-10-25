import { PLACEMENT_MATCHES_REQUIRED } from "./elo";

export interface RankTier {
  id: string;
  labelKey: string;
  minRating: number;
  color: string;
}

// Configurable rank thresholds - change here to retune the whole game.
export const RANK_TIERS: RankTier[] = [
  { id: "bronze", labelKey: "rank.bronze", minRating: 0, color: "#b97a56" },
  { id: "silver", labelKey: "rank.silver", minRating: 1200, color: "#9fa6b2" },
  { id: "gold", labelKey: "rank.gold", minRating: 1400, color: "#e3b23c" },
  { id: "platinum", labelKey: "rank.platinum", minRating: 1600, color: "#5bc8af" },
  { id: "diamond", labelKey: "rank.diamond", minRating: 1800, color: "#5b9cd6" },
  { id: "master", labelKey: "rank.master", minRating: 2000, color: "#a45be6" },
  { id: "grandmaster", labelKey: "rank.grandmaster", minRating: 2200, color: "#e65b5b" },
];

export interface RankInfo {
  tier: RankTier;
  nextTier: RankTier | null;
  progressToNext: number; // 0..1
  isProvisional: boolean;
}

export function getRankInfo(rating: number, placementMatchesPlayed: number): RankInfo {
  const isProvisional = placementMatchesPlayed < PLACEMENT_MATCHES_REQUIRED;
  const sorted = [...RANK_TIERS].sort((a, b) => a.minRating - b.minRating);
  let tier = sorted[0];
  for (const t of sorted) {
    if (rating >= t.minRating) tier = t;
  }
  const idx = sorted.findIndex((t) => t.id === tier.id);
  const nextTier = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const progressToNext = nextTier
    ? Math.max(0, Math.min(1, (rating - tier.minRating) / (nextTier.minRating - tier.minRating)))
    : 1;
  return { tier, nextTier, progressToNext, isProvisional };
}
