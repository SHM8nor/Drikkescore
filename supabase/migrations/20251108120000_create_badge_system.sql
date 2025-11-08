-- Create Badge/Achievement System
-- This migration implements a comprehensive badge system with:
-- 1. Badge metadata table for badge definitions
-- 2. User badge associations for tracking earned badges
-- 3. Badge progress tracking for incremental achievements
-- 4. RLS policies for secure data access
-- 5. Database functions for badge operations

-- ============================================================================
-- BADGE METADATA TABLE
-- ============================================================================
-- Stores badge definitions, criteria, and metadata

CREATE TABLE IF NOT EXISTS "public"."badges" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
  "code" VARCHAR(50) UNIQUE NOT NULL,
  "title" VARCHAR(100) NOT NULL,
  "description" TEXT NOT NULL,
  "category" VARCHAR(50) NOT NULL,
  "tier" VARCHAR(20) NOT NULL,
  "tier_order" INTEGER NOT NULL,
  "icon_url" TEXT,
  "criteria" JSONB NOT NULL,
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "is_automatic" BOOLEAN DEFAULT true NOT NULL,
  "points" INTEGER DEFAULT 0 NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT "badges_category_check" CHECK ("category" IN ('session', 'global', 'social', 'milestone')),
  CONSTRAINT "badges_tier_check" CHECK ("tier" IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
  CONSTRAINT "badges_points_check" CHECK ("points" >= 0)
);

COMMENT ON TABLE "public"."badges" IS 'Badge definitions and metadata for the achievement system';
COMMENT ON COLUMN "public"."badges"."code" IS 'Unique code identifier for the badge (e.g., first_drink, party_animal)';
COMMENT ON COLUMN "public"."badges"."category" IS 'Badge category: session (per session), global (all-time), social (friends), milestone (special achievements)';
COMMENT ON COLUMN "public"."badges"."tier" IS 'Badge tier indicating rarity/difficulty';
COMMENT ON COLUMN "public"."badges"."tier_order" IS 'Numeric order for tier sorting (1=bronze, 2=silver, 3=gold, 4=platinum, 5=legendary)';
COMMENT ON COLUMN "public"."badges"."icon_url" IS 'Supabase Storage URL for badge icon image';
COMMENT ON COLUMN "public"."badges"."criteria" IS 'JSONB object defining badge criteria (e.g., {"drinks": 10, "timeframe": "session"})';
COMMENT ON COLUMN "public"."badges"."is_active" IS 'Whether the badge is currently available to earn';
COMMENT ON COLUMN "public"."badges"."is_automatic" IS 'Whether badge is awarded automatically (true) or manually by admin (false)';
COMMENT ON COLUMN "public"."badges"."points" IS 'Points awarded for earning this badge';

ALTER TABLE "public"."badges" OWNER TO "postgres";

-- ============================================================================
-- USER BADGE ASSOCIATIONS TABLE
-- ============================================================================
-- Tracks which badges users have earned and when

CREATE TABLE IF NOT EXISTS "public"."user_badges" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
  "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "badge_id" "uuid" NOT NULL REFERENCES "public"."badges"("id") ON DELETE CASCADE,
  "earned_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "session_id" "uuid" REFERENCES "public"."sessions"("id") ON DELETE SET NULL,
  "metadata" JSONB,
  UNIQUE("user_id", "badge_id", "session_id")
);

COMMENT ON TABLE "public"."user_badges" IS 'Tracks badges earned by users';
COMMENT ON COLUMN "public"."user_badges"."session_id" IS 'Session in which badge was earned (NULL for global badges)';
COMMENT ON COLUMN "public"."user_badges"."metadata" IS 'Additional context about badge earning (e.g., final score, ranking)';
COMMENT ON CONSTRAINT "user_badges_user_id_badge_id_session_id_key" ON "public"."user_badges" IS 'Prevents duplicate badge awards for same session. Session-based badges can be earned multiple times across different sessions.';

ALTER TABLE "public"."user_badges" OWNER TO "postgres";

-- ============================================================================
-- BADGE PROGRESS TABLE
-- ============================================================================
-- Tracks incremental progress toward earning badges

