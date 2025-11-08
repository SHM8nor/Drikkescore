# Theme Management System

## Overview

The theme management system allows administrators to control session themes (e.g., julebord/Christmas theme), configure seasonal auto-switching, and view comprehensive analytics about theme usage.

## Architecture

### Components

1. **Theme Configuration** (`src/config/themes.ts`)
   - Central configuration file with feature flags
   - Seasonal date management
   - Theme availability controls
   - Auto-seasonal switching logic

2. **Database Analytics** (`supabase/migrations/20251108190000_theme_analytics.sql`)
   - Views for theme statistics
   - Badge statistics by theme
   - Timeline analysis
   - Peak usage patterns
   - Database functions for comprehensive analytics

3. **API Layer** (`src/api/themeAnalytics.ts`)
   - Centralized API functions for theme data
   - Type-safe interfaces
   - Error handling

4. **React Query Hooks** (`src/hooks/useThemeAnalytics.ts`)
   - Custom hooks for theme analytics
   - Caching and automatic refetching
   - Composite hooks for dashboard

5. **Admin UI** (`src/components/admin/ThemeManagement.tsx`)
   - Theme control toggles
   - Analytics dashboard
   - Charts and visualizations
   - Theme comparison tools

6. **Admin Page Integration** (`src/pages/AdminPage.tsx`)
   - Tabbed interface (Sessions | Tema)
   - Integrated theme management panel

## Features

### Theme Controls

#### Enable/Disable Julebord Theme
Admins can globally enable or disable the julebord theme:
- When **enabled**: Users can create julebord sessions
- When **disabled**: Julebord option is hidden from session creation

