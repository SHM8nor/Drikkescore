import { useMemo } from 'react';
import { Box, Typography, CircularProgress, useTheme, Paper } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import type { BACTimeSeriesData } from '../../hooks/useSessionBACData';
import type { Session } from '../../types/database';

interface SessionBACChartTabProps {
  bacData: BACTimeSeriesData[];
  loading: boolean;
  session: Session | null;
}

/**
 * Session BAC Chart Tab - Line chart showing BAC over time
 *
 * Features:
 * - Multi-series line chart (one per participant)
 * - Time on X-axis, BAC on Y-axis
 * - Danger zone highlight (>0.8‰)
 * - Legend with participant names
 * - Responsive chart sizing
 * - Color-coded series
 */
export default function SessionBACChartTab({
  bacData,
  loading,
  session,
}: SessionBACChartTabProps) {
  const theme = useTheme();

  // Prepare chart data
  const chartData = useMemo(() => {
    if (bacData.length === 0 || !session) {
      return null;
    }

    // Extract all unique time points
    const timePoints = bacData[0]?.data.map((d) => new Date(d.time)) || [];

    // Build series for each participant
    const series = bacData.map((participant, index) => {
      // Generate a color from theme palette
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.success.main,
      ];
      const color = colors[index % colors.length];

      return {
        id: participant.userId,
        label: participant.userName,
        data: participant.data.map((d) => d.bac),
        color,
        showMark: false, // Smoother lines
      };
    });

    return {
      xAxis: timePoints,
      series,
    };
  }, [bacData, session, theme.palette]);

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // No data state
  if (!chartData || bacData.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Ingen BAC-data tilgjengelig for denne sesjonen
        </Typography>
      </Box>
    );
  }

  // Calculate chart height based on number of participants
  const chartHeight = Math.max(400, Math.min(600, 400 + bacData.length * 10));

  return (
    <Box>
      {/* Chart description */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          BAC-utvikling over tid
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Viser promillenivå for alle deltakere gjennom sesjonen. Rød sone indikerer
          farlig nivå (≥0.8‰).
        </Typography>
      </Box>

      {/* Chart */}
      <Paper sx={{ p: 2 }}>
        <LineChart
          xAxis={[
            {
              data: chartData.xAxis,
              scaleType: 'time',
              valueFormatter: (value: Date) => {
                return new Intl.DateTimeFormat('nb-NO', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(value);
              },
              label: 'Tid',
            },
          ]}
          yAxis={[
            {
              label: 'BAC (‰)',
              min: 0,
            },
          ]}
          series={chartData.series}
          height={chartHeight}
          margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
          grid={{ vertical: true, horizontal: true }}
          sx={{
            // Style the danger zone (>0.8)
            '& .MuiChartsAxis-line': {
              stroke: theme.palette.divider,
            },
            '& .MuiChartsAxis-tick': {
              stroke: theme.palette.divider,
            },
            '& .MuiChartsLegend-series': {
              fontSize: '0.875rem',
            },
          }}
          slotProps={{
            legend: {
              direction: 'row',
              position: { vertical: 'bottom', horizontal: 'middle' },
              padding: 0,
              itemMarkWidth: 10,
              itemMarkHeight: 2,
              markGap: 5,
              itemGap: 15,
            },
          }}
        />

        {/* Danger zone indicator */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 20,
              height: 3,
              bgcolor: 'error.main',
              borderRadius: 0.5,
            }}
          />
          <Typography variant="body2">
            Farlig nivå (≥0.8‰) - Risiko for alvorlige skader
          </Typography>
        </Box>
      </Paper>

      {/* Peak BAC summary */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Topp BAC per deltaker
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {bacData
              .sort((a, b) => b.peakBAC - a.peakBAC)
              .map((participant) => (
                <Box
                  key={participant.userId}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.5,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    borderLeft: 4,
                    borderColor:
                      participant.peakBAC >= 0.8
                        ? 'error.main'
                        : participant.peakBAC >= 0.5
                          ? 'warning.main'
                          : 'success.main',
                  }}
                >
                  <Typography variant="body2" noWrap sx={{ mr: 2 }}>
                    {participant.userName}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color={
                      participant.peakBAC >= 0.8
                        ? 'error.main'
                        : participant.peakBAC >= 0.5
                          ? 'warning.main'
                          : 'text.primary'
                    }
                  >
                    {participant.peakBAC.toFixed(2)}‰
                  </Typography>
                </Box>
              ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
