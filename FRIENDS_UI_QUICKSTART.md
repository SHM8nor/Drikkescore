# Friends UI - Quick Start Guide

## What Was Built

A complete friends management interface with:
- ✅ User search by name
- ✅ Send/accept/decline friend requests
- ✅ Remove friends
- ✅ Real-time updates
- ✅ Navigation integration with badge notifications
- ✅ Mobile-responsive design

## Access the Feature

1. **Start the app**:
   ```bash
   npm run dev
   ```

2. **Navigate to Friends page**:
   - Click the burger menu (top-left)
   - Click "Venner" (Friends)
   - Or navigate directly to: `http://localhost:5176/friends`

## The Friends Page

The page has **5 tabs**:

### Tab 1: Mine venner (My Friends)
- Shows all your accepted friends
- Click "Fjern" to remove a friend (with confirmation)
- Empty state if no friends yet

### Tab 2: Forespørsler (Friend Requests)
- Shows incoming friend requests
- Red badge indicates pending count
- Click "Aksepter" to accept
- Click "Avslå" to decline

### Tab 3: Sendt (Sent Requests)
- Shows outgoing friend requests
- Yellow badge indicates sent count
- Click "Kanseller" to cancel a sent request

### Tab 4: Legg til (Add Friend) ⭐ NEW
- **Search users by name** (minimum 2 characters)
- See real-time friendship status:
  - **Green "Venner"** = Already friends
  - **Yellow "Avventer"** = Request pending
  - **Blue badge** = They sent you a request
  - **"Legg til" button** = Send friend request
- Instant feedback when sending requests

### Tab 5: Spiller nå (Playing Now)
- Shows which friends are in active sessions
- See session details and join them
- Status indicators (active/idle)

## Key Features

### Real-Time Updates
- Friend requests update automatically
- Badge counts update instantly
- No page refresh needed

### User Search
```
Type: "Jo"
Results show: "John", "Jonas", "Jostein", etc.
         with their friendship status
```

### Navigation Badge
- Red badge on "Venner" menu item shows pending request count
- Updates in real-time
- Click to go directly to requests

## API Functions Available

If building features that need friend functionality:

```typescript
import { useFriends } from '../hooks/useFriends';
import { searchUsers } from '../api';

// In your component:
const {
  friends,           // List of accepted friends
  pendingRequests,   // Incoming requests
  sentRequests,      // Outgoing requests
  friendCount,       // Number of friends
  pendingCount,      // Number of pending requests
  loading,           // Loading state
  error,             // Error message

  // Actions:
  sendRequest,       // Send friend request
  acceptRequest,     // Accept incoming request
  declineRequest,    // Decline incoming request
  cancelRequest,     // Cancel sent request
  unfriend,          // Remove friend
  refresh,           // Reload data
} = useFriends();

// Search for users
const results = await searchUsers('john'); // Returns up to 10 matches
```

## Testing the Feature

### Test Scenario 1: Add a Friend
1. Go to "Legg til" tab
2. Type a name (e.g., "Test")
3. Click "Legg til" on a user
4. Verify:
   - Button changes to "Avventer"
   - "Sendt" tab badge increases
   - Navigation badge updates

### Test Scenario 2: Accept a Request
1. Have someone send you a request (or use another account)
2. See red badge on menu and "Forespørsler" tab
3. Go to "Forespørsler" tab
4. Click "Aksepter"
5. Verify:
   - User moves to "Mine venner" tab
   - Badge count decreases
   - Real-time update (no refresh needed)

### Test Scenario 3: Remove a Friend
1. Go to "Mine venner" tab
2. Click "Fjern" on a friend
3. Confirm in dialog
4. Verify:
   - Friend removed from list
   - Can search and re-add them

## File Locations

### Main Components
- **Page**: `src/pages/FriendsPage.tsx`
- **Search**: `src/components/friends/AddFriend.tsx`
- **Friends List**: `src/components/friends/FriendsList.tsx`
- **Requests**: `src/components/friends/PendingRequests.tsx` & `SentRequests.tsx`

### API & Hooks
- **User Search**: `src/api/users.ts`
- **Friends Hook**: `src/hooks/useFriends.ts`
- **Friendship API**: `src/api/friendships.ts`

### Navigation
- **Menu**: `src/components/navigation/BurgerMenu/BurgerMenu.tsx`
- **Route**: `src/App.tsx` (line 36)

## Troubleshooting

### Search returns no results
- Check minimum 2 characters
- Verify user exists in database
- Check profiles table has data

### Requests not updating
- Check Supabase connection
- Verify real-time subscriptions enabled
- Check browser console for errors

### Badge not showing
- Verify `useFriends()` hook in BurgerMenu
- Check pendingCount value
- Refresh the page

## Database Schema

The feature uses these tables:
- **profiles** - User information
- **friendships** - Friend relationships (status: pending/accepted/declined)

RLS policies ensure users can only:
- Search all profiles (read-only)
- Manage their own friendships

## Next Steps (Optional Enhancements)

1. **Email search** - Search by email in addition to name
2. **Friend suggestions** - Show mutual friends or common sessions
3. **Bulk operations** - Accept multiple requests at once
4. **Notifications** - Push notifications for new requests
5. **Activity feed** - See what friends are doing

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database migrations are applied
3. Check Supabase dashboard for data
4. Review `FRIENDS_UI_IMPLEMENTATION_SUMMARY.md` for details
5. See `FRIENDS_UI_ARCHITECTURE.md` for technical details

---

**Status**: ✅ Fully implemented and production-ready

**Test URL**: http://localhost:5176/friends

**Last Updated**: 2025-11-04
