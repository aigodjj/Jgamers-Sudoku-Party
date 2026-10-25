CREATE TABLE "achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title_key" text NOT NULL,
	"desc_key" text NOT NULL,
	"condition_type" text NOT NULL,
	"condition_value" integer DEFAULT 0 NOT NULL,
	"reward_coins" integer DEFAULT 0 NOT NULL,
	"reward_cosmetic_id" text,
	"icon" text DEFAULT 'star' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"level_id" text NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"best_time_ms" integer,
	"best_mistakes" integer,
	"best_hints" integer,
	"completed" boolean DEFAULT false NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cosmetic_items" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"name_key" text NOT NULL,
	"color_value" text,
	"render_key" text NOT NULL,
	"unlock_type" text DEFAULT 'default' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"unlock_achievement_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_challenge_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"date" text NOT NULL,
	"time_ms" integer NOT NULL,
	"mistakes" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"reward_claimed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_challenges" (
	"date" text PRIMARY KEY NOT NULL,
	"givens" text NOT NULL,
	"solution" text NOT NULL,
	"difficulty" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipped_cosmetics" (
	"profile_id" text NOT NULL,
	"category" text NOT NULL,
	"cosmetic_id" text NOT NULL,
	CONSTRAINT "equipped_cosmetics_profile_id_category_pk" PRIMARY KEY("profile_id","category")
);
--> statement-breakpoint
CREATE TABLE "multiplayer_match_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"placement" integer,
	"finish_time_ms" integer,
	"mistakes" integer DEFAULT 0 NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"correct_cells" integer DEFAULT 0 NOT NULL,
	"rating_before" integer,
	"rating_after" integer,
	"rating_change" integer,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "multiplayer_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"difficulty" text NOT NULL,
	"puzzle_givens" text NOT NULL,
	"puzzle_solution" text NOT NULL,
	"rated" boolean DEFAULT true NOT NULL,
	"time_limit_s" integer DEFAULT 900 NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"status" text DEFAULT 'countdown' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "multiplayer_room_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"seat" integer NOT NULL,
	"is_host" boolean DEFAULT false NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'joined' NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "multiplayer_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"host_profile_id" text NOT NULL,
	"status" text DEFAULT 'lobby' NOT NULL,
	"difficulty" text DEFAULT 'easy' NOT NULL,
	"max_players" integer DEFAULT 4 NOT NULL,
	"rated" boolean DEFAULT true NOT NULL,
	"time_limit_s" integer DEFAULT 900 NOT NULL,
	"match_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"unlocked" boolean DEFAULT false NOT NULL,
	"unlocked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "player_cosmetics" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"cosmetic_id" text NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'default' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_rating" (
	"profile_id" text PRIMARY KEY NOT NULL,
	"rating" integer DEFAULT 1000 NOT NULL,
	"season_id" integer,
	"season_best_rating" integer DEFAULT 1000 NOT NULL,
	"lifetime_best_rating" integer DEFAULT 1000 NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"matches_completed" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"placement_matches" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"is_guest" boolean DEFAULT true NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"locale" text DEFAULT 'zh-TW' NOT NULL,
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"equipped_title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puzzle_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"mode" text NOT NULL,
	"ref_id" text NOT NULL,
	"difficulty" text NOT NULL,
	"time_ms" integer NOT NULL,
	"mistakes" integer DEFAULT 0 NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rating_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"match_id" text NOT NULL,
	"rating_before" integer NOT NULL,
	"rating_after" integer NOT NULL,
	"rating_change" integer NOT NULL,
	"algo_version" text DEFAULT 'elo-ffa-v1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_progress" ADD CONSTRAINT "campaign_progress_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_challenge_completions" ADD CONSTRAINT "daily_challenge_completions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipped_cosmetics" ADD CONSTRAINT "equipped_cosmetics_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multiplayer_match_results" ADD CONSTRAINT "multiplayer_match_results_match_id_multiplayer_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."multiplayer_matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multiplayer_room_members" ADD CONSTRAINT "multiplayer_room_members_room_id_multiplayer_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."multiplayer_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_achievements" ADD CONSTRAINT "player_achievements_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_achievements" ADD CONSTRAINT "player_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_cosmetics" ADD CONSTRAINT "player_cosmetics_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_cosmetics" ADD CONSTRAINT "player_cosmetics_cosmetic_id_cosmetic_items_id_fk" FOREIGN KEY ("cosmetic_id") REFERENCES "public"."cosmetic_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_rating" ADD CONSTRAINT "player_rating_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzle_records" ADD CONSTRAINT "puzzle_records_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_progress_unique" ON "campaign_progress" USING btree ("profile_id","level_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_completions_unique" ON "daily_challenge_completions" USING btree ("profile_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "match_results_unique" ON "multiplayer_match_results" USING btree ("match_id","profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "room_members_unique" ON "multiplayer_room_members" USING btree ("room_id","profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "multiplayer_rooms_code_idx" ON "multiplayer_rooms" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "player_achievements_unique" ON "player_achievements" USING btree ("profile_id","achievement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_cosmetics_unique" ON "player_cosmetics" USING btree ("profile_id","cosmetic_id");--> statement-breakpoint
CREATE INDEX "puzzle_records_profile_idx" ON "puzzle_records" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "rating_history_profile_idx" ON "rating_history" USING btree ("profile_id");