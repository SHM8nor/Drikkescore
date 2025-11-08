# Badge Timing and Award Logic

This document explains WHEN badges are checked and awarded in the Drikkescore app.

## Overview

Badges are automatically checked at two critical moments:

1. **On Drink Added** (`drink_added` context)
2. **On Session Ended** (`session_ended` context)

Each context checks different badge categories to ensure accurate evaluation.

## Award Timing by Category

### ⏱️ When Badges Are Checked

| Badge Category | Checked On Drink Added | Checked On Session End | Reason |
|----------------|----------------------|----------------------|---------|
| **milestone** | ✅ Yes | ❌ No | Can be earned immediately when threshold is reached |
| **global** | ✅ Yes | ❌ No | Based on all-time stats, can be checked anytime |
| **session** | ❌ No | ✅ Yes | Requires complete session data for accurate evaluation |
| **social** | ❌ No | ✅ Yes | Often depends on full session participation data |

## Detailed Timing Logic

### 🎯 Milestone Badges (drink_added)

**When**: Checked immediately after each drink is added
**Why**: These are simple threshold checks that can be evaluated in real-time

**Examples:**
- "Første Drink" - Triggers when `total_drinks >= 1`
  - Checked after first drink is saved
  - Awarded immediately

**Flow:**
```
User adds drink →
  Database saves drink →
    checkAndAward('drink_added', sessionId) →
      Filters to milestone/global badges →
        Checks "Første Drink" criteria →
          total_drinks = 1, threshold = 1 →
            ✅ ELIGIBLE → Awards badge
```

---

### 🌍 Global Badges (drink_added)

**When**: Checked after each drink is added
**Why**: Based on cumulative all-time statistics

**Examples:**
- "Veteran" - Requires `session_count >= 10`
  - Checked after drink in 10th session
  - Awarded when threshold is met

**Why Not Session End?**
Global badges don't depend on session-specific data, so they can be checked anytime. Checking on drink_added provides immediate gratification.

---

### 🏆 Session Badges (session_ended) ⚠️ CRITICAL

**When**: Checked ONLY when session ends (transitions to history)
**Why**: Require complete session data to evaluate accurately

**Examples:**
- "Øktkongen" - Requires `max_bac_in_session >= 0.08`
  - ❌ **NOT** checked while session is active
  - ✅ **ONLY** checked when session ends
  - BAC continues to change during session
  - Final maximum can only be determined after session ends

**Flow:**
```
Session ends (end_time passes) →
  Session appears in history →
    useSessionHistory hook detects new completed session →
      checkAndAward('session_ended', sessionId) →
        Filters to session/social badges →
          Checks "Øktkongen" criteria →
            Calculates max_bac_in_session across entire session →
              Compares to threshold (0.08) →
                If eligible → Awards badge
```

**Why This Matters:**
If checked during session:
- ❌ BAC is still changing (drinks being added, time passing)
- ❌ Max BAC might not be reached yet
- ❌ User might get badge too early at 0.01 BAC
- ❌ Criteria evaluation is inaccurate

If checked at session end:
- ✅ All drinks are recorded
- ✅ BAC curve is complete
- ✅ True maximum BAC is calculated
- ✅ Accurate evaluation against threshold

---

### 👥 Social Badges (session_ended)

**When**: Checked when session ends
**Why**: Participation can change throughout session

**Examples:**
- "Sosial Sommerfugl" - Requires `unique_friends_in_session >= 5`
  - Friends can join session late
  - Need final participant list to count accurately
  - Checked at session end

---

## Implementation Details

### Code: `useBadgeAwarding.ts`

```typescript
const checkAndAward = async (
  context: 'drink_added' | 'session_ended',
  sessionId?: string
) => {
  // Filter automatic badges by category based on context
  if (context === 'drink_added') {
    // Only milestone and global badges
    automaticBadges = automaticBadges.filter(
      badge => badge.category === 'milestone' || badge.category === 'global'
    );
  } else if (context === 'session_ended') {
    // Only session and social badges
    automaticBadges = automaticBadges.filter(
      badge => badge.category === 'session' || badge.category === 'social'
    );
  }

  // Check and award eligible badges...
};
```

