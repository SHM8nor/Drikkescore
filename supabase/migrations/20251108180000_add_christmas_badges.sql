-- ============================================================================
-- CHRISTMAS BADGE COLLECTION (Julebord)
-- ============================================================================
-- Adds Christmas-themed badges for julebord (Christmas party) sessions
-- These badges celebrate Norwegian Christmas drinking traditions
-- Category: 'special' - Seasonal badges tied to session_type = 'julebord'
--
-- Badge Design Philosophy:
-- - Norwegian language names and descriptions
-- - Tied to julebord session participation
-- - Range from easy (participation) to legendary (heroic achievements)
-- - Encourage social drinking culture while tracking milestones
-- ============================================================================

-- ============================================================================
-- 1. JULEGLEDE (Christmas Joy) - Bronze Tier
-- ============================================================================
-- First julebord session badge - everyone gets their first taste of holiday cheer
INSERT INTO "public"."badges" (
  "code",
  "title",
  "description",
  "category",
  "tier",
  "tier_order",
  "icon_url",
  "criteria",
  "is_active",
  "is_automatic",
  "points"
) VALUES (
  'juleglede',
  'Juleglede',
  'Deltok på din første julebord! Velkommen til julefeiringen! 🎄',
  'special',
  'bronze',
  1,
  NULL, -- Icon to be added later
  '{
    "type": "milestone",
    "conditions": [
      {
        "metric": "julebord_session_count",
        "operator": ">=",
        "value": 1,
        "timeframe": "all_time"
      }
    ],
    "requireAll": true
  }'::jsonb,
  true,
  true,
  50
);

-- ============================================================================
-- 2. NISSEHUE (Santa's Hat) - Silver Tier
-- ============================================================================
-- Attend 3+ julebord sessions - becoming a regular at holiday festivities
INSERT INTO "public"."badges" (
  "code",
  "title",
  "description",
  "category",
  "tier",
  "tier_order",
  "icon_url",
  "criteria",
  "is_active",
  "is_automatic",
  "points"
) VALUES (
  'nissehue',
  'Nissehue',
  'Deltatt på 3 julebord! Du er en ekte julefest-veteran! 🎅',
  'special',
  'silver',
  2,
  NULL, -- Icon to be added later
  '{
    "type": "milestone",
    "conditions": [
      {
        "metric": "julebord_session_count",
        "operator": ">=",
        "value": 3,
        "timeframe": "all_time"
      }
    ],
    "requireAll": true
  }'::jsonb,
  true,
  true,
  150
);

-- ============================================================================
-- 3. GLØGGMESTER (Mulled Wine Master) - Gold Tier
-- ============================================================================
-- Drink 5+ drinks in a single julebord session - true party spirit
INSERT INTO "public"."badges" (
  "code",
  "title",
  "description",
  "category",
  "tier",
  "tier_order",
  "icon_url",
  "criteria",
  "is_active",
  "is_automatic",
  "points"
) VALUES (
  'gloggmester',
  'Gløggmester',
  'Drakk 5+ drinker i et julebord! Skål for gløggmesteren! 🍷',
  'special',
  'gold',
  3,
  NULL, -- Icon to be added later
  '{
    "type": "threshold",
    "conditions": [
      {
        "metric": "session_drink_count",
        "operator": ">=",
        "value": 5,
        "timeframe": "session"
      },
      {
        "metric": "is_julebord_session",
        "operator": "==",
        "value": 1,
        "timeframe": "session"
      }
    ],
    "requireAll": true
  }'::jsonb,
  true,
  true,
  250
);

