import { useMemo } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import type { Profile, DrinkEntry } from '../../types/database';
import {
  prepareBarChartData,
  calculateTotalAlcoholGrams,
  convertGramsToBeers,
} from '../../utils/chartHelpers';

interface AlcoholConsumptionChartProps {
  participants: Profile[];
  drinks: DrinkEntry[];
  view: 'per-participant' | 'session-total';
  unit: 'grams' | 'beers';
}

/**
 * AlcoholConsumptionChart Component
 *
 * Displays alcohol consumption data using Material UI BarChart.
 * Supports two visualization modes:
 * - per-participant: Shows individual consumption for each participant
 * - session-total: Shows total session consumption as a single bar
 *
 * Units can be toggled between grams of pure alcohol and beer units.
 * 1 beer unit = 13.035g (330ml @ 5% ABV)
 */
export default function AlcoholConsumptionChart({
  participants,
  drinks,
  view,
  unit,
}: AlcoholConsumptionChartProps) {
  // Prepare chart data based on view mode
  const chartData = useMemo(() => {
    if (view === 'per-participant') {
      // Use helper function to calculate per-participant data
      return prepareBarChartData(participants, drinks, unit);
    } else {
      // Calculate total session consumption
      const totalGrams = calculateTotalAlcoholGrams(drinks);
      const value = unit === 'beers' ? convertGramsToBeers(totalGrams) : totalGrams;

      return [
        {
          participant: 'Total',
          value: Math.round(value * 100) / 100,
        },
      ];
    }
  }, [participants, drinks, view, unit]);

  // Format value for display based on unit
  const formatValue = (value: number): string => {
    if (unit === 'beers') {
      return value.toFixed(1);
    }
    return value.toFixed(0);
  };

  // Get axis label based on unit
  const yAxisLabel = unit === 'beers' ? 'Beer Units' : 'Pure Alcohol (g)';

  // Handle edge cases
  if (participants.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 300,
        color: 'var(--color-text-secondary)',
        fontSize: '14px',
      }}>
        No participants in this session
      </div>
    );
  }

  if (drinks.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 300,
        color: 'var(--color-text-secondary)',
        fontSize: '14px',
      }}>
        No drinks recorded yet
      </div>
    );
  }

  // Prepare data in MUI BarChart format
  const xAxisData = chartData.map((d) => d.participant);
  const seriesData = chartData.map((d) => d.value);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '350px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <BarChart
        xAxis={[
          {
            id: 'participant',
            scaleType: 'band',
            data: xAxisData,
            label: view === 'per-participant' ? 'Participant' : '',
          },
        ]}
        yAxis={[
          {
            id: 'consumption',
            label: yAxisLabel,
            valueFormatter: (value: number | null) => {
              if (value === null) return '';
              return formatValue(value);
            },
          },
        ]}
        series={[
          {
            data: seriesData,
            label: unit === 'beers' ? 'Beer Units' : 'Grams',
            xAxisId: 'participant',
            yAxisId: 'consumption',
            valueFormatter: (value: number | null) => {
              if (value === null) return '';
              const formatted = formatValue(value);
              return unit === 'beers'
                ? `${formatted} units`
                : `${formatted}g`;
            },
          },
        ]}
        margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
        grid={{ vertical: false, horizontal: true }}
        axisHighlight={{ x: 'none', y: 'none' }}
        slots={{
          legend: () => null,
        }}
        sx={{
          width: '100%',
          height: '100%',
          flex: 1,
        }}
      />
    </div>
  );
}
