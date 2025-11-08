# Christmas Badge System - Technical Architecture

## System Overview

This document describes the technical architecture of the Christmas badge system integration into the Drikkescore app.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Create   │  │  Join    │  │   Add    │  │   End    │        │
│  │Julebord  │  │Julebord  │  │  Drink   │  │ Session  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TRIGGER POINTS                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │onCreate  │  │onJoin    │  │onDrink   │  │onEnd     │        │
│  │Handler   │  │Handler   │  │Handler   │  │Handler   │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        │ Julenisse   │             │Gløggmester  │ All session
        │ award       │             │check        │ badges
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│              useCheckAndAwardBadges Hook                          │
│  ┌────────────────────────────────────────────────────┐          │
│  │  checkAndAward(context, sessionId?)                │          │
│  │                                                     │          │
│  │  Contexts: 'drink_added' | 'session_ended'        │          │
│  │                                                     │          │
│  │  Filters: milestone, global, special (drink)      │          │
│  │           session, social, special (end)           │          │
│  └────┬───────────────────────────────────────────────┘          │
└────────┼──────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Badge Evaluation Pipeline                            │
│  ┌────────────────────────────────────────────────────┐          │
│  │ 1. Fetch active 'special' category badges          │          │
│  │ 2. Call checkMultipleBadges()                      │          │
│  │ 3. For each badge:                                 │          │
│  │    - Extract required metrics                      │          │
│  │    - Evaluate criteria conditions                  │          │
│  │    - Return eligibility + metadata                 │          │
│  └────┬───────────────────────────────────────────────┘          │
└────────┼──────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Metric Extraction Layer                          │
│  ┌────────────────────────────────────────────────────┐          │
│  │ badgeMetrics.ts - Metric Functions:                │          │
│  │                                                     │          │
│  │ ┌─────────────────────────────────────┐            │          │
│  │ │ Existing Metrics:                   │            │          │
│  │ │ • getTotalDrinks()                  │            │          │
│  │ │ • getSessionCount()                 │            │          │
│  │ │ • getSessionDrinkCount()            │            │          │
│  │ │ • getMaxBACInSession()              │            │          │
│  │ │ • getUniqueFriendsInSession()       │            │          │
│  │ │ • getTotalVolume()                  │            │          │
│  │ │ • getFriendCount()                  │            │          │
│  │ └─────────────────────────────────────┘            │          │
│  │                                                     │          │
│  │ ┌─────────────────────────────────────┐            │          │
│  │ │ NEW Christmas Metrics:              │            │          │
│  │ │ • getJulebordSessionCount()     🎄  │            │          │
│  │ │ • getIsJulebordSession()        🎄  │            │          │
│  │ │ • getCreatedJulebordSessionCount() 🎄│           │          │
│  │ └─────────────────────────────────────┘            │          │
│  └────┬───────────────────────────────────────────────┘          │
└────────┼──────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer                                 │
│  ┌────────────────────────────────────────────────────┐          │
│  │  Supabase PostgreSQL Tables:                       │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────┐              │          │
│  │  │ sessions                         │              │          │
│  │  │ ├─ id                            │              │          │
│  │  │ ├─ session_type (NEW) 🎄        │              │          │
│  │  │ ├─ session_name                  │              │          │
│  │  │ ├─ created_by                    │              │          │
│  │  │ └─ ...                           │              │          │
│  │  └──────────────────────────────────┘              │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────┐              │          │
│  │  │ badges                           │              │          │
│  │  │ ├─ id                            │              │          │
│  │  │ ├─ code (e.g., 'juleglede')     │              │          │
│  │  │ ├─ category ('special') 🎄      │              │          │
│  │  │ ├─ criteria (JSONB)              │              │          │
│  │  │ └─ ...                           │              │          │
│  │  └──────────────────────────────────┘              │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────┐              │          │
│  │  │ user_badges                      │              │          │
│  │  │ ├─ user_id                       │              │          │
│  │  │ ├─ badge_id                      │              │          │
│  │  │ ├─ session_id                    │              │          │
│  │  │ ├─ earned_at                     │              │          │
│  │  │ └─ metadata (JSONB)              │              │          │
│  │  └──────────────────────────────────┘              │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────┐              │          │
│  │  │ session_participants             │              │          │
│  │  │ ├─ user_id                       │              │          │
│  │  │ ├─ session_id                    │              │          │
│  │  │ └─ joined_at                     │              │          │
│  │  └──────────────────────────────────┘              │          │
│  │                                                     │          │
│  │  ┌──────────────────────────────────┐              │          │
│  │  │ drink_entries                    │              │          │
│  │  │ ├─ user_id                       │              │          │
│  │  │ ├─ session_id                    │              │          │
│  │  │ ├─ volume_ml                     │              │          │
│  │  │ └─ ...                           │              │          │
│  │  └──────────────────────────────────┘              │          │
│  └────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Flow 1: Automatic Badge Award (Gløggmester - 5+ drinks)

