# Friend System Setup Guide

This guide explains how to set up the friend system for Drikkescore, including database migrations, RLS policies, and real-time subscriptions.

## Overview

The friend system adds two main features to Drikkescore:

1. **Friend Relationships**: Users can send friend requests, accept/decline them, and maintain a friends list
2. **Active Session Presence**: Track which sessions friends are currently in for real-time social features

## Database Schema

### New Tables

#### `friendships`
Stores bi-directional friend relationships with request/accept flow.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User who initiated the friendship |
| friend_id | uuid | User who received the request |
| status | enum | 'pending', 'accepted', 'declined', 'blocked' |
| created_at | timestamptz | When the friendship was created |
| updated_at | timestamptz | Last update timestamp |

**Key Constraints:**
- Unique constraint on `(user_id, friend_id)` prevents duplicates
- Check constraint ensures `user_id != friend_id` (no self-friending)
- Indexes on `user_id`, `friend_id`, and `status` for performance

#### `active_sessions`
Tracks user presence in sessions for real-time friend activity.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User in the session |
| session_id | uuid | Session they're in |
| status | enum | 'active', 'idle', 'offline' |
| last_seen | timestamptz | Last activity timestamp |
| created_at | timestamptz | When presence was created |
| updated_at | timestamptz | Last update timestamp |

**Key Constraints:**
- Unique constraint on `(user_id, session_id)` - one presence per user per session
- Indexes on `user_id`, `session_id`, `status`, and `last_seen`
- Auto-updates `last_seen` on any update

## Installation Steps

### Step 1: Run Database Migrations

You need to run two SQL migration files in your Supabase SQL Editor:

1. **Open Supabase Dashboard**
   - Go to your project at https://app.supabase.com
   - Navigate to SQL Editor

2. **Run Migration 001: Friendships Table**
   - Copy the contents of `guidelines/001-create-friendships-table.sql`
   - Paste into SQL Editor
   - Click "Run" to execute
   - Verify no errors in the output

3. **Run Migration 002: Active Sessions Table**
   - Copy the contents of `guidelines/002-create-active-sessions-table.sql`
   - Paste into SQL Editor
   - Click "Run" to execute
   - Verify no errors in the output

### Step 2: Verify Installation

Run these queries in the SQL Editor to verify everything is set up correctly:

```sql
-- Check that tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('friendships', 'active_sessions');

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('friendships', 'active_sessions')
ORDER BY tablename, policyname;

-- Check realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('friendships', 'active_sessions');

-- Test the helper functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%friend%' OR routine_name LIKE '%session%'
ORDER BY routine_name;
```

Expected results:
- 2 tables created: `friendships`, `active_sessions`
- Multiple RLS policies for each table
- Both tables added to realtime publication
- Several helper functions available

## Database Functions

The migrations create several helper functions for common operations:

### Friendship Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `get_friends(user_id)` | Get all accepted friends | `p_user_id uuid` |
| `get_pending_requests(user_id)` | Get pending requests received | `p_user_id uuid` |
| `get_sent_requests(user_id)` | Get pending requests sent | `p_user_id uuid` |
| `are_friends(user_id, friend_id)` | Check if two users are friends | `p_user_id uuid`, `p_friend_id uuid` |
| `get_friendship_status(user_id, friend_id)` | Get friendship status | `p_user_id uuid`, `p_friend_id uuid` |

### Active Session Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `get_active_friends_sessions(user_id)` | Get sessions friends are in | `p_user_id uuid` |
| `upsert_session_presence(...)` | Update/create session presence | `p_user_id uuid`, `p_session_id uuid`, `p_status session_status` |
| `mark_session_offline(...)` | Mark user offline in session | `p_user_id uuid`, `p_session_id uuid` |
| `cleanup_stale_sessions()` | Remove old offline sessions | None |
| `get_session_active_users(session_id)` | Get active users in session | `p_session_id uuid` |

## Row Level Security (RLS) Policies

### Friendships RLS

1. **Users can view their own friendships**: Users can see friendships where they are either `user_id` or `friend_id`
2. **Users can send friend requests**: Users can insert pending friendships only if they are the `user_id`
3. **Users can update friend requests sent to them**: Users can accept/decline requests where they are the `friend_id`
4. **Users can update their own friend requests**: Users can modify friendships they initiated
5. **Users can delete their friendships**: Users can remove friendships where they are involved

