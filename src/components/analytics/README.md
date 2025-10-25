# Analytics Components

This directory contains components for the Personal Analytics feature of Drikkescore.

## Components

### HealthInsights

A comprehensive health recommendations panel that displays WHO-based insights.

**Location:** `src/components/analytics/HealthInsights.tsx`

**Features:**
- WHO risk level assessment with color-coded badges
- Personalized health recommendations based on consumption patterns
- Recommended maximum drinks per session (gender-specific)
- Actionable advice for reducing consumption when over WHO limits
- Positive reinforcement for healthy consumption patterns
- General health tips

**Props:**
```typescript
interface HealthInsightsProps {
  whoData: WHOComparisonData;  // WHO comparison data with risk level
  gender: Gender;               // User's gender for personalized recommendations
}
```

**Usage:**
```tsx
import HealthInsights from './components/analytics/HealthInsights';

<HealthInsights
  whoData={{
    weeklyGrams: 120,
    whoLimitGrams: 140,
    riskLevel: 'moderate',
    percentageOfLimit: 86
  }}
  gender="male"
/>
```

**Risk Levels:**
- `low` - 0-50% of WHO limit (Green #047857)
- `moderate` - 51-100% of WHO limit (Yellow #d9a03a)
- `high` - 101-200% of WHO limit (Orange #f77f00)
- `very_high` - >200% of WHO limit (Red #d62828)

---

### ConsumptionBreakdown

A comprehensive component that displays detailed consumption analysis including calories, alcohol content, and optional drink type breakdown.

**Location:** `src/components/analytics/ConsumptionBreakdown.tsx`

**Features:**
- Total calorie display with food comparisons (hamburgers, pizza slices, chocolate bars)
- Calories per day average calculation
- Total alcohol in grams
- Beer units conversion with informative tooltip
- Optional drink type breakdown with percentage distribution
- Educational notes about alcohol metabolism
- Loading and error states
- Fully responsive design
- Norwegian language

**Props:**
```typescript
interface ConsumptionBreakdownProps {
  totalCalories: number;                    // Total calories from alcohol
  totalAlcoholGrams: number;                // Total pure alcohol in grams
  periodDays: number;                       // Number of days in analysis period
  drinkTypeBreakdown?: {                    // Optional drink distribution
    type: string;
    count: number;
    percentage: number;
  }[];
  isLoading?: boolean;                      // Show loading state
  error?: string | null;                    // Show error message
}
```

**Usage Example:**
```tsx
import ConsumptionBreakdown from '@/components/analytics/ConsumptionBreakdown';

function AnalyticsPage() {
  const { stats, period } = useAnalytics();

  return (
    <ConsumptionBreakdown
      totalCalories={stats.totalCalories}
      totalAlcoholGrams={stats.totalAlcoholGrams}
      periodDays={7}
      drinkTypeBreakdown={[
        { type: 'Øl', count: 12, percentage: 60 },
        { type: 'Vin', count: 5, percentage: 25 },
        { type: 'Brennevin', count: 3, percentage: 15 },
      ]}
    />
  );
}
```

**Food Comparison Reference:**
- Hamburger: ~540 kcal
- Pizza slice: ~285 kcal
- Chocolate bar: ~230 kcal

**Alcohol Unit Reference:**
- 1 unit = 13.035g pure alcohol
- Equivalent to 330ml beer at 5% ABV

---

## Related Charts (in src/components/charts/)

### BACTrendsChart

Line chart showing average and peak BAC trends over time.

**Location:** `src/components/charts/BACTrendsChart.tsx`

**Features:**
- Two-line chart: average BAC and peak BAC
- Date-based x-axis with formatted labels
- Empty state with helpful message
- Responsive and optimized for performance

**Props:**
```typescript
interface BACTrendsChartProps {
  bacTrend: { date: string; averageBAC: number; peakBAC: number }[];
}
```

**Usage:**
```tsx
import BACTrendsChart from './components/charts/BACTrendsChart';

<BACTrendsChart
  bacTrend={[
    { date: '2025-01-18', averageBAC: 0.03, peakBAC: 0.05 },
    { date: '2025-01-19', averageBAC: 0.04, peakBAC: 0.07 },
  ]}
/>
```

---

### WHOComparisonGauge

Visual gauge showing WHO comparison with color-coded risk levels.

**Location:** `src/components/charts/WHOComparisonGauge.tsx`

**Features:**
- Linear progress bar gauge with risk-based color coding
- Percentage of WHO limit display
- Current consumption vs. WHO limit in grams and standard drinks
- Risk level badge
- Warning message when over limit
- Detailed statistics breakdown

**Props:**
```typescript
interface WHOComparisonGaugeProps {
  whoData: WHOComparisonData;
}
```

**Usage:**
```tsx
import WHOComparisonGauge from './components/charts/WHOComparisonGauge';

<WHOComparisonGauge
  whoData={{
    weeklyGrams: 120,
    whoLimitGrams: 140,
    riskLevel: 'moderate',
    percentageOfLimit: 86
  }}
/>
```

---

### CalorieChart

Located in `src/components/charts/CalorieChart.tsx`

A bar chart visualization for calorie consumption over time with weekly/monthly toggle.

See [Charts README](../charts/README.md) for more information.

---

## Utilities

These components rely on utility functions from:

- `src/utils/whoGuidelines.ts` - WHO calculations and recommendations
  - `calculateWHOComparison()` - Calculate risk level from weekly consumption
  - `getRiskLevelDescription()` - Get Norwegian description of risk level
  - `getHealthRecommendation()` - Get detailed health advice
  - `getRiskLevelColor()` - Get color for risk level
  - `getRecommendedMaxDrinksPerSession()` - Get max drinks per session
- `src/utils/analyticsChartHelpers.ts` - Chart data preparation
  - `prepareBACTrendChartData()` - Format BAC trend data for line chart
  - `prepareWeeklyConsumptionChartData()` - Format weekly consumption data
  - `prepareMonthlyConsumptionChartData()` - Format monthly consumption data
  - `prepareCalorieChartData()` - Format calorie data
- `src/utils/calorieCalculator.ts` - Calorie calculations and food comparisons
- `src/utils/chartHelpers.ts` - General chart helpers

---

## Styling

Components use:
- Material-UI components for UI elements
- CSS variables from `guidelines/CSS_VARIABLES.css` for consistent theming
- Responsive Grid layout for mobile-first design

### Color Coding

All health components use consistent color coding based on WHO risk levels:

- **Low Risk (Green):** `#047857` - 0-50% of WHO limit
- **Moderate Risk (Yellow):** `#d9a03a` - 51-100% of WHO limit
- **High Risk (Orange):** `#f77f00` - 101-200% of WHO limit
- **Very High Risk (Red):** `#d62828` - >200% of WHO limit

---

## TypeScript Types

All components are fully typed using:
- `src/types/analytics.ts` - Analytics-specific types
- `src/types/database.ts` - Database schema types

**Key Type Definitions:**
```typescript
interface WHOComparisonData {
  weeklyGrams: number;
  whoLimitGrams: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  percentageOfLimit: number;
}

interface PeriodStats {
  totalDrinks: number;
  totalSessions: number;
  totalAlcoholGrams: number;
  totalAlcoholBeers: number;
  totalCalories: number;
  totalSpent: number;
  averageBAC: number;
  peakBAC: number;
  averageDrinksPerSession: number;
}
```

---

## Examples

See the `.example.tsx` files for comprehensive usage examples:
- `HealthInsights.example.tsx` - Health insights for different risk levels
- `ConsumptionBreakdown.example.tsx` - Various usage scenarios
- `BACTrendsChart.example.tsx` - Line chart examples
- `WHOComparisonGauge.example.tsx` - Gauge examples with all risk levels

---

## Best Practices

1. **Error Handling**: Always provide error prop when data fetching fails
2. **Loading States**: Use isLoading prop during data fetching
3. **Optional Data**: drinkTypeBreakdown is optional - only include if available
4. **Period Context**: Make sure periodDays matches the data timeframe
5. **Calculations**: Use utility functions for consistent calorie/alcohol calculations
6. **Performance**: All chart components use `useMemo` for data preparation
7. **Accessibility**: Use MUI's built-in accessibility features
8. **Responsive**: Components adapt to container size
9. **Norwegian Text**: All user-facing text is in Norwegian
10. **Type Safety**: Full TypeScript support with strict typing

---

## Integration Example

Complete integration in an analytics page:

```tsx
import { useEffect, useState } from 'react';
import { Box, Container, Grid } from '@mui/material';
import ConsumptionBreakdown from '@/components/analytics/ConsumptionBreakdown';
import HealthInsights from '@/components/analytics/HealthInsights';
import BACTrendsChart from '@/components/charts/BACTrendsChart';
import WHOComparisonGauge from '@/components/charts/WHOComparisonGauge';
import CalorieChart from '@/components/charts/CalorieChart';
import { calculateWHOComparison } from '@/utils/whoGuidelines';
import { prepareCalorieChartData } from '@/utils/analyticsChartHelpers';

function PersonalAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchAnalyticsData()
      .then(data => {
        setAnalyticsData(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <ConsumptionBreakdown isLoading={true} />;
  }

  if (error) {
    return <ConsumptionBreakdown error={error} />;
  }

  // Calculate WHO comparison from analytics data
  const whoData = calculateWHOComparison(
    analyticsData.stats.totalAlcoholGrams,
    userProfile.gender
  );

  const weeklyChartData = prepareCalorieChartData(analyticsData.weeklyConsumption);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* WHO Comparison and Health Insights */}
        <Grid item xs={12} md={6}>
          <WHOComparisonGauge whoData={whoData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <HealthInsights whoData={whoData} gender={userProfile.gender} />
        </Grid>

        {/* BAC Trends Chart */}
        <Grid item xs={12}>
          <Box sx={{ height: 400 }}>
            <BACTrendsChart bacTrend={analyticsData.bacTrend} />
          </Box>
        </Grid>

        {/* Calorie Chart */}
        <Grid item xs={12}>
          <CalorieChart
            weeklyData={weeklyChartData}
            monthlyData={analyticsData.monthlyCalories}
          />
        </Grid>

        {/* Consumption Breakdown */}
        <Grid item xs={12}>
          <ConsumptionBreakdown
            totalCalories={analyticsData.stats.totalCalories}
            totalAlcoholGrams={analyticsData.stats.totalAlcoholGrams}
            periodDays={7}
            drinkTypeBreakdown={analyticsData.drinkTypeBreakdown}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
```

---

## Contributing

When adding new analytics components:

1. Follow the existing component structure
2. Use TypeScript with proper type definitions
3. Include loading and error states
4. Add comprehensive examples in `.example.tsx` files
5. Update this README with component documentation
6. Use Norwegian language for all user-facing text
7. Follow MUI design patterns and CSS variable conventions
8. Use `useMemo` for chart data preparation
9. Implement proper empty states
10. Add accessibility features
