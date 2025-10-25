import { useMemo } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import type { Profile, DrinkEntry } from '../../types/database';
import { prepareLineChartData } from '../../utils/chartHelpers';

interface BACLineChartProps {
  participants: Profile[];
  drinks: DrinkEntry[];
  sessionStartTime: Date;
  sessionEndTime: Date;
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
 * The x-axis is fixed from session start (0 minutes) to session end, preventing
 * the chart from expanding and providing a clear view of progress toward the finish line.
 *
 * @param participants - Array of participant profiles
 * @param drinks - Array of all drink entries in the session
 * @param sessionStartTime - Session start timestamp
 * @param sessionEndTime - Session end timestamp (defines the fixed x-axis range)
 * @param currentUserId - ID of the current user (to highlight their line)
 * @param view - Display mode: 'all' shows all participants, 'self' shows only current user
 */
export default function BACLineChart({
  participants,
  drinks,
  sessionStartTime,
  sessionEndTime,
  currentUserId,
  view,
}: BACLineChartProps) {
  // Prepare chart data using memoization for performance
  const chartData = useMemo(() => {
    const currentTime = new Date();

    // Calculate total session duration in minutes
    const sessionDurationMinutes = Math.ceil(
      (sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)
    );

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

    // Assign colors to participants
    const colors = displayParticipants.map((participant, index) => {
      // Highlight current user's line with a bolder color
      if (participant.id === currentUserId) {
        return '#1976d2'; // Primary blue for current user
      }
      return CHART_COLORS[index % CHART_COLORS.length];
    });

    return { series, colors, sessionDurationMinutes };
  }, [participants, drinks, sessionStartTime, sessionEndTime, currentUserId, view]);

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
        Ingen promilledata tilgjengelig ennå. Legg til noen enheter for å se grafen!
      </div>
    );
  }

  // Create x-axis data from all unique x values across all series
  const allXValues = new Set<number>();
  chartData.series.forEach(s => {
    s.data.forEach(point => allXValues.add(point.x));
  });
  const xAxisData = Array.from(allXValues).sort((a, b) => a - b);

  // Align each series data to the x-axis
  const seriesConfig = chartData.series.map((s, index) => {
    // Create a map of x -> y for this series
    const dataMap = new Map(s.data.map(point => [point.x, point.y]));

    // For each x value in the axis, get the corresponding y value or null
    const alignedData = xAxisData.map(x => dataMap.get(x) ?? null);

    return {
      data: alignedData,
      label: s.label,
      color: chartData.colors[index],
      connectNulls: true, // Connect the line even if there are null values
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
      <LineChart
        xAxis={[{
          data: xAxisData,
          label: 'Tid (minutter)',
          min: 0,
          max: chartData.sessionDurationMinutes,
        }]}
        yAxis={[{
          label: 'Promille %',
          min: 0,
        }]}
        series={seriesConfig}
        margin={{ top: 50, right: 20, bottom: 60, left: 80 }}
        grid={{ vertical: false, horizontal: true }}
        axisHighlight={{ x: 'none', y: 'none' }}
        slotProps={{
          legend: {
            direction: 'row',
            position: { vertical: 'top', horizontal: 'middle' },
            padding: 0,
            itemMarkWidth: 10,
            itemMarkHeight: 10,
            markGap: 5,
            itemGap: 15,
          },
        }}
        sx={{
          width: '100%',
          height: '100%',
          flex: 1,
          '& .MuiLineElement-root': {
            strokeWidth: 2,
          },
          '& .MuiMarkElement-root': {
            scale: '0.8',
            strokeWidth: 2,
          },
          '& .MuiChartsAxis-label': {
            fontSize: '14px',
            fontWeight: 500,
          },
          '& .MuiChartsAxis-tickLabel': {
            fontSize: '12px',
          },
          '& .MuiChartsLegend-root': {
            marginBottom: '8px',
          },
          '& .MuiChartsLegend-series text': {
            fontSize: '13px !important',
            fontWeight: 500,
          },
          '& .MuiChartsLegend-mark': {
            rx: 2,
          },
        }}
      />
    </div>
  );
}
