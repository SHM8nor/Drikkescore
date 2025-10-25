import { useMemo } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { prepareBACTrendChartData } from '../../utils/analyticsChartHelpers';

interface BACTrendsChartProps {
  bacTrend: { date: string; averageBAC: number; peakBAC: number }[];
}

/**
 * BACTrendsChart Component
 *
 * Displays BAC trends over time for personal analytics.
 * Shows two lines: average BAC and peak BAC per session/day.
 * Helps users understand their drinking patterns and BAC evolution over time.
 *
 * @param bacTrend - Array of BAC trend data points with date, average, and peak BAC
 */
export default function BACTrendsChart({ bacTrend }: BACTrendsChartProps) {
  // Prepare chart data using memoization for performance
  const chartData = useMemo(() => {
    if (bacTrend.length === 0) {
      return null;
    }

    return prepareBACTrendChartData(bacTrend);
  }, [bacTrend]);

  // Handle empty state
  if (!chartData || chartData.dates.length === 0) {
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
        Ingen promilledata tilgjengelig ennå. Start en økt for å se trender!
      </div>
    );
  }

  // Format dates for display
  const formattedDates = chartData.dates.map((dateStr) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });

  // Create series data aligned to x-axis
  const xAxisData = chartData.averageSeries.map((_, index) => index);

  const seriesConfig = [
    {
      data: chartData.averageSeries.map((point) => point.y),
      label: 'Gjennomsnittlig promille',
      color: '#1976d2', // Blue
      curve: 'linear' as const,
    },
    {
      data: chartData.peakSeries.map((point) => point.y),
      label: 'Høyeste promille',
      color: '#d32f2f', // Red
      curve: 'linear' as const,
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '350px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <LineChart
        height={350}
        xAxis={[
          {
            data: xAxisData,
            label: 'Dato',
            scaleType: 'point',
            valueFormatter: (value) => formattedDates[value as number] || '',
          },
        ]}
        yAxis={[
          {
            label: 'Promille %',
            min: 0,
          },
        ]}
        series={seriesConfig}
        margin={{ top: 50, right: 20, bottom: 60, left: 80 }}
        grid={{ vertical: false, horizontal: true }}
        axisHighlight={{ x: 'line', y: 'none' }}
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
            strokeWidth: 2.5,
          },
          '& .MuiMarkElement-root': {
            scale: '0.9',
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