### Active Sessions RLS

1. **Users can view their own active sessions**: Users can see their own presence records
2. **Users can view friends' active sessions**: Users can see where their friends are active
3. **Users can view active sessions in their sessions**: Users see who's active in sessions they're in
4. **Users can insert own active sessions**: Users can only create presence for themselves
5. **Users can update own active sessions**: Users can only update their own presence
6. **Users can delete own active sessions**: Users can only delete their own presence

## TypeScript Integration

### Types Available

All types are exported from `src/types/database.ts`:

```typescript
// Enums
type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
type SessionStatus = 'active' | 'idle' | 'offline';

// Core interfaces
interface Friendship { ... }
interface Friend { ... }
interface FriendRequest { ... }
interface SentFriendRequest { ... }
interface ActiveSession { ... }
interface ActiveFriendSession { ... }
interface SessionActiveUser { ... }
```

### API Functions

All API functions are available from `src/api/`:

```typescript
// Friendships API
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  removeFriend,
  blockUser,
  unblockUser,
  areFriends,
  getFriendshipStatus,
  subscribeFriendships,
} from '@/api/friendships';

// Active Sessions API
import {
  updateSessionPresence,
  markSessionOffline,
  markAllSessionsOffline,
  getActiveFriendsSessions,
  getSessionActiveUsers,
  getCurrentActiveSession,
  setupPresenceTracking,
  subscribeActiveFriendsSessions,
  subscribeSessionActiveUsers,
} from '@/api/activeSessions';

// Or import everything from index
import { sendFriendRequest, getActiveFriendsSessions } from '@/api';
```

## Usage Examples

### 1. Send a Friend Request

```typescript
import { sendFriendRequest } from '@/api';

try {
  const friendship = await sendFriendRequest('user-id-here');
  console.log('Friend request sent!', friendship);
} catch (error) {
  console.error('Failed to send friend request:', error.message);
}
```

### 2. Accept a Friend Request

```typescript
import { acceptFriendRequest } from '@/api';

try {
  const friendship = await acceptFriendRequest('friendship-id-here');
  console.log('Friend request accepted!', friendship);
} catch (error) {
  console.error('Failed to accept request:', error.message);
}
```

### 3. Get Friends List

```typescript
import { getFriends } from '@/api';

const friends = await getFriends();
console.log('My friends:', friends);
// Output: [{ friend_id: '...', full_name: 'John Doe', avatar_url: '...', created_at: '...' }, ...]
```

### 4. Track Session Presence

```typescript
import { setupPresenceTracking } from '@/api';

// In a session component
useEffect(() => {
  if (!sessionId) return;

  // Setup automatic presence tracking with heartbeat and visibility handling
  const cleanup = setupPresenceTracking(sessionId);

  return cleanup; // Cleanup on unmount
}, [sessionId]);
```

### 5. Get Active Friends Sessions

```typescript
import { getActiveFriendsSessions } from '@/api';

const activeFriends = await getActiveFriendsSessions();
console.log('Friends currently in sessions:', activeFriends);
// Output: [{ friend_id: '...', friend_name: 'John', session_name: 'Party', session_code: 'ABC123', ... }]
```

### 6. Real-time Friend Updates

```typescript
import { subscribeFriendships } from '@/api';
import { useEffect, useState } from 'react';

function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    // Initial load
    getFriends().then(setFriends);

    // Subscribe to changes
    const unsubscribe = subscribeFriendships((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // Refetch friends list
        getFriends().then(setFriends);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div>
      {friends.map(friend => (
        <div key={friend.friend_id}>{friend.full_name}</div>
      ))}
    </div>
  );
}
```

### 7. Real-time Active Sessions

```typescript
import { subscribeActiveFriendsSessions, getActiveFriendsSessions } from '@/api';
import { useEffect, useState } from 'react';

function ActiveFriends() {
  const [activeFriends, setActiveFriends] = useState<ActiveFriendSession[]>([]);

  useEffect(() => {
    // Initial load
    getActiveFriendsSessions().then(setActiveFriends);

    // Subscribe to changes
    const unsubscribe = subscribeActiveFriendsSessions(() => {
      // Refetch when any friend's session status changes
      getActiveFriendsSessions().then(setActiveFriends);
    });

    return unsubscribe;
  }, []);

  return (
    <div>
      <h2>Venner som spiller nå</h2>
      {activeFriends.map(friend => (
        <div key={`${friend.friend_id}-${friend.session_id}`}>
          {friend.friend_name} er i {friend.session_name} ({friend.participant_count} deltakere)
        </div>
      ))}
    </div>
  );
}
```

