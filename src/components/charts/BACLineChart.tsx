import { useMemo } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import type { Profile, DrinkEntry } from '../../types/database';
import { prepareLineChartData } from '../../utils/chartHelpers';

interface BACLineChartProps {
  participants: Profile[];
  drinks: DrinkEntry[];
  sessionStartTime: Date;
  currentUserId: string;
  view: 'all' | 'self';
}

/**
 * Default color palette for participant lines
 * Colors chosen for good contrast and accessibility
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
 * BACLineChart Component
 *
 * Displays BAC evolution over time for session participants using MUI LineChart.
 * Shows one colored line per participant with their BAC progression from session start.
 *
 * @param participants - Array of participant profiles
 * @param drinks - Array of all drink entries in the session
 * @param sessionStartTime - Session start timestamp
 * @param currentUserId - ID of the current user (to highlight their line)
 * @param view - Display mode: 'all' shows all participants, 'self' shows only current user
 */
export default function BACLineChart({
  participants,
  drinks,
  sessionStartTime,
  currentUserId,
  view,
}: BACLineChartProps) {
  // Prepare chart data using memoization for performance
  const chartData = useMemo(() => {
    const currentTime = new Date();

    // Filter participants based on view mode
    const displayParticipants =
      view === 'self'
        ? participants.filter((p) => p.id === currentUserId)
        : participants;

    // Generate line chart series for each participant
    const series = prepareLineChartData(
      displayParticipants,
      drinks,
      sessionStartTime,
      currentTime
    );

    // If no data, return empty structure
    if (series.length === 0 || series.every((s) => s.data.length === 0)) {
      return { series: [], xAxisData: [], colors: [] };
    }

    // Extract all unique x values (time points in minutes)
    const xValuesSet = new Set<number>();
    series.forEach((s) => {
      s.data.forEach((point) => {
        xValuesSet.add(point.x);
      });
    });
    const xAxisData = Array.from(xValuesSet).sort((a, b) => a - b);

    // Assign colors to participants
    const colors = displayParticipants.map((participant, index) => {
      // Highlight current user's line with a bolder color
      if (participant.id === currentUserId) {
        return '#1976d2'; // Primary blue for current user
      }
      return CHART_COLORS[index % CHART_COLORS.length];
    });

    return { series, xAxisData, colors };
  }, [participants, drinks, sessionStartTime, currentUserId, view]);

  // Handle empty state
  if (chartData.series.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          color: '#666',
          fontSize: '14px',
        }}
      >
        No BAC data available yet. Add some drinks to see the chart!
      </div>
    );
  }

  // Simple series config - use only the data points that exist
  const seriesConfig = chartData.series.map((s, index) => ({
    data: s.data.map(point => point.y),
    label: s.label,
    color: chartData.colors[index],
  }));

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '350px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <LineChart
        xAxis={[{
          data: chartData.xAxisData,
          label: 'Time (minutes)',
        }]}
        yAxis={[{
          label: 'BAC %',
        }]}
        series={seriesConfig}
        margin={{ top: 50, right: 20, bottom: 60, left: 80 }}
        grid={{ vertical: false, horizontal: true }}
        axisHighlight={{ x: 'none', y: 'none' }}
        slots={{
          legend: () => null,
        }}
        sx={{
          width: '100%',
          height: '100%',
          flex: 1,
          '& .MuiLineElement-root': {
            strokeWidth: 2,
          },
          '& .MuiMarkElement-root': {
            scale: '0.6',
          },
          '& .MuiChartsAxis-label': {
            fontSize: '14px',
            fontWeight: 500,
          },
          '& .MuiChartsAxis-tickLabel': {
            fontSize: '12px',
          },
          '& .MuiChartsLegend-series text': {
            fontSize: '12px !important',
          },
        }}
      />
    </div>
  );
}
