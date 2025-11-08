# Christmas Badge System - Quick Start Guide

## Installation Steps

### 1. Run Database Migration
```bash
# Using Supabase CLI
supabase db push

# Or run the SQL directly in Supabase Dashboard
# File: supabase/migrations/20251108180000_add_christmas_badges.sql
```

### 2. Verify Installation
```sql
-- Check badges were created
SELECT code, title, category, is_active
FROM badges
WHERE category = 'special';

-- Should return 7 badges: juleglede, nissehue, gloggmester, julestjerne, snowmann, julenisse, pepperkake
```

### 3. Add UI Integration (Choose One)

#### Option A: Add to Badges Page
```typescript
// In src/pages/BadgesPage.tsx

import { ChristmasBadgeCollection } from '../components/badges/ChristmasBadgeCollection';
import { useAuth } from '../context/AuthContext';

export function BadgesPage() {
  const { user } = useAuth();

  // Check if it's December
  const isDecember = new Date().getMonth() === 11;

  return (
    <Box sx={{ p: 3 }}>
      {/* Show Christmas badges during December */}
      {isDecember && (
        <Box sx={{ mb: 4 }}>
          <ChristmasBadgeCollection />
        </Box>
      )}

      {/* Regular badges grid below */}
      <BadgeGrid badges={badges} />
    </Box>
  );
}
```

#### Option B: Create Dedicated Christmas Page
```typescript
// Create new file: src/pages/ChristmasBadgesPage.tsx

import { Box, Container } from '@mui/material';
import { ChristmasBadgeCollection } from '../components/badges/ChristmasBadgeCollection';

export function ChristmasBadgesPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <ChristmasBadgeCollection />
      </Box>
    </Container>
  );
}

// Add route in App.tsx or router config:
// <Route path="/badges/christmas" element={<ChristmasBadgesPage />} />
```

#### Option C: Show in Session Page During Julebord
```typescript
// In src/pages/SessionPage.tsx

import { CompactChristmasBadgeShowcase } from '../components/badges/ChristmasBadgeCollection';

export function SessionPage() {
  const { session } = useSession(sessionId);

  return (
    <Box>
      {/* Sidebar */}
      <Box>
        {/* Show Christmas badges in sidebar during julebord */}
        {session?.session_type === 'julebord' && (
          <Box sx={{ mb: 3 }}>
            <CompactChristmasBadgeShowcase />
          </Box>
        )}

        {/* Other sidebar content */}
      </Box>

      {/* Main content */}
    </Box>
  );
}
```

## Testing the System

### Test 1: First Julebord Badge (Juleglede)
```typescript
// 1. Create a julebord session
const { createSession } = useCreateSession();
await createSession('Test Julebord', startTime, endTime, 'julebord');

// 2. Join as a new user
const { joinSession } = useJoinSession();
await joinSession(sessionCode);

// 3. Expected: "Juleglede" badge awarded immediately
// Check: User's badge collection should show the badge
```

### Test 2: Multiple Drinks Badge (Gloggmester)
```typescript
// 1. Join julebord session
await joinSession(julebordCode);

// 2. Add 5 drinks
const { addDrink } = useSession(sessionId);
for (let i = 0; i < 5; i++) {
  await addDrink(500, 5.0); // 500ml, 5% alcohol
}

// 3. Expected: "Gloggmester" badge awarded after 5th drink
```

### Test 3: Sober Badge (Snømann)
```typescript
// 1. Join julebord session
await joinSession(julebordCode);

// 2. Don't add any drinks (or very low amounts)
// Wait for session to end

// 3. Navigate to history page
// Expected: "Snømann" badge awarded when session appears in history
```

### Test 4: Creator Badge (Julenisse)
```typescript
// 1. Create a julebord session
const { createSession } = useCreateSession();
await createSession('My Julebord', startTime, endTime, 'julebord');

// 2. Expected: "Julenisse" badge awarded immediately
```

### Test 5: Admin-Awarded Badges
```typescript
// For Julestjerne and Pepperkake:
// 1. Navigate to admin panel
// 2. Find the badge in badge list
// 3. Click "Award Badge"
// 4. Select user and session
// 5. Submit

// These badges cannot be auto-awarded and must be given manually
```

