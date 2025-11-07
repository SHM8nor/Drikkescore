import { useState, useMemo } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import type { GrowthData } from '../../api/systemAnalytics';

interface SystemChartsProps {
  growthData: GrowthData[] | undefined;
  loading?: boolean;
  error?: Error | null;
  onPeriodChange?: (period: number) => void;
  currentPeriod?: number;
}

/**
 * SystemCharts Component
 *
 * Displays growth charts for users and sessions over time.
 * Features:
 * - Line charts for user and session growth
 * - Period selector (7/30/90 days)
 * - Responsive sizing
 * - Loading and error states
 * - Norwegian labels
 */
export default function SystemCharts({
  growthData,
  loading = false,
  error,
  onPeriodChange,
  currentPeriod = 30,
}: SystemChartsProps) {
  const [period, setPeriod] = useState<number>(currentPeriod);

  const handlePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: number | null
  ) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
      onPeriodChange?.(newPeriod);
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!growthData || growthData.length === 0) {
      return { dates: [], users: [], sessions: [] };
    }

    return {
      dates: growthData.map((d) => new Date(d.date)),
      users: growthData.map((d) => d.users),
      sessions: growthData.map((d) => d.sessions),
    };
  }, [growthData]);

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Feil ved lasting av vekstdata
          </Typography>
          <Typography>{error.message}</Typography>
        </Alert>
      </Paper>
    );
  }

  // Empty state
  if (!growthData || growthData.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="info">
          <Typography>Ingen vekstdata tilgjengelig</Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      {/* Header with period selector */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Vekstutvikling
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
          aria-label="tidsperiode"
        >
          <ToggleButton value={7} aria-label="7 dager">
            7 dager
          </ToggleButton>
          <ToggleButton value={30} aria-label="30 dager">
            30 dager
          </ToggleButton>
          <ToggleButton value={90} aria-label="90 dager">
            90 dager
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Users Growth Chart */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          Brukervekst
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <LineChart
            xAxis={[
              {
                data: chartData.dates,
                scaleType: 'time',
                valueFormatter: (value: Date) =>
                  value.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }),
              },
            ]}
            yAxis={[
              {
                label: 'Antall brukere',
              },
            ]}
            series={[
              {
                data: chartData.users,
                label: 'Brukere',
                color: 'var(--prussian-blue)',
                curve: 'linear',
                showMark: false,
              },
            ]}
            height={300}
            margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
            grid={{ vertical: false, horizontal: true }}
            sx={{
              '& .MuiChartsAxis-label': {
                fontSize: '14px',
                fontWeight: 500,
                fill: 'var(--color-text-primary)',
              },
              '& .MuiChartsAxis-tickLabel': {
                fontSize: '12px',
                fill: 'var(--color-text-secondary)',
              },
              '& .MuiLineElement-root': {
                strokeWidth: 2,
              },
            }}
          />
        </Box>
      </Box>

      {/* Sessions Growth Chart */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
          Øktervekst
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <LineChart
            xAxis={[
              {
                data: chartData.dates,
                scaleType: 'time',
                valueFormatter: (value: Date) =>
                  value.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }),
              },
            ]}
            yAxis={[
              {
                label: 'Antall økter',
              },
            ]}
            series={[
              {
                data: chartData.sessions,
                label: 'Økter',
                color: 'var(--orange-wheel)',
                curve: 'linear',
                showMark: false,
              },
            ]}
            height={300}
            margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
            grid={{ vertical: false, horizontal: true }}
            sx={{
              '& .MuiChartsAxis-label': {
                fontSize: '14px',
                fontWeight: 500,
                fill: 'var(--color-text-primary)',
              },
              '& .MuiChartsAxis-tickLabel': {
                fontSize: '12px',
                fill: 'var(--color-text-secondary)',
              },
              '& .MuiLineElement-root': {
                strokeWidth: 2,
              },
            }}
          />
        </Box>
      </Box>

      {/* Summary Statistics */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          mt: 3,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Nye brukere
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--prussian-blue)' }}>
            {chartData.users[chartData.users.length - 1] || 0}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Nye økter
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--orange-wheel)' }}>
            {chartData.sessions[chartData.sessions.length - 1] || 0}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
