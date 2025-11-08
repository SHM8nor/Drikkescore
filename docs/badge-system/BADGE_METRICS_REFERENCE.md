# Badge Metrics Reference

This document lists all available metrics that can be used in badge criteria.

## Available Metrics

### Global Metrics (All-Time Statistics)

| Metric Name | Description | Returns | Timeframe |
|-------------|-------------|---------|-----------|
| `total_drinks` | Total number of drinks registered across all sessions | Number | `all_time` |
| `session_count` | Total number of sessions participated in | Number | `all_time` |
| `total_volume` | Total volume of alcohol consumed in milliliters | Number (ml) | `all_time` |
| `friend_count` | Number of accepted friends | Number | `all_time` |

### Session-Specific Metrics

| Metric Name | Description | Returns | Timeframe | Requires sessionId |
|-------------|-------------|---------|-----------|-------------------|
| `session_drink_count` | Number of drinks in this session | Number | `session` | ✅ Yes |
| `max_bac_in_session` | Highest BAC reached in this session | Number (0.0-1.0) | `session` | ✅ Yes |
| `unique_friends_in_session` | Number of friends participating in this session | Number | `session` | ✅ Yes |
| `session_has_beer` | User logged at least one beer (< 8% alcohol) | 1 or 0 | `session` | ✅ Yes |
| `session_has_wine` | User logged at least one wine (8-20% alcohol) | 1 or 0 | `session` | ✅ Yes |
| `session_friend_has_beer` | At least one friend logged beer | 1 or 0 | `session` | ✅ Yes |
| `session_friend_has_wine` | At least one friend logged wine | 1 or 0 | `session` | ✅ Yes |
| `session_ended_after_midnight` | Session ended after 00:00 (before 6 AM) | 1 or 0 | `session` | ✅ Yes |

## Metric Details

### `total_drinks`
**Function:** `getTotalDrinks(supabase, userId)`
**Query:** Counts all `drink_entries` for the user
**Use Case:** Milestone badges like "100 drinks total"

**Example:**
```json
{
  "metric": "total_drinks",
  "operator": ">=",
  "value": 100,
  "timeframe": "all_time"
}
```

---

### `session_count`
**Function:** `getSessionCount(supabase, userId)`
**Query:** Counts all `session_participants` for the user
**Use Case:** Global achievement badges like "Veteran" (10 sessions)

**Example:**
```json
{
  "metric": "session_count",
  "operator": ">=",
  "value": 10,
  "timeframe": "all_time"
}
```

---

### `session_drink_count`
**Function:** `getSessionDrinkCount(supabase, sessionId, userId)`
**Query:** Counts `drink_entries` in specific session for user
**Use Case:** Session badges like "Speed Demon" (5 drinks in one session)

**Example:**
```json
{
  "metric": "session_drink_count",
  "operator": ">=",
  "value": 5,
  "timeframe": "session"
}
```

---

### `max_bac_in_session`
**Function:** `getMaxBACInSession(supabase, sessionId, userId, profile)`
**Calculation Strategy:**
1. Fetches all drinks for user in session
2. Samples BAC at each drink time + every 5 minutes
3. Continues sampling for 2 hours after last drink
4. Returns the peak BAC value found

**Use Case:** Session badges like "Øktkongen" (BAC ≥ 0.08)

**Example:**
```json
{
  "metric": "max_bac_in_session",
  "operator": ">=",
  "value": 0.08,
  "timeframe": "session"
}
```

**Note:** Value is in decimal format (0.08 = 0.08% = 0.8‰)

---

### `unique_friends_in_session`
**Function:** `getUniqueFriendsInSession(supabase, sessionId, userId)`
**Calculation Strategy:**
1. Gets all session participants (excluding user)
2. Queries friendships table for accepted friendships
3. Counts how many participants are friends with user

**Use Case:** Social badges like "Sosial Sommerfugl" (5+ friends in session)

