# Real-Time Presence Tracking Integration

## Overview

This document describes the integration of real-time presence tracking into the Drikkescore app's SessionPage component.

## What Was Integrated

### 1. Core Hook Integration

**File**: `C:\Users\Felles\Documents\Projects\Drikkescore\src\pages\SessionPage.tsx`

The `useSessionPresence()` hook was integrated into the SessionPage component to automatically track user presence:

```typescript
import { useSessionPresence } from '../hooks/useSessionPresence';

// Inside SessionPage component:
useSessionPresence({
  sessionId: sessionId || null,
  enabled: !!sessionId, // Only enable when we have a valid session ID
});
```

**How It Works:**

- Automatically updates user presence to 'active' when joining a session
- Sends heartbeat every 30 seconds to maintain 'active' status
- Detects tab visibility changes:
  - Sets status to 'idle' when tab is hidden
  - Sets status to 'active' when tab becomes visible
- Marks user as 'offline' when leaving session or closing tab
- Properly cleans up all listeners and intervals on unmount

### 2. Active Users Indicator Component

**File**: `C:\Users\Felles\Documents\Projects\Drikkescore\src\components\session\ActiveUsersIndicator.tsx`

A new UI component was created to display active users in real-time:

**Features:**

- Shows count of active users with animated green indicator
- Real-time updates via Supabase subscriptions
- Click to expand dropdown showing all active users
- Status indicators for each user:
  - Green dot = Active
  - Orange dot = Idle
  - Gray dot = Offline
- Displays user names and status text
- Click outside to close dropdown
- Pulsing animation for active indicator

**Usage:**

```typescript
import { ActiveUsersIndicator } from '../components/session/ActiveUsersIndicator';

<ActiveUsersIndicator sessionId={sessionId} />
```

### 3. UI Placement

The ActiveUsersIndicator was added to the session info banner in SessionPage, next to the session timer:

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
  <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--prussian-blue)' }}>
    {session.session_name || 'Økt'}: <strong>{session.session_code}</strong>
  </span>
  <span style={{ fontSize: '15px', color: sessionEnded ? 'var(--fire-engine-red)' : 'var(--prussian-blue)' }}>
    {sessionEnded ? (
      <strong>Økten er avsluttet!</strong>
    ) : (
      <>⏱ {formatTime(timeRemaining)} igjen</>
    )}
  </span>
  {/* Active users indicator */}
  {sessionId && <ActiveUsersIndicator sessionId={sessionId} />}
</div>
```

## Technical Implementation Details

### Automatic Presence Management

The `useSessionPresence` hook handles all presence tracking automatically:

1. **Initial Setup** (on mount):
   - Calls `setupPresenceTracking(sessionId)` from API
   - Sets user status to 'active'
   - Starts 30-second heartbeat interval
   - Attaches visibility change listener
   - Attaches beforeunload listener

2. **During Session**:
   - Every 30 seconds: Updates presence to 'active'
   - Tab hidden: Updates presence to 'idle'
   - Tab visible: Updates presence to 'active'

3. **Cleanup** (on unmount):
   - Clears heartbeat interval
   - Removes visibility listener
   - Removes beforeunload listener
   - Marks user as 'offline'

### Real-Time Subscriptions

The ActiveUsersIndicator uses Supabase real-time subscriptions:

```typescript
// Subscribe to active_sessions table changes for this session
subscribeSessionActiveUsers(sessionId, () => {
  // Refetch active users list when any change occurs
  getSessionActiveUsers(sessionId)
    .then(setActiveUsers)
    .catch(console.error);
});
```

**Subscription Cleanup:**

Properly unsubscribes when component unmounts to prevent memory leaks.

### API Functions Used

From `C:\Users\Felles\Documents\Projects\Drikkescore\src\api\activeSessions.ts`:

- `setupPresenceTracking(sessionId)` - Complete setup with cleanup function
- `updateSessionPresence(sessionId, status)` - Manual status updates
- `markSessionOffline(sessionId)` - Mark user offline
- `getSessionActiveUsers(sessionId)` - Fetch active users list
- `subscribeSessionActiveUsers(sessionId, callback)` - Real-time subscription

### Database Types

From `C:\Users\Felles\Documents\Projects\Drikkescore\src\types\database.ts`:

```typescript
export type SessionStatus = 'active' | 'idle' | 'offline';

export interface SessionActiveUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  status: SessionStatus;
  last_seen: string;
}
```

## Testing Verification

### Manual Testing Checklist

1. **Join Session**:
   - [ ] User appears in active users list immediately
   - [ ] Green indicator shows on active users count
   - [ ] Heartbeat updates every 30 seconds (check browser console)

2. **Tab Visibility**:
   - [ ] Switch to another tab → status changes to 'idle' (orange indicator)
   - [ ] Switch back to app → status changes to 'active' (green indicator)

3. **Leave Session**:
   - [ ] Click "Forlat økt" button → user marked as offline
   - [ ] Close browser tab → user marked as offline

4. **Real-Time Updates**:
   - [ ] Open session in two browser windows
   - [ ] User count updates in both windows
   - [ ] Status changes reflect in both windows

5. **UI Interaction**:
   - [ ] Click active users indicator → dropdown opens
   - [ ] Click outside dropdown → dropdown closes
   - [ ] Active users show green dot
   - [ ] Idle users show orange dot
   - [ ] Offline users show gray dot

### Performance Considerations

1. **Heartbeat Interval**: 30 seconds
   - Balances real-time accuracy with server load
   - Configurable via `intervalMs` parameter

2. **Subscription Efficiency**:
   - Uses single subscription per session
   - Filters at database level (`filter: session_id=eq.${sessionId}`)
   - Refetches only when changes occur

3. **Memory Management**:
   - All intervals cleared on unmount
   - All event listeners removed on unmount
   - Subscriptions properly unsubscribed

## Files Modified/Created

### Modified:
- `C:\Users\Felles\Documents\Projects\Drikkescore\src\pages\SessionPage.tsx`

### Created:
- `C:\Users\Felles\Documents\Projects\Drikkescore\src\components\session\ActiveUsersIndicator.tsx`
- `C:\Users\Felles\Documents\Projects\Drikkescore\docs\PRESENCE_TRACKING_INTEGRATION.md`

## Future Enhancements

Potential improvements for the future:

1. **Typing Indicators**: Show when users are actively adding drinks
2. **User Avatars**: Display user profile pictures in the dropdown
3. **More Detailed Status**: Show "Adding drink...", "Viewing charts", etc.
4. **Presence Notifications**: Toast when friends join/leave
5. **Offline Queue**: Queue presence updates when offline, sync when back online
6. **Heartbeat Optimization**: Adaptive interval based on user activity
7. **Last Seen Timestamp**: Show "Last seen 2 minutes ago" for idle users

## Troubleshooting

### Issue: Users not appearing in active list

**Solution:**
1. Check browser console for errors
2. Verify Supabase connection
3. Check that RLS policies allow reading `active_sessions` table
4. Ensure user is authenticated

### Issue: Status not updating

**Solution:**
1. Verify heartbeat is running (check console logs)
2. Check network tab for API calls
3. Ensure visibility API is supported in browser
4. Check that session ID is valid

### Issue: Memory leaks

**Solution:**
1. Verify cleanup function is called on unmount
2. Check that subscriptions are unsubscribed
3. Ensure intervals are cleared
4. Use React DevTools Profiler to identify issues

## Additional Resources

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
