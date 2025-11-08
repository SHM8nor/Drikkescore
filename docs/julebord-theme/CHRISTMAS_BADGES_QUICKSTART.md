# Christmas Badge System - Quick Start Guide

## Overview

7 Christmas-themed badges for julebord (Norwegian Christmas party) sessions:

| Badge | Tier | Points | Type | Criteria |
|-------|------|--------|------|----------|
| 🎄 Juleglede | Bronze | 50 | Auto | First julebord session |
| 🎅 Nissehue | Silver | 150 | Auto | 3+ julebord sessions |
| 🍷 Gløggmester | Gold | 250 | Auto | 5+ drinks in julebord |
| ⭐ Julestjerne | Gold | 300 | Manual | Highest BAC in julebord |
| ⛄ Snømann | Silver | 100 | Auto | Low BAC in julebord |
| 🎁 Julenisse | Bronze | 75 | Manual | Created julebord session |
| 🍪 Pepperkake | Legendary | 500 | Admin | Admin-only award |

## Files Created

1. **Migration:** `supabase/migrations/20251108180000_add_christmas_badges.sql`
   - Inserts 7 badge definitions into database
   - Ready to deploy

2. **Implementation Guide:** `CHRISTMAS_BADGES_IMPLEMENTATION.md`
   - Complete step-by-step implementation
   - 350+ lines of detailed documentation
   - Code examples for all integration points

3. **Metric Functions:** `src/utils/badgeMetrics.julebord.ts`
   - 4 new metric extraction functions
   - Ready to merge into `badgeMetrics.ts`
   - Includes integration instructions

4. **Icon Designs:** `badge-icons-svg-examples.md`
   - 7 custom SVG icons
   - Norwegian Christmas theme
   - Upload instructions included

## Deployment Steps (5-Step Quick Deploy)

### Step 1: Deploy Database Migration
```bash
# Navigate to project directory
cd C:\Users\Felles\Documents\Projects\Drikkescore

# Apply migration via Supabase CLI
supabase db push

# OR manually via Supabase Dashboard:
# Dashboard → Database → Migrations → Paste SQL from migration file
```

### Step 2: Add Metric Functions

Copy functions from `src/utils/badgeMetrics.julebord.ts` into `src/utils/badgeMetrics.ts`:

```typescript
// Add these 3 exports to badgeMetrics.ts:
export async function getJulebordSessionCount(supabase: SupabaseClient, userId: string): Promise<number> { ... }
export async function getIsJulebordSession(supabase: SupabaseClient, sessionId: string): Promise<number> { ... }
export async function getCreatedJulebordSessionCount(supabase: SupabaseClient, userId: string): Promise<number> { ... }
```

### Step 3: Update Badge Checker

Edit `src/utils/badgeChecker.ts` - Add these cases in the switch statement (line ~197):

```typescript
case 'julebord_session_count':
  value = await getJulebordSessionCount(supabase, userId);
  break;

case 'is_julebord_session':
  if (sessionId) {
    value = await getIsJulebordSession(supabase, sessionId);
  }
  break;

case 'created_julebord_session':
  value = await getCreatedJulebordSessionCount(supabase, userId);
  break;

case 'admin_awarded':
  value = 0; // Always 0 for automatic checks
  break;
```

### Step 4: Enable Special Category

Edit `src/hooks/useBadgeAwarding.ts` - Update category filters (lines ~56-70):

```typescript
if (context === 'drink_added') {
  automaticBadges = automaticBadges.filter(
    badge => badge.category === 'milestone' ||
             badge.category === 'global' ||
             badge.category === 'special'  // ADD THIS
  );
} else if (context === 'session_ended') {
  automaticBadges = automaticBadges.filter(
    badge => badge.category === 'session' ||
             badge.category === 'social' ||
             badge.category === 'special'  // ADD THIS
  );
}
```

### Step 5: Add Icons (Optional)

Upload SVG icons from `badge-icons-svg-examples.md` to Supabase Storage, then update URLs:

```sql
UPDATE badges SET icon_url = '[your-storage-url]/christmas/juleglede.svg' WHERE code = 'juleglede';
-- Repeat for all 7 badges
```

**OR leave as NULL to use default tier icons.**

## Testing Your Implementation

### Test 1: Juleglede Badge
1. Create a new session with `session_type = 'julebord'`
2. Join as a test user
3. Wait for session to end or trigger `checkAndAward('session_ended', sessionId)`
4. Verify badge appears in user's collection

### Test 2: Gløggmester Badge
1. Join a julebord session
2. Add 5 drinks
3. Badge should auto-award after 5th drink

