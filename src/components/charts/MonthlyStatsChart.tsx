import { useMemo, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { prepareMonthlyConsumptionChartData } from '../../utils/analyticsChartHelpers';

interface MonthlyStatsChartProps {
  monthlyData: { month: string; grams: number; beers: number; calories: number }[];
}

/**
 * MonthlyStatsChart Component
 *
 * Displays monthly consumption statistics as a bar chart.
 * Users can toggle between viewing data in grams or beer units.
 * Uses MUI BarChart for visualization.
 */
export default function MonthlyStatsChart({ monthlyData }: MonthlyStatsChartProps) {
  const [unit, setUnit] = useState<'grams' | 'beers'>('beers');

  // Prepare chart data based on selected unit
  const chartData = useMemo(() => {
    return prepareMonthlyConsumptionChartData(monthlyData, unit);
  }, [monthlyData, unit]);

  // Format value for display
  const formatValue = (value: number | null): string => {
    if (value === null) return '';
    if (unit === 'beers') {
      return value.toFixed(1);
    }
    return value.toFixed(0);
  };

  // Get axis label based on unit
  const yAxisLabel = unit === 'beers' ? 'Antall enheter' : 'Rent alkohol (g)';

  // Handle unit change
  const handleUnitChange = (_event: React.MouseEvent<HTMLElement>, newUnit: 'grams' | 'beers' | null) => {
    if (newUnit !== null) {
      setUnit(newUnit);
    }
  };

  // Handle empty state
  if (monthlyData.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 300,
          color: 'var(--color-text-secondary)',
          fontSize: '14px',
        }}
      >
        Ingen månedlige data tilgjengelig
      </Box>
    );
  }

  // Extract data for MUI BarChart
  const xAxisData = chartData.map((d) => d.month);
  const seriesData = chartData.map((d) => d.value);

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      {/* Unit Toggle Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '12px 0',
        }}
      >
        <ToggleButtonGroup
          value={unit}
          exclusive
          onChange={handleUnitChange}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.5,
              fontSize: '13px',
              textTransform: 'none',
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)',
              '&.Mui-selected': {
                backgroundColor: 'var(--prussian-blue)',
                color: 'var(--color-white)',
                '&:hover': {
                  backgroundColor: 'var(--prussian-blue-dark)',
                },
              },
            },
          }}
        >
          <ToggleButton value="beers">Enheter</ToggleButton>
          <ToggleButton value="grams">Gram</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <BarChart
          xAxis={[
            {
              scaleType: 'band',
              data: xAxisData,
              label: 'Måned',
            },
          ]}
          yAxis={[
            {
              label: yAxisLabel,
              valueFormatter: formatValue,
            },
          ]}
          series={[
            {
              data: seriesData,
              label: unit === 'beers' ? 'Enheter' : 'Gram',
              color: 'var(--orange-wheel)',
              valueFormatter: (value: number | null) => {
                if (value === null) return '';
                const formatted = formatValue(value);
                return unit === 'beers' ? `${formatted} enheter` : `${formatted}g`;
              },
            },
          ]}
          margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
          grid={{ vertical: false, horizontal: true }}
          axisHighlight={{ x: 'band', y: 'none' }}
          slotProps={{
            legend: {
              hidden: true,
            },
          }}
          sx={{
            width: '100%',
            height: '100%',
            '& .MuiChartsAxis-label': {
              fontSize: '14px',
              fontWeight: 500,
              fill: 'var(--color-text-primary)',
            },
            '& .MuiChartsAxis-tickLabel': {
              fontSize: '12px',
              fill: 'var(--color-text-secondary)',
            },
            '& .MuiBarElement-root': {
              '&:hover': {
                opacity: 0.8,
              },
            },
          }}
        />
      </Box>

      {/* Summary Statistics */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3,
          padding: '12px 0 8px 0',
          borderTop: '1px solid var(--color-border-light)',
          marginTop: 2,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', display: 'block' }}>
            Totalt
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {unit === 'beers'
              ? `${monthlyData.reduce((sum, m) => sum + m.beers, 0).toFixed(1)} enheter`
              : `${monthlyData.reduce((sum, m) => sum + m.grams, 0).toFixed(0)}g`}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', display: 'block' }}>
            Gjennomsnitt/måned
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {unit === 'beers'
              ? `${(monthlyData.reduce((sum, m) => sum + m.beers, 0) / monthlyData.length).toFixed(1)} enheter`
              : `${(monthlyData.reduce((sum, m) => sum + m.grams, 0) / monthlyData.length).toFixed(0)}g`}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'var(--color-text-muted)', display: 'block' }}>
            Total kalorier
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {monthlyData.reduce((sum, m) => sum + m.calories, 0).toLocaleString('nb-NO')} kcal
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
