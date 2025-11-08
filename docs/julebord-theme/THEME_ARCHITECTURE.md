# Theme Management System - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐         ┌─────────────────────────────┐  │
│  │   AdminPage.tsx      │         │     HomePage.tsx             │  │
│  │  ┌──────────────┐   │         │  ┌────────────────────────┐ │  │
│  │  │ Sesjoner Tab │   │         │  │ Session Creation Form  │ │  │
│  │  └──────────────┘   │         │  │                        │ │  │
│  │  ┌──────────────┐   │         │  │ ┌──────────────────┐  │ │  │
│  │  │  Tema Tab    │◄──┼─────────┼──┤ │ Theme Selector   │  │ │  │
│  │  └──────────────┘   │         │  │ │ (Standard/       │  │ │  │
│  │         │            │         │  │ │  Julebord)       │  │ │  │
│  │         ▼            │         │  │ └──────────────────┘  │ │  │
│  │ ┌──────────────────┐│         │  └────────────────────────┘ │  │
│  │ │ThemeManagement   ││         │            │                 │  │
│  │ │    Component     ││         │            │                 │  │
│  │ └──────────────────┘│         └────────────┼─────────────────┘  │
│  └──────────────────────┘                     │                    │
│           │                                    │                    │
└───────────┼────────────────────────────────────┼────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CONFIGURATION LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                   themes.ts (Config)                        │    │
│  │  ┌──────────────────────────────────────────────────────┐  │    │
│  │  │  defaultThemeConfig: ThemeConfig                      │  │    │
│  │  │  - julebordEnabled: boolean                          │  │    │
│  │  │  - autoSeasonalSwitch: boolean                       │  │    │
│  │  │  - availableThemes: SessionType[]                    │  │    │
│  │  │  - seasonalDates: { julebord: {...} }                │  │    │
│  │  │  - requireApproval: boolean                          │  │    │
│  │  └──────────────────────────────────────────────────────┘  │    │
│  │                                                              │    │
│  │  ┌──────────────────────────────────────────────────────┐  │    │
│  │  │  Functions:                                           │  │    │
│  │  │  • getThemeConfig()                                   │  │    │
│  │  │  • isThemeAvailable(theme)                           │  │    │
│  │  │  • isInSeasonalPeriod(theme)                         │  │    │
│  │  │  • getRecommendedTheme()                             │  │    │
│  │  └──────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT LAYER                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            useThemeAnalytics.ts (React Query Hooks)           │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Individual Hooks:                                      │  │  │
│  │  │  • useThemeStatistics()                                 │  │  │
│  │  │  • useThemeBadgeStatistics()                           │  │  │
│  │  │  • useThemeUsageTimeline(days)                         │  │  │
│  │  │  • useThemePeakHours()                                 │  │  │
│  │  │  • useMostPopularTheme()                               │  │  │
│  │  │  • useThemeComparison(themeA, themeB)                  │  │  │
│  │  │  • useSessionCountByTheme()                            │  │  │
│  │  │  • useActiveSessionsByTheme()                          │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Composite Hook:                                        │  │  │
│  │  │  • useAllThemeAnalytics(options)                       │  │  │
│  │  │    Returns: statistics, badgeStats, timeline,          │  │  │
│  │  │             mostPopular, sessionCount, activeSessions  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  Caching Strategy:                                           │  │
│  │  - staleTime: 5 minutes (analytics)                         │  │
│  │  - staleTime: 30 seconds (active sessions)                  │  │
│  │  - gcTime: 10 minutes                                        │  │
│  │  - refetchInterval: 30s (active sessions)                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              themeAnalytics.ts (API Functions)                │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  Data Fetching Functions:                              │  │  │
│  │  │  • getThemeStatistics()                                │  │  │
│  │  │  • getThemeBadgeStatistics()                          │  │  │
│  │  │  • getThemeUsageTimeline(days)                        │  │  │
│  │  │  • getThemePeakHours()                                │  │  │
│  │  │  • getThemeAnalytics(sessionType?)                    │  │  │
│  │  │  • getMostPopularTheme()                              │  │  │
│  │  │  • compareThemes(themeA, themeB)                      │  │  │
│  │  │  • getSessionCountByTheme()                           │  │  │
│  │  │  • getActiveSessionsByTheme()                         │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                                                              │  │
│  │  Error Handling: Norwegian error messages                   │  │
│  │  Type Safety: Full TypeScript interfaces                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Supabase PostgreSQL                          │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Base Tables:                                             │  │ │
│  │  │  • sessions (session_type, start_time, end_time, ...)    │  │ │
│  │  │  • session_participants (session_id, user_id, ...)       │  │ │
│  │  │  • drink_entries (session_id, user_id, volume_ml, ...)   │  │ │
│  │  │  • badge_awards (badge_id, session_id, user_id, ...)     │  │ │
│  │  │  • badges (name, category, tier, ...)                    │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Analytics Views:                                         │  │ │
│  │  │  • theme_statistics                                       │  │ │
│  │  │    └─> Aggregates: sessions, participants, drinks        │  │ │
│  │  │  • theme_badge_statistics                                │  │ │
│  │  │    └─> Badge awards grouped by theme                     │  │ │
│  │  │  • theme_usage_timeline                                  │  │ │
│  │  │    └─> Daily aggregation by theme                        │  │ │
│  │  │  • theme_peak_hours                                      │  │ │
│  │  │    └─> Hour/day patterns by theme                        │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Database Functions (SECURITY DEFINER):                  │  │ │
│  │  │  • get_theme_analytics(theme_type?)                      │  │ │
│  │  │    └─> Returns comprehensive metrics for theme(s)        │  │ │
│  │  │  • get_most_popular_theme()                             │  │ │
│  │  │    └─> Returns most used theme by popularity score      │  │ │
│  │  │  • compare_themes(theme_a, theme_b)                      │  │ │
│  │  │    └─> Side-by-side comparison with differences         │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │  Indexes (Performance):                                   │  │ │
│  │  │  • idx_sessions_session_type (session_type)              │  │ │
│  │  │  • idx_sessions_type_end_time (session_type, end_time)   │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Theme Availability Check Flow