**Example:**
```json
{
  "metric": "unique_friends_in_session",
  "operator": ">=",
  "value": 5,
  "timeframe": "session"
}
```

---

### `total_volume`
**Function:** `getTotalVolume(supabase, userId)`
**Query:** Sums `volume_ml` from all `drink_entries` for user
**Use Case:** Volume-based achievements like "Gallon Club" (3785ml total)

**Example:**
```json
{
  "metric": "total_volume",
  "operator": ">=",
  "value": 3785,
  "timeframe": "all_time"
}
```

---

### `friend_count`
**Function:** `getFriendCount(supabase, userId)`
**Query:** Counts accepted friendships (bidirectional)
**Use Case:** Social milestones like "Popular" (20+ friends)

**Example:**
```json
{
  "metric": "friend_count",
  "operator": ">=",
  "value": 20,
  "timeframe": "all_time"
}
```

---

### `session_has_beer`
**Function:** `getSessionHasBeer(supabase, sessionId, userId)`
**Query:** Checks if user has any drinks with `alcohol_percentage < 8%` in session
**Returns:** 1 if user has beer, 0 otherwise
**Use Case:** Badges requiring specific drink types

**Example:**
```json
{
  "metric": "session_has_beer",
  "operator": "==",
  "value": 1,
  "timeframe": "session"
}
```

---

### `session_has_wine`
**Function:** `getSessionHasWine(supabase, sessionId, userId)`
**Query:** Checks if user has any drinks with `8% <= alcohol_percentage <= 20%` in session
**Returns:** 1 if user has wine, 0 otherwise
**Use Case:** Badges requiring specific drink types

**Example:**
```json
{
  "metric": "session_has_wine",
  "operator": "==",
  "value": 1,
  "timeframe": "session"
}
```

---

### `session_friend_has_beer`
**Function:** `getSessionFriendHasBeer(supabase, sessionId, userId)`
**Calculation Strategy:**
1. Gets all participants in session (excluding user)
2. Filters participants to only friends (accepted friendships)
3. Checks if any friend has beer drinks (< 8%)

**Returns:** 1 if at least one friend has beer, 0 otherwise
**Use Case:** Social badges requiring friends to drink specific types

**Example:**
```json
{
  "metric": "session_friend_has_beer",
  "operator": "==",
  "value": 1,
  "timeframe": "session"
}
```

---

### `session_friend_has_wine`
**Function:** `getSessionFriendHasWine(supabase, sessionId, userId)`
**Calculation Strategy:**
1. Gets all participants in session (excluding user)
2. Filters participants to only friends (accepted friendships)
3. Checks if any friend has wine drinks (8-20%)

**Returns:** 1 if at least one friend has wine, 0 otherwise
**Use Case:** Social badges requiring friends to drink specific types

**Example:**
```json
{
  "metric": "session_friend_has_wine",
  "operator": "==",
  "value": 1,
  "timeframe": "session"
}
```

---

### `session_ended_after_midnight`
**Function:** `getSessionEndedAfterMidnight(supabase, sessionId)`
**Query:** Checks if session `end_time` is between 00:00 and 06:00
**Returns:** 1 if session ended after midnight (before 6 AM), 0 otherwise
**Use Case:** Late-night session badges

**Example:**
```json
{
  "metric": "session_ended_after_midnight",
  "operator": "==",
  "value": 1,
  "timeframe": "session"
}
```

**Note:** This checks if the session ended in the early morning hours (00:00-06:00), which typically indicates a late-night session.

---

## Supported Operators

All metrics support these comparison operators:

| Operator | Meaning | Example |
|----------|---------|---------|
| `>=` | Greater than or equal | `value >= 10` |
| `>` | Greater than | `value > 10` |
| `<=` | Less than or equal | `value <= 5` |
| `<` | Less than | `value < 5` |
| `==` | Equal to | `value == 10` |
| `between` | Between two values | `5 <= value <= 10` |

## Timeframe Reference

| Timeframe | Meaning | Used With |
|-----------|---------|-----------|
| `all_time` | Across all sessions ever | Global metrics |
| `session` | Within a specific session | Session metrics |

