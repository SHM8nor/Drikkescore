-- Fix Badge Duplicate Awards Bug
--
-- Problem: The UNIQUE constraint allows the same badge to be awarded multiple times
-- when session_id differs. For example, "first_drink" (a milestone badge) gets awarded
-- once per session instead of once ever.
--
-- Solution:
-- - For milestone/global badges: Only one award per user (session_id should be NULL)
-- - For session badges: One award per user per session (session_id required)
-- - Update award_badge() function to enforce this logic

-- ============================================================================
-- DROP OLD CONSTRAINT AND ADD NEW ONES
-- ============================================================================

-- Drop the old unique constraint
ALTER TABLE "public"."user_badges"
  DROP CONSTRAINT IF EXISTS "user_badges_user_id_badge_id_session_id_key";

-- Add new constraints based on badge category logic:
-- For milestone/global badges (session_id should be NULL): unique per user
-- For session badges: unique per user per session

-- Constraint 1: Ensure only ONE award for milestone/global badges (where session_id IS NULL)
CREATE UNIQUE INDEX "user_badges_milestone_global_unique"
  ON "public"."user_badges"("user_id", "badge_id")
  WHERE "session_id" IS NULL;

-- Constraint 2: Ensure only ONE award per session for session-specific badges
CREATE UNIQUE INDEX "user_badges_session_unique"
  ON "public"."user_badges"("user_id", "badge_id", "session_id")
  WHERE "session_id" IS NOT NULL;

-- ============================================================================
-- UPDATE award_badge() FUNCTION
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS "public"."award_badge"(uuid, varchar, uuid, jsonb);

-- Recreate with proper category-aware logic
CREATE OR REPLACE FUNCTION "public"."award_badge"(
  "p_user_id" uuid,
  "p_badge_code" varchar,
  "p_session_id" uuid DEFAULT NULL,
  "p_metadata" jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
  v_badge_id uuid;
  v_badge_category text;
  v_user_badge_id uuid;
  v_existing_badge_id uuid;
BEGIN
  -- Get badge ID and category
  SELECT "id", "category" INTO v_badge_id, v_badge_category
  FROM "public"."badges"
  WHERE "code" = p_badge_code
    AND "is_active" = true
  LIMIT 1;

  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Badge with code % not found or inactive', p_badge_code;
  END IF;

  -- Determine correct session_id based on category
  -- milestone and global badges should NEVER have a session_id
  -- session and social badges CAN have a session_id
  DECLARE
    v_final_session_id uuid;
  BEGIN
    IF v_badge_category IN ('milestone', 'global') THEN
      v_final_session_id := NULL;  -- Force NULL for milestone/global
    ELSE
      v_final_session_id := p_session_id;  -- Use provided session_id for session/social
    END IF;

    -- Check if badge already awarded with this configuration
    SELECT "id" INTO v_existing_badge_id
    FROM "public"."user_badges"
    WHERE "user_id" = p_user_id
      AND "badge_id" = v_badge_id
      AND (
        (v_final_session_id IS NULL AND "session_id" IS NULL) OR
        (v_final_session_id IS NOT NULL AND "session_id" = v_final_session_id)
      )
    LIMIT 1;

    -- If already exists, return existing ID (idempotent)
    IF v_existing_badge_id IS NOT NULL THEN
      RETURN v_existing_badge_id;
    END IF;

    -- Award the badge
    INSERT INTO "public"."user_badges" ("user_id", "badge_id", "session_id", "metadata")
    VALUES (p_user_id, v_badge_id, v_final_session_id, p_metadata)
    RETURNING "id" INTO v_user_badge_id;

    RETURN v_user_badge_id;
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION "public"."award_badge"(uuid, varchar, uuid, jsonb) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION "public"."award_badge"(uuid, varchar, uuid, jsonb) IS
'Awards a badge to a user. Automatically determines if badge should be tied to a session based on category.
- milestone/global badges: Awarded once per user (session_id forced to NULL)
- session/social badges: Can be awarded once per session (session_id from parameter)
Idempotent - returns existing badge ID if already awarded.';
