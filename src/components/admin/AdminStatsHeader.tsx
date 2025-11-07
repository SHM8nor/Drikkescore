import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';
import {
  People as PeopleIcon,
  Event as EventIcon,
  EventAvailable as EventAvailableIcon,
  PersonPin as PersonPinIcon,
} from '@mui/icons-material';
import { useSystemStats } from '../../hooks/useSystemAnalytics';

/**
 * AdminStatsHeader Component
 *
 * Displays key system statistics in a compact card layout
 * - Total Users
 * - Total Sessions
 * - Active Sessions Now
 * - Active Users Now
 */
export default function AdminStatsHeader() {
  const { data: stats, isLoading } = useSystemStats();

  const statCards = [
    {
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      value: stats?.totalUsers ?? 0,
      label: 'Totalt brukere',
    },
    {
      icon: <EventIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      value: stats?.totalSessions ?? 0,
      label: 'Totalt sesjoner',
    },
    {
      icon: <EventAvailableIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      value: stats?.activeSessions ?? 0,
      label: 'Aktive sesjoner nå',
    },
    {
      icon: <PersonPinIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      value: stats?.activeUsers ?? 0,
      label: 'Aktive brukere nå',
    },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2,
        }}
      >
        {statCards.map((card, index) => (
          <Card
            key={index}
            elevation={2}
            sx={{
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 2,
                px: 2.5,
                '&:last-child': { pb: 2 },
              }}
            >
              <Box sx={{ flexShrink: 0 }}>{card.icon}</Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                {isLoading ? (
                  <>
                    <Skeleton variant="text" width={60} height={40} />
                    <Skeleton variant="text" width="100%" height={20} />
                  </>
                ) : (
                  <>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{
                        fontWeight: 'bold',
                        lineHeight: 1.2,
                        mb: 0.5,
                      }}
                    >
                      {card.value.toLocaleString('nb-NO')}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.875rem',
                        lineHeight: 1.3,
                      }}
                    >
                      {card.label}
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
