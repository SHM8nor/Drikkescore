# Theme Management - Quick Start Guide

## For Administrators

### Accessing Theme Management

1. **Log in as admin**
   - Navigate to `/admin` in your browser
   - Requires admin role in database

2. **Open Tema Tab**
   - Click the "Tema" tab at the top of the admin page
   - You'll see the theme management dashboard

### Quick Actions

#### ✅ Enable/Disable Julebord Theme

**To Enable:**
- Find "Julebord-tema" card
- Toggle switch to ON (green)
- Users can now create julebord sessions

**To Disable:**
- Toggle switch to OFF (gray)
- Julebord option disappears from session creation
- Existing julebord sessions remain active

#### 🎄 Automatic Seasonal Activation

**To Enable Auto-Switch:**
- Find "Automatisk sesongbytte" card
- Toggle switch to ON
- Julebord theme auto-enables in December

**Current Season:**
- Green chip = "I sesong nå" (julebord available)
- Gray chip = "Utenfor sesong" (not December)

### Dashboard Features

#### 📊 Statistics Overview

View key metrics for each theme:
- Total sessions created
- Active sessions right now
- Total participants
- Total drinks logged
- Average participants per session

#### 🏆 Most Popular Theme

See which theme is most used based on:
- Session count
- Participant count
- Popularity score

#### 📈 Usage Trends

**Timeline Chart:**
- Shows session creation over time
- Compare standard vs julebord
- Adjust period: 7, 30, or 90 days

**Distribution Chart:**
- Pie chart of session types
- Visual breakdown of theme usage

#### 🔄 Theme Comparison

Compare any two themes:
- Select themes from dropdowns
- See side-by-side metrics
- View differences and percentages

#### 🎖️ Badge Statistics

See which badges are awarded in themed sessions:
- Badge name and category
- Total awards
- Unique recipients
- Sessions with awards

## For Developers

### Quick Configuration

Edit `src/config/themes.ts`:

```typescript
export const defaultThemeConfig: ThemeConfig = {
  julebordEnabled: true,        // Set to false to disable
  autoSeasonalSwitch: true,     // Set to false for manual control
  availableThemes: ['standard', 'julebord'],
  seasonalDates: getSeasonalDates(),
  requireApproval: false,
};
```

### Testing Theme System

1. **Test theme availability:**
   ```typescript
   import { isThemeAvailable } from '../config/themes';
   console.log(isThemeAvailable('julebord')); // true/false
   ```

2. **Test seasonal detection:**
   ```typescript
   import { isInSeasonalPeriod } from '../config/themes';
   console.log(isInSeasonalPeriod('julebord')); // true in December
   ```

3. **Test recommended theme:**
   ```typescript
   import { getRecommendedTheme } from '../config/themes';
   console.log(getRecommendedTheme()); // 'julebord' in Dec, 'standard' otherwise
   ```

### Database Setup

Run migration to enable analytics:

```bash
# Apply migration file
supabase db push

# Or copy SQL from:
# supabase/migrations/20251108190000_theme_analytics.sql
```

### API Testing

Test analytics endpoints:

```typescript
import { getThemeStatistics } from '../api/themeAnalytics';

const stats = await getThemeStatistics();
console.log(stats); // Array of theme statistics
```

## Common Tasks

### Task: Disable Julebord After December

**Option 1: Manual (Immediate)**
1. Go to Admin → Tema tab
2. Toggle "Julebord-tema" to OFF

**Option 2: Automatic**
- Keep "Automatisk sesongbytte" ON
- Theme auto-disables after Dec 31

### Task: Force Julebord in November (Testing)

Edit `themes.ts`:

```typescript
seasonalDates: {
  julebord: {
    start: new Date(currentYear, 10, 1),  // November 1
    end: new Date(currentYear, 11, 31),   // December 31
  },
}
```

### Task: View Theme Analytics

1. Admin → Tema tab
2. Scroll to charts section
3. Adjust period selector (7/30/90 days)
4. View trends, distribution, and comparisons

### Task: Export Session Data by Theme

1. Admin → Sesjoner tab
2. Filter by status if needed
3. Select sessions
4. Click "Eksporter til CSV"
5. CSV includes session_type column

## Integration Points

### Where Theme Config is Used

1. **HomePage** (`src/pages/HomePage.tsx`)
   - Checks `themeConfig.julebordEnabled`
   - Shows/hides julebord button
   - Sets recommended theme on load

2. **Session Creation** (`src/hooks/useSession.ts`)
   - Accepts `session_type` parameter
   - Saves to database

3. **Theme Context** (`src/context/ThemeContext.tsx`)
   - Manages active theme
   - Applies CSS variables
   - Controls color palette

4. **Analytics** (`src/hooks/useThemeAnalytics.ts`)
   - Fetches theme usage data
   - Powers admin dashboard

## Monitoring

### Check Theme Usage

```sql
-- Total sessions by theme
SELECT session_type, COUNT(*) as count
FROM sessions
GROUP BY session_type;

-- Active sessions by theme
SELECT session_type, COUNT(*) as count
FROM sessions
WHERE end_time > NOW()
GROUP BY session_type;

-- Most popular badges in julebord sessions
SELECT b.name, COUNT(*) as awards
FROM badge_awards ba
JOIN badges b ON ba.badge_id = b.id
JOIN sessions s ON ba.session_id = s.id
WHERE s.session_type = 'julebord'
GROUP BY b.name
ORDER BY awards DESC
LIMIT 10;
```

### Performance Metrics

Check dashboard load times:
- Theme statistics: < 100ms
- Timeline data: < 200ms
- Badge stats: < 150ms

If slow, check database indexes:
```sql
-- Verify indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'sessions'
AND indexname LIKE '%session_type%';
```

## Troubleshooting

### Problem: Julebord button not showing

**Solution:**
1. Check `themeConfig.julebordEnabled` is `true`
2. Clear browser cache
3. Check console for errors

### Problem: Analytics not loading

**Solution:**
1. Verify migration applied: `SELECT * FROM theme_statistics;`
2. Check network tab for 500 errors
3. Verify user has `authenticated` role

### Problem: Wrong theme selected by default

**Solution:**
1. Check `autoSeasonalSwitch` setting
2. Verify seasonal dates in config
3. Check system date/time is correct

## Next Steps

After setup:
1. ✅ Apply database migration
2. ✅ Configure theme settings
3. ✅ Test session creation
4. ✅ Monitor analytics
5. ✅ Adjust seasonal dates if needed

## Support Contacts

- Technical issues: Check console logs
- Database issues: Check Supabase logs
- Configuration help: See THEME_MANAGEMENT_README.md

---

**Last Updated:** November 8, 2024
**Version:** 1.0
