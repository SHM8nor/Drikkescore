-- Add 'special' category to badges table
-- Special badges are admin-only honorary badges that don't appear on the main badges page

-- Drop the old constraint
ALTER TABLE "public"."badges"
  DROP CONSTRAINT IF EXISTS "badges_category_check";

-- Add new constraint with 'special' category
ALTER TABLE "public"."badges"
  ADD CONSTRAINT "badges_category_check"
  CHECK ("category" IN ('session', 'global', 'social', 'milestone', 'special'));

-- Update comment to reflect new category
COMMENT ON COLUMN "public"."badges"."category" IS 'Badge category: session (per session), global (all-time), social (friends), milestone (special achievements), special (admin-only honorary badges)';
