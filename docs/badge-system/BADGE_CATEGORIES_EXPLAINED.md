# Badge Categories Explained

This document explains the different badge categories and how they work in the Drikkescore badge system.

## Category Types

### 🏆 Milestone
**Definition:** One-time achievements that mark significant personal firsts.

**Award Behavior:**
- Can only be earned **ONCE PER USER** across all time
- `session_id` is **always NULL** (not tied to any specific session)
- Examples:
  - "Første Drink" - Register your very first drink ever
  - "First Session" - Complete your first drinking session
  - "First Friend" - Add your first friend to the app

**Database Logic:**
```sql
-- Milestone badges ignore session_id and use NULL
INSERT INTO user_badges (user_id, badge_id, session_id)
VALUES ('user-123', 'badge-456', NULL);
```

---

### 🌍 Global
**Definition:** Achievements based on cumulative all-time statistics.

**Award Behavior:**
- Can only be earned **ONCE PER USER** when threshold is reached
- `session_id` is **always NULL** (based on total stats, not one session)
- Examples:
  - "Veteran" - Complete 10 total sessions
  - "Century Club" - Register 100 total drinks
  - "Party Legend" - Complete 100 total sessions

**Database Logic:**
```sql
-- Global badges are awarded based on total_drinks, session_count, etc.
-- session_id is NULL because it's about all-time achievement
INSERT INTO user_badges (user_id, badge_id, session_id)
VALUES ('user-123', 'badge-456', NULL);
```

---

### 🎯 Session
**Definition:** Achievements earned within a specific drinking session.

**Award Behavior:**
- Can be earned **ONCE PER SESSION** per user
- `session_id` is **REQUIRED** (tied to the session where it was earned)
- User can earn the same badge in different sessions
- Examples:
  - "Øktkongen" - Highest BAC in THIS session (≥0.08%)
  - "Marathon Man" - Session lasted 8+ hours
  - "Speed Demon" - 5 drinks in first hour of session

**Database Logic:**
```sql
-- Session badges can be earned multiple times, once per session
INSERT INTO user_badges (user_id, badge_id, session_id)
VALUES ('user-123', 'badge-456', 'session-abc');

-- Same user, same badge, different session = NEW badge
INSERT INTO user_badges (user_id, badge_id, session_id)
VALUES ('user-123', 'badge-456', 'session-xyz');  -- ✅ Allowed!
```

---

### 👥 Social
**Definition:** Achievements related to friends and social interaction.

**Award Behavior:**
- **Can vary** - some are session-specific, some are global
- If tied to a specific session activity: `session_id` is set
- If based on total friend stats: `session_id` is NULL
- Examples:
  - "Sosial Sommerfugl" - Drink with 5+ friends in ONE session (session-specific)
  - "Popular" - Have 20+ friends total (global, session_id NULL)
  - "Squad Goals" - Drink with same group 10 times (global, session_id NULL)

**Database Logic:**
```sql
-- Session-specific social badge
INSERT INTO user_badges (user_id, badge_id, session_id)
VALUES ('user-123', 'social-butterfly', 'session-abc');

-- Global social badge
INSERT INTO user_badges (user_id, badge_id, session_id)
VALUES ('user-123', 'popular', NULL);
```

---

## Award Function Behavior

The `award_badge()` function automatically determines the correct `session_id` value:

```sql
award_badge(
  p_user_id := 'user-123',
  p_badge_code := 'first_drink',
  p_session_id := 'session-abc',  -- Passed in, but...
  p_metadata := NULL
)
```

**What happens:**
1. Function fetches badge category from `badges` table
2. If category is `milestone` or `global`: **Forces session_id to NULL**
3. If category is `session` or `social`: **Uses provided session_id**
4. Checks if badge already exists with this configuration
5. If exists: Returns existing ID (idempotent)
6. If not exists: Inserts new badge

---

## UNIQUE Constraints

The database enforces uniqueness with partial indexes:

### For Milestone/Global Badges (session_id IS NULL)
```sql
CREATE UNIQUE INDEX "user_badges_milestone_global_unique"
  ON "user_badges"("user_id", "badge_id")
  WHERE "session_id" IS NULL;
```
**Effect:** User can only have ONE "first_drink" badge total, regardless of sessions.

### For Session Badges (session_id IS NOT NULL)
```sql
CREATE UNIQUE INDEX "user_badges_session_unique"
  ON "user_badges"("user_id", "badge_id", "session_id")
  WHERE "session_id" IS NOT NULL;
```
**Effect:** User can have multiple "session_king" badges, but only ONE per session.

---

## Examples with Current Badges

### ❌ WRONG (Old Behavior)
```javascript
// User registers first drink in session-1
checkAndAward('drink_added', 'session-1');
// Awards: first_drink with session_id='session-1'

// User starts new session-2, registers first drink
checkAndAward('drink_added', 'session-2');
// Awards: first_drink with session_id='session-2' ❌ DUPLICATE!
```

### ✅ CORRECT (New Behavior)
```javascript
// User registers first drink in session-1
checkAndAward('drink_added', 'session-1');
// Awards: first_drink with session_id=NULL (milestone badge)

// User starts new session-2, registers first drink
checkAndAward('drink_added', 'session-2');
// Attempts to award: first_drink with session_id=NULL
// Already exists! Returns existing badge ID, no duplicate ✅
```

---

## Recommended Badge Design

When creating new badges, follow these guidelines:

| Badge Purpose | Category | session_id | Timeframe | Example |
|--------------|----------|------------|-----------|---------|
| First time doing X | `milestone` | NULL | `all_time` | First drink ever |
| Total count milestone | `global` | NULL | `all_time` | 100 sessions completed |
| Best performance in session | `session` | Required | `session` | Highest BAC this session |
| Session-specific achievement | `session` | Required | `session` | 5 friends in this session |
| Total friend stats | `social` | NULL | `all_time` | 20 friends total |

---

## Migration Applied

**Migration:** `20251108150000_fix_badge_duplicate_awards.sql`

**Changes:**
1. Dropped old `UNIQUE(user_id, badge_id, session_id)` constraint
2. Added partial index for milestone/global badges (session_id NULL)
3. Added partial index for session badges (session_id NOT NULL)
4. Updated `award_badge()` function to enforce category logic
5. Added idempotency - returns existing badge instead of erroring

**Result:** No more duplicate milestone/global badges! 🎉
