# Spending Tracker & Price Management - Drikkescore

This document describes the spending tracker and price management components built for personal analytics in the Drikkescore app.

## Overview

The spending tracker allows users to:
- Track the cost of their drinks over time
- Manage a library of drink prices
- View spending analytics with charts
- Set default prices for quick calculations
- Analyze spending by drink type and time period

## Components

### 1. useDrinkPrices Hook
**Location:** `src/hooks/useDrinkPrices.ts`

A custom React hook for managing drink prices with Supabase integration.

**Features:**
- Fetch user's drink prices
- Add new prices
- Update existing prices
- Delete prices
- Real-time subscriptions for live updates
- Automatic handling of default price constraints

**Usage:**
```typescript
import { useDrinkPrices } from '../hooks/useDrinkPrices';

function MyComponent() {
  const { prices, loading, error, addPrice, updatePrice, deletePrice } = useDrinkPrices();

  // Prices are automatically updated in real-time
  return <div>{prices.length} prices loaded</div>;
}
```

**API:**
- `prices: DrinkPrice[]` - Array of user's drink prices
- `loading: boolean` - Loading state during initial fetch
- `error: string | null` - Error message if fetch fails
- `addPrice(formData: DrinkPriceFormData): Promise<DrinkPrice>` - Add new price
- `updatePrice(id: string, formData: Partial<DrinkPriceFormData>): Promise<DrinkPrice>` - Update price
- `deletePrice(id: string): Promise<void>` - Delete price

**Real-time Features:**
- Automatic subscription to `drink_prices` table changes
- Updates when prices are added/updated/deleted
- Works across multiple tabs/devices
- Automatic cleanup on unmount

### 2. DrinkPriceManager Component
**Location:** `src/components/analytics/DrinkPriceManager.tsx`

A comprehensive UI for managing drink prices.

**Features:**
- Form to add new drink prices
- List of saved prices (editable/deletable)
- Inline editing with save/cancel
- Mark price as "default" option
- Form validation with error messages
- Loading states for async operations
- Confirmation dialogs for deletions

**Fields:**
- **Drink Name** (required): Name of the drink (e.g., "Øl", "Vin")
- **Price Amount** (required): Price in currency (must be > 0)
- **Currency** (optional): Default is NOK
- **Volume (ml)** (optional): Volume in milliliters
- **Alcohol %** (optional): Alcohol percentage (0-100)
- **Is Default** (optional): Mark as default price

**Validation:**
- Drink name: Required, non-empty
- Price: Must be greater than 0
- Volume: Optional, must be > 0 if provided
- Alcohol %: Optional, must be 0-100 if provided

**Usage:**
```typescript
import DrinkPriceManager from '../components/analytics/DrinkPriceManager';

function SettingsPage() {
  return (
    <div>
      <h1>Innstillinger</h1>
      <DrinkPriceManager />
    </div>
  );
}
```

### 3. SpendingChart Component
**Location:** `src/components/charts/SpendingChart.tsx`

A visualization component for spending analytics.

**Features:**
- Total spending display
- Average cost per drink
- Spending by drink type (bar chart)
- Spending over time (weekly/monthly bar chart)
- Period toggle (week/month)
- Graceful handling when no prices exist
- Helpful messages for empty states

**Props:**
```typescript
interface SpendingChartProps {
  drinks: DrinkEntry[];        // Array of drinks to analyze
  prices: DrinkPrice[];        // Array of user's prices
  period: 'week' | 'month';   // Time grouping
  onPeriodChange?: (period: 'week' | 'month') => void; // Period change callback
}
```

**Displays:**
1. **Statistics Summary:**
   - Total spending
   - Average cost per drink
   - Number of saved prices

2. **Spending Over Time Chart:**
   - Bar chart grouped by week or month
   - Last 12 periods shown
   - Formatted Norwegian labels

3. **Spending by Drink Type:**
   - Bar chart showing top 10 drink types
   - Color-coded for easy distinction
   - Values shown on bars

**Usage:**
```typescript
import SpendingChart from '../components/charts/SpendingChart';
import { useDrinkPrices } from '../hooks/useDrinkPrices';

function AnalyticsPage() {
  const { prices } = useDrinkPrices();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  // Get drinks from session or analytics
  const drinks = useUserDrinks();

  return (
    <SpendingChart
      drinks={drinks}
      prices={prices}
      period={period}
      onPeriodChange={setPeriod}
    />
  );
}
```

## Database Schema

The components use the `drink_prices` table:

