import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';
import { Grid } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import GroupIcon from '@mui/icons-material/Group';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimerIcon from '@mui/icons-material/Timer';
import type { SystemStats } from '../../api/systemAnalytics';
import { formatBAC } from '../../utils/bacCalculator';

interface SystemStatsCardsProps {
  stats: SystemStats | undefined;
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

/**
 * Individual stat card component
 */
function StatCard({ title, value, subtitle, icon, color, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
            <Skeleton variant="text" width={100} height={20} />
            <Skeleton variant="circular" width={40} height={40} />
          </Box>
          <Skeleton variant="text" width="60%" height={40} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="80%" height={16} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'var(--transition-base)',
        '&:hover': {
          boxShadow: 'var(--shadow-md)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              backgroundColor: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            mb: subtitle ? 0.5 : 0,
            fontSize: '28px',
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: 'var(--color-text-muted)',
              fontSize: '12px',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * SystemStatsCards Component
 *
 * Displays system-wide statistics as a grid of cards:
 * - Total users and active users
 * - Active sessions
 * - Total drinks consumed
 * - Total friendships
 * - Average BAC
 * - Average session duration
 *
 * Uses Material-UI Card components with custom styling.
 */
export default function SystemStatsCards({ stats, loading = false }: SystemStatsCardsProps) {
  return (
    <Grid container spacing={2}>
      {/* Total Users */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Totalt antall brukere"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.activeUsers || 0} aktive brukere`}
          icon={<PeopleIcon />}
          color="var(--prussian-blue)"
          loading={loading}
        />
      </Grid>

      {/* Active Sessions */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Aktive økter"
          value={stats?.activeSessions || 0}
          subtitle={`${stats?.totalSessions || 0} totalt økter`}
          icon={<EventIcon />}
          color="var(--orange-wheel)"
          loading={loading}
        />
      </Grid>

      {/* Total Drinks */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Totalt antall enheter"
          value={stats?.totalDrinks || 0}
          subtitle="Alle enheter konsumert"
          icon={<LocalBarIcon />}
          color="var(--xanthous-dark)"
          loading={loading}
        />
      </Grid>

      {/* Total Friendships */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Totalt vennskaper"
          value={stats?.totalFriendships || 0}
          subtitle="Aktive vennerelasjoner"
          icon={<GroupIcon />}
          color="#047857"
          loading={loading}
        />
      </Grid>

      {/* Average BAC */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Gjennomsnittlig promille"
          value={formatBAC(stats?.avgBACAllTime || 0)}
          subtitle="På tvers av alle økter"
          icon={<ShowChartIcon />}
          color="var(--fire-engine-red)"
          loading={loading}
        />
      </Grid>

      {/* Average Session Duration */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Gjennomsnittlig varighet"
          value={`${stats?.avgSessionDuration.toFixed(1) || '0.0'}t`}
          subtitle="Per økt"
          icon={<TimerIcon />}
          color="#7b1fa2"
          loading={loading}
        />
      </Grid>
    </Grid>
  );
}