## Verifying Badge Awards

### Check Database
```sql
-- See all Christmas badge awards
SELECT
  ub.id,
  p.display_name as user_name,
  b.title as badge_name,
  b.code as badge_code,
  ub.earned_at,
  s.session_name
FROM user_badges ub
JOIN profiles p ON ub.user_id = p.id
JOIN badges b ON ub.badge_id = b.id
LEFT JOIN sessions s ON ub.session_id = s.id
WHERE b.category = 'special'
ORDER BY ub.earned_at DESC;
```

### Check in UI
```typescript
// Use the useBadges hook
import { useUserBadges } from '../hooks/useBadges';

function MyComponent() {
  const { user } = useAuth();
  const { data: userBadges } = useUserBadges(user?.id);

  const christmasBadges = userBadges?.filter(ub =>
    ub.badge?.category === 'special'
  );

  console.log('Christmas badges earned:', christmasBadges);
}
```

### Check Console Logs
Look for these debug messages:
```
[BadgeAwarding] Starting badge check { context: 'drink_added', sessionId: '...', userId: '...' }
[BadgeAwarding] Context: drink_added - checking milestone/global/special badges
[BadgeAwarding] Checking 15 automatic badges for drink_added
[BadgeAwarding] Found 1 eligible badges
[BadgeAwarding] Attempting to award badge: Gløggmester
[BadgeAwarding] Successfully awarded: Gløggmester
[BadgeAwarding] Completed: { awarded: 1, skipped: 0, errors: 0 }
```

## Common Issues

### Issue: Badges Not Awarding
**Solution:**
1. Check migration ran: `SELECT * FROM badges WHERE category = 'special';`
2. Check session is julebord: `SELECT session_type FROM sessions WHERE id = 'session-id';`
3. Check badge is active: `UPDATE badges SET is_active = true WHERE category = 'special';`
4. Check console for errors

### Issue: Badge Awarded Twice
**Solution:**
- This shouldn't happen due to unique constraint
- If it does, check database for duplicate entries:
```sql
SELECT user_id, badge_id, COUNT(*)
FROM user_badges
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1;
```

### Issue: ChristmasBadgeCollection Not Showing
**Solution:**
1. Check import path is correct
2. Verify badges exist: `useBadgesByCategory('special')`
3. Check MUI Grid v7 is installed (uses `size` prop, not `item`)
4. Check browser console for React errors

## Badge Award Timing Summary

| Badge | Trigger Event | Context | Timing |
|-------|--------------|---------|--------|
| Juleglede | Join julebord | `session_ended` | Immediate |
| Nissehue | Join 3rd julebord | `session_ended` | Immediate |
| Gloggmester | 5th drink in julebord | `drink_added` | Immediate |
| Snømann | End julebord sober | `session_ended` | On history load |
| Julenisse | Create julebord | `session_ended` | Immediate |
| Julestjerne | Highest BAC | Manual | Admin awards |
| Pepperkake | Exceptional spirit | Manual | Admin awards |

## Next Steps

1. **Run Migration** - Add the 7 badges to database
2. **Choose UI Integration** - Pick one of the three options above
3. **Test Each Badge** - Follow test procedures
4. **Add Icons** (Optional) - Upload custom icons to Supabase Storage
5. **Monitor Awards** - Watch console logs and database for successful awards

## Advanced: Custom Badge Icons

If you want to replace emoji placeholders with real icons:

1. Design 7 badge icons (PNG, 256x256px recommended)
2. Upload to Supabase Storage:
```typescript
const { data, error } = await supabase.storage
  .from('badge-icons')
  .upload('christmas/juleglede.png', file);
```

3. Update database:
```sql
UPDATE badges
SET icon_url = 'https://your-project.supabase.co/storage/v1/object/public/badge-icons/christmas/juleglede.png'
WHERE code = 'juleglede';
```

4. Icons will automatically appear in BadgeCard and ChristmasBadgeCollection

## Questions?

Check the full documentation in `CHRISTMAS_BADGE_INTEGRATION.md` for:
- Detailed badge criteria
- Complete testing checklist
- Performance considerations
- Troubleshooting guide
- Future enhancement ideas