CREATE TABLE IF NOT EXISTS "public"."badge_progress" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
  "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "badge_id" "uuid" NOT NULL REFERENCES "public"."badges"("id") ON DELETE CASCADE,
  "current_value" NUMERIC DEFAULT 0 NOT NULL,
  "target_value" NUMERIC NOT NULL,
  "last_updated" TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE("user_id", "badge_id"),
  CONSTRAINT "badge_progress_current_value_check" CHECK ("current_value" >= 0),
  CONSTRAINT "badge_progress_target_value_check" CHECK ("target_value" > 0)
);

COMMENT ON TABLE "public"."badge_progress" IS 'Tracks incremental progress toward earning badges';
COMMENT ON COLUMN "public"."badge_progress"."current_value" IS 'Current progress value (e.g., 7 out of 10 drinks)';
COMMENT ON COLUMN "public"."badge_progress"."target_value" IS 'Target value needed to earn the badge';

ALTER TABLE "public"."badge_progress" OWNER TO "postgres";

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Optimize query performance for common access patterns

-- Badge indexes
CREATE INDEX "idx_badges_category" ON "public"."badges" USING "btree" ("category");
CREATE INDEX "idx_badges_tier_order" ON "public"."badges" USING "btree" ("tier_order");
CREATE INDEX "idx_badges_is_active" ON "public"."badges" USING "btree" ("is_active") WHERE "is_active" = true;
CREATE INDEX "idx_badges_code" ON "public"."badges" USING "btree" ("code");

-- User badge indexes
CREATE INDEX "idx_user_badges_user_id" ON "public"."user_badges" USING "btree" ("user_id");
CREATE INDEX "idx_user_badges_badge_id" ON "public"."user_badges" USING "btree" ("badge_id");
CREATE INDEX "idx_user_badges_session_id" ON "public"."user_badges" USING "btree" ("session_id") WHERE "session_id" IS NOT NULL;
CREATE INDEX "idx_user_badges_earned_at" ON "public"."user_badges" USING "btree" ("earned_at");

-- Badge progress indexes
CREATE INDEX "idx_badge_progress_user_id" ON "public"."badge_progress" USING "btree" ("user_id");
CREATE INDEX "idx_badge_progress_badge_id" ON "public"."badge_progress" USING "btree" ("badge_id");

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Automatically update timestamps

CREATE OR REPLACE TRIGGER "update_badges_updated_at"
BEFORE UPDATE ON "public"."badges"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Create function to update last_updated column
CREATE OR REPLACE FUNCTION "public"."update_last_updated_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER "update_badge_progress_last_updated"
BEFORE UPDATE ON "public"."badge_progress"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_last_updated_column"();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."badge_progress" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BADGES TABLE POLICIES
-- ============================================================================

-- Everyone can view active badges
CREATE POLICY "Anyone can view active badges"
ON "public"."badges"
FOR SELECT
TO "authenticated", "anon"
USING ("is_active" = true);

-- Admins can view all badges (including inactive)
CREATE POLICY "Admins can view all badges"
ON "public"."badges"
FOR SELECT
TO "authenticated"
USING ((SELECT "is_admin"()));

-- Admins can insert badges
CREATE POLICY "Admins can create badges"
ON "public"."badges"
FOR INSERT
TO "authenticated"
WITH CHECK ((SELECT "is_admin"()));

-- Admins can update badges
CREATE POLICY "Admins can update badges"
ON "public"."badges"
FOR UPDATE
TO "authenticated"
USING ((SELECT "is_admin"()))
WITH CHECK ((SELECT "is_admin"()));

-- Admins can delete badges
CREATE POLICY "Admins can delete badges"
ON "public"."badges"
FOR DELETE
TO "authenticated"
USING ((SELECT "is_admin"()));

-- ============================================================================
-- USER_BADGES TABLE POLICIES
-- ============================================================================

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
ON "public"."user_badges"
FOR SELECT
TO "authenticated"
USING ((SELECT "auth"."uid"()) = "user_id");

-- Users can view friends' badges (using existing are_friends function)
CREATE POLICY "Users can view friends' badges"
ON "public"."user_badges"
FOR SELECT
TO "authenticated"
USING (
  (SELECT "are_friends"((SELECT "auth"."uid"()), "user_badges"."user_id"))
);

-- Admins can view all user badges
CREATE POLICY "Admins can view all user badges"
ON "public"."user_badges"
FOR SELECT
TO "authenticated"
USING ((SELECT "is_admin"()));

