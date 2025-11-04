# Friends UI Architecture

## Component Hierarchy

```
App.tsx
└── ProtectedLayout
    └── BurgerMenu (with Friends link + badge)
        └── /friends route
            └── FriendsPage
                ├── Tab 0: Mine venner (FriendsExample)
                │   ├── Friends List
                │   ├── Pending Requests
                │   ├── Sent Requests
                │   └── Active Friends Sessions
                │
                ├── Tab 1: Forespørsler
                │   └── PendingRequests
                │       └── List of incoming requests
                │           ├── Accept button
                │           └── Decline button
                │
                ├── Tab 2: Sendt
                │   └── SentRequests
                │       └── List of outgoing requests
                │           └── Cancel button
                │
                ├── Tab 3: Legg til ⭐ NEW
                │   └── AddFriend
                │       ├── Search Input
                │       └── Search Results
                │           ├── User Avatar
                │           ├── User Name
                │           └── Action Button
                │               ├── "Legg til" (send request)
                │               ├── "Venner" (already friends)
                │               ├── "Avventer" (pending)
                │               └── "Forespørsel mottatt"
                │
                └── Tab 4: Spiller nå
                    └── Active Friends Info
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Supabase Database                     │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │   profiles   │  │  friendships  │  │ active_sessions│   │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │  users.ts    │  │ friendships.ts│  │activeSessions│    │
│  │  • searchUsers│  │• sendRequest  │  │.ts           │    │
│  │  • getProfile │  │• acceptRequest│  │• getActive   │    │
│  └──────────────┘  │• declineReq   │  │  Friends     │    │
│                    │• removeFriend │  └──────────────┘    │
│                    └───────────────┘                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        Hooks Layer                           │
│                   ┌──────────────┐                          │
│                   │ useFriends() │                          │
│                   │              │                          │
│                   │ • friends    │                          │
│                   │ • pending    │                          │
│                   │ • sent       │                          │
│                   │ • loading    │                          │
│                   │ • error      │                          │
│                   │              │                          │
│                   │ Actions:     │                          │
│                   │ • sendRequest│                          │
│                   │ • accept     │                          │
│                   │ • decline    │                          │
│                   │ • cancel     │                          │
│                   │ • unfriend   │                          │
│                   └──────────────┘                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Component Layer                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FriendsPage (Container)                  │  │
│  │  • Tab state management                              │  │
│  │  • Error handling                                    │  │
│  │  • Loading states                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│           │                                                  │
│           ├─► FriendsExample (Tab 0)                       │
│           ├─► PendingRequests (Tab 1)                      │
│           ├─► SentRequests (Tab 2)                         │
│           ├─► AddFriend (Tab 3) ⭐ NEW                     │
│           └─► ActiveFriendsInfo (Tab 4)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## User Search Flow (AddFriend Component)

```
User Input
    │
    ▼
┌─────────────────┐
│ Search Input    │
│ (min 2 chars)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Debounce Wait   │
│ (prevent spam)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ API: searchUsers(query) │
│ • Query profiles table  │
│ • Exclude current user  │
│ • ILIKE %query%        │
│ • Limit 10 results     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Get Friendship Status for Each │
│ • Check friends array           │
│ • Check sentRequests array      │
│ • Check pendingRequests array   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Display Results         │
│ For each user:          │
│  • Avatar               │
│  • Name                 │
│  • Status Badge/Button  │
└─────────────────────────┘
```

## Friend Request Flow

```
┌──────────────┐
│ User clicks  │
│ "Legg til"   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ sendFriendRequest()  │
│ • Validate IDs       │
│ • Check existing     │
│ • Insert friendship  │
│   status: 'pending'  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Real-time Update     │
│ • Supabase triggers  │
│ • useFriends() hook  │
│ • UI refreshes       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Update UI            │
│ • Change button to   │
│   "Avventer"         │
│ • Update badge count │
│ • Refresh search     │
└──────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────┐
│           useFriends() Hook State           │
├─────────────────────────────────────────────┤
│ Data State:                                 │
│  • friends: Friend[]                        │
│  • pendingRequests: FriendRequest[]        │
│  • sentRequests: SentFriendRequest[]       │
│                                             │
│ UI State:                                   │
│  • loading: boolean                         │
│  • error: string | null                     │
│                                             │
│ Computed:                                   │
│  • friendCount: number                      │
│  • pendingCount: number                     │
│  • sentCount: number                        │
│                                             │
│ Actions:                                    │
│  • sendRequest(friendId)                   │
│  • acceptRequest(friendshipId)             │
│  • declineRequest(friendshipId)            │
│  • cancelRequest(friendshipId)             │
│  • unfriend(friendId)                      │
│  • checkFriendship(friendId)               │
│  • getStatus(friendId)                     │
│  • refresh()                                │
│  • clearError()                             │
└─────────────────────────────────────────────┘
```

## Real-time Subscriptions

```
Supabase Real-time
        │
        ▼