#### Automatic Seasonal Switching
Configure automatic theme activation based on dates:
- **Auto-enable in December**: Julebord theme automatically becomes the default from Dec 1-31
- Configurable seasonal date ranges
- Respects feature flags (won't activate if theme is disabled)

### Analytics Dashboard

The admin panel provides comprehensive analytics:

#### Statistics Overview
- Total sessions by theme
- Active sessions count
- Participant counts
- Drink statistics
- Average participants per session

#### Most Popular Theme
- Identifies the most-used theme
- Popularity scoring based on sessions and participants
- Visual indicators

#### Usage Trends
- **Line Chart**: Session creation over time by theme
- **Pie Chart**: Session distribution by theme type
- Configurable time periods (7, 30, 90 days)

#### Theme Comparison
- Side-by-side metric comparison
- Percentage differences
- Visual color coding for increases/decreases

#### Badge Statistics
- Badge awards grouped by theme
- Shows which badges are earned in themed sessions
- Unique recipient counts
- Sessions with award activity

## Configuration Guide

### Enabling/Disabling Themes

Edit `src/config/themes.ts`:

```typescript
export const defaultThemeConfig: ThemeConfig = {
  // Enable julebord theme (set to false to disable globally)
  julebordEnabled: true,

  // Auto-enable julebord during December
  autoSeasonalSwitch: true,

  // Available themes (will be filtered based on julebordEnabled flag)
  availableThemes: ['standard', 'julebord'],

  // Seasonal dates (auto-updated each year)
  seasonalDates: getSeasonalDates(),

  // Require admin approval for themed sessions (not implemented yet)
  requireApproval: false,
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `julebordEnabled` | boolean | `true` | Global on/off switch for julebord theme |
| `autoSeasonalSwitch` | boolean | `true` | Auto-enable theme during seasonal period |
| `availableThemes` | SessionType[] | `['standard', 'julebord']` | List of available themes |
| `seasonalDates.julebord` | {start: Date, end: Date} | Dec 1 - Dec 31 | Date range for julebord season |
| `requireApproval` | boolean | `false` | Require admin approval (future feature) |

### Seasonal Dates

Seasonal dates are automatically calculated for the current year:
- **Julebord**: December 1 - December 31

To customize, modify the `getSeasonalDates()` function in `themes.ts`.

## Database Schema

### Views

#### `theme_statistics`
Aggregated statistics by theme type:
- `session_type`
- `total_sessions`
- `total_participants`
- `active_sessions`
- `total_drinks`
- `avg_participants_per_session`
- `first_session_created`
- `last_session_created`

#### `theme_badge_statistics`
Badge awards grouped by theme:
- `session_type`
- `category`
- `total_awards`
- `unique_recipients`
- `sessions_with_awards`
- `badge_name`
- `badge_id`

#### `theme_usage_timeline`
Daily aggregation of theme usage:
- `date`
- `session_type`
- `sessions_created`
- `unique_participants`
- `total_drinks`

#### `theme_peak_hours`
Peak usage patterns:
- `session_type`
- `hour_of_day` (0-23)
- `sessions_started`
- `participants`
- `day_of_week` (0=Sunday, 6=Saturday)

### Functions

#### `get_theme_analytics(theme_type?)`
Comprehensive theme analytics with optional filtering.

**Returns:**
- `session_type`
- `total_sessions`
- `active_sessions`
- `total_participants`
- `total_drinks`
- `avg_participants_per_session`
- `avg_drinks_per_session`
- `first_session_created`
- `last_session_created`
- `most_popular_badge_name`
- `most_popular_badge_awards`

#### `get_most_popular_theme()`
Returns the most popular theme based on usage metrics.

**Returns:**
- `session_type`
- `total_sessions`
- `total_participants`
- `popularity_score`

#### `compare_themes(theme_a, theme_b)`
Side-by-side comparison of two themes.

**Returns:**
- `metric_name`
- `theme_a_value`
- `theme_b_value`
- `difference`
- `percent_difference`

## Usage

### Accessing Theme Management

1. Log in as an admin user
2. Navigate to Admin panel (`/admin`)
3. Click the "Tema" tab
4. View analytics and adjust settings

### Creating Sessions with Themes

Users see theme options on the home page when creating sessions:
- Standard theme is always available
- Julebord theme appears only when enabled
- Recommended theme is pre-selected based on seasonal settings

### Session Creation Flow

1. User navigates to home page
2. Clicks "Create Session"
3. Selects theme (if multiple available)
4. Sees theme preview with color palette
5. Creates session with chosen theme
6. Session uses theme colors and badges

## API Reference

### Theme Configuration

```typescript
import {
  getThemeConfig,
  isThemeAvailable,
  getRecommendedTheme,
  isInSeasonalPeriod
} from '../config/themes';

// Get current configuration
const config = getThemeConfig();

// Check if theme is available
const available = isThemeAvailable('julebord');

// Get recommended theme based on season
const recommended = getRecommendedTheme();

// Check if in seasonal period
const isSeason = isInSeasonalPeriod('julebord');
```

### Analytics Hooks

```typescript
import {
  useThemeStatistics,
  useThemeBadgeStatistics,
  useThemeUsageTimeline,
  useAllThemeAnalytics
} from '../hooks/useThemeAnalytics';

// Get all analytics data
const {
  statistics,
  badgeStats,
  timeline,
  mostPopular,
  isLoading,
  error
} = useAllThemeAnalytics({ timelineDays: 30 });
```

## Data Flow

```
User Action (Admin UI)
    ↓
Toggle Theme Setting (Local State)
    ↓
Configuration Updated (themes.ts)
    ↓
HomePage Reads Config
    ↓
Theme Options Filtered
    ↓
User Creates Session
    ↓
Database Stores session_type
    ↓
Analytics Views Update
    ↓
Admin Dashboard Refreshes
```

## Performance Considerations

### Caching Strategy

- **Theme Statistics**: 5-minute stale time
- **Active Sessions**: 30-second refresh interval
- **Timeline Data**: 5-minute cache
- **Badge Statistics**: 5-minute cache

### Database Optimization

- Indexed `session_type` column for fast filtering
- Compound index on `(session_type, end_time)`
- Database views pre-aggregate common queries
- Functions use SECURITY DEFINER for RLS bypass

## Future Enhancements

### Planned Features

1. **Admin Approval System**
   - Themed sessions require approval before visibility
   - Database field: `approved: boolean`
   - Admin workflow for approving/rejecting sessions

2. **Custom Theme Creation**
   - Allow admins to create custom themes
   - Theme editor UI
   - Color picker and preview

3. **Theme Scheduling**
   - Schedule theme activation in advance
   - Multiple seasonal periods per theme
   - Recurring schedules (yearly)

4. **Theme Analytics Export**
   - Export analytics to CSV/PDF
   - Scheduled reports
   - Email notifications

5. **User Theme Preferences**
   - Users can set preferred theme
   - Theme suggestions based on history
   - Personal theme customization

## Troubleshooting

### Julebord Theme Not Showing

**Check:**
1. Is `julebordEnabled: true` in `themes.ts`?
2. Are you in the seasonal period (Dec 1-31)?
3. Is `autoSeasonalSwitch` configured correctly?
4. Clear browser cache and refresh

### Analytics Not Loading

**Check:**
1. Database migration applied successfully?
2. RLS policies allow authenticated users to read views?
3. Network tab for API errors
4. Console for JavaScript errors

### Theme Preview Not Showing

**Check:**
1. Theme colors defined in `ThemeContext.tsx`?
2. CSS variables updated in `index.css`?
3. Browser supports CSS custom properties?

## Migration Guide

### Applying Database Migration

```bash
# Navigate to project directory
cd Drikkescore

# Apply migration (if using Supabase CLI)
supabase db push

# Or apply manually via Supabase dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of supabase/migrations/20251108190000_theme_analytics.sql
# 3. Run query
```

### Verifying Migration

```sql
-- Check views exist
SELECT * FROM theme_statistics;
SELECT * FROM theme_badge_statistics;

-- Check functions exist
SELECT get_theme_analytics();
SELECT get_most_popular_theme();
```

## Contributing

When adding new themes:

1. Add theme type to `database.ts`:
   ```typescript
   export type SessionType = 'standard' | 'julebord' | 'new_theme';
   ```

2. Update database constraint:
   ```sql
   ALTER TABLE sessions DROP CONSTRAINT sessions_type_check;
   ALTER TABLE sessions ADD CONSTRAINT sessions_type_check
   CHECK (session_type IN ('standard', 'julebord', 'new_theme'));
   ```

3. Add theme colors to `ThemeContext.tsx`
4. Add configuration in `themes.ts`
5. Update display names and descriptions
6. Add theme emoji/icon

## Support

For issues or questions:
1. Check this documentation
2. Review code comments
3. Check Supabase logs for database errors
4. Review browser console for client errors

## License

Part of the Drikkescore project. See main project README for license information.
