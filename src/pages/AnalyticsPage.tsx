import { useState, lazy, Suspense } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import { PageContainer } from '../components/layout/PageContainer';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import StatsOverviewCards from '../components/analytics/StatsOverviewCards';
import { calculateWHOComparison } from '../utils/whoGuidelines';
import type { AnalyticsData } from '../types/analytics';

// Lazy load chart components - these are heavy with MUI X-Charts
// Only loaded when the respective tab is viewed
const WeeklyStatsChart = lazy(() => import('../components/charts/WeeklyStatsChart'));
const MonthlyStatsChart = lazy(() => import('../components/charts/MonthlyStatsChart'));
const BACTrendsChart = lazy(() => import('../components/charts/BACTrendsChart'));
const WHOComparisonGauge = lazy(() => import('../components/charts/WHOComparisonGauge'));

// Lazy load analytics components
const HealthInsights = lazy(() => import('../components/analytics/HealthInsights'));

// These need to be imported directly due to prop type issues
import CalorieChart from '../components/charts/CalorieChart';
import ConsumptionBreakdown from '../components/analytics/ConsumptionBreakdown';
import DrinkPriceManager from '../components/analytics/DrinkPriceManager';

// Loading component for charts
const ChartSkeleton = () => (
  <Box sx={{ width: '100%' }}>
    <Skeleton variant="rectangular" height={300} />
    <Box sx={{ mt: 2 }}>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" />
    </Box>
  </Box>
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export function AnalyticsPage() {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<AnalyticsData['period']>('30days');
  const [activeTab, setActiveTab] = useState(0);

  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics(period);

  const handlePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: AnalyticsData['period'] | null
  ) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Calculate WHO comparison data from weekly consumption
  const whoData =
    analyticsData && profile
      ? calculateWHOComparison(
          analyticsData.weeklyConsumption[analyticsData.weeklyConsumption.length - 1]
            ?.grams || 0,
          profile.gender
        )
      : null;

  // Calculate period days for calorie breakdown
  const periodDays = period === '7days' ? 7 : period === '30days' ? 30 : period === '90days' ? 90 : 365;

  if (analyticsLoading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', mt: 4, mb: 4 }}>
          <CircularProgress size={60} />
        </Box>
      </PageContainer>
    );
  }

  if (analyticsError) {
    return (
      <PageContainer>
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            <Typography variant="h6">Feil ved lasting av analysedata</Typography>
            <Typography>{analyticsError}</Typography>
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  if (!analyticsData || !profile) {
    return (
      <PageContainer>
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="info">
            <Typography>Ingen analysedata tilgjengelig</Typography>
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--prussian-blue)',
            }}
          >
            Personlig Analyse
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Detaljert oversikt over dine drikkevaner og helseinnsikt
          </Typography>

          {/* Period Selector */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={handlePeriodChange}
              aria-label="tidsperiode"
              size="small"
            >
              <ToggleButton value="7days" aria-label="siste 7 dager">
                Siste 7 dager
              </ToggleButton>
              <ToggleButton value="30days" aria-label="siste 30 dager">
                Siste 30 dager
              </ToggleButton>
              <ToggleButton value="90days" aria-label="siste 90 dager">
                Siste 90 dager
              </ToggleButton>
              <ToggleButton value="all" aria-label="alt">
                Alt
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Stats Overview Cards */}
        <StatsOverviewCards stats={analyticsData.stats} loading={false} />

        {/* Tabs */}
        <Paper sx={{ mt: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="analyse kategorier"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Tab label="Forbruk" />
            <Tab label="Helse" />
            <Tab label="Kalorier" />
            <Tab label="Utgifter" />
          </Tabs>

          {/* Tab 1: Consumption */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Alkoholforbruk
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Oversikt over alkoholkonsum fordelt på uker og måneder
              </Typography>

              <Suspense fallback={<ChartSkeleton />}>
                {analyticsData.weeklyConsumption.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <WeeklyStatsChart weeklyData={analyticsData.weeklyConsumption} />
                  </Box>
                )}

                {analyticsData.monthlyConsumption.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <MonthlyStatsChart monthlyData={analyticsData.monthlyConsumption} />
                  </Box>
                )}
              </Suspense>

              {analyticsData.weeklyConsumption.length === 0 &&
                analyticsData.monthlyConsumption.length === 0 && (
                  <Alert severity="info">Ingen forbruksdata for valgt periode</Alert>
                )}
            </Box>
          </TabPanel>

          {/* Tab 2: Health */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Helse og Promilletrend
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                BAC-utvikling og sammenligning med WHO-anbefalinger
              </Typography>

              <Suspense fallback={<ChartSkeleton />}>
                {whoData && (
                  <Box sx={{ mb: 4 }}>
                    <WHOComparisonGauge whoData={whoData} />
                  </Box>
                )}

                {whoData && (
                  <Box sx={{ mb: 4 }}>
                    <HealthInsights whoData={whoData} gender={profile.gender} />
                  </Box>
                )}

                {analyticsData.bacTrend.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <BACTrendsChart bacTrend={analyticsData.bacTrend} />
                  </Box>
                )}
              </Suspense>

              {!whoData && analyticsData.bacTrend.length === 0 && (
                <Alert severity="info">Ingen helsedata for valgt periode</Alert>
              )}
            </Box>
          </TabPanel>

          {/* Tab 3: Calories */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Kaloriinntak fra alkohol
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Oversikt over kalorier fra alkoholforbruk
              </Typography>

              {analyticsData.stats.totalCalories > 0 ? (
                <Box>
                  <Box sx={{ mb: 4 }}>
                    <CalorieChart
                      weeklyData={analyticsData.weeklyConsumption.map(w => ({
                        week: w.week,
                        calories: Math.round((w.grams / 0.789) * 7) // Convert grams of alcohol to calories
                      }))}
                      monthlyData={analyticsData.monthlyConsumption.map(m => ({
                        month: m.month,
                        calories: Math.round((m.grams / 0.789) * 7)
                      }))}
                    />
                  </Box>
                  <ConsumptionBreakdown
                    totalCalories={analyticsData.stats.totalCalories}
                    totalAlcoholGrams={analyticsData.weeklyConsumption.reduce((sum, w) => sum + w.grams, 0)}
                    periodDays={periodDays}
                  />
                </Box>
              ) : (
                <Alert severity="info">Ingen kaloridata for valgt periode</Alert>
              )}
            </Box>
          </TabPanel>

          {/* Tab 4: Spending */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Estimerte utgifter
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Beregn dine alkoholutgifter basert på egendefinerte priser
              </Typography>

              <DrinkPriceManager />
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </PageContainer>
  );
}