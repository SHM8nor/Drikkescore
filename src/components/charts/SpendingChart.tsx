import { useMemo } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import type { DrinkEntry } from '../../types/database';
import type { DrinkPrice } from '../../types/analytics';
import {
  calculateTotalSpending,
  calculateAverageCostPerDrink,
  calculateSpendingByDrinkType,
  formatCurrency,
  getSpendingDescription,
  DEFAULT_CURRENCY,
} from '../../utils/spendingCalculator';

interface SpendingChartProps {
  drinks: DrinkEntry[];
  prices: DrinkPrice[];
  period: 'week' | 'month';
  onPeriodChange?: (period: 'week' | 'month') => void;
}

/**
 * Color palette for spending charts
 */
const CHART_COLORS = [
  '#1976d2', // Blue
  '#d32f2f', // Red
  '#388e3c', // Green
  '#f57c00', // Orange
  '#7b1fa2', // Purple
  '#0097a7', // Cyan
  '#c2185b', // Pink
  '#fbc02d', // Yellow
  '#5d4037', // Brown
  '#455a64', // Blue Grey
];

/**
 * SpendingChart Component
 *
 * Displays spending data using Material UI BarChart.
 * Shows:
 * - Total spending
 * - Average cost per drink
 * - Spending by drink type (if prices available)
 * - Spending over time (weekly/monthly)
 *
 * Handles case where no prices exist with helpful message.
 */