```sql
CREATE TABLE drink_prices (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  drink_name VARCHAR(100) NOT NULL,
  price_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NOK',
  volume_ml INTEGER,
  alcohol_percentage DECIMAL(4, 2),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Row Level Security (RLS):**
- Users can only view/edit/delete their own prices
- Enforced by Supabase RLS policies
- See `guidelines/add-drink-prices-table.sql` for details

## Utilities

### spendingCalculator.ts
**Location:** `src/utils/spendingCalculator.ts`

Helper functions for spending calculations:

- `matchDrinkToPrice(drink, prices)` - Match a drink to a saved price
- `calculateTotalSpending(drinks, prices)` - Calculate total spent
- `calculateSpendingByDrinkType(drinks, prices)` - Spending per type
- `calculateAverageCostPerDrink(totalSpent, totalDrinks)` - Average cost
- `formatCurrency(amount, currency)` - Format for display
- `getSpendingDescription(totalSpent)` - Norwegian description

**Matching Logic:**
1. Try exact match (volume & ABV)
2. Try tolerant match (±50ml, ±1% ABV)
3. Fall back to default price
4. Return null if no match

## Integration Examples

### Settings Page Integration
```typescript
function SettingsPage() {
  return (
    <Container>
      <Tabs>
        <Tab label="Profil" />
        <Tab label="Priser">
          <DrinkPriceManager />
        </Tab>
        <Tab label="Personvern" />
      </Tabs>
    </Container>
  );
}
```

### Analytics Page Integration
```typescript
function PersonalAnalytics() {
  const { prices } = useDrinkPrices();
  const { drinks } = useUserAnalytics();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  return (
    <Container>
      <SpendingChart
        drinks={drinks}
        prices={prices}
        period={period}
        onPeriodChange={setPeriod}
      />
    </Container>
  );
}
```

### Combined Price Manager + Analytics
```typescript
function SpendingAnalyticsPage() {
  const { prices } = useDrinkPrices();
  const drinks = useUserDrinks();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  return (
    <Container>
      <Paper>
        <Typography variant="h5">Dine utgifter</Typography>
        <SpendingChart
          drinks={drinks}
          prices={prices}
          period={period}
          onPeriodChange={setPeriod}
        />
      </Paper>

      <Paper>
        <Typography variant="h5">Administrer priser</Typography>
        <DrinkPriceManager />
      </Paper>
    </Container>
  );
}
```

## Technical Details

### Type Safety
All components are fully typed with TypeScript:
- `DrinkPrice` - Database entity type
- `DrinkPriceFormData` - Form input type
- `DrinkEntry` - Drink entity from database

### Real-time Updates
- Uses Supabase real-time subscriptions
- Automatic updates across tabs/devices
- Proper cleanup to prevent memory leaks
- Polling fallback for reliability

### Performance
- Memoized calculations with `useMemo`
- Efficient Supabase queries with proper indexes
- Optimized re-renders
- Charts render at 60fps

### Accessibility
- Material-UI components (built-in a11y)
- Proper ARIA labels
- Keyboard navigation support
- Form validation with error messages

### Styling
- Material-UI components for consistency
- Responsive layouts with MUI Grid
- CSS variables for theming
- Norwegian text throughout

## File Structure

```
src/
├── components/
│   ├── analytics/
│   │   ├── DrinkPriceManager.tsx
│   │   └── DrinkPriceManager.example.tsx
│   └── charts/
│       ├── SpendingChart.tsx
│       └── SpendingChart.example.tsx
├── hooks/
│   ├── useDrinkPrices.ts
│   └── useDrinkPrices.example.ts
├── types/
│   └── analytics.ts (DrinkPrice, DrinkPriceFormData)
├── utils/
│   └── spendingCalculator.ts
└── lib/
    └── supabase.ts
```

## Example Files

Each component includes comprehensive example files:
- **DrinkPriceManager.example.tsx** - Usage examples for the price manager
- **SpendingChart.example.tsx** - Usage examples for the chart
- **useDrinkPrices.example.ts** - Hook usage patterns

See these files for detailed integration examples.

## Testing Checklist

- [ ] Add a new drink price
- [ ] Edit an existing price
- [ ] Delete a price
- [ ] Set a price as default
- [ ] View spending chart with prices
- [ ] View spending chart without prices
- [ ] Toggle between weekly/monthly view
- [ ] Test real-time updates (multi-tab)
- [ ] Test form validation
- [ ] Test empty states

## Future Enhancements

Potential improvements:
- Export spending data to CSV
- Spending goals and budgets
- Price comparison across time
- Currency conversion
- Import prices from receipts
- Price suggestions based on drink type
- Spending vs. consumption correlation

## Support

For questions or issues:
- See example files for usage patterns
- Check TypeScript types for API details
- Review `spendingCalculator.ts` for calculation logic
- Refer to Supabase documentation for database queries

---

**Created:** 2025-10-25
**Version:** 1.0
**Tech Stack:** React 18, TypeScript, Material-UI, Supabase