## Security Considerations

### 1. Bi-directional Friendships
The system prevents duplicate friendships by checking both directions:
- User A → User B
- User B → User A

Only one record exists per friendship pair.

### 2. Friend Request Flow
1. User A sends request to User B (status: 'pending', user_id=A, friend_id=B)
2. User B accepts/declines (updates status to 'accepted' or 'declined')
3. If accepted, both users can see the friendship

### 3. Privacy
- Users can only see their own friendships
- Active sessions are only visible to friends
- RLS policies enforce all privacy rules at the database level

### 4. Rate Limiting
Consider implementing rate limiting for:
- Friend requests (prevent spam)
- Presence updates (prevent abuse)

### 5. Blocking
- Blocked users cannot send new friend requests
- Existing friendships are updated to 'blocked' status
- Unblocking removes the friendship record

## Performance Optimization

### Indexes Created
- `idx_friendships_user_id` - Fast lookups by user
- `idx_friendships_friend_id` - Fast lookups by friend
- `idx_friendships_status` - Filter by status
- `idx_friendships_user_status` - Composite index for common queries
- `idx_active_sessions_user_id` - User's sessions
- `idx_active_sessions_session_id` - Session's users
- `idx_active_sessions_last_seen` - Cleanup stale sessions

### Real-time Subscriptions
- Only subscribe to changes for the current user
- Unsubscribe when components unmount
- Use debouncing for frequent updates

### Presence Heartbeat
- Default interval: 30 seconds (adjust based on needs)
- Auto-cleanup after 5 minutes of inactivity
- Handle page visibility for accurate status

## Troubleshooting

### "User is not a participant in this session"
Ensure the user has joined the session via `session_participants` before updating presence.

### "Friend request already sent"
Check if a friendship already exists in either direction before sending a new request.

### Real-time not working
1. Verify tables are added to `supabase_realtime` publication
2. Check that RLS policies allow reading the records
3. Ensure subscription channel is unique

### Stale sessions not cleaning up
Run manual cleanup: `SELECT cleanup_stale_sessions();`

Or set up a cron job (requires pg_cron extension).

## Next Steps

1. **Create UI Components**: Build friend list, request management, and active sessions display
2. **Add Notifications**: Alert users of new friend requests
3. **Search Users**: Implement user search to find and add friends
4. **Friend Activity Feed**: Show what friends are doing in their sessions
5. **Join Friend Session**: Allow users to quickly join sessions their friends are in

## Breaking Changes

None - this is a new feature that doesn't modify existing tables or functionality.

## Prerequisites

- Supabase project with existing `profiles`, `sessions`, and `session_participants` tables
- PostgreSQL functions must support `plpgsql` language
- Real-time subscriptions must be enabled in Supabase project settings

## Migration Rollback

If you need to rollback the migrations:

```sql
-- Remove from realtime
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS friendships;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS active_sessions;

-- Drop functions
DROP FUNCTION IF EXISTS get_friends(uuid);
DROP FUNCTION IF EXISTS get_pending_requests(uuid);
DROP FUNCTION IF EXISTS get_sent_requests(uuid);
DROP FUNCTION IF EXISTS are_friends(uuid, uuid);
DROP FUNCTION IF EXISTS get_friendship_status(uuid, uuid);
DROP FUNCTION IF EXISTS get_active_friends_sessions(uuid);
DROP FUNCTION IF EXISTS upsert_session_presence(uuid, uuid, session_status);
DROP FUNCTION IF EXISTS mark_session_offline(uuid, uuid);
DROP FUNCTION IF EXISTS cleanup_stale_sessions();
DROP FUNCTION IF EXISTS get_session_active_users(uuid);

-- Drop tables
DROP TABLE IF EXISTS active_sessions CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;

-- Drop enum type
DROP TYPE IF EXISTS session_status;
```

## Support

For issues or questions:
1. Check this documentation
2. Review the SQL migration files for implementation details
3. Check Supabase logs for error messages
4. Verify RLS policies are correctly configured
