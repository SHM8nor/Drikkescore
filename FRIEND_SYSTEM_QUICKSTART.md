# Friend System Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get you up and running with the Drikkescore friend system as quickly as possible.

---

## Step 1: Run Database Migrations (2 minutes)

1. Open [Supabase Dashboard](https://app.supabase.com) → Your Project → SQL Editor

2. **Run Migration 001:**
   - Open file: `guidelines/001-create-friendships-table.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" ▶️

3. **Run Migration 002:**
   - Open file: `guidelines/002-create-active-sessions-table.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" ▶️

4. **Verify Installation:**
   - Open file: `guidelines/verify-friend-system.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" ▶️
   - Look for: ✅ ALL CHECKS PASSED

---

## Step 2: Test the API (1 minute)

In your React app, test that the API works:

```typescript
import { getFriends } from '@/api';

// Should return empty array (no friends yet)
const friends = await getFriends();
console.log('My friends:', friends); // []
```

If this works without errors, you're ready to build UI!

---

## Step 3: Use in Components (2 minutes)

### Option A: Use the Pre-built Example Component

```typescript
import FriendsExample from '@/components/friends/FriendsExample';

function MyPage() {
  return <FriendsExample />;
}
```

This gives you a complete friend management UI with:
- Friends list
- Friend requests (accept/decline)
- Sent requests (cancel)
- Active friends (who's playing now)
- Real-time updates

### Option B: Build Custom UI with Hooks

#### Show Friends List

```typescript
import { useFriends } from '@/hooks/useFriends';

function MyFriendsList() {
  const { friends, loading } = useFriends();

  if (loading) return <div>Laster...</div>;

  return (
    <ul>
      {friends.map(friend => (
        <li key={friend.friend_id}>{friend.full_name}</li>
      ))}
    </ul>
  );
}
```

#### Show Active Friends

```typescript
import { useActiveFriends } from '@/hooks/useActiveFriends';

function ActiveFriendsWidget() {
  const { activeOnly } = useActiveFriends();

  return (
    <div>
      <h3>Spiller nå ({activeOnly.length})</h3>
      {activeOnly.map(friend => (
        <div key={friend.friend_id}>
          {friend.friend_name} - {friend.session_name}
        </div>
      ))}
    </div>
  );
}
```

#### Track Session Presence (Automatic)

```typescript
import { useSessionPresence } from '@/hooks/useSessionPresence';

function SessionPage({ sessionId }) {
  // This single line handles EVERYTHING:
  // ✅ Marks you active when page loads
  // ✅ Sends heartbeat every 30 seconds
  // ✅ Marks you idle when tab is hidden
  // ✅ Marks you offline when you leave
  useSessionPresence({ sessionId });

  return <div>Session content here</div>;
}
```

---

## Common Operations

### Send Friend Request

```typescript
import { useFriends } from '@/hooks/useFriends';

function SendRequest() {
  const { sendRequest } = useFriends();

  return (
    <button onClick={() => sendRequest('user-id-here')}>
      Legg til venn
    </button>
  );
}
```

### Accept Friend Request

```typescript
import { useFriends } from '@/hooks/useFriends';

function PendingRequests() {
  const { pendingRequests, acceptRequest } = useFriends();

  return (
    <div>
      {pendingRequests.map(request => (
        <div key={request.friendship_id}>
          {request.full_name}
          <button onClick={() => acceptRequest(request.friendship_id)}>
            Aksepter
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Remove Friend

```typescript
import { useFriends } from '@/hooks/useFriends';

function FriendsList() {
  const { friends, unfriend } = useFriends();

  return (
    <ul>
      {friends.map(friend => (
        <li key={friend.friend_id}>
          {friend.full_name}
          <button onClick={() => unfriend(friend.friend_id)}>
            Fjern
          </button>
        </li>
      ))}
    </ul>
  );
}
```

---

## Real-time Updates

All hooks automatically subscribe to real-time updates. Your UI will automatically refresh when:
- Friend requests are sent/received
- Requests are accepted/declined
- Friends come online/go offline
- Friends join/leave sessions

No manual refresh needed! 🎉

---

## Testing Your Implementation

### Test Friend Requests

1. Create two test users in Supabase Auth
2. Log in as User A
3. Send friend request to User B
4. Log in as User B
5. Accept the request
6. Verify both users see each other as friends

### Test Active Sessions

1. User A joins a session
2. User B (friend of A) should see A's active session
3. User B can click "Join" to join the same session

### Test Real-time

1. Open two browser windows
2. Log in as different users (who are friends)
3. Send a friend request in one window
4. Watch it appear in real-time in the other window

---

## File Locations

| What | Where |
|------|-------|
| Database Migrations | `guidelines/001-create-friendships-table.sql` <br/> `guidelines/002-create-active-sessions-table.sql` |
| Verification Script | `guidelines/verify-friend-system.sql` |
| API Functions | `src/api/friendships.ts` <br/> `src/api/activeSessions.ts` |
| React Hooks | `src/hooks/useFriends.ts` <br/> `src/hooks/useActiveFriends.ts` <br/> `src/hooks/useSessionPresence.ts` |
| TypeScript Types | `src/types/database.ts` |
| Example Component | `src/components/friends/FriendsExample.tsx` |
| Complete Docs | `FRIEND_SYSTEM_COMPLETE_SUMMARY.md` |
| Detailed Guide | `guidelines/FRIEND_SYSTEM_SETUP.md` |

---

## API Quick Reference

### Friend Operations

```typescript
import {
  getFriends,              // Get all friends
  getPendingRequests,      // Get incoming requests
  getSentRequests,         // Get outgoing requests
  sendFriendRequest,       // Send request
  acceptFriendRequest,     // Accept request
  declineFriendRequest,    // Decline request
  cancelFriendRequest,     // Cancel sent request
  removeFriend,            // Unfriend
  areFriends,              // Check if friends
  getFriendshipStatus,     // Get status
} from '@/api';
```

### Active Sessions

```typescript
import {
  getActiveFriendsSessions,    // Get friends' sessions
  getSessionActiveUsers,       // Get users in session
  updateSessionPresence,       // Update presence
  markSessionOffline,          // Go offline
  setupPresenceTracking,       // Auto-tracking
} from '@/api';
```

### React Hooks

```typescript
import { useFriends } from '@/hooks/useFriends';
import { useActiveFriends } from '@/hooks/useActiveFriends';
import { useSessionPresence } from '@/hooks/useSessionPresence';
```

---

## Need More Help?

📚 **Full Documentation:**
- `FRIEND_SYSTEM_COMPLETE_SUMMARY.md` - Complete overview
- `guidelines/FRIEND_SYSTEM_SETUP.md` - Detailed setup guide
- `guidelines/friend-system-quick-reference.sql` - SQL examples

🎨 **Example Code:**
- `src/components/friends/FriendsExample.tsx` - Complete component example

🐛 **Debugging:**
- `guidelines/verify-friend-system.sql` - Check installation
- `guidelines/friend-system-quick-reference.sql` - Testing queries

---

## Troubleshooting

### "Table does not exist" error
→ Run the migration files in Supabase SQL Editor

### "Permission denied" error
→ RLS policies are working correctly (this is expected for unauthorized access)

### Real-time not updating
→ Verify realtime is enabled: Run `verify-friend-system.sql`

### "User not authenticated" error
→ Ensure user is logged in before calling API functions

---

## 🎉 You're Ready!

The friend system is fully functional and ready to use. Start building your friend UI and enjoy real-time social features in Drikkescore!

**Happy coding! 🚀**