```
User adds 5th drink in julebord session
    │
    ▼
onDrinkAdded handler triggered
    │
    ▼
checkAndAward('drink_added', sessionId)
    │
    ▼
Filter badges: category IN ('milestone', 'global', 'special')
    │
    ▼
Get badge 'gloggmester' with criteria:
    {
      conditions: [
        { metric: 'session_drink_count', operator: '>=', value: 5 },
        { metric: 'is_julebord_session', operator: '==', value: 1 }
      ],
      requireAll: true
    }
    │
    ▼
Extract metrics:
    - getSessionDrinkCount(sessionId, userId) → 5
    - getIsJulebordSession(sessionId) → 1
    │
    ▼
Evaluate conditions:
    - 5 >= 5 → TRUE
    - 1 == 1 → TRUE
    - requireAll=true → ELIGIBLE
    │
    ▼
Call award_badge(userId, 'gloggmester', sessionId)
    │
    ▼
Insert into user_badges table
    │
    ▼
Invalidate React Query cache
    │
    ▼
BadgeNotification shown to user
```

### Flow 2: Session-End Badge Award (Juleglede - First julebord)

```
Session ends
    │
    ▼
onSessionEnd handler
    │
    ▼
checkAndAward('session_ended', sessionId)
    │
    ▼
Filter badges: category IN ('session', 'social', 'special')
    │
    ▼
Get badge 'juleglede' with criteria:
    {
      conditions: [
        { metric: 'julebord_session_count', operator: '>=', value: 1 }
      ]
    }
    │
    ▼
Extract metrics:
    - getJulebordSessionCount(userId) → 1
    │
    ▼
Evaluate condition:
    - 1 >= 1 → TRUE → ELIGIBLE
    │
    ▼
Award badge 'juleglede'
    │
    ▼
User celebrates their first julebord! 🎄
```

### Flow 3: Manual Badge Award (Julenisse - Created julebord)

```
User creates julebord session
    │
    ▼
createSession({ session_type: 'julebord', ... })
    │
    ▼
Session inserted into database
    │
    ▼
Custom trigger: if (session_type === 'julebord')
    │
    ▼
Call award_badge RPC:
    supabase.rpc('award_badge', {
      p_user_id: userId,
      p_badge_code: 'julenisse',
      p_session_id: sessionId
    })
    │
    ▼
Database function validates badge exists
    │
    ▼
Check for duplicate (unique constraint on user+badge+session)
    │
    ▼
Insert into user_badges
    │
    ▼
Return user_badge_id
    │
    ▼
Badge appears in user's collection
```

## Component Integration Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Component Tree                         │
└─────────────────────────────────────────────────────────────────┘

App.tsx
 │
 ├─ ProtectedLayout
 │   │
 │   ├─ BurgerMenu
 │   │   └─ Link to /badges
 │   │
 │   └─ Routes
 │       ├─ HomePage
 │       ├─ SessionPage
 │       │   ├─ AddDrinkForm
 │       │   │   └─ onSubmit → checkAndAward('drink_added')
 │       │   │
 │       │   └─ EndSessionButton
 │       │       └─ onClick → checkAndAward('session_ended')
 │       │
 │       ├─ BadgesPage 🎄
 │       │   ├─ BadgeFilter
 │       │   │   └─ Filter by category: 'special'
 │       │   │
 │       │   └─ BadgeGrid
 │       │       └─ BadgeCard (x7 Christmas badges)
 │       │           ├─ icon_url or fallback
 │       │           ├─ BadgeProgress (if locked)
 │       │           └─ onClick → BadgeDetailModal
 │       │
 │       └─ AdminBadgesPage
 │           ├─ AdminBadgeGrid
 │           │   └─ Shows all 7 Christmas badges
 │           │
 │           ├─ BadgeCreateDialog
 │           │   └─ Can create more special badges
 │           │
 │           └─ BadgeAwardDialog
 │               └─ Manually award 'pepperkake' 🍪
 │
 └─ BadgeNotificationManager
     └─ Listens for new user_badges
         └─ Shows BadgeNotification toast
```

## Badge Criteria Schema

### Example: Gløggmester Badge

```json
{
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
}
```

**Evaluation Logic:**
1. Extract `session_drink_count` → Query drink_entries for session
2. Extract `is_julebord_session` → Query sessions table for session_type
3. Evaluate: `drink_count >= 5 AND is_julebord == 1`
4. If both true → ELIGIBLE

## Database Schema Changes

### Migration: 20251108170939_add_session_type.sql

```sql
ALTER TABLE sessions
ADD COLUMN session_type VARCHAR(50) DEFAULT 'standard' NOT NULL;

ALTER TABLE sessions
ADD CONSTRAINT sessions_type_check
CHECK (session_type IN ('standard', 'julebord'));
```

### Migration: 20251108170000_add_special_badge_category.sql

```sql
ALTER TABLE badges
DROP CONSTRAINT badges_category_check;

ALTER TABLE badges
ADD CONSTRAINT badges_category_check
CHECK (category IN ('session', 'global', 'social', 'milestone', 'special'));
```

### Migration: 20251108180000_add_christmas_badges.sql (NEW)

```sql
INSERT INTO badges (code, title, description, category, tier, ...) VALUES
  ('juleglede', 'Juleglede', '...', 'special', 'bronze', ...),
  ('nissehue', 'Nissehue', '...', 'special', 'silver', ...),
  ('gloggmester', 'Gløggmester', '...', 'special', 'gold', ...),
  ('julestjerne', 'Julestjerne', '...', 'special', 'gold', ...),
  ('snowmann', 'Snømann', '...', 'special', 'silver', ...),
  ('julenisse', 'Julenisse', '...', 'special', 'bronze', ...),
  ('pepperkake', 'Pepperkake', '...', 'special', 'legendary', ...);
```

## API Endpoints

### Supabase RPC: award_badge

**Function:** `award_badge(p_user_id, p_badge_code, p_session_id, p_metadata)`

**Location:** Database function (SECURITY DEFINER)

**Logic:**
1. Verify badge exists and is active
2. Check for duplicate award (unique constraint)
3. Handle category-specific session_id logic:
   - `milestone`/`global` → Force session_id to NULL
   - `session`/`social`/`special` → Use provided session_id
4. Insert into user_badges
5. Return user_badge_id

**Usage:**
```typescript
const { data, error } = await supabase.rpc('award_badge', {
  p_user_id: userId,
  p_badge_code: 'juleglede',
  p_session_id: sessionId,
  p_metadata: {
    bac: 0.75,
    awarded_at: new Date().toISOString()
  }
});
```

## React Query Integration

### Query Keys

```typescript
// From src/lib/queryKeys.ts
queryKeys.badges.active() // All active badges
queryKeys.badges.userBadges(userId) // User's earned badges
queryKeys.badges.progress(userId) // Badge progress tracking
```

### Invalidation Flow

```
Badge awarded
    │
    ▼
Insert into user_badges (Supabase)
    │
    ▼
Realtime subscription detects change
    │
    ▼
queryClient.invalidateQueries({ queryKey: ['badges', 'user', userId] })
    │
    ▼
React Query refetches user badges
    │
    ▼
BadgeNotificationManager detects new badge
    │
    ▼
Show toast notification
    │
    ▼
BadgeGrid re-renders with updated badges
```

## Performance Considerations

### Query Optimization

1. **Indexed Columns:**
   - `sessions.session_type` → btree index
   - `badges.category` → btree index
   - `user_badges.user_id` → btree index

2. **Efficient Joins:**
   ```sql
   -- Julebord session count query
   SELECT COUNT(DISTINCT sp.session_id)
   FROM session_participants sp
   INNER JOIN sessions s ON sp.session_id = s.id
   WHERE sp.user_id = $1 AND s.session_type = 'julebord';
   ```

3. **Caching Strategy:**
   - Active badges: 5min stale time
   - User badges: Refetch on realtime update
   - Badge progress: 30sec stale time

### Metric Extraction Efficiency

| Metric | Query Type | Complexity | Cacheable |
|--------|-----------|-----------|-----------|
| `julebord_session_count` | JOIN + COUNT | O(n) sessions | Yes |
| `is_julebord_session` | Single row lookup | O(1) | Yes |
| `created_julebord_session` | COUNT with filter | O(n) sessions | Yes |
| `session_drink_count` | COUNT with filter | O(n) drinks | No (changes frequently) |
| `max_bac_in_session` | Complex calculation | O(n²) drinks×time | No |

## Error Handling

### Badge Awarding Failures

```typescript
try {
  await awardBadgeMutation.mutateAsync({ ... });
} catch (error) {
  const errorMsg = error.message.toLowerCase();

  if (errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
    // User already has badge - skip silently
    console.debug('Badge already awarded');
  } else if (errorMsg.includes('not active')) {
    // Badge deactivated - skip
    console.warn('Badge no longer active');
  } else {
    // Unexpected error - log and report
    console.error('Failed to award badge:', error);
    Sentry.captureException(error);
  }
}
```

## Security Model

### Row Level Security (RLS)

**Badges Table:**
- SELECT: All authenticated users (if active)
- INSERT/UPDATE/DELETE: Admins only

**User_Badges Table:**
- SELECT: User themselves + friends + admins
- INSERT: Admins only (via SECURITY DEFINER function)
- DELETE: Admins only

**Sessions Table:**
- SELECT: Participants + admins
- UPDATE: Session creator + admins
- `session_type` can be set on creation by any user

## Testing Strategy

### Unit Tests

```typescript
describe('Christmas Badge Metrics', () => {
  it('should count julebord sessions correctly', async () => {
    const count = await getJulebordSessionCount(supabase, userId);
    expect(count).toBe(3);
  });

  it('should identify julebord session', async () => {
    const isJulebord = await getIsJulebordSession(supabase, sessionId);
    expect(isJulebord).toBe(1);
  });
});
```

### Integration Tests

```typescript
describe('Badge Awarding', () => {
  it('should award Juleglede on first julebord', async () => {
    // Create julebord session
    const session = await createSession({ session_type: 'julebord' });

    // Join session
    await joinSession(session.id, userId);

    // Trigger award
    await checkAndAward('session_ended', session.id);

    // Verify badge awarded
    const userBadges = await getUserBadges(userId);
    expect(userBadges).toContainObject({ badge: { code: 'juleglede' } });
  });
});
```

## Monitoring & Observability

### Key Metrics to Track

1. **Badge Award Rate:**
   - Total Christmas badges awarded per day
   - Award distribution across tiers

2. **Julebord Session Volume:**
   - Number of julebord sessions created
   - Average participants per julebord

3. **Performance Metrics:**
   - Average badge check duration
   - Metric extraction query times

4. **Error Rates:**
   - Badge award failures
   - Metric extraction errors

### Logging

```typescript
console.debug('[BadgeAwarding] Starting check', { context, sessionId, userId });
console.debug('[BadgeAwarding] Found N eligible badges');
console.debug('[BadgeAwarding] Successfully awarded: badge_title');
console.error('[BadgeAwarding] Failed to award:', error);
```

## Future Enhancements

### Phase 2: Advanced Features

1. **Seasonal Activation:**
   - Auto-activate Christmas badges in December
   - Auto-deactivate in January

2. **Leaderboard Integration:**
   - Christmas badge leaderboard
   - Most decorated user

3. **Badge Collections:**
   - "Complete Christmas Collection" meta-badge
   - Collection progress tracking

4. **Additional Badges:**
   - Monthly themed badges
   - Event-specific badges

### Phase 3: Gamification

1. **Badge Rarity System:**
   - Track how many users have each badge
   - Display rarity percentage

2. **Badge Showcase:**
   - Featured badge on profile
   - Badge display order preference

3. **Badge Challenges:**
   - Time-limited badge opportunities
   - Competitive badge earning

---

## Technical Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Database | PostgreSQL (Supabase) | Badge storage, criteria evaluation |
| Backend Logic | Database Functions (PL/pgSQL) | Badge awarding, duplicate prevention |
| State Management | React Query v5 | Badge data fetching, caching |
| Realtime | Supabase Realtime | Badge award notifications |
| UI Components | Material UI v7 | Badge display, progress bars |
| Type Safety | TypeScript | Badge schema types |
| Icons | SVG / Supabase Storage | Badge visual assets |

## Deployment Architecture

```
Development → Staging → Production

Migration deployment:
  1. Apply to dev database
  2. Test badge awarding
  3. Apply to staging
  4. Integration tests
  5. Apply to production
  6. Monitor for 24h

Code deployment:
  1. Merge to feature branch
  2. Run type checks (tsc)
  3. Run linter (eslint)
  4. Create PR to main
  5. Code review
  6. Deploy via Vercel
```

---

## Summary

The Christmas badge system extends the existing badge architecture with:

- **7 new badges** in the `special` category
- **3 new metric functions** for julebord session tracking
- **Minimal code changes** leveraging existing infrastructure
- **Automatic awarding** for 5 badges, manual for 2
- **Norwegian language** throughout
- **Scalable design** for future seasonal events

**Total implementation impact:**
- Database: 1 migration file (~200 lines)
- TypeScript: ~150 lines of new code
- Changes to existing code: ~20 lines
- Documentation: ~1000 lines

**Estimated development time:** 4-6 hours
**Estimated testing time:** 2-3 hours
