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
  currentUserId?: string; // Optional: to match colors with BAC chart
}

/**
 * Color palette matching BACLineChart for consistency
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
  currentUserId,
}: AlcoholConsumptionChartProps) {
  // Prepare chart data based on view mode
  const chartData = useMemo(() => {
    if (view === 'per-participant') {
      // Use helper function to calculate per-participant data
      const data = prepareBarChartData(participants, drinks, unit);

      // Assign colors to match BAC chart
      return data.map((item, index) => {
        const participant = participants.find(p => p.full_name === item.participant);
        let color: string;

        if (currentUserId && participant?.id === currentUserId) {
          color = '#1976d2'; // Primary blue for current user
        } else {
          color = CHART_COLORS[index % CHART_COLORS.length];
        }

        return { ...item, color };
      });
    } else {
      // Calculate total session consumption
      const totalGrams = calculateTotalAlcoholGrams(drinks);
      const value = unit === 'beers' ? convertGramsToBeers(totalGrams) : totalGrams;

      return [
        {
          participant: 'Total',
          value: Math.round(value * 100) / 100,
          color: '#1976d2',
        },
      ];
    }
  }, [participants, drinks, view, unit, currentUserId]);

  // Format value for display based on unit
  const formatValue = (value: number): string => {
    if (unit === 'beers') {
      return value.toFixed(1);
    }
    return value.toFixed(0);
  };

  // Get axis label based on unit
  const yAxisLabel = unit === 'beers' ? 'Antall enheter' : 'Rent alkohol (g)';

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
        Ingen deltakere i denne økten
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
        Ingen enheter registrert ennå
      </div>
    );
  }

  // Prepare data in MUI BarChart format
  const xAxisData = chartData.map((d) => d.participant);

  // Create individual series for each participant to enable different colors
  const series = chartData.map((item, index) => {
    const data = new Array(chartData.length).fill(0);
    data[index] = item.value;

    return {
      data: data,
      label: item.participant,
      color: item.color,
      stack: 'total', // Stack them so they appear in same position
      valueFormatter: (value: number | null) => {
        if (value === null || value === 0) return '';
        const formatted = formatValue(value);
        return unit === 'beers'
          ? `${formatted} units`
          : `${formatted}g`;
      },
    };
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '350px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Custom legend for per-participant view */}
      {view === 'per-participant' && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          padding: '8px 0 12px 0',
        }}>
          {chartData.map((item) => (
            <div
              key={item.participant}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: item.color,
                  borderRadius: '2px',
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>
                {item.participant}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* Display total value prominently when in session-total view */}
      {view === 'session-total' && chartData.length > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '16px 0 8px 0',
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'var(--primary-color)',
        }}>
          {formatValue(chartData[0].value)} {unit === 'beers' ? 'enheter' : 'g'}
        </div>
      )}
      <BarChart
        xAxis={[
          {
            scaleType: 'band',
            data: xAxisData,
            label: view === 'per-participant' ? 'Participant' : '',
          },
        ]}
        yAxis={[
          {
            label: yAxisLabel,
            valueFormatter: (value: number | null) => {
              if (value === null) return '';
              return formatValue(value);
            },
          },
        ]}
        series={series}
        margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
        grid={{ vertical: false, horizontal: true }}
        axisHighlight={{ x: 'none', y: 'none' }}
        barLabel="value"
        slotProps={{
          barLabel: {
            style: {
              fontSize: '12px',
              fontWeight: 600,
              fill: '#fff',
            },
          },
        }}
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