export default function SpendingChart({
  drinks,
  prices,
  period,
  onPeriodChange,
}: SpendingChartProps) {
  // Calculate total spending and statistics
  const stats = useMemo(() => {
    const totalSpent = calculateTotalSpending(drinks, prices);
    const totalDrinks = drinks.length;
    const averageCost = calculateAverageCostPerDrink(totalSpent, totalDrinks);
    const spendingDescription = getSpendingDescription(totalSpent);

    return {
      totalSpent,
      totalDrinks,
      averageCost,
      spendingDescription,
    };
  }, [drinks, prices]);

  // Calculate spending by drink type
  const spendingByType = useMemo(() => {
    const spendingMap = calculateSpendingByDrinkType(drinks, prices);
    const data = Array.from(spendingMap.entries())
      .map(([drinkName, amount]) => ({
        drinkName,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 drink types

    return data;
  }, [drinks, prices]);

  // Group drinks by time period (week or month)
  const spendingOverTime = useMemo(() => {
    if (drinks.length === 0 || prices.length === 0) {
      return [];
    }

    // Group drinks by period
    const periodMap = new Map<string, DrinkEntry[]>();

    drinks.forEach((drink) => {
      const date = new Date(drink.consumed_at);
      let periodKey: string;

      if (period === 'week') {
        // Get start of week (Monday)
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        periodKey = monday.toISOString().split('T')[0];
      } else {
        // Get month
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const existing = periodMap.get(periodKey) || [];
      periodMap.set(periodKey, [...existing, drink]);
    });

    // Calculate spending for each period
    const data = Array.from(periodMap.entries())
      .map(([periodKey, periodDrinks]) => {
        const spent = calculateTotalSpending(periodDrinks, prices);
        const label = period === 'week' ? formatWeekLabel(periodKey) : formatMonthLabel(periodKey);

        return {
          period: periodKey,
          label,
          spent,
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-12); // Show last 12 periods

    return data;
  }, [drinks, prices, period]);

  // Handle no prices case
  if (prices.length === 0) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Ingen priser lagt til
          </Typography>
          <Typography variant="body2">
            For å spore utgifter må du først legge til prisene på drikkevarene dine.
            Gå til innstillinger og legg til priser for å se utgiftsstatistikk.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Handle no drinks case
  if (drinks.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          Ingen drikkevarer registrert ennå
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Statistics Summary */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box
          sx={{
            p: 2,
            backgroundColor: 'var(--color-background-paper)',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Totale utgifter
          </Typography>
          <Typography variant="h5" color="primary" fontWeight="bold">
            {formatCurrency(stats.totalSpent, DEFAULT_CURRENCY)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.spendingDescription}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            backgroundColor: 'var(--color-background-paper)',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Gjennomsnitt per drink
          </Typography>
          <Typography variant="h5" color="primary" fontWeight="bold">
            {formatCurrency(stats.averageCost, DEFAULT_CURRENCY)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.totalDrinks} drikkevarer totalt
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            backgroundColor: 'var(--color-background-paper)',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Lagrede priser
          </Typography>
          <Typography variant="h5" color="primary" fontWeight="bold">
            {prices.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {prices.filter(p => p.is_default).length} standardpris
          </Typography>
        </Box>
      </Box>

      {/* Period Toggle */}
      {onPeriodChange && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, newPeriod) => {
              if (newPeriod !== null) {
                onPeriodChange(newPeriod);
              }
            }}
            size="small"
          >
            <ToggleButton value="week">Ukentlig</ToggleButton>
            <ToggleButton value="month">Månedlig</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Spending Over Time Chart */}
      {spendingOverTime.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Utgifter over tid
          </Typography>
          <Box sx={{ width: '100%', height: 350 }}>
            <BarChart
              xAxis={[
                {
                  scaleType: 'band',
                  data: spendingOverTime.map((d) => d.label),
                  label: period === 'week' ? 'Uke' : 'Måned',
                },
              ]}
              yAxis={[
                {
                  label: `Utgifter (${DEFAULT_CURRENCY})`,
                  valueFormatter: (value: number | null) => {
                    if (value === null) return '';
                    return `${value.toFixed(0)} kr`;
                  },
                },
              ]}
              series={[
                {
                  data: spendingOverTime.map((d) => d.spent),
                  label: 'Utgifter',
                  color: '#1976d2',
                  valueFormatter: (value: number | null) => {
                    if (value === null) return '';
                    return formatCurrency(value, DEFAULT_CURRENCY);
                  },
                },
              ]}
              margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
              grid={{ vertical: false, horizontal: true }}
              slotProps={{
                legend: {
                  hidden: true,
                },
              }}
              sx={{
                width: '100%',
                height: '100%',
              }}
            />
          </Box>
        </Box>
      )}

      {/* Spending by Drink Type Chart */}
      {spendingByType.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Utgifter per type
          </Typography>
          <Box sx={{ width: '100%', height: 350 }}>
            <BarChart
              xAxis={[
                {
                  scaleType: 'band',
                  data: spendingByType.map((d) => d.drinkName),
                  label: 'Type drikke',
                },
              ]}
              yAxis={[
                {
                  label: `Utgifter (${DEFAULT_CURRENCY})`,
                  valueFormatter: (value: number | null) => {
                    if (value === null) return '';
                    return `${value.toFixed(0)} kr`;
                  },
                },
              ]}
              series={spendingByType.map((item, index) => {
                const data = new Array(spendingByType.length).fill(0);
                data[index] = item.amount;

                return {
                  data: data,
                  label: item.drinkName,
                  color: CHART_COLORS[index % CHART_COLORS.length],
                  stack: 'total',
                  valueFormatter: (value: number | null) => {
                    if (value === null || value === 0) return '';
                    return formatCurrency(value, DEFAULT_CURRENCY);
                  },
                };
              })}
              margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
              grid={{ vertical: false, horizontal: true }}
              barLabel="value"
              slotProps={{
                barLabel: {
                  style: {
                    fontSize: '11px',
                    fontWeight: 600,
                    fill: '#fff',
                  },
                },
                legend: {
                  hidden: true,
                },
              }}
              sx={{
                width: '100%',
                height: '100%',
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

/**
 * Format week label for display (e.g., "2025-01-06" -> "Uke 1")
 */
function formatWeekLabel(weekString: string): string {
  const date = new Date(weekString);
  const weekNumber = getWeekNumber(date);
  return `Uke ${weekNumber}`;
}

/**
 * Format month label for display (e.g., "2025-01" -> "Jan 2025")
 */
function formatMonthLabel(monthString: string): string {
  const [year, month] = monthString.split('-');
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