### Trigger Points

**1. Drink Added** (`src/hooks/useSession.ts`)
```typescript
addDrinkMutation.mutate(payload, {
  onSuccess: () => {
    // Fire and forget
    checkAndAward('drink_added', sessionId);
  }
});
```

**2. Session Ended** (`src/hooks/useSessionHistory.ts`)
```typescript
useEffect(() => {
  if (!query.data) return;

  query.data.forEach((session) => {
    if (!checkedSessionsRef.current.has(session.id)) {
      checkedSessionsRef.current.add(session.id);

      // Fire and forget
      checkAndAward('session_ended', session.id);
    }
  });
}, [query.data]);
```

---

## Common Issues and Fixes

### ❌ Issue: Session Badge Awarded Too Early

**Symptom**: "Øktkongen" awarded on first drink with 0.01 BAC

**Cause**: Badge was being checked on `drink_added` context

**Fix**: Filter badges by category - session badges only checked at session end

**Before:**
```typescript
// Checked ALL automatic badges on drink_added
checkAndAward('drink_added', sessionId);
// → Checks milestone, global, session, social (WRONG!)
```

**After:**
```typescript
// Only checks milestone and global on drink_added
checkAndAward('drink_added', sessionId);
// → Checks milestone, global only (CORRECT!)

// Session badges checked when session ends
checkAndAward('session_ended', sessionId);
// → Checks session, social only (CORRECT!)
```

---

### ❌ Issue: Badge Awarded Despite Not Meeting Threshold

**Symptom**: Badge awarded at 0.01 BAC when threshold is 0.08

**Possible Causes:**
1. **Wrong metric being calculated**
   - Check debug logs for actual metric value
   - Ensure correct metric name in criteria

2. **Timing issue**
   - Session badge checked during active session
   - BAC not fully calculated yet

3. **Criteria misconfiguration**
   - Wrong operator (using `<=` instead of `>=`)
   - Wrong threshold value in database

**Debug Steps:**
1. Check browser console for debug logs:
   ```
   [checkBadgeEligibility] session_king: max_bac_in_session = 0.0100
   [checkBadgeEligibility] session_king: eligible=false
   ```

2. Verify badge criteria in database:
   ```sql
   SELECT code, criteria FROM badges WHERE code = 'session_king';
   ```

3. Check when badge was awarded:
   ```sql
   SELECT earned_at, session_id, metadata
   FROM user_badges
   WHERE badge_id = (SELECT id FROM badges WHERE code = 'session_king');
   ```

---

## Testing Checklist

When testing badge awarding:

- [ ] **Milestone badges**: Award immediately when threshold is met
  - Add first drink → "Første Drink" badge awarded instantly

- [ ] **Global badges**: Award when all-time stats reach threshold
  - Complete 10th session → "Veteran" badge awarded

- [ ] **Session badges**: Award ONLY after session ends
  - Add drinks during session → No "Øktkongen" yet
  - End session (wait for end_time to pass) → View history
  - If max BAC >= 0.08 → "Øktkongen" awarded now

- [ ] **No duplicates**: Same badge not awarded twice
  - Add drink in new session → "Første Drink" not awarded again

---

## Best Practices for New Badges

When creating new badges:

1. **Choose correct category**:
   - Milestone: One-time achievements
   - Global: Cumulative all-time stats
   - Session: Performance within single session
   - Social: Friend/participation based

2. **Set timeframe to match category**:
   - Milestone/Global: `timeframe: 'all_time'`
   - Session/Social: `timeframe: 'session'`

3. **Use appropriate metrics**:
   - Session badges: Use metrics ending in `_in_session`
   - Global badges: Use metrics like `total_*`, `session_count`

4. **Test both contexts**:
   - Verify badge NOT awarded prematurely
   - Verify badge IS awarded at correct time

---

## Migration Applied

**File**: `src/hooks/useBadgeAwarding.ts`

**Changes**:
- Added category filtering based on context
- `drink_added` → milestone + global only
- `session_ended` → session + social only
- Added debug logging for context and filtered badge count

**Result**: Session badges now only checked at session end! ✅