### Test 3: Snømann Badge
1. Join a julebord session
2. Add 0 drinks or drinks with low alcohol
3. End session
4. Verify badge awarded if BAC ≤ 0.2

## Common Issues & Fixes

**Issue:** Badges not appearing
**Fix:** Verify migration ran successfully, check `badges` table has 7 new rows with category `'special'`

**Issue:** Badges not auto-awarding
**Fix:** Check category filter includes `'special'` in `useBadgeAwarding.ts`

**Issue:** "Unknown metric" errors in console
**Fix:** Ensure new metric functions added to `badgeMetrics.ts` and cases added to `badgeChecker.ts`

**Issue:** Session type not recognized
**Fix:** Verify `sessions` table has `session_type` column (migration `20251108170939_add_session_type.sql` should exist)

## Advanced Features (Optional)

### Award Julestjerne on Session End

Add this to your session end handler:

```typescript
async function onSessionEnd(sessionId: string) {
  const { data: session } = await supabase
    .from('sessions')
    .select('session_type')
    .eq('id', sessionId)
    .single();

  if (session?.session_type === 'julebord') {
    // Award regular session badges
    await checkAndAward('session_ended', sessionId);

    // Award Julestjerne to highest BAC user
    await awardJulestjerneBadge(sessionId);
  }
}
```

### Award Julenisse on Session Creation

Add this to your session creation logic:

```typescript
const createSession = async (formData) => {
  const newSession = await supabase
    .from('sessions')
    .insert({
      session_name: formData.session_name,
      session_type: formData.session_type, // 'julebord'
      // ... other fields
    })
    .select()
    .single();

  // If julebord session, award creator badge
  if (newSession.session_type === 'julebord') {
    await supabase.rpc('award_badge', {
      p_user_id: userId,
      p_badge_code: 'julenisse',
      p_session_id: newSession.id
    });
  }

  return newSession;
};
```

## Validation Checklist

- [ ] Migration deployed successfully
- [ ] 7 badges visible in admin panel
- [ ] Badges have category `'special'`
- [ ] New metric functions added to `badgeMetrics.ts`
- [ ] Badge checker updated with new metric cases
- [ ] Special category included in badge awarding filters
- [ ] Test user earns Juleglede badge
- [ ] Test user earns Gløggmester badge (5+ drinks)
- [ ] Icons uploaded and URLs updated (optional)
- [ ] No console errors when checking badges

## Performance Notes

- **Badge checking runs after every drink:** Minimal performance impact (special category filtered appropriately)
- **Session end check:** Includes leaderboard calculation for Julestjerne (only for julebord sessions)
- **Database queries:** All metrics use indexed columns (`session_type` indexed in migration)

## Support

For detailed implementation instructions, see:
- `CHRISTMAS_BADGES_IMPLEMENTATION.md` - Full guide (10 phases)
- `badge-icons-svg-examples.md` - Icon designs and upload instructions
- `src/utils/badgeMetrics.julebord.ts` - Metric function implementations

## Next Steps

1. Deploy migration ✅
2. Add metric functions (10 min)
3. Update badge checker (5 min)
4. Enable special category (2 min)
5. Test in development
6. Upload icons (optional)
7. Deploy to production

**Estimated total implementation time: 30-45 minutes**

---

## Badge Summary Table

| Code | Norwegian | English | Auto | Category | Trigger |
|------|-----------|---------|------|----------|---------|
| `juleglede` | Juleglede | Christmas Joy | ✓ | special | First julebord |
| `nissehue` | Nissehue | Santa's Hat | ✓ | special | 3 julebordsessions |
| `gloggmester` | Gløggmester | Mulled Wine Master | ✓ | special | 5+ drinks in julebord |
| `julestjerne` | Julestjerne | Christmas Star | ✗ | special | Highest BAC (manual logic) |
| `snowmann` | Snømann | Snowman | ✓ | special | Low BAC in julebord |
| `julenisse` | Julenisse | Christmas Elf | ✗ | special | Create julebord (manual hook) |
| `pepperkake` | Pepperkake | Gingerbread | ✗ | special | Admin award only |

**Auto:** Automatic badge awarding via badge checker
**Manual:** Requires custom logic or admin intervention

---

## Final Notes

- All badges use Norwegian language for title/description
- Criteria stored as JSONB in database
- Icons can be emojis initially, upgrade to SVG later
- Special category ensures badges only appear for julebord sessions
- Admin can manually award Pepperkake via admin panel

**Ready to implement? Start with Step 1!**
