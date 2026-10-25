import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { equippedCosmetics, playerCosmetics, playerRating, profiles } from "@/db/schema";
import { COSMETIC_CATALOG, ALL_CATEGORIES } from "@/lib/cosmetics/catalog";
import { DEFAULT_STARTING_RATING } from "@/lib/rating/elo";

export interface ProfileRecord {
  id: string;
  username: string;
  isGuest: boolean;
  coins: number;
  locale: string;
  soundEnabled: boolean;
  theme: string;
  equippedTitle: string | null;
}

function randomDisplayName(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `玩家${n}`;
}

/**
 * Ensures a profile row (and starter cosmetics / rating row) exists for the
 * given guest id, creating it on first visit. This is the guest-play
 * identity system described in the project README.
 */
export async function getOrCreateProfile(profileId: string): Promise<ProfileRecord> {
  const existing = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  if (existing.length > 0) return existing[0];

  return db.transaction(async (tx) => {
    const reCheck = await tx.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
    if (reCheck.length > 0) return reCheck[0];

    const [created] = await tx
      .insert(profiles)
      .values({
        id: profileId,
        username: randomDisplayName(),
        isGuest: true,
        coins: 150,
      })
      .returning();

    const defaults = COSMETIC_CATALOG.filter((c) => c.unlockType === "default");
    if (defaults.length > 0) {
      await tx
        .insert(playerCosmetics)
        .values(defaults.map((d) => ({ profileId, cosmeticId: d.id, source: "default" })))
        .onConflictDoNothing();
    }

    for (const category of ALL_CATEGORIES) {
      const def = defaults
        .filter((d) => d.category === category)
        .sort((a, b) => a.sortOrder - b.sortOrder)[0];
      if (def) {
        await tx
          .insert(equippedCosmetics)
          .values({ profileId, category, cosmeticId: def.id })
          .onConflictDoNothing();
      }
    }

    await tx
      .insert(playerRating)
      .values({ profileId, rating: DEFAULT_STARTING_RATING, seasonBestRating: DEFAULT_STARTING_RATING, lifetimeBestRating: DEFAULT_STARTING_RATING })
      .onConflictDoNothing();

    return created;
  });
}

export async function updateProfile(
  profileId: string,
  updates: Partial<Pick<ProfileRecord, "username" | "locale" | "soundEnabled" | "theme">>,
): Promise<ProfileRecord> {
  const [updated] = await db
    .update(profiles)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(profiles.id, profileId))
    .returning();
  return updated;
}

/** Adjusts coin balance atomically, never allowing a negative balance. */
export async function addCoins(profileId: string, delta: number): Promise<number> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
    if (!row) throw new Error("Profile not found");
    const next = Math.max(0, row.coins + delta);
    await tx.update(profiles).set({ coins: next, updatedAt: new Date() }).where(eq(profiles.id, profileId));
    return next;
  });
}

export async function spendCoins(profileId: string, amount: number): Promise<{ ok: boolean; coins: number }> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
    if (!row) throw new Error("Profile not found");
    if (row.coins < amount) return { ok: false, coins: row.coins };
    const next = row.coins - amount;
    await tx.update(profiles).set({ coins: next, updatedAt: new Date() }).where(eq(profiles.id, profileId));
    return { ok: true, coins: next };
  });
}

export async function getEquippedMap(profileId: string): Promise<Record<string, string>> {
  const rows = await db.select().from(equippedCosmetics).where(eq(equippedCosmetics.profileId, profileId));
  const map: Record<string, string> = {};
  for (const r of rows) map[r.category] = r.cosmeticId;
  return map;
}

export async function getOwnedCosmeticIds(profileId: string): Promise<Set<string>> {
  const rows = await db.select().from(playerCosmetics).where(eq(playerCosmetics.profileId, profileId));
  return new Set(rows.map((r) => r.cosmeticId));
}

export async function unequipCategory(profileId: string, category: string): Promise<void> {
  await db
    .delete(equippedCosmetics)
    .where(and(eq(equippedCosmetics.profileId, profileId), eq(equippedCosmetics.category, category)));
}
