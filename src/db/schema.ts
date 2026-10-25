import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Profiles (guest or linked accounts)
// ---------------------------------------------------------------------------
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  isGuest: boolean("is_guest").notNull().default(true),
  coins: integer("coins").notNull().default(0),
  locale: text("locale").notNull().default("zh-TW"),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  theme: text("theme").notNull().default("light"),
  equippedTitle: text("equipped_title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Cosmetics catalog + ownership + equipped state
// ---------------------------------------------------------------------------
export const cosmeticItems = pgTable("cosmetic_items", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  nameKey: text("name_key").notNull(),
  colorValue: text("color_value"),
  renderKey: text("render_key").notNull(),
  unlockType: text("unlock_type").notNull().default("default"),
  price: integer("price").notNull().default(0),
  unlockAchievementId: text("unlock_achievement_id"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const playerCosmetics = pgTable(
  "player_cosmetics",
  {
    id: serial("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id),
    cosmeticId: text("cosmetic_id").notNull().references(() => cosmeticItems.id),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
    source: text("source").notNull().default("default"),
  },
  (t) => [uniqueIndex("player_cosmetics_unique").on(t.profileId, t.cosmeticId)],
);

export const equippedCosmetics = pgTable(
  "equipped_cosmetics",
  {
    profileId: text("profile_id").notNull().references(() => profiles.id),
    category: text("category").notNull(),
    cosmeticId: text("cosmetic_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.category] })],
);

// ---------------------------------------------------------------------------
// Campaign progress + generic puzzle records
// ---------------------------------------------------------------------------
export const campaignProgress = pgTable(
  "campaign_progress",
  {
    id: serial("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id),
    levelId: text("level_id").notNull(),
    stars: integer("stars").notNull().default(0),
    bestTimeMs: integer("best_time_ms"),
    bestMistakes: integer("best_mistakes"),
    bestHints: integer("best_hints"),
    completed: boolean("completed").notNull().default(false),
    attempts: integer("attempts").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("campaign_progress_unique").on(t.profileId, t.levelId)],
);

export const puzzleRecords = pgTable(
  "puzzle_records",
  {
    id: serial("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id),
    mode: text("mode").notNull(),
    refId: text("ref_id").notNull(),
    difficulty: text("difficulty").notNull(),
    timeMs: integer("time_ms").notNull(),
    mistakes: integer("mistakes").notNull().default(0),
    hintsUsed: integer("hints_used").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("puzzle_records_profile_idx").on(t.profileId)],
);

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  titleKey: text("title_key").notNull(),
  descKey: text("desc_key").notNull(),
  conditionType: text("condition_type").notNull(),
  conditionValue: integer("condition_value").notNull().default(0),
  rewardCoins: integer("reward_coins").notNull().default(0),
  rewardCosmeticId: text("reward_cosmetic_id"),
  icon: text("icon").notNull().default("star"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const playerAchievements = pgTable(
  "player_achievements",
  {
    id: serial("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id),
    achievementId: text("achievement_id").notNull().references(() => achievements.id),
    progress: integer("progress").notNull().default(0),
    unlocked: boolean("unlocked").notNull().default(false),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("player_achievements_unique").on(t.profileId, t.achievementId)],
);

// ---------------------------------------------------------------------------
// Daily challenge
// ---------------------------------------------------------------------------
export const dailyChallenges = pgTable("daily_challenges", {
  date: text("date").primaryKey(),
  givens: text("givens").notNull(),
  solution: text("solution").notNull(),
  difficulty: text("difficulty").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyChallengeCompletions = pgTable(
  "daily_challenge_completions",
  {
    id: serial("id").primaryKey(),
    profileId: text("profile_id").notNull().references(() => profiles.id),
    date: text("date").notNull(),
    timeMs: integer("time_ms").notNull(),
    mistakes: integer("mistakes").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    streakCount: integer("streak_count").notNull().default(0),
    rewardClaimed: boolean("reward_claimed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("daily_completions_unique").on(t.profileId, t.date)],
);

// ---------------------------------------------------------------------------
// Multiplayer rooms / matches
// ---------------------------------------------------------------------------
export const multiplayerRooms = pgTable("multiplayer_rooms", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  hostProfileId: text("host_profile_id").notNull(),
  status: text("status").notNull().default("lobby"),
  difficulty: text("difficulty").notNull().default("easy"),
  maxPlayers: integer("max_players").notNull().default(4),
  rated: boolean("rated").notNull().default(true),
  timeLimitS: integer("time_limit_s").notNull().default(900),
  matchId: text("match_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("multiplayer_rooms_code_idx").on(t.code)]);

export const multiplayerRoomMembers = pgTable(
  "multiplayer_room_members",
  {
    id: serial("id").primaryKey(),
    roomId: text("room_id").notNull().references(() => multiplayerRooms.id),
    profileId: text("profile_id").notNull(),
    seat: integer("seat").notNull(),
    isHost: boolean("is_host").notNull().default(false),
    isReady: boolean("is_ready").notNull().default(false),
    status: text("status").notNull().default("joined"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("room_members_unique").on(t.roomId, t.profileId)],
);

export const multiplayerMatches = pgTable("multiplayer_matches", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull(),
  difficulty: text("difficulty").notNull(),
  puzzleGivens: text("puzzle_givens").notNull(),
  puzzleSolution: text("puzzle_solution").notNull(),
  rated: boolean("rated").notNull().default(true),
  timeLimitS: integer("time_limit_s").notNull().default(900),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  status: text("status").notNull().default("countdown"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const multiplayerMatchResults = pgTable(
  "multiplayer_match_results",
  {
    id: serial("id").primaryKey(),
    matchId: text("match_id").notNull().references(() => multiplayerMatches.id),
    profileId: text("profile_id").notNull(),
    placement: integer("placement"),
    finishTimeMs: integer("finish_time_ms"),
    mistakes: integer("mistakes").notNull().default(0),
    hintsUsed: integer("hints_used").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    correctCells: integer("correct_cells").notNull().default(0),
    ratingBefore: integer("rating_before"),
    ratingAfter: integer("rating_after"),
    ratingChange: integer("rating_change"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("match_results_unique").on(t.matchId, t.profileId)],
);

// ---------------------------------------------------------------------------
// Competitive rating
// ---------------------------------------------------------------------------
export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  active: boolean("active").notNull().default(false),
});

export const playerRating = pgTable("player_rating", {
  profileId: text("profile_id").primaryKey().references(() => profiles.id),
  rating: integer("rating").notNull().default(1000),
  seasonId: integer("season_id"),
  seasonBestRating: integer("season_best_rating").notNull().default(1000),
  lifetimeBestRating: integer("lifetime_best_rating").notNull().default(1000),
  matchesPlayed: integer("matches_played").notNull().default(0),
  matchesCompleted: integer("matches_completed").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  placementMatches: integer("placement_matches").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ratingHistory = pgTable(
  "rating_history",
  {
    id: serial("id").primaryKey(),
    profileId: text("profile_id").notNull(),
    matchId: text("match_id").notNull(),
    ratingBefore: integer("rating_before").notNull(),
    ratingAfter: integer("rating_after").notNull(),
    ratingChange: integer("rating_change").notNull(),
    algoVersion: text("algo_version").notNull().default("elo-ffa-v1"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rating_history_profile_idx").on(t.profileId)],
);
