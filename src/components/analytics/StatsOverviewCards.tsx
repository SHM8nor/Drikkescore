import { Box, Card, CardContent, Typography } from '@mui/material';
import { Grid } from '@mui/material';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import EventIcon from '@mui/icons-material/Event';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import ScienceIcon from '@mui/icons-material/Science';
import type { PeriodStats } from '../../types/analytics';

interface StatsOverviewCardsProps {
  stats: PeriodStats;
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

/**
 * Individual stat card component
 */
function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
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
 * StatsOverviewCards Component
 *
 * Displays key metrics as a grid of cards:
 * - Total drinks consumed
 * - Total sessions participated in
 * - Total alcohol consumed (in grams and beer units)
 * - Average BAC across sessions
 * - Peak BAC recorded
 * - Total calories consumed
 * - Average drinks per session
 *
 * Uses Material-UI Card components with custom styling.
 */
export default function StatsOverviewCards({ stats, loading = false }: StatsOverviewCardsProps) {
  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Card
              sx={{
                height: 120,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-gray-50)',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            >
              <CardContent />
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      {/* Total Drinks */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Totalt antall enheter"
          value={stats.totalDrinks}
          subtitle={`Gjennomsnitt ${stats.averageDrinksPerSession.toFixed(1)} per økt`}
          icon={<LocalBarIcon />}
          color="var(--prussian-blue)"
        />
      </Grid>

      {/* Total Sessions */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Antall økter"
          value={stats.totalSessions}
          subtitle={stats.totalSessions === 1 ? 'økt fullført' : 'økter fullført'}
          icon={<EventIcon />}
          color="var(--orange-wheel)"
        />
      </Grid>

      {/* Total Alcohol (Beers) */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Totalt alkohol"
          value={`${stats.totalAlcoholBeers.toFixed(1)}`}
          subtitle={`${stats.totalAlcoholGrams.toFixed(0)}g rent alkohol`}
          icon={<ScienceIcon />}
          color="var(--xanthous-dark)"
        />
      </Grid>

      {/* Average BAC */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Gjennomsnittlig promille"
          value={`${(stats.averageBAC * 100).toFixed(2)}%`}
          subtitle="På tvers av alle økter"
          icon={<ShowChartIcon />}
          color="#047857"
        />
      </Grid>

      {/* Peak BAC */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Høyeste promille"
          value={`${(stats.peakBAC * 100).toFixed(2)}%`}
          subtitle="Høyeste måling"
          icon={<TrendingUpIcon />}
          color="var(--fire-engine-red)"
        />
      </Grid>

      {/* Total Calories */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title="Totalt kalorier"
          value={stats.totalCalories.toLocaleString('nb-NO')}
          subtitle="Fra alkoholkonsum"
          icon={<LocalFireDepartmentIcon />}
          color="#7b1fa2"
        />
      </Grid>
    </Grid>
  );
}