┌───────────────────────┐
│ subscribeFriendships()│
│ • Listen to INSERT    │
│ • Listen to UPDATE    │
│ • Listen to DELETE    │
└──────────┬────────────┘
           │
           ▼
┌──────────────────────┐
│ Callback Handler     │
│ • loadData()         │
│ • Update state       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ UI Auto-updates      │
│ • Lists refresh      │
│ • Badges update      │
│ • Status changes     │
└──────────────────────┘
```

## API Endpoints Used

### User Search API
```typescript
// Search users by name
GET /profiles
  .select('id, full_name, avatar_url')
  .neq('id', currentUser.id)
  .ilike('full_name', `%${query}%`)
  .limit(10)
```

### Friendship API
```typescript
// Send friend request
POST /friendships
  { user_id, friend_id, status: 'pending' }

// Accept request
PATCH /friendships/:id
  { status: 'accepted' }

// Decline request
PATCH /friendships/:id
  { status: 'declined' }

// Cancel/Remove
DELETE /friendships/:id
```

## Navigation Structure

```
BurgerMenu
├── Hjem (/)
├── Venner (/friends) 🔴 Badge if pendingCount > 0
│   └── FriendsPage
│       ├── Tab 0: Mine venner
│       ├── Tab 1: Forespørsler 🔴 Badge
│       ├── Tab 2: Sendt ⚠️ Badge
│       ├── Tab 3: Legg til ⭐ NEW
│       └── Tab 4: Spiller nå
├── Historikk (/history)
├── Analyse (/analytics)
└── Innstillinger (/settings)
```

## Styling System

```
Design System Variables
├── Colors
│   ├── --prussian-blue: #003049 (Primary)
│   ├── --fire-engine-red: #d62828 (Danger)
│   ├── --orange-wheel: #f77f00 (Warning)
│   └── --xanthous: #fcbf49 (Accent)
│
├── Spacing
│   ├── --spacing-xs: 4px
│   ├── --spacing-sm: 8px
│   ├── --spacing-md: 16px
│   └── --spacing-lg: 24px
│
├── Typography
│   ├── --font-size-base: 16px
│   ├── --font-size-small: 14px
│   └── --font-weight-medium: 500
│
└── Effects
    ├── --shadow-sm: subtle shadow
    ├── --shadow-md: medium shadow
    └── --transition-base: 250ms ease
```

## File Structure

```
src/
├── api/
│   ├── index.ts (exports all API functions)
│   ├── users.ts ⭐ NEW (search, getProfile)
│   ├── friendships.ts (friend CRUD operations)
│   └── activeSessions.ts (presence tracking)
│
├── components/
│   ├── navigation/
│   │   └── BurgerMenu/
│   │       └── BurgerMenu.tsx (Friends link with badge)
│   │
│   └── friends/
│       ├── AddFriend.tsx ⭐ (User search)
│       ├── FriendsList.tsx (Display friends)
│       ├── PendingRequests.tsx (Incoming)
│       ├── SentRequests.tsx (Outgoing)
│       ├── FriendsExample.tsx (Comprehensive)
│       ├── ActiveSessions.tsx (Live friends)
│       └── index.ts
│
├── hooks/
│   ├── useFriends.ts (Main friends hook)
│   ├── useActiveFriends.ts (Active sessions)
│   └── useSessionPresence.ts (Presence)
│
├── pages/
│   └── FriendsPage.tsx ⭐ UPDATED (Added Tab 3)
│
├── types/
│   └── database.ts (TypeScript types)
│
└── App.tsx (Route: /friends)
```

## Security & Validation

```
Input Validation
├── Search Query
│   ├── Min length: 2 chars
│   ├── Max length: 100 chars
│   └── Sanitized for SQL
│
├── User IDs
│   ├── UUID format validation
│   ├── Non-empty check
│   └── Not self-reference
│
└── Friendship Operations
    ├── Authentication required
    ├── Authorization check (RLS)
    └── Duplicate prevention
```

## Performance Considerations

```
Optimizations
├── Search
│   ├── Debounced input (300ms)
│   ├── Limited results (10 max)
│   └── Indexed database columns
│
├── Rendering
│   ├── Memoized callbacks
│   ├── Lazy tab loading
│   └── Virtual scrolling (future)
│
└── Network
    ├── Optimistic updates
    ├── Request deduplication
    └── Connection pooling
```

This architecture provides a scalable, maintainable, and performant friends management system fully integrated with the Drikkescore app.