## Common Mistakes

### ❌ Wrong Metric Name
```json
{
  "metric": "max_bac",  // ❌ Wrong! Should be max_bac_in_session
  "operator": ">=",
  "value": 0.08,
  "timeframe": "session"
}
```

### ✅ Correct Metric Name
```json
{
  "metric": "max_bac_in_session",  // ✅ Correct!
  "operator": ">=",
  "value": 0.08,
  "timeframe": "session"
}
```

### ❌ Missing Required sessionId
```json
// Badge category: 'global' (session_id will be NULL)
{
  "metric": "max_bac_in_session",  // ❌ Wrong! Session metrics can't be used in global badges
  "operator": ">=",
  "value": 0.08,
  "timeframe": "session"
}
```

### ✅ Correct Category for Metric
```json
// Badge category: 'session' (session_id will be provided)
{
  "metric": "max_bac_in_session",  // ✅ Correct! Session metric in session badge
  "operator": ">=",
  "value": 0.08,
  "timeframe": "session"
}
```

## Adding New Metrics

To add a new metric:

1. **Create extraction function** in `src/utils/badgeMetrics.ts`:
```typescript
export async function getYourNewMetric(
  supabase: SupabaseClient,
  userId: string,
  // Add sessionId if session-specific
): Promise<number> {
  // Query database and return numeric value
  // Return 0 on error
}
```

2. **Add case to badgeChecker** in `src/utils/badgeChecker.ts`:
```typescript
switch (metric) {
  // ... existing cases ...

  case 'your_new_metric':
    value = await getYourNewMetric(supabase, userId);
    break;
}
```

3. **Document it** in this file!

4. **Test it** with a badge that uses the metric

## Example Badge Criteria

### Simple Milestone
```json
{
  "type": "threshold",
  "conditions": [
    {
      "metric": "total_drinks",
      "operator": ">=",
      "value": 1,
      "timeframe": "all_time"
    }
  ]
}
```

### Complex Multi-Condition (AND logic)
```json
{
  "type": "threshold",
  "logic": "AND",
  "conditions": [
    {
      "metric": "session_drink_count",
      "operator": ">=",
      "value": 5,
      "timeframe": "session"
    },
    {
      "metric": "max_bac_in_session",
      "operator": ">=",
      "value": 0.08,
      "timeframe": "session"
    }
  ]
}
```
Requires BOTH 5+ drinks AND 0.08+ BAC in the session.

### Range Check (Between)
```json
{
  "type": "threshold",
  "conditions": [
    {
      "metric": "max_bac_in_session",
      "operator": "between",
      "value": [0.05, 0.08],
      "timeframe": "session"
    }
  ]
}
```
Requires BAC between 0.05 and 0.08 (responsible drinking badge).

### Late Night Variety Badge (Using New Metrics)
```json
{
  "type": "combination",
  "conditions": [
    {
      "metric": "session_ended_after_midnight",
      "operator": "==",
      "value": 1,
      "timeframe": "session"
    },
    {
      "metric": "unique_friends_in_session",
      "operator": ">=",
      "value": 1,
      "timeframe": "session"
    },
    {
      "metric": "session_has_beer",
      "operator": "==",
      "value": 1,
      "timeframe": "session"
    },
    {
      "metric": "session_has_wine",
      "operator": "==",
      "value": 1,
      "timeframe": "session"
    },
    {
      "metric": "session_friend_has_beer",
      "operator": "==",
      "value": 1,
      "timeframe": "session"
    },
    {
      "metric": "session_friend_has_wine",
      "operator": "==",
      "value": 1,
      "timeframe": "session"
    }
  ],
  "requireAll": true
}
```
Requires:
- Session ended after midnight (00:00-06:00)
- At least one friend in session
- User logged both beer AND wine
- At least one friend logged both beer AND wine

This is perfect for a badge like "Midnattsvariasjon" (Midnight Variety).
