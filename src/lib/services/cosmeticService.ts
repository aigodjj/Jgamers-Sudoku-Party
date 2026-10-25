import { eq } from "drizzle-orm";
import { db } from "@/db";
import { equippedCosmetics, playerCosmetics } from "@/db/schema";
import { COSMETIC_CATALOG, getCosmeticDef, OPTIONAL_CATEGORIES } from "@/lib/cosmetics/catalog";
import { getEquippedMap, getOwnedCosmeticIds, spendCoins, unequipCategory } from "./profileService";

export interface CosmeticViewItem {
  id: string;
  category: string;
  nameKey: string;
  colorValue?: string;
  renderKey: string;
  unlockType: string;
  price: number;
  owned: boolean;
  equipped: boolean;
  locked: boolean;
  unlockAchievementId?: string;
}

export async function getWardrobeView(profileId: string): Promise<CosmeticViewItem[]> {
  const [owned, equipped] = await Promise.all([getOwnedCosmeticIds(profileId), getEquippedMap(profileId)]);
  return COSMETIC_CATALOG.map((item) => {
    const isOwned = owned.has(item.id) || item.unlockType === "default";
    return {
      id: item.id,
      category: item.category,
      nameKey: item.nameKey,
      colorValue: item.colorValue,
      renderKey: item.renderKey,
      unlockType: item.unlockType,
      price: item.price,
      owned: isOwned,
      equipped: equipped[item.category] === item.id,
      locked: !isOwned,
      unlockAchievementId: item.unlockAchievementId,
    };
  }).sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
}

export type PurchaseResult =
  | { ok: true; coins: number }
  | { ok: false; reason: "not_found" | "already_owned" | "not_purchasable" | "insufficient_coins" };

export async function purchaseCosmetic(profileId: string, cosmeticId: string): Promise<PurchaseResult> {
  const def = getCosmeticDef(cosmeticId);
  if (!def) return { ok: false, reason: "not_found" };
  if (def.unlockType !== "coins") return { ok: false, reason: "not_purchasable" };

  const owned = await getOwnedCosmeticIds(profileId);
  if (owned.has(cosmeticId)) return { ok: false, reason: "already_owned" };

  const spend = await spendCoins(profileId, def.price);
  if (!spend.ok) return { ok: false, reason: "insufficient_coins" };

  await db
    .insert(playerCosmetics)
    .values({ profileId, cosmeticId, source: "purchase" })
    .onConflictDoNothing();

  return { ok: true, coins: spend.coins };
}

/** Grants a cosmetic (e.g. achievement reward) without charging coins. Idempotent. */
export async function grantCosmetic(profileId: string, cosmeticId: string, source: string): Promise<void> {
  await db.insert(playerCosmetics).values({ profileId, cosmeticId, source }).onConflictDoNothing();
}

export type EquipResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_owned" };

export async function equipCosmetic(profileId: string, cosmeticId: string): Promise<EquipResult> {
  const def = getCosmeticDef(cosmeticId);
  if (!def) return { ok: false, reason: "not_found" };

  const owned = await getOwnedCosmeticIds(profileId);
  if (def.unlockType !== "default" && !owned.has(cosmeticId)) return { ok: false, reason: "not_owned" };

  await db
    .insert(equippedCosmetics)
    .values({ profileId, category: def.category, cosmeticId })
    .onConflictDoUpdate({
      target: [equippedCosmetics.profileId, equippedCosmetics.category],
      set: { cosmeticId },
    });

  return { ok: true };
}

export async function unequip(profileId: string, category: string): Promise<EquipResult> {
  if (!OPTIONAL_CATEGORIES.includes(category as (typeof OPTIONAL_CATEGORIES)[number])) {
    return { ok: false, reason: "not_found" };
  }
  await unequipCategory(profileId, category);
  return { ok: true };
}

export async function resetAppearance(profileId: string): Promise<void> {
  await db.delete(equippedCosmetics).where(eq(equippedCosmetics.profileId, profileId));
  const defaults = COSMETIC_CATALOG.filter((c) => c.unlockType === "default");
  const byCategory = new Map<string, (typeof defaults)[number]>();
  for (const d of defaults) {
    if (!byCategory.has(d.category)) byCategory.set(d.category, d);
  }
  for (const def of byCategory.values()) {
    await db.insert(equippedCosmetics).values({ profileId, category: def.category, cosmeticId: def.id }).onConflictDoNothing();
  }
}

export async function countOwnedCosmetics(profileId: string): Promise<number> {
  const owned = await getOwnedCosmeticIds(profileId);
  return owned.size;
}
