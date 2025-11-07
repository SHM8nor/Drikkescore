import { useMemo } from 'react';
import { Box, Typography, Paper, Tooltip, Alert, CircularProgress } from '@mui/material';
import type { ActivityHeatmap } from '../../api/systemAnalytics';

interface ActivityHeatmapProps {
  activityData: ActivityHeatmap[] | undefined;
  loading?: boolean;
  error?: Error | null;
}

const DAYS = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * ActivityHeatmap Component
 *
 * Displays a heatmap showing session activity by day of week and hour.
 * Features:
 * - Color-coded cells based on activity count
 * - Tooltips showing exact counts
 * - X-axis: Days of week (Norwegian)
 * - Y-axis: Hours (0-23)
 * - Responsive grid layout
 */
export default function ActivityHeatmap({
  activityData,
  loading = false,
  error,
}: ActivityHeatmapProps) {
  // Create a map for quick lookup
  const activityMap = useMemo(() => {
    if (!activityData) return new Map<string, number>();

    const map = new Map<string, number>();
    activityData.forEach((item) => {
      const key = `${item.dayOfWeek}-${item.hour}`;
      map.set(key, item.count);
    });
    return map;
  }, [activityData]);

  // Calculate max count for color scaling
  const maxCount = useMemo(() => {
    if (!activityData || activityData.length === 0) return 1;
    return Math.max(...activityData.map((d) => d.count));
  }, [activityData]);

  // Get color intensity based on count
  const getColor = (count: number): string => {
    if (count === 0) return '#f3f4f6'; // Gray for no activity
    const intensity = Math.min(count / maxCount, 1);

    // Color scale from light blue to dark blue
    const lightness = 90 - intensity * 50; // 90% to 40%
    return `hsl(215, 70%, ${lightness}%)`;
  };

  // Get activity count for a specific day and hour
  const getCount = (day: number, hour: number): number => {
    const key = `${day}-${hour}`;
    return activityMap.get(key) || 0;
  };

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
            Feil ved lasting av aktivitetsdata
          </Typography>
          <Typography>{error.message}</Typography>
        </Alert>
      </Paper>
    );
  }

  // Empty state
  if (!activityData || activityData.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="info">
          <Typography>Ingen aktivitetsdata tilgjengelig</Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Aktivitetskart
      </Typography>

      <Box sx={{ overflowX: 'auto' }}>
        {/* Heatmap Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `60px repeat(7, minmax(50px, 1fr))`,
            gap: '2px',
            minWidth: '600px',
          }}
        >
          {/* Header Row - Days */}
          <Box /> {/* Empty corner cell */}
          {DAYS.map((day) => (
            <Box
              key={day}
              sx={{
                textAlign: 'center',
                p: 1,
                fontSize: '13px',
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {day}
            </Box>
          ))}

          {/* Hour Rows */}
          {HOURS.map((hour) => (
            <>
              {/* Hour Label */}
              <Box
                key={`hour-${hour}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  pr: 2,
                  fontSize: '12px',
                  color: 'text.secondary',
                }}
              >
                {hour.toString().padStart(2, '0')}:00
              </Box>

              {/* Activity Cells for this hour */}
              {DAYS.map((_, dayIndex) => {
                const count = getCount(dayIndex, hour);
                const color = getColor(count);

                return (
                  <Tooltip
                    key={`${dayIndex}-${hour}`}
                    title={
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {DAYS[dayIndex]} {hour.toString().padStart(2, '0')}:00
                        </Typography>
                        <Typography variant="caption" display="block">
                          {count} {count === 1 ? 'økt' : 'økter'}
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                  >
                    <Box
                      sx={{
                        backgroundColor: color,
                        aspectRatio: '1',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: 'var(--shadow-sm)',
                          zIndex: 1,
                        },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </>
          ))}
        </Box>

        {/* Legend */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            mt: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
            Færre økter
          </Typography>
          {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
            <Box
              key={intensity}
              sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: getColor(Math.ceil(maxCount * intensity)),
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          ))}
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
            Flere økter
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Høyeste aktivitet: {maxCount} økter
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
