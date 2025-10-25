import { useState, useMemo } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, ToggleButton, ToggleButtonGroup, Typography, CircularProgress } from '@mui/material';
import { getCalorieDescription } from '../../utils/calorieCalculator';

interface WeeklyCalorieData {
  week: string;
  calories: number;
}

interface MonthlyCalorieData {
  month: string;
  calories: number;
}

interface CalorieChartProps {
  weeklyData: WeeklyCalorieData[];
  monthlyData: MonthlyCalorieData[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * CalorieChart Component
 *
 * Displays calorie consumption data using Material UI BarChart.
 * Supports toggling between weekly and monthly views.
 * Shows calorie descriptions and trends for user education.
 */
export default function CalorieChart({
  weeklyData,
  monthlyData,
  isLoading = false,
  error = null,
}: CalorieChartProps) {
  const [timeView, setTimeView] = useState<'weekly' | 'monthly'>('weekly');

  // Handle view toggle
  const handleTimeViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'weekly' | 'monthly' | null
  ) => {
    if (newView !== null) {
      setTimeView(newView);
    }
  };

  // Prepare chart data based on view
  const { xAxisData, yAxisData, totalCalories } = useMemo(() => {
    if (timeView === 'weekly') {
      const xAxis = weeklyData.map((d) => d.week);
      const yAxis = weeklyData.map((d) => d.calories);
      const total = weeklyData.reduce((sum, item) => sum + item.calories, 0);
      return { xAxisData: xAxis, yAxisData: yAxis, totalCalories: total };
    } else {
      const xAxis = monthlyData.map((d) => d.month);
      const yAxis = monthlyData.map((d) => d.calories);
      const total = monthlyData.reduce((sum, item) => sum + item.calories, 0);
      return { xAxisData: xAxis, yAxisData: yAxis, totalCalories: total };
    }
  }, [timeView, weeklyData, monthlyData]);

  // Get calorie description
  const calorieDescription = useMemo(() => {
    return getCalorieDescription(totalCalories);
  }, [totalCalories]);

  // Calculate average calories per period
  const averageCalories = useMemo(() => {
    const dataLength = timeView === 'weekly' ? weeklyData.length : monthlyData.length;
    if (dataLength === 0) return 0;
    return Math.round(totalCalories / dataLength);
  }, [totalCalories, timeView, weeklyData.length, monthlyData.length]);

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 350,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 350,
          color: 'var(--fire-engine-red)',
          fontSize: '14px',
          textAlign: 'center',
          padding: 2,
        }}
      >
        {error}
      </Box>
    );
  }

  // No data state
  if (xAxisData.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: 350,
          gap: 2,
        }}
      >
        <Typography
          sx={{
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
          }}
        >
          Ingen kaloridata tilgjengelig
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
            }}
          >
            {calorieDescription}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'var(--color-text-muted)',
              fontSize: '12px',
            }}
          >
            Gjennomsnitt: {averageCalories} kcal per{' '}
            {timeView === 'weekly' ? 'uke' : 'måned'}
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={timeView}
          exclusive
          onChange={handleTimeViewChange}
          aria-label="tidsvisning"
          size="small"
        >
          <ToggleButton value="weekly" aria-label="ukentlig">
            Ukentlig
          </ToggleButton>
          <ToggleButton value="monthly" aria-label="månedlig">
            Månedlig
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart */}
      <Box
        sx={{
          width: '100%',
          height: 350,
        }}
      >
        <BarChart
          xAxis={[
            {
              scaleType: 'band',
              data: xAxisData,
              label: timeView === 'weekly' ? 'Uke' : 'Måned',
            },
          ]}
          yAxis={[
            {
              label: 'Kalorier (kcal)',
              valueFormatter: (value: number | null) => {
                if (value === null) return '';
                return `${value.toFixed(0)}`;
              },
            },
          ]}
          series={[
            {
              data: yAxisData,
              label: 'Kalorier',
              color: 'var(--orange-wheel)',
              valueFormatter: (value: number | null) => {
                if (value === null) return '';
                return `${value.toFixed(0)} kcal`;
              },
            },
          ]}
          margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
          grid={{ vertical: false, horizontal: true }}
          axisHighlight={{ x: 'band', y: 'none' }}
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
          tooltip={{
            trigger: 'item',
          }}
          sx={{
            width: '100%',
            height: '100%',
            '& .MuiChartsAxis-label': {
              fontSize: '13px',
              fill: 'var(--color-text-secondary)',
            },
            '& .MuiChartsAxis-tickLabel': {
              fontSize: '12px',
              fill: 'var(--color-text-secondary)',
            },
          }}
        />
      </Box>

      {/* Educational tooltip */}
      <Box
        sx={{
          backgroundColor: 'var(--xanthous-bg)',
          borderLeft: '3px solid var(--xanthous)',
          padding: 1.5,
          borderRadius: 1,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
          }}
        >
          💡 <strong>Tips:</strong> Alkohol inneholder 7 kalorier per gram rent
          alkohol. Dette er nesten like kaloririke som fett (9 kcal/g), men
          kroppen kan ikke lagre alkoholkalorier som energi.
        </Typography>
      </Box>
    </Box>
  );
}
