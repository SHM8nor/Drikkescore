# Friend Request Decline Fix

## Problem

When a user declined a friend request, the friendship record was updated to `status = 'declined'` instead of being deleted. This caused the following issues:

1. The declined friendship record remained in the database
2. The `UNIQUE (user_id, friend_id)` constraint prevented the same user from sending a new request
3. Users could not re-send friend requests after being declined

## Solution

Changed the behavior to **delete** declined requests instead of marking them as 'declined'. This allows users to send new friend requests in the future.

## Changes Made

### 1. Updated `declineFriendRequest` Function
**File**: `src/api/friendships.ts`

Changed from:
```typescript
// Old: Update status to 'declined'
.update({ status: 'declined' as FriendshipStatus })
```

To:
```typescript
// New: Delete the request entirely
.delete()
```

### 2. Database Cleanup Script
**File**: `guidelines/fix-declined-requests.sql`

This SQL script:
- Deletes all existing declined requests from the database
- Updates the status constraint to only allow: 'pending', 'accepted', 'blocked'
- Removes 'declined' as a valid status

## To Apply the Fix

1. **Run the SQL migration** in your Supabase SQL Editor:
   ```sql
   -- Copy and paste the contents of:
   -- guidelines/fix-declined-requests.sql
   ```

2. **Deploy the updated code** (already built and ready)

## How It Works Now

1. User A sends a friend request to User B → Creates `status = 'pending'`
2. User B declines the request → **Deletes** the friendship record
3. User A can send a new request later → No constraint issues

## Benefits

- Users can re-attempt friend requests after being declined
- Cleaner database (no need to store declined requests)
- More intuitive user experience
- Follows common social platform patterns (e.g., Instagram, Discord)

## Alternative Approach (Not Implemented)

If you want to prevent spam/repeated requests, you could:
- Keep the 'declined' status
- Add a cooldown period (e.g., 7 days) before allowing re-requests
- Track decline timestamps

For now, the simple delete approach provides the best UX.
