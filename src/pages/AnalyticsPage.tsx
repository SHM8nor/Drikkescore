import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { useDrinkPrices } from '../hooks/useDrinkPrices';
import StatsOverviewCards from '../components/analytics/StatsOverviewCards';
import WeeklyStatsChart from '../components/charts/WeeklyStatsChart';
import MonthlyStatsChart from '../components/charts/MonthlyStatsChart';
import BACTrendsChart from '../components/charts/BACTrendsChart';
import WHOComparisonGauge from '../components/charts/WHOComparisonGauge';
import HealthInsights from '../components/analytics/HealthInsights';
import CalorieChart from '../components/charts/CalorieChart';
import ConsumptionBreakdown from '../components/analytics/ConsumptionBreakdown';
import DrinkPriceManager from '../components/analytics/DrinkPriceManager';
import { calculateWHOComparison } from '../utils/whoGuidelines';
import type { AnalyticsData } from '../types/analytics';

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

  const { prices } = useDrinkPrices();

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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (analyticsError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Feil ved lasting av analysedata</Typography>
          <Typography>{analyticsError}</Typography>
        </Alert>
      </Container>
    );
  }

  if (!analyticsData || !profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">
          <Typography>Ingen analysedata tilgjengelig</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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

            {!whoData && analyticsData.bacTrend.length === 0 && (
              <Alert severity="info">Ingen helsedata for valgt periode</Alert>
            )}
          </Box>
        </TabPanel>

        {/* Tab 3: Calories */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Kalorier fra Alkohol
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Kaloriinntak og næringssammenligning
            </Typography>

            {analyticsData.weeklyConsumption.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <CalorieChart
                  weeklyData={analyticsData.weeklyConsumption.map((w) => ({
                    week: w.week,
                    calories: w.calories,
                  }))}
                  monthlyData={analyticsData.monthlyConsumption.map((m) => ({
                    month: m.month,
                    calories: m.calories,
                  }))}
                />
              </Box>
            )}

            <Box sx={{ mb: 4 }}>
              <ConsumptionBreakdown
                totalCalories={analyticsData.stats.totalCalories}
                totalAlcoholGrams={analyticsData.stats.totalAlcoholGrams}
                periodDays={periodDays}
              />
            </Box>
          </Box>
        </TabPanel>

        {/* Tab 4: Spending */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Utgifter og Prisstyring
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Kostnadsoversikt og administrasjon av drikkepriser
            </Typography>

            {/* Spending Info */}
            <Box sx={{ mb: 4 }}>
              {prices.length === 0 ? (
                <Alert severity="info">
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Ingen priser lagt til
                  </Typography>
                  <Typography variant="body2">
                    For å spore utgifter må du først legge til prisene på drikkevarene dine nedenfor.
                  </Typography>
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Utgiftsanalyse vil vises når du har lagt til priser på drikkene dine.
                </Typography>
              )}
            </Box>

            {/* Price Manager */}
            <Box sx={{ mb: 4 }}>
              <DrinkPriceManager />
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}