-- ============================================================================
-- 4. JULESTJERNE (Christmas Star) - Gold Tier
-- ============================================================================
-- Highest BAC in a julebord session - reaching for the stars
INSERT INTO "public"."badges" (
  "code",
  "title",
  "description",
  "category",
  "tier",
  "tier_order",
  "icon_url",
  "criteria",
  "is_active",
  "is_automatic",
  "points"
) VALUES (
  'julestjerne',
  'Julestjerne',
  'Hadde høyeste promille i et julebord! Du lyser som julestjernen! ⭐',
  'special',
  'gold',
  3,
  NULL, -- Icon to be added later
  '{
    "type": "threshold",
    "conditions": [
      {
        "metric": "max_bac_in_session",
        "operator": ">=",
        "value": 0.5,
        "timeframe": "session"
      },
      {
        "metric": "is_julebord_session",
        "operator": "==",
        "value": 1,
        "timeframe": "session"
      }
    ],
    "requireAll": true
  }'::jsonb,
  true,
  false,
  300
);

-- ============================================================================
-- 5. SNØMANN (Snowman) - Silver Tier
-- ============================================================================
-- Stay sober at a julebord (0 drinks or BAC < 0.2) - the designated guardian
INSERT INTO "public"."badges" (
  "code",
  "title",
  "description",
  "category",
  "tier",
  "tier_order",
  "icon_url",
  "criteria",
  "is_active",
  "is_automatic",
  "points"
) VALUES (
  'snowmann',
  'Snømann',
  'Holdt deg edru på et julebord! Kjempebra! ⛄',
  'special',
  'silver',
  2,
  NULL, -- Icon to be added later
  '{
    "type": "threshold",
    "conditions": [
      {
        "metric": "max_bac_in_session",
        "operator": "<=",
        "value": 0.2,
        "timeframe": "session"
      },
      {
        "metric": "is_julebord_session",
        "operator": "==",
        "value": 1,
        "timeframe": "session"
      }
    ],
    "requireAll": true
  }'::jsonb,
  true,
  true,
  100
);

-- ============================================================================
-- 6. JULENISSE (Christmas Elf) - Bronze Tier
-- ============================================================================
-- Create a julebord session - spreading holiday cheer as the organizer
INSERT INTO "public"."badges" (
  "code",
  "title",
  "description",
  "category",
  "tier",
  "tier_order",
  "icon_url",
  "criteria",
  "is_active",
  "is_automatic",
  "points"
) VALUES (
  'julenisse',
  'Julenisse',
  'Opprettet et julebord! Du er den som sprer juleglede! 🎁',
  'special',
  'bronze',
  1,
  NULL, -- Icon to be added later
  '{
    "type": "milestone",
    "conditions": [
      {
        "metric": "created_julebord_session",
        "operator": ">=",
        "value": 1,
        "timeframe": "all_time"
      }
    ],
    "requireAll": true
  }'::jsonb,
  true,
  false,
  75
);

-- ============================================================================
-- 7. PEPPERKAKE (Gingerbread) - Legendary Tier
-- ============================================================================
-- Admin-only honorary badge for exceptional Christmas spirit
-- Manually awarded by admins for outstanding julebord participation/behavior
INSERT INTO "public"."badges" (
  "code",
  "title",
  "description",
  "category",
  "tier",
  "tier_order",
  "icon_url",
  "criteria",
  "is_active",
  "is_automatic",
  "points"
) VALUES (
  'pepperkake',
  'Pepperkake',
  'Tildelt av admin for eksepsjonell julånd! Du er en ekte julelegende! 🍪',
  'special',
  'legendary',
  5,
  NULL, -- Icon to be added later
  '{
    "type": "milestone",
    "conditions": [
      {
        "metric": "admin_awarded",
        "operator": "==",
        "value": 1,
        "timeframe": "all_time"
      }
    ],
    "requireAll": true
  }'::jsonb,
  true,
  false,
  500
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "public"."badges" IS 'Badge definitions and metadata for the achievement system. Includes Christmas-themed badges for julebord sessions.';

-- Add helpful comments for the new Christmas badges
DO $$
BEGIN
  -- Note: Individual badge comments would go here if needed for documentation
  RAISE NOTICE 'Christmas badges added successfully!';
  RAISE NOTICE '7 badges created: Juleglede, Nissehue, Gløggmester, Julestjerne, Snømann, Julenisse, Pepperkake';
  RAISE NOTICE 'These badges require new metrics to be implemented in badgeMetrics.ts';
END $$;
