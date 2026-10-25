export type CosmeticCategory =
  | "skin"
  | "hairStyle"
  | "hairColor"
  | "face"
  | "top"
  | "bottom"
  | "dress"
  | "shoes"
  | "hat"
  | "glasses"
  | "accessory";

export const OPTIONAL_CATEGORIES: CosmeticCategory[] = ["dress", "hat", "glasses", "accessory"];

export type UnlockType = "default" | "coins" | "achievement";

export interface CosmeticDef {
  id: string;
  category: CosmeticCategory;
  nameKey: string;
  colorValue?: string;
  renderKey: string;
  unlockType: UnlockType;
  price: number;
  unlockAchievementId?: string;
  sortOrder: number;
}

export const COSMETIC_CATALOG: CosmeticDef[] = [
  // ---- skin tones (free, basic customization) ----
  { id: "skin-1", category: "skin", nameKey: "cosmetic.skin1", colorValue: "#ffe0bd", renderKey: "skin-1", unlockType: "default", price: 0, sortOrder: 0 },
  { id: "skin-2", category: "skin", nameKey: "cosmetic.skin2", colorValue: "#f1c27d", renderKey: "skin-2", unlockType: "default", price: 0, sortOrder: 1 },
  { id: "skin-3", category: "skin", nameKey: "cosmetic.skin3", colorValue: "#e0ac69", renderKey: "skin-3", unlockType: "default", price: 0, sortOrder: 2 },
  { id: "skin-4", category: "skin", nameKey: "cosmetic.skin4", colorValue: "#c68642", renderKey: "skin-4", unlockType: "default", price: 0, sortOrder: 3 },
  { id: "skin-5", category: "skin", nameKey: "cosmetic.skin5", colorValue: "#8d5524", renderKey: "skin-5", unlockType: "default", price: 0, sortOrder: 4 },

  // ---- hairstyles ----
  { id: "hair-short", category: "hairStyle", nameKey: "cosmetic.hairShort", renderKey: "short", unlockType: "default", price: 0, sortOrder: 0 },
  { id: "hair-bob", category: "hairStyle", nameKey: "cosmetic.hairBob", renderKey: "bob", unlockType: "default", price: 0, sortOrder: 1 },
  { id: "hair-ponytail", category: "hairStyle", nameKey: "cosmetic.hairPonytail", renderKey: "ponytail", unlockType: "coins", price: 150, sortOrder: 2 },
  { id: "hair-curly", category: "hairStyle", nameKey: "cosmetic.hairCurly", renderKey: "curly", unlockType: "coins", price: 200, sortOrder: 3 },
  { id: "hair-buzz", category: "hairStyle", nameKey: "cosmetic.hairBuzz", renderKey: "buzz", unlockType: "achievement", price: 0, unlockAchievementId: "first_steps", sortOrder: 4 },

  // ---- hair colors ----
  { id: "haircolor-black", category: "hairColor", nameKey: "cosmetic.colorBlack", colorValue: "#2b2b2b", renderKey: "#2b2b2b", unlockType: "default", price: 0, sortOrder: 0 },
  { id: "haircolor-brown", category: "hairColor", nameKey: "cosmetic.colorBrown", colorValue: "#6b4226", renderKey: "#6b4226", unlockType: "default", price: 0, sortOrder: 1 },
  { id: "haircolor-blonde", category: "hairColor", nameKey: "cosmetic.colorBlonde", colorValue: "#e8c977", renderKey: "#e8c977", unlockType: "coins", price: 100, sortOrder: 2 },
  { id: "haircolor-red", category: "hairColor", nameKey: "cosmetic.colorRed", colorValue: "#c0472c", renderKey: "#c0472c", unlockType: "coins", price: 100, sortOrder: 3 },
  { id: "haircolor-blue", category: "hairColor", nameKey: "cosmetic.colorBlue", colorValue: "#5b7fd4", renderKey: "#5b7fd4", unlockType: "coins", price: 150, sortOrder: 4 },
  { id: "haircolor-pink", category: "hairColor", nameKey: "cosmetic.colorPink", colorValue: "#e6789c", renderKey: "#e6789c", unlockType: "coins", price: 150, sortOrder: 5 },

  // ---- faces ----
  { id: "face-default", category: "face", nameKey: "cosmetic.faceDefault", renderKey: "default", unlockType: "default", price: 0, sortOrder: 0 },
  { id: "face-happy", category: "face", nameKey: "cosmetic.faceHappy", renderKey: "happy", unlockType: "default", price: 0, sortOrder: 1 },
  { id: "face-sparkle", category: "face", nameKey: "cosmetic.faceSparkle", renderKey: "sparkle", unlockType: "coins", price: 120, sortOrder: 2 },
  { id: "face-cool", category: "face", nameKey: "cosmetic.faceCool", renderKey: "cool", unlockType: "achievement", price: 0, unlockAchievementId: "flawless_solve", sortOrder: 3 },

  // ---- tops ----
  { id: "top-tshirt", category: "top", nameKey: "cosmetic.topTshirt", colorValue: "#6bbf8e", renderKey: "tshirt", unlockType: "default", price: 0, sortOrder: 0 },
  { id: "top-hoodie", category: "top", nameKey: "cosmetic.topHoodie", colorValue: "#eb9f3c", renderKey: "hoodie", unlockType: "coins", price: 120, sortOrder: 1 },
  { id: "top-vest", category: "top", nameKey: "cosmetic.topVest", colorValue: "#d65d7a", renderKey: "vest", unlockType: "coins", price: 150, sortOrder: 2 },
  { id: "top-sweater", category: "top", nameKey: "cosmetic.topSweater", colorValue: "#7a6ff0", renderKey: "sweater", unlockType: "coins", price: 180, sortOrder: 3 },

  // ---- bottoms ----
  { id: "bottom-shorts", category: "bottom", nameKey: "cosmetic.bottomShorts", colorValue: "#4a6fa5", renderKey: "shorts", unlockType: "default", price: 0, sortOrder: 0 },
  { id: "bottom-jeans", category: "bottom", nameKey: "cosmetic.bottomJeans", colorValue: "#3b5998", renderKey: "jeans", unlockType: "coins", price: 120, sortOrder: 1 },
  { id: "bottom-skirt", category: "bottom", nameKey: "cosmetic.bottomSkirt", colorValue: "#c75b8f", renderKey: "skirt", unlockType: "coins", price: 140, sortOrder: 2 },
  { id: "bottom-pants", category: "bottom", nameKey: "cosmetic.bottomPants", colorValue: "#555b6e", renderKey: "pants", unlockType: "coins", price: 160, sortOrder: 3 },

  // ---- dresses (override top+bottom) ----
  { id: "dress-sundress", category: "dress", nameKey: "cosmetic.dressSun", colorValue: "#f7b2bd", renderKey: "sundress", unlockType: "coins", price: 200, sortOrder: 0 },
  { id: "dress-party", category: "dress", nameKey: "cosmetic.dressParty", colorValue: "#9b6bd6", renderKey: "party", unlockType: "achievement", price: 0, unlockAchievementId: "puzzle_explorer", sortOrder: 1 },
  { id: "dress-royal", category: "dress", nameKey: "cosmetic.dressRoyal", colorValue: "#2f4b7c", renderKey: "royal", unlockType: "coins", price: 400, sortOrder: 2 },

  // ---- shoes ----
  { id: "shoes-sneakers", category: "shoes", nameKey: "cosmetic.shoesSneakers", colorValue: "#ffffff", renderKey: "sneakers", unlockType: "default", price: 0, sortOrder: 0 },
  { id: "shoes-sandals", category: "shoes", nameKey: "cosmetic.shoesSandals", colorValue: "#c89666", renderKey: "sandals", unlockType: "coins", price: 100, sortOrder: 1 },
  { id: "shoes-boots", category: "shoes", nameKey: "cosmetic.shoesBoots", colorValue: "#5b3a29", renderKey: "boots", unlockType: "coins", price: 150, sortOrder: 2 },

  // ---- hats ----
  { id: "hat-cap", category: "hat", nameKey: "cosmetic.hatCap", colorValue: "#e3594d", renderKey: "cap", unlockType: "coins", price: 120, sortOrder: 0 },
  { id: "hat-beanie", category: "hat", nameKey: "cosmetic.hatBeanie", colorValue: "#4d8fe3", renderKey: "beanie", unlockType: "coins", price: 150, sortOrder: 1 },
  { id: "hat-bow", category: "hat", nameKey: "cosmetic.hatBow", colorValue: "#e34d8f", renderKey: "bow", unlockType: "coins", price: 130, sortOrder: 2 },
  { id: "hat-crown", category: "hat", nameKey: "cosmetic.hatCrown", colorValue: "#f3c13a", renderKey: "crown", unlockType: "achievement", price: 0, unlockAchievementId: "campaign_champion", sortOrder: 3 },

  // ---- glasses ----
  { id: "glasses-round", category: "glasses", nameKey: "cosmetic.glassesRound", colorValue: "#333333", renderKey: "round", unlockType: "coins", price: 100, sortOrder: 0 },
  { id: "glasses-star", category: "glasses", nameKey: "cosmetic.glassesStar", colorValue: "#e3b94d", renderKey: "star", unlockType: "coins", price: 140, sortOrder: 1 },
  { id: "glasses-sun", category: "glasses", nameKey: "cosmetic.glassesSun", colorValue: "#222222", renderKey: "sun", unlockType: "achievement", price: 0, unlockAchievementId: "speed_solver", sortOrder: 2 },

  // ---- accessories ----
  { id: "accessory-backpack", category: "accessory", nameKey: "cosmetic.accBackpack", colorValue: "#8a5fd1", renderKey: "backpack", unlockType: "coins", price: 150, sortOrder: 0 },
  { id: "accessory-wings", category: "accessory", nameKey: "cosmetic.accWings", colorValue: "#f5f5f5", renderKey: "wings", unlockType: "achievement", price: 0, unlockAchievementId: "race_veteran", sortOrder: 1 },
  { id: "accessory-balloon", category: "accessory", nameKey: "cosmetic.accBalloon", colorValue: "#e35f5f", renderKey: "balloon", unlockType: "coins", price: 180, sortOrder: 2 },
];

export function getCosmeticDef(id: string): CosmeticDef | undefined {
  return COSMETIC_CATALOG.find((c) => c.id === id);
}

export function getDefaultCosmeticForCategory(category: CosmeticCategory): CosmeticDef | undefined {
  return COSMETIC_CATALOG.filter((c) => c.category === category && c.unlockType === "default").sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )[0];
}

export const ALL_CATEGORIES: CosmeticCategory[] = [
  "skin",
  "hairStyle",
  "hairColor",
  "face",
  "top",
  "bottom",
  "dress",
  "shoes",
  "hat",
  "glasses",
  "accessory",
];