-- Only system/admin can insert user badges (automatic awarding)
CREATE POLICY "Admins can award badges"
ON "public"."user_badges"
FOR INSERT
TO "authenticated"
WITH CHECK ((SELECT "is_admin"()));

-- Admins can delete user badges
CREATE POLICY "Admins can remove badges"
ON "public"."user_badges"
FOR DELETE
TO "authenticated"
USING ((SELECT "is_admin"()));

-- ============================================================================
-- BADGE_PROGRESS TABLE POLICIES
-- ============================================================================

-- Users can only view their own progress
CREATE POLICY "Users can view own badge progress"
ON "public"."badge_progress"
FOR SELECT
TO "authenticated"
USING ((SELECT "auth"."uid"()) = "user_id");

-- Admins can view all badge progress
CREATE POLICY "Admins can view all badge progress"
ON "public"."badge_progress"
FOR SELECT
TO "authenticated"
USING ((SELECT "is_admin"()));

-- Only system/admin can update badge progress
CREATE POLICY "Admins can update badge progress"
ON "public"."badge_progress"
FOR INSERT
TO "authenticated"
WITH CHECK ((SELECT "is_admin"()));

CREATE POLICY "Admins can modify badge progress"
ON "public"."badge_progress"
FOR UPDATE
TO "authenticated"
USING ((SELECT "is_admin"()))
WITH CHECK ((SELECT "is_admin"()));

CREATE POLICY "Admins can delete badge progress"
ON "public"."badge_progress"
FOR DELETE
TO "authenticated"
USING ((SELECT "is_admin"()));

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Award a badge to a user
-- Returns the user_badge id, handles duplicates gracefully
CREATE OR REPLACE FUNCTION "public"."award_badge"(
  "p_user_id" "uuid",
  "p_badge_code" VARCHAR,
  "p_session_id" "uuid" DEFAULT NULL,
  "p_metadata" JSONB DEFAULT NULL
)
RETURNS "uuid"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge_id uuid;
  v_user_badge_id uuid;
  v_badge_exists boolean;
BEGIN
  -- Verify badge exists and is active
  SELECT id INTO v_badge_id
  FROM badges
  WHERE code = p_badge_code AND is_active = true;

  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Badge with code % does not exist or is not active', p_badge_code;
  END IF;

  -- Check if user already has this badge for this session
  SELECT id INTO v_user_badge_id
  FROM user_badges
  WHERE user_id = p_user_id
    AND badge_id = v_badge_id
    AND (
      (p_session_id IS NULL AND session_id IS NULL)
      OR
      (session_id = p_session_id)
    );

  -- If badge already awarded, return existing id
  IF v_user_badge_id IS NOT NULL THEN
    RETURN v_user_badge_id;
  END IF;

  -- Award the badge
  INSERT INTO user_badges (user_id, badge_id, session_id, metadata)
  VALUES (p_user_id, v_badge_id, p_session_id, p_metadata)
  RETURNING id INTO v_user_badge_id;

  RETURN v_user_badge_id;
END;
$$;

COMMENT ON FUNCTION "public"."award_badge"("p_user_id" "uuid", "p_badge_code" VARCHAR, "p_session_id" "uuid", "p_metadata" JSONB)
IS 'Awards a badge to a user. Handles duplicates gracefully by returning existing badge id. Session-specific badges can be earned multiple times across different sessions.';

ALTER FUNCTION "public"."award_badge"("p_user_id" "uuid", "p_badge_code" VARCHAR, "p_session_id" "uuid", "p_metadata" JSONB) OWNER TO "postgres";

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";

GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";

GRANT ALL ON TABLE "public"."badge_progress" TO "anon";
GRANT ALL ON TABLE "public"."badge_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."badge_progress" TO "service_role";

GRANT ALL ON FUNCTION "public"."award_badge"("p_user_id" "uuid", "p_badge_code" VARCHAR, "p_session_id" "uuid", "p_metadata" JSONB) TO "anon";
GRANT ALL ON FUNCTION "public"."award_badge"("p_user_id" "uuid", "p_badge_code" VARCHAR, "p_session_id" "uuid", "p_metadata" JSONB) TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_badge"("p_user_id" "uuid", "p_badge_code" VARCHAR, "p_session_id" "uuid", "p_metadata" JSONB) TO "service_role";
