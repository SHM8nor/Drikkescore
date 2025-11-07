import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSystemAnalytics } from '../hooks/useSystemAnalytics';
import SystemStatsCards from '../components/admin/SystemStatsCards';
import SystemCharts from '../components/admin/SystemCharts';
import ActivityHeatmap from '../components/admin/ActivityHeatmap';
import TopUsersTable from '../components/admin/TopUsersTable';

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
      id={`admin-analytics-tabpanel-${index}`}
      aria-labelledby={`admin-analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * AdminAnalyticsPage Component
 *
 * System analytics dashboard for admin users.
 * Features:
 * - System-wide statistics (users, sessions, drinks, BAC, etc.)
 * - Growth charts (users and sessions over time)
 * - Activity heatmap (sessions by day and hour)
 * - Top users leaderboard
 * - Tabbed interface for different views
 * - Refresh functionality
 * - Loading and error states
 */
export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [growthPeriod, setGrowthPeriod] = useState(30);

  const {
    stats,
    growthData,
    activityHeatmap,
    topUsers,
    loading,
    error,
    refetch,
  } = useSystemAnalytics({
    growthPeriod,
    topUsersLimit: 10,
    realtime: false,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handlePeriodChange = (newPeriod: number) => {
    setGrowthPeriod(newPeriod);
  };

  // Global error state (shown at top of page)
  const showGlobalError = error && !loading;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--prussian-blue)',
            }}
          >
            Systemanalyse
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Oversikt over systemets aktivitet og statistikk
          </Typography>
        </Box>
        <Tooltip title="Oppdater data">
          <IconButton
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              bgcolor: 'var(--prussian-blue)',
              color: 'white',
              '&:hover': {
                bgcolor: 'var(--prussian-blue-dark)',
              },
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Global Error Alert */}
      {showGlobalError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Feil ved lasting av analysedata
          </Typography>
          <Typography>{error.message}</Typography>
        </Alert>
      )}

      {/* Stats Overview Cards (always visible) */}
      <Box sx={{ mb: 4 }}>
        <SystemStatsCards stats={stats} loading={loading} />
      </Box>

      {/* Tabbed Content */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="admin analytics tabs"
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '15px',
            },
          }}
        >
          <Tab label="Oversikt" id="admin-analytics-tab-0" />
          <Tab label="Vekst" id="admin-analytics-tab-1" />
          <Tab label="Aktivitet" id="admin-analytics-tab-2" />
          <Tab label="Toppliste" id="admin-analytics-tab-3" />
        </Tabs>

        {/* Tab 0: Overview */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Systemoversikt
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Nøkkelmetrikker for systemet
            </Typography>

            {loading && !stats ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={60} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Quick Stats Summary */}
                <Paper
                  sx={{
                    p: 3,
                    bgcolor: 'background.default',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Sammendrag
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3, mt: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Aktive brukere / Totalt
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--prussian-blue)' }}>
                        {stats?.activeUsers || 0} / {stats?.totalUsers || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {stats?.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(0) : 0}% aktivitet
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Enheter per bruker
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--xanthous-dark)' }}>
                        {stats?.totalUsers ? (stats.totalDrinks / stats.totalUsers).toFixed(1) : 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Gjennomsnitt
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        Økter per aktiv bruker
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--orange-wheel)' }}>
                        {stats?.activeUsers ? (stats.totalSessions / stats.activeUsers).toFixed(1) : 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Gjennomsnitt
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Info Message */}
                <Alert severity="info">
                  <Typography variant="body2">
                    Bruk faneknappene ovenfor for å utforske detaljerte analyser av vekst, aktivitet og topplister.
                  </Typography>
                </Alert>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Tab 1: Growth */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Vekstanalyse
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Historisk utvikling av brukere og økter
            </Typography>

            <SystemCharts
              growthData={growthData}
              loading={loading}
              error={error}
              onPeriodChange={handlePeriodChange}
              currentPeriod={growthPeriod}
            />
          </Box>
        </TabPanel>

        {/* Tab 2: Activity */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Aktivitetsanalyse
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Når er økter mest aktive? (basert på starttidspunkt)
            </Typography>

            <ActivityHeatmap
              activityData={activityHeatmap}
              loading={loading}
              error={error}
            />
          </Box>
        </TabPanel>

        {/* Tab 3: Top Users */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Toppliste
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Mest aktive brukere på plattformen
            </Typography>

            <TopUsersTable
              topUsers={topUsers}
              loading={loading}
              error={error}
            />
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
}