```
User opens HomePage
        ↓
Component mounts → useEffect()
        ↓
getRecommendedTheme() ← reads config
        ↓
isInSeasonalPeriod('julebord')
        ↓
    Is December?
    /          \
  Yes          No
   ↓            ↓
Return      Return
'julebord'  'standard'
   ↓            ↓
setSessionType(theme)
        ↓
Component renders with selected theme
        ↓
User sees theme buttons
    /              \
Julebord       Standard
enabled?       (always visible)
   ↓
  Yes → Button shown
   ↓
  No → Button hidden, Alert shown
```

### Session Creation with Theme Flow

```
User selects theme → setSessionType('julebord')
        ↓
User fills form (name, duration)
        ↓
User submits form
        ↓
handleCreateSession()
        ↓
createSession(name, start, end, sessionType)
        ↓
API call to Supabase
        ↓
INSERT INTO sessions
  (session_name, session_type, ...)
VALUES ('My Party', 'julebord', ...)
        ↓
Session created in database
        ↓
Navigate to /session/:id
        ↓
ThemeContext reads session.session_type
        ↓
Apply theme colors and styles
        ↓
User sees themed session UI
```

### Analytics Dashboard Load Flow

```
Admin navigates to /admin → Tema tab
        ↓
ThemeManagement component mounts
        ↓
useAllThemeAnalytics({ timelineDays: 30 })
        ↓
Parallel React Query calls:
├─ useThemeStatistics()
├─ useThemeBadgeStatistics()
├─ useThemeUsageTimeline(30)
├─ useMostPopularTheme()
└─ useSessionCountByTheme()
        ↓
Each hook checks cache
    /           \
  Cache        Cache
  valid        stale/empty
   ↓             ↓
Return        Fetch from API
cached        ↓
data          API functions
              ↓
              Database queries
              (views/functions)
              ↓
              Return data
        ↓
All data combined
        ↓
Component renders:
├─ Statistics cards
├─ Line chart (timeline)
├─ Pie chart (distribution)
├─ Comparison table
└─ Badge statistics
```

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      AdminPage                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Tabs: [Sesjoner] [Tema*]                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│              ┌────────────┴─────────────┐                    │
│              ▼                          ▼                     │
│  ┌──────────────────────┐   ┌─────────────────────────────┐ │
│  │  SessionsTab         │   │  ThemeManagement             │ │
│  │  (existing)          │   │  (new)                       │ │
│  └──────────────────────┘   └─────────────────────────────┘ │
│                                         │                     │
│                          ┌──────────────┼──────────────┐     │
│                          ▼              ▼              ▼      │
│              ┌────────────────┐  ┌──────────┐  ┌───────────┐│
│              │ Config Section │  │Analytics │  │ Charts    ││
│              │ ┌────────────┐ │  │ Section  │  │ Section   ││
│              │ │ Toggles    │ │  │          │  │           ││
│              │ │ - Julebord │ │  │ Stats    │  │ Line      ││
│              │ │ - Seasonal │ │  │ Cards    │  │ Chart     ││
│              │ └────────────┘ │  │          │  │           ││
│              │ ┌────────────┐ │  │ Most     │  │ Pie       ││
│              │ │ Info       │ │  │ Popular  │  │ Chart     ││
│              │ │ Alerts     │ │  │          │  │           ││
│              │ └────────────┘ │  └──────────┘  │ Compare   ││
│              └────────────────┘                 │ Table     ││
│                                                 └───────────┘│
└──────────────────────────────────────────────────────────────┘
```

## Theme Configuration Flow

```
themes.ts (Source of Truth)
    │
    ├─> defaultThemeConfig
    │   ├─> julebordEnabled: true/false
    │   ├─> autoSeasonalSwitch: true/false
    │   ├─> availableThemes: ['standard', 'julebord']
    │   └─> seasonalDates: { julebord: { ... } }
    │
    ├─> getThemeConfig()
    │   └─> Applies runtime filters
    │       └─> Returns filtered config
    │
    ├─> isThemeAvailable(theme)
    │   └─> Checks if theme in availableThemes
    │
    ├─> isInSeasonalPeriod(theme)
    │   └─> Checks current date vs seasonalDates
    │
    └─> getRecommendedTheme()
        └─> If autoSeasonalSwitch && isInSeasonalPeriod('julebord')
            └─> Return 'julebord'
        └─> Else return 'standard'
