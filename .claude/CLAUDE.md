# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Drikkescore is a real-time drinking session tracker with Blood Alcohol Content (BAC) calculation and leaderboards. It allows users to create/join drinking sessions, track drinks, calculate BAC using the Widmark formula with realistic absorption curves, and compete on live leaderboards.

**Key Features:**
- User authentication with physical profile data for BAC calculation
- Session management with join codes and QR scanning
- Real-time BAC tracking using two-phase absorption model (absorption + elimination)
- Friend system with social features
- Session history and analytics
- Admin panel for session management

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Database/Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **State Management:** TanStack Query (React Query v5) for server state
- **Styling:** Material UI (MUI) v7 + Emotion
- **Routing:** React Router DOM v7
- **Charts:** MUI X-Charts

## Development Commands

```bash
# Development
npm run dev              # Start development server with Vite

# Building
npm run build            # TypeScript check (tsc -b) + Vite build

# Linting
npm run lint             # Run ESLint with TypeScript rules

# Preview
npm run preview          # Preview production build locally
```

## Environment Setup

Create `.env` with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Architecture Overview

### State Management Strategy

**TanStack Query (React Query) is the primary state management solution:**
- All server state is managed through React Query queries and mutations
- Query keys are centralized in `src/lib/queryKeys.ts` for consistency
- Global query client configuration in `src/lib/queryClient.ts` (5min stale time, 10min cache)
- Supabase Realtime subscriptions work alongside React Query by invalidating queries

**Pattern:** Fetch with React Query → Invalidate on Realtime events → React Query refetches

### Authentication Flow

`AuthContext` (`src/context/AuthContext.tsx`) provides:
- User session state from Supabase Auth
- Profile data fetched via React Query
- Auth initialized on mount with `getUser()`, then `onAuthStateChange` listener
- **CRITICAL BUG FIX:** The `onAuthStateChange` callback MUST be synchronous (no async/await) to avoid Supabase JS deadlock where the next Supabase call hangs forever

### Data Layer Structure

**API Layer** (`src/api/`):
- Centralized API functions grouped by domain (users, friendships, activeSessions)
- Export functions that return promises, used by React Query hooks

**Custom Hooks** (`src/hooks/`):
- Hooks encapsulate React Query queries/mutations for specific features
- Examples: `useSession`, `useActiveSession`, `useFriends`, `useAnalytics`
- Hooks handle realtime subscriptions via `useSupabaseSubscription`

**Key Hooks:**
- `useSession(sessionId)` - Fetch session details, participants, drinks, leaderboard
- `useActiveSession(userId)` - Get user's current active session
- `useFriends(userId)` - Friend lists, pending requests, sent requests
- `useAnalytics(userId, period)` - Drink history analytics and calculations

### Realtime Pattern

Uses `useSupabaseSubscription` hook (`src/hooks/useSupabaseSubscription.ts`):
```typescript
useSupabaseSubscription(
  channelName,
  useCallback((channel) => {
    channel.on('postgres_changes', {...}, () => {
      queryClient.invalidateQueries({ queryKey: [...] });
    });
  }, [deps]),
  enabled
);
```

**Realtime events invalidate React Query cache → automatic refetch → UI updates**

### BAC Calculation

Located in `src/utils/bacCalculator.ts` - implements sophisticated Widmark formula:
- **Two-phase model:** Absorption phase (sigmoid curve) → Elimination phase (linear)
- Drink type inference from alcohol % (beer < 8%, wine 8-20%, spirits > 20%)
- Food consumption doubles absorption time
- Rapid consumption (chugging) reduces absorption to 5 minutes
- Separate BAC contribution calculated per drink, then summed

**Functions:**
- `calculateBAC(drinks, profile, currentTime)` - Main BAC calculation
- `calculateTimeToPeak(drinks)` - Minutes until BAC peaks
- `calculateTimeToSober(bac)` - Hours until sober

### Layout & Routing Structure

**Layouts:**
- `PublicLayout` - For login/register pages
- `ProtectedLayout` - Requires authentication, includes burger menu navigation
- `AdminLayout` - Requires admin role

**Guards:**
- `AdminGuard` - Checks `profile.role === 'admin'`

**Routes:**
- Public: `/login`, `/register`, `/join/:sessionId` (accessible without auth)
- Protected: `/`, `/session/:sessionId`, `/friends`, `/settings`, `/history`, `/analytics`
- Admin: `/admin`

### Component Organization

```
src/
├── components/
│   ├── admin/           # Admin dashboard components
│   ├── analytics/       # Analytics views and stats cards
│   ├── charts/          # MUI X-Charts wrappers
│   ├── friends/         # Friend system UI (lists, requests, add friend)
│   ├── legal/           # Disclaimer and privacy policy modals
│   ├── navigation/      # Burger menu with framer-motion animations
│   ├── notifications/   # Friend request notifications
│   ├── recap/           # Session recap modal
│   ├── session/         # QR codes, scanners, active users
│   └── settings/        # User settings components
├── pages/               # Top-level page components
├── layouts/             # Layout wrappers
├── guards/              # Route guards
├── hooks/               # Custom React hooks
├── api/                 # API layer functions
├── utils/               # Pure utility functions (BAC calc, helpers)
├── types/               # TypeScript types (database.ts for DB schema)
├── context/             # React Context (AuthContext)
└── lib/                 # Shared libraries (Supabase client, query config)
```

### Type System

`src/types/database.ts` defines all database schema types:
- `Profile` - User profiles with weight, height, gender, age for BAC
- `Session` - Drinking sessions with codes and time ranges
- `DrinkEntry` - Individual drinks with volume, alcohol %, timestamps
- `Friendship` - Friend relationships with status
- `LeaderboardEntry` - Computed type for session rankings

**Use these types everywhere** - they match the Supabase database schema exactly.

### Query Key Structure

Centralized in `src/lib/queryKeys.ts`:
```typescript
queryKeys.auth.profile(userId)
queryKeys.sessions.active(userId)
queryKeys.sessions.detail(sessionId)
queryKeys.sessions.drinks(sessionId)
queryKeys.friends.list(userId)
queryKeys.analytics.period(userId, period)
```

**Always use these keys** - never hardcode query keys. This ensures consistent invalidation across the app.

### Friend System

Friends can see each other's active sessions via `ActiveSessions` component. Uses:
- `useFriends` hook for friend lists
- `useActiveFriends` hook for friends currently in sessions
- Friend requests have pending/accepted/declined/blocked statuses
- Notifications managed by `FriendRequestNotificationManager`

### Session Presence Tracking

`useSessionPresence` hook tracks which users are actively viewing a session:
- Uses Supabase Realtime Presence API
- Updates `session_active_users` table via DB function
- Powers `ActiveUsersIndicator` component
- Tracks last seen timestamps

### Analytics System

Analytics (`src/pages/AnalyticsPage.tsx`) calculates:
- Total drinks, sessions, alcohol consumption
- BAC trends over time
- Calorie consumption from alcohol
- Spending estimates (using `DrinkPriceManager`)
- WHO guideline comparisons

Calculations in `src/utils/analyticsCalculator.ts`, `calorieCalculator.ts`, `spendingCalculator.ts`.

## Important Patterns & Conventions

### When to Use React Query

- **Always** use React Query for data fetching (never raw `useEffect` + `useState`)
- **Always** use mutations for writes, invalidate relevant queries on success
- Use `queryClient.invalidateQueries()` to trigger refetches after changes

### Supabase Patterns

- Single Supabase client instance exported from `src/lib/supabase.ts`
- Auth state managed in `AuthContext`, available via `useAuth()` hook
- RLS (Row Level Security) enforced on all tables - trust the database to handle permissions
- Realtime subscriptions must clean up on unmount (handled by `useSupabaseSubscription`)

### TypeScript Strictness

- Strict mode enabled - no implicit any
- All database types defined in `types/database.ts`
- Use proper null checks for optional data
- Prefer `type` over `interface` for simple types, `interface` for extensible objects

### MUI Theming

- Material UI v7 with Emotion for styling
- Theme defined in `src/index.css` (imported in main.tsx)
- Use MUI components for consistent design
- MUI X-Charts for data visualization

### Error Handling

- React Query handles loading/error states automatically
- Display errors using MUI Snackbar or inline error messages
- Log errors to console with context for debugging
- Profile missing error shows restore button (see `AuthContext.retryFetchProfile`)

## Common Gotchas

1. **Supabase Async Deadlock:** Never use `async/await` inside `onAuthStateChange` callback - it causes the next Supabase call to hang forever. Keep callback synchronous and handle async work in separate `useEffect`.

2. **Query Key Consistency:** Always use `queryKeys` from `src/lib/queryKeys.ts` - never hardcode strings. This ensures invalidations work correctly.

3. **Realtime Invalidations:** When using Supabase Realtime, always invalidate React Query cache - don't try to manually update cache. Let React Query refetch.

4. **BAC Calculation Timing:** BAC must be recalculated frequently as it changes over time. Use `refetchInterval: 5000` for queries involving BAC data.

5. **Session End Time:** Sessions have explicit start/end times. Handle expired sessions gracefully - they should be read-only.

6. **Profile Required:** Many features require complete profile data (weight, gender) for BAC calculation. Check `profile` exists before allowing drink tracking.

7. **RLS Policies:** Database has Row Level Security enabled. If queries fail unexpectedly, check RLS policies in Supabase - don't try to work around them in the client.

## Testing

Currently no automated tests configured. When adding tests:
- Use Vitest (Vite's test runner)
- Test BAC calculator utilities (`bacCalculator.ts`)
- Test React Query hooks with MSW for API mocking
- Security test file exists: `src/components/session/__tests__/QRScanner.security.test.ts`

## Deployment

- Built with Vite for production
- Deployed on Vercel (see `vercel.json` for config)
- Environment variables must be set in Vercel dashboard
- Database migrations in `supabase/` directory

## Database Schema

Full schema documented in Supabase project. Key tables:
- `profiles` - User data with BAC calculation parameters
- `sessions` - Drinking sessions with codes
- `session_participants` - Many-to-many join table
- `drink_entries` - Individual drink records
- `friendships` - Friend relationships
- `session_active_users` - Real-time presence tracking

Database functions:
- `generate_session_code()` - Creates unique 6-character session codes
- `update_session_active_users()` - Maintains presence tracking

## Admin Features

Admin users (role='admin' in profiles table) can:
- View all sessions in `AdminPage`
- Edit session details
- Delete sessions and their associated data
- Access via `/admin` route (guarded by `AdminGuard`)

## Security Considerations

- QR scanner has input validation to prevent XSS (see `QRScanner.security.test.ts`)
- RLS policies enforce data access control at database level
- Session codes are 6 characters (alphanumeric) - sufficient entropy for short-lived sessions
- Auth tokens handled by Supabase Auth SDK
- CORS configured in Supabase project settings
