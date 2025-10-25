# Chart Components

This directory contains chart components for visualizing BAC data in the Drikkescore application.

## Components

### AlcoholConsumptionChart

A bar chart component that displays alcohol consumption data with flexible view modes and units.

**Location:** `src/components/charts/AlcoholConsumptionChart.tsx`

**Features:**
- Two view modes: 'per-participant' (individual consumption) or 'session-total' (total consumption)
- Unit toggle: 'grams' (pure alcohol) or 'beers' (beer units)
- Smart formatting: 1 decimal for beers, 0 decimals for grams
- Edge case handling: Graceful display when no participants or drinks exist
- Responsive design with fixed height of 300px
- Horizontal grid lines for easy reading
- Material UI BarChart integration

**Props:**
```typescript
interface AlcoholConsumptionChartProps {
  participants: Profile[];      // Array of participant profiles
  drinks: DrinkEntry[];         // Array of drink entries
  view: 'per-participant' | 'session-total';  // Chart view mode
  unit: 'grams' | 'beers';      // Display unit (1 beer = 13.035g = 330ml @ 5% ABV)
}
```

**Usage Example:**
```tsx
import AlcoholConsumptionChart from './components/charts/AlcoholConsumptionChart';
import { useSession } from './hooks/useSession';

function SessionPage() {
  const { drinks, participants } = useSession(sessionId);
  const [view, setView] = useState<'per-participant' | 'session-total'>('per-participant');
  const [unit, setUnit] = useState<'grams' | 'beers'>('beers');

  return (
    <AlcoholConsumptionChart
      participants={participants}
      drinks={drinks}
      view={view}
      unit={unit}
    />
  );
}
```

See `AlcoholConsumptionChart.example.tsx` for a complete integration example with controls.

### BACLineChart

A line chart component that displays Blood Alcohol Content (BAC) evolution over time for session participants.

**Location:** `src/components/charts/BACLineChart.tsx`

**Features:**
- Shows BAC progression from session start to current time
- Supports two view modes: 'all' (all participants) or 'self' (current user only)
- Highlights current user's line with thicker stroke
- Responsive and interactive with MUI X Charts
- Automatic color assignment for participants
- Formatted tooltips with participant names and BAC values
- Time axis in minutes with automatic formatting (e.g., "1h 30m")
- BAC axis formatted as percentage (e.g., "0.08%")

**Props:**
```typescript
interface BACLineChartProps {
  participants: Profile[];      // Array of participant profiles
  drinks: DrinkEntry[];         // Array of all drink entries in session
  sessionStartTime: Date;       // When the session started
  currentUserId: string;        // ID of current user (for highlighting)
  view: 'all' | 'self';        // View mode
}
```

**Usage Example:**
```tsx
import BACLineChart from './components/charts/BACLineChart';
import { useSession } from './hooks/useSession';
import { useAuth } from './context/AuthContext';

function SessionPage() {
  const { user } = useAuth();
  const { session, drinks, participants } = useSession(sessionId);
  const [view, setView] = useState<'all' | 'self'>('all');

  return (
    <BACLineChart
      participants={participants}
      drinks={drinks}
      sessionStartTime={new Date(session.start_time)}
      currentUserId={user.id}
      view={view}
    />
  );
}
```

See `BACLineChart.example.tsx` for a complete integration example.

## Utilities

The chart components use utilities from `src/utils/chartHelpers.ts` for data transformation:

- `prepareLineChartData()` - Converts participant and drink data into MUI LineChart format
- `prepareBarChartData()` - Prepares per-participant consumption data for bar charts
- `calculateBACTimeSeries()` - Calculates BAC values at multiple time points
- `calculateTotalAlcoholGrams()` - Calculates total alcohol consumption across all drinks
- `convertGramsToBeers()` - Converts grams of pure alcohol to beer units (1 unit = 13.035g)

## Dependencies

- `@mui/x-charts` - MUI X Charts library for rendering
- `@mui/material` - Material UI for theming
- React 19.x
- TypeScript

## Design Decisions

1. **Color Palette**: Uses a predefined palette of 10 distinct colors for good contrast and accessibility
2. **Current User Highlighting**: Current user's line is always shown in primary blue (#1976d2) with a thicker stroke
3. **Performance**: Uses `useMemo` to avoid recalculating chart data on every render
4. **Sampling**: BAC is calculated every 5 minutes to balance detail and performance
5. **Empty State**: Shows a helpful message when no drink data is available
6. **Responsive**: Chart adapts to container width with configurable height

## Future Enhancements

Potential improvements for future iterations:

- Add export to image functionality
- Implement zoom/pan controls for long sessions
- Add reference lines for legal BAC limits
- Support custom time ranges
- Add animation on data updates
- Implement dark mode support
