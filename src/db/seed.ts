// One-off idempotent seed script for static catalog data (cosmetics,
// achievements, the active competitive season). Run with:
//   npx tsx src/db/seed.ts
import "dotenv/config";
import { db, pool } from "./index";
import { cosmeticItems, seasons } from "./schema";
import { COSMETIC_CATALOG } from "@/lib/cosmetics/catalog";
import { seedAchievementsCatalog } from "@/lib/services/achievementService";
import { eq } from "drizzle-orm";

async function seedCosmetics() {
  for (const item of COSMETIC_CATALOG) {
    await db
      .insert(cosmeticItems)
      .values({
        id: item.id,
        category: item.category,
        nameKey: item.nameKey,
        colorValue: item.colorValue,
        renderKey: item.renderKey,
        unlockType: item.unlockType,
        price: item.price,
        unlockAchievementId: item.unlockAchievementId,
        sortOrder: item.sortOrder,
      })
      .onConflictDoUpdate({
        target: cosmeticItems.id,
        set: {
          category: item.category,
          nameKey: item.nameKey,
          colorValue: item.colorValue,
          renderKey: item.renderKey,
          unlockType: item.unlockType,
          price: item.price,
          unlockAchievementId: item.unlockAchievementId,
          sortOrder: item.sortOrder,
        },
      });
  }
  console.log(`Seeded ${COSMETIC_CATALOG.length} cosmetic items.`);
}

async function seedSeason() {
  const [existing] = await db.select().from(seasons).where(eq(seasons.active, true));
  if (existing) {
    console.log(`Active season already exists: ${existing.name}`);
    return;
  }
  const start = new Date();
  const end = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
  await db.insert(seasons).values({ name: "第一賽季", startAt: start, endAt: end, active: true });
  console.log("Seeded season 1.");
}

async function main() {
  await seedCosmetics();
  await seedAchievementsCatalog();
  console.log("Seeded achievements catalog.");
  await seedSeason();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