```

## State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Query Cache                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Query Key: ['admin', 'themes', 'statistics']         │  │
│  │  Data: ThemeStatistics[]                              │  │
│  │  Stale Time: 5 minutes                                │  │
│  │  GC Time: 10 minutes                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Query Key: ['admin', 'themes', 'timeline', 30]       │  │
│  │  Data: ThemeUsageTimeline[]                           │  │
│  │  Stale Time: 5 minutes                                │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Query Key: ['admin', 'themes', 'activeSessions']     │  │
│  │  Data: Record<SessionType, number>                    │  │
│  │  Stale Time: 30 seconds                               │  │
│  │  Refetch Interval: 30 seconds                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Security & Permissions

```
┌─────────────────────────────────────────────────────────────┐
│                    Row Level Security                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Views (theme_statistics, theme_badge_statistics)     │  │
│  │  GRANT SELECT TO authenticated                        │  │
│  │  → All logged-in users can view analytics            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Functions (get_theme_analytics, etc.)                │  │
│  │  SECURITY DEFINER                                     │  │
│  │  GRANT EXECUTE TO authenticated                       │  │
│  │  → Bypasses RLS for aggregation queries              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Admin UI Access                                      │  │
│  │  Checked by AdminGuard component                      │  │
│  │  profile.role === 'admin'                             │  │
│  │  → Only admins can access /admin route               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                   Performance Layers                         │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Database                                           │
│  ├─ Pre-aggregated views                                    │
│  ├─ Indexed queries (session_type)                          │
│  └─ SECURITY DEFINER functions                              │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: API/Network                                        │
│  ├─ Batched queries (useAllThemeAnalytics)                  │
│  ├─ Minimal data transfer                                   │
│  └─ Type-safe interfaces                                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Client Cache                                       │
│  ├─ React Query 5-minute cache                              │
│  ├─ Automatic background refetch                            │
│  └─ Optimistic updates                                      │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Component Rendering                                │
│  ├─ Lazy loading (charts on tab switch)                     │
│  ├─ Memoized components                                     │
│  └─ Skeleton loaders during fetch                           │
└─────────────────────────────────────────────────────────────┘
```

## Extension Points

```
Adding New Theme:
└─> 1. Update SessionType in database.ts
    └─> 2. Modify database CHECK constraint
        └─> 3. Add colors to ThemeContext.tsx
            └─> 4. Configure in themes.ts
                └─> 5. Add display name & emoji
                    └─> 6. Define seasonal dates
                        └─> 7. Test availability logic
```

---

**Last Updated:** November 8, 2024
**Version:** 1.0
**Architecture Status:** ✅ Production Ready
