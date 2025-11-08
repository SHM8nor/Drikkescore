# Christmas Badge System - Implementation Guide

## Overview

This document provides a complete implementation guide for the Christmas badge collection for julebord (Christmas party) sessions in the Drikkescore app.

## Badge Collection

### 1. Juleglede (Christmas Joy) - Bronze

**Code:** `juleglede`
**Points:** 50
**Tier:** Bronze (1)
**Type:** Automatic
**Category:** Special

**Criteria:**
- Attend your first julebord session
- Metric: `julebord_session_count >= 1`

**Icon Suggestion:** 🎄 (Christmas tree emoji or SVG)

**Description:** "Deltok på din første julebord! Velkommen til julefeiringen! 🎄"

---

### 2. Nissehue (Santa's Hat) - Silver

**Code:** `nissehue`
**Points:** 150
**Tier:** Silver (2)
**Type:** Automatic
**Category:** Special

**Criteria:**
- Attend 3 or more julebord sessions
- Metric: `julebord_session_count >= 3`

**Icon Suggestion:** 🎅 (Santa emoji or red Santa hat SVG)

**Description:** "Deltatt på 3 julebord! Du er en ekte julefest-veteran! 🎅"

---

### 3. Gløggmester (Mulled Wine Master) - Gold

**Code:** `gloggmester`
**Points:** 250
**Tier:** Gold (3)
**Type:** Automatic
**Category:** Special

**Criteria:**
- Drink 5+ drinks in a single julebord session
- Metrics:
  - `session_drink_count >= 5`
  - `is_julebord_session == 1`

**Icon Suggestion:** 🍷 (Wine glass emoji or steaming gløgg mug SVG)

**Description:** "Drakk 5+ drinker i et julebord! Skål for gløggmesteren! 🍷"

---

### 4. Julestjerne (Christmas Star) - Gold

**Code:** `julestjerne`
**Points:** 300
**Tier:** Gold (3)
**Type:** Manual (requires admin verification or special logic)
**Category:** Special

**Criteria:**
- Achieve the highest BAC in a julebord session
- Metrics:
  - `max_bac_in_session >= 0.5`
  - `is_julebord_session == 1`

**Icon Suggestion:** ⭐ (Star emoji or golden Christmas star SVG)

**Description:** "Hadde høyeste promille i et julebord! Du lyser som julestjernen! ⭐"

**Note:** This badge requires leaderboard comparison logic to determine if user had the highest BAC in the session.

---

### 5. Snømann (Snowman) - Silver

**Code:** `snowmann`
**Points:** 100
**Tier:** Silver (2)
**Type:** Automatic
**Category:** Special

**Criteria:**
- Stay sober at a julebord (BAC ≤ 0.2‰)
- Metrics:
  - `max_bac_in_session <= 0.2`
  - `is_julebord_session == 1`

**Icon Suggestion:** ⛄ (Snowman emoji or snowman SVG)

**Description:** "Holdt deg edru på et julebord! Kjempebra! ⛄"

---

### 6. Julenisse (Christmas Elf) - Bronze

**Code:** `julenisse`
**Points:** 75
**Tier:** Bronze (1)
**Type:** Manual (triggered on session creation)
**Category:** Special

**Criteria:**
- Create a julebord session
- Metric: `created_julebord_session >= 1`

**Icon Suggestion:** 🎁 (Gift emoji or Christmas elf SVG)

**Description:** "Opprettet et julebord! Du er den som sprer juleglede! 🎁"

---

### 7. Pepperkake (Gingerbread) - Legendary

**Code:** `pepperkake`
**Points:** 500
**Tier:** Legendary (5)
**Type:** Manual (admin-only)
**Category:** Special

**Criteria:**
- Admin-awarded for exceptional Christmas spirit
- Metric: `admin_awarded == 1`

**Icon Suggestion:** 🍪 (Cookie emoji or gingerbread person SVG)

**Description:** "Tildelt av admin for eksepsjonell julånd! Du er en ekte julelegende! 🍪"

**Note:** This badge is exclusively awarded by admins through the admin panel for outstanding julebord participation or behavior.

---

## Implementation Steps

### Phase 1: Database Migration ✅

**File:** `supabase/migrations/20251108180000_add_christmas_badges.sql`

- [x] Created migration with all 7 Christmas badges
- [x] Set category to `special`
- [x] Defined JSONB criteria for each badge
- [x] Set appropriate tier levels and points

**To Deploy:**
```bash
# Apply migration to Supabase
supabase db push
# OR via Supabase Dashboard: Database → Migrations → Run migration
```

### Phase 2: New Metric Implementations

**File to modify:** `src/utils/badgeMetrics.ts`

Add the following new metric extraction functions:

#### 2.1 Julebord Session Count

```typescript
/**
 * Get total number of julebord sessions user has participated in
 *
 * @param supabase Supabase client instance
 * @param userId User ID to query
 * @returns Total julebord session count, or 0 on error
 */
export async function getJulebordSessionCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { data: sessions, error } = await supabase
      .from('session_participants')
      .select('session_id, sessions!inner(session_type)')
      .eq('user_id', userId)
      .eq('sessions.session_type', 'julebord');

    if (error) {
      console.error('[getJulebordSessionCount] Error querying sessions:', error);
      return 0;
    }

    return sessions?.length ?? 0;
  } catch (error) {
    console.error('[getJulebordSessionCount] Unexpected error:', error);
    return 0;
  }
}
```

#### 2.2 Is Julebord Session Check

```typescript
/**
 * Check if a specific session is a julebord session
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to check
 * @returns 1 if julebord, 0 if not or error
 */
export async function getIsJulebordSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('session_type')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('[getIsJulebordSession] Error querying session:', error);
      return 0;
    }

    return session?.session_type === 'julebord' ? 1 : 0;
  } catch (error) {
    console.error('[getIsJulebordSession] Unexpected error:', error);
    return 0;
  }
}
```

#### 2.3 Created Julebord Session Count

```typescript
/**
 * Get number of julebord sessions created by user
 *
 * @param supabase Supabase client instance
 * @param userId User ID to query
 * @returns Number of julebord sessions created, or 0 on error
 */
export async function getCreatedJulebordSessionCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .eq('session_type', 'julebord');

    if (error) {
      console.error('[getCreatedJulebordSessionCount] Error querying sessions:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('[getCreatedJulebordSessionCount] Unexpected error:', error);
    return 0;
  }
}
```

### Phase 3: Badge Checker Integration

**File to modify:** `src/utils/badgeChecker.ts`

Update the `checkBadgeEligibility` function to handle new metrics:

```typescript
// In the switch statement inside checkBadgeEligibility, add:

case 'julebord_session_count':
  value = await getJulebordSessionCount(supabase, userId);
  break;

case 'is_julebord_session':
  if (sessionId) {
    value = await getIsJulebordSession(supabase, sessionId);
  } else {
    console.warn('[checkBadgeEligibility] is_julebord_session requires sessionId');
  }
  break;

case 'created_julebord_session':
  value = await getCreatedJulebordSessionCount(supabase, userId);
  break;

case 'admin_awarded':
  // This metric is only for manual admin awards, always 0 for automatic checks
  value = 0;
  break;
```

### Phase 4: Badge Awarding Triggers

**File to modify:** `src/hooks/useBadgeAwarding.ts`

Update the `checkAndAward` function to handle `special` category badges:

```typescript
// In the context filtering section, add special category handling:

if (context === 'drink_added') {
  // On drink_added: Check milestone, global, and special badges
  automaticBadges = automaticBadges.filter(
    badge => badge.category === 'milestone' ||
             badge.category === 'global' ||
             badge.category === 'special'
  );
  console.debug('[BadgeAwarding] Context: drink_added - checking milestone/global/special badges');
} else if (context === 'session_ended') {
  // On session_ended: Check session, social, and special badges
  automaticBadges = automaticBadges.filter(
    badge => badge.category === 'session' ||
             badge.category === 'social' ||
             badge.category === 'special'
  );
  console.debug('[BadgeAwarding] Context: session_ended - checking session/social/special badges');
}
```

### Phase 5: Session Creation Hook

**Files to check/modify:**
- Where sessions are created (likely in session creation API/hooks)

Add badge awarding trigger when a julebord session is created:

```typescript
// After successful julebord session creation:
if (sessionType === 'julebord') {
  // Trigger badge check for "Julenisse" badge
  checkAndAward('session_ended', newSessionId);
}
```

### Phase 6: Julestjerne Special Logic

The "Julestjerne" badge requires determining if a user had the highest BAC in a session. This needs special logic:

**Implementation approach:**

Option A: Add to session end handler
```typescript
// When session ends, check leaderboard
async function awardJulestjerneIfEligible(sessionId: string) {
  const { data: session } = await supabase
    .from('sessions')
    .select('session_type')
    .eq('id', sessionId)
    .single();

  if (session?.session_type !== 'julebord') return;

  // Get leaderboard
  const leaderboard = await getSessionLeaderboard(sessionId);

  if (leaderboard && leaderboard.length > 0) {
    const winner = leaderboard[0]; // Highest BAC

    if (winner.bac >= 0.5) {
      // Award Julestjerne to the winner
      await awardBadge(winner.user_id, 'julestjerne', sessionId);
    }
  }
}
```

Option B: Make it fully manual and let admins award it

### Phase 7: Badge Icons

**Icon Format:**
- SVG files (recommended) or high-quality PNG
- Size: 128x128px minimum
- Transparent background
- Christmas color palette: Red (#C41E3A), Green (#165B33), Gold (#FFD700), White

**Storage Location:** Supabase Storage bucket `badge-icons`

**Suggested Icon Designs:**

1. **Juleglede** (🎄): Stylized Christmas tree with presents
2. **Nissehue** (🎅): Red Santa hat with white trim
3. **Gløggmester** (🍷): Steaming mug of gløgg with cinnamon stick
4. **Julestjerne** (⭐): Golden star with sparkles
5. **Snømann** (⛄): Friendly snowman with scarf
6. **Julenisse** (🎁): Wrapped gift with bow
7. **Pepperkake** (🍪): Gingerbread person with icing

**Upload Process:**
1. Create/design icons
2. Upload to Supabase Storage: `badge-icons/christmas/`
3. Update badge records with URLs:

```sql
UPDATE badges SET icon_url = 'https://[your-supabase-url]/storage/v1/object/public/badge-icons/christmas/juleglede.svg' WHERE code = 'juleglede';
UPDATE badges SET icon_url = 'https://[your-supabase-url]/storage/v1/object/public/badge-icons/christmas/nissehue.svg' WHERE code = 'nissehue';
-- etc...
```

### Phase 8: TypeScript Types

**File to modify:** `src/types/database.ts`

Update the Session interface to include session_type:

```typescript
export interface Session {
  id: string;
  session_code: string;
  session_name: string;
  created_by: string;
  start_time: string;
  end_time: string;
  session_type: 'standard' | 'julebord'; // Add this
  created_at: string;
  updated_at: string;
}
```

### Phase 9: Testing

**Test Cases:**

1. **Juleglede Badge:**
   - Create a julebord session
   - Join as a user
   - Verify badge awarded after first julebord participation

2. **Nissehue Badge:**
   - Participate in 3 different julebord sessions
   - Verify badge awarded after third session

3. **Gløggmester Badge:**
   - Join julebord session
   - Add 5+ drinks
   - Verify badge awarded

4. **Snømann Badge:**
   - Join julebord session
   - Add 0 drinks or drinks resulting in BAC ≤ 0.2
   - Verify badge awarded at session end

5. **Julenisse Badge:**
   - Create a julebord session
   - Verify badge awarded to creator

6. **Pepperkake Badge:**
   - Admin manually awards through admin panel
   - Verify badge appears in user's collection

7. **Julestjerne Badge:**
   - Multiple users in julebord session
   - One user achieves highest BAC (≥ 0.5)
   - Verify badge awarded to highest BAC user

### Phase 10: UI Considerations

**Badge Display:**
- Christmas badges should be filterable by category: "Special"
- Consider adding a seasonal "Christmas" filter in BadgeFilter component
- Badge cards should work with existing BadgeCard component
- Progress tracking works automatically via existing BadgeProgress component

**Potential UI Enhancements:**
- Add Christmas theme indicator on badges page when julebord session active
- Show "Christmas Collection" section during julebord season
- Festive animations when Christmas badges are earned

---

## Award Logic Summary

### Automatic Badges (7 total, 5 automatic)

| Badge | Trigger Context | Timing |
|-------|----------------|--------|
| Juleglede | `session_ended` | After participating in first julebord |
| Nissehue | `session_ended` | After participating in 3rd julebord |
| Gløggmester | `drink_added` or `session_ended` | When 5th drink logged in julebord |
| Snømann | `session_ended` | At end of julebord with low BAC |

### Manual/Special Logic Badges (2 total)

| Badge | Award Method | Notes |
|-------|-------------|-------|
| Julenisse | Session creation hook | Award when user creates julebord session |
| Julestjerne | Session end comparison | Award to highest BAC in julebord (requires leaderboard comparison) |
| Pepperkake | Admin panel | Manual award only |

---

## Integration Points

### Required Code Locations

1. **Metric Functions:** `src/utils/badgeMetrics.ts`
   - Add 3 new metric functions

2. **Badge Checker:** `src/utils/badgeChecker.ts`
   - Add 4 new metric cases in switch statement

3. **Badge Awarding:** `src/hooks/useBadgeAwarding.ts`
   - Update category filtering to include `special`

4. **Session Creation:** Find where sessions are created
   - Add Julenisse badge trigger

5. **Session End Logic:** Find session end handler
   - Add Julestjerne special logic (leaderboard comparison)

---

## Database Schema Notes

### Session Type Field

Already implemented in migration `20251108170939_add_session_type.sql`:
- Column: `sessions.session_type`
- Type: `VARCHAR(50)`
- Constraint: `CHECK (session_type IN ('standard', 'julebord'))`
- Default: `'standard'`
- Indexed for performance

### Badge Criteria JSONB Structure

All Christmas badges follow the established criteria schema:

```typescript
interface BadgeCriteria {
  type: 'threshold' | 'milestone' | 'streak' | 'combination';
  conditions: BadgeCondition[];
  requireAll?: boolean; // Default: true
}

interface BadgeCondition {
  metric: string;
  operator: '>=' | '==' | '<=' | '>' | '<' | 'between';
  value: number | [number, number];
  timeframe?: 'session' | 'all_time' | '30_days' | '7_days' | '24_hours';
}
```

---

## Deployment Checklist

- [ ] Run migration `20251108180000_add_christmas_badges.sql`
- [ ] Implement 3 new metric functions in `badgeMetrics.ts`
- [ ] Update `badgeChecker.ts` with new metric cases
- [ ] Update `useBadgeAwarding.ts` to handle `special` category
- [ ] Add Julenisse award trigger on session creation
- [ ] Implement Julestjerne leaderboard comparison logic
- [ ] Update `Session` TypeScript interface
- [ ] Create/upload badge icons to Supabase Storage
- [ ] Update badge records with icon URLs
- [ ] Test all 7 badges in development
- [ ] Document badge system for users (in-app help/FAQ)
- [ ] Deploy to production

---

## Norwegian Language Reference

| English | Norwegian |
|---------|-----------|
| Christmas party | Julebord |
| Christmas joy | Juleglede |
| Santa's hat | Nissehue |
| Mulled wine master | Gløggmester |
| Christmas star | Julestjerne |
| Snowman | Snømann |
| Christmas elf | Julenisse |
| Gingerbread | Pepperkake |
| Exceptional Christmas spirit | Eksepsjonell julånd |

---

## Future Enhancements

1. **Seasonal Activation:**
   - Automatically activate Christmas badges during December
   - Deactivate in January (set `is_active = false`)

2. **Leaderboard Integration:**
   - Christmas-specific leaderboards
   - Season rankings

3. **Additional Badges:**
   - "Juleslask" - Most sessions in December
   - "Ribbe og smalahove" - Food-related achievements
   - "Juledrink-kjenner" - Variety of drinks in julebord

4. **Badge Collections:**
   - "Complete Christmas Collection" meta-badge
   - Seasonal badge showcase

---

## Support & Troubleshooting

### Common Issues

**Issue:** Badges not being awarded automatically
**Solution:** Check that `is_automatic = true` and category filtering includes `special`

**Issue:** Julebord session count always 0
**Solution:** Verify `session_type` is properly set to `'julebord'` when creating sessions

**Issue:** Icons not displaying
**Solution:** Check icon_url is valid Supabase Storage public URL

**Issue:** Julestjerne awarded to wrong user
**Solution:** Verify leaderboard sorting is by BAC descending

---

## Credits

Badge system designed for Norwegian julebord (Christmas party) culture. Emojis used as temporary icons until custom SVG icons are created.

**Design Philosophy:** Celebrate Norwegian Christmas traditions while maintaining the app's core BAC tracking and social features.
