/**
 * ThemeManagement Component
 *
 * Admin panel for managing the theme system including:
 * - Theme enable/disable controls
 * - Seasonal auto-switching configuration
 * - Theme usage analytics and statistics
 * - Most popular themes
 * - Theme comparison
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  CalendarMonth as CalendarIcon,
  QueryStats as StatsIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import {
  useAllThemeAnalytics,
  useThemeComparison,
} from '../../hooks/useThemeAnalytics';
import {
  useThemeConfig,
  useUpdateThemeConfig,
} from '../../hooks/useThemeConfig';
import {
  themeDisplayNames,
  themeEmojis,
  isInSeasonalPeriod,
} from '../../config/themes';
import type { SessionType } from '../../types/database';

/**
 * Theme Management Component
 */
export default function ThemeManagement() {
  const [timelineDays, setTimelineDays] = useState(30);
  const [compareThemeA, setCompareThemeA] = useState<SessionType>('standard');
  const [compareThemeB, setCompareThemeB] = useState<SessionType>('julebord');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Fetch all theme analytics
  const {
    statistics,
    badgeStats,
    timeline,
    mostPopular,
    sessionCount,
    isLoading,
    error,
  } = useAllThemeAnalytics({ timelineDays });

  // Fetch theme comparison
  const { data: comparison } = useThemeComparison(compareThemeA, compareThemeB);

  // Fetch theme config from database
  const { data: themeConfig, isLoading: configLoading } = useThemeConfig();
  const updateConfig = useUpdateThemeConfig();

  const handleToggleJulebord = async () => {
    if (!themeConfig) return;

    try {
      await updateConfig.mutateAsync({
        julebordEnabled: !themeConfig.julebord_enabled,
        autoSeasonalSwitch: themeConfig.auto_seasonal_switch,
      });
      setSnackbar({
        open: true,
        message: `Julebord-tema ${!themeConfig.julebord_enabled ? 'aktivert' : 'deaktivert'}`,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Kunne ikke oppdatere tema',
        severity: 'error',
      });
    }
  };

  const handleToggleAutoSeasonal = async () => {
    if (!themeConfig) return;

    try {
      await updateConfig.mutateAsync({
        julebordEnabled: themeConfig.julebord_enabled,
        autoSeasonalSwitch: !themeConfig.auto_seasonal_switch,
      });
      setSnackbar({
        open: true,
        message: `Automatisk sesongbytte ${!themeConfig.auto_seasonal_switch ? 'aktivert' : 'deaktivert'}`,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Kunne ikke oppdatere tema',
        severity: 'error',
      });
    }
  };

  if (isLoading || configLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Kunne ikke laste temastatistikk: {error.message}
      </Alert>
    );
  }

  if (!themeConfig) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Kunne ikke laste temakonfigurasjon
      </Alert>
    );
  }

  // Calculate chart data
  const timelineData = timeline || [];
  const dates = [...new Set(timelineData.map((d) => d.date))].sort();
  const standardData = dates.map(
    (date) =>
      timelineData.find((d) => d.date === date && d.session_type === 'standard')
        ?.sessions_created || 0
  );
  const julebordData = dates.map(
    (date) =>
      timelineData.find((d) => d.date === date && d.session_type === 'julebord')
        ?.sessions_created || 0
  );

  // Pie chart data for session distribution
  const pieData = Object.entries(sessionCount || {}).map(([type, count]) => ({
    id: type,
    label: themeDisplayNames[type as SessionType],
    value: count,
  }));

  // Seasonal status
  const isJulebordSeason = isInSeasonalPeriod('julebord');

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Temahåndtering
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administrer tema for sesjoner, inkludert julebord-tema og annen tematisering.
          Konfigurer automatisk aktivering basert på sesong og se bruksstatistikk.
        </Typography>
      </Box>

      {/* Theme Configuration Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon /> Temakonfigurasjon
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Julebord Enable/Disable */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {themeEmojis.julebord} Julebord-tema
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tillat brukere å opprette julebord-sesjoner
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={themeConfig.julebord_enabled}
                        onChange={handleToggleJulebord}
                        color="primary"
                        disabled={updateConfig.isPending}
                      />
                    }
                    label=""
                  />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={themeConfig.julebord_enabled ? 'Aktivert' : 'Deaktivert'}
                    color={themeConfig.julebord_enabled ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Auto-Seasonal Switching */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Automatisk sesongbytte
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktiver julebord automatisk i desember
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={themeConfig.auto_seasonal_switch}
                        onChange={handleToggleAutoSeasonal}
                        color="primary"
                        disabled={!themeConfig.julebord_enabled || updateConfig.isPending}
                      />
                    }
                    label=""
                  />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={isJulebordSeason ? 'I sesong nå' : 'Utenfor sesong'}
                    color={isJulebordSeason ? 'success' : 'default'}
                    size="small"
                    icon={<CelebrationIcon />}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Seasonal Dates Info */}
        {themeConfig.auto_seasonal_switch && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Julebord-tema aktiveres automatisk i desember (1. - 31. desember)
          </Alert>
        )}
      </Paper>

      {/* Statistics Overview */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatsIcon /> Statistikk oversikt
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {statistics?.map((stat) => (
            <Grid size={{ xs: 12, md: 6 }} key={stat.session_type}>
              <Card
                variant="outlined"
                sx={{
                  borderLeft: 4,
                  borderColor:
                    stat.session_type === 'julebord' ? 'success.main' : 'primary.main',
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {themeEmojis[stat.session_type]} {themeDisplayNames[stat.session_type]}
                  </Typography>

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Totalt sesjoner:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {stat.total_sessions}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Aktive sesjoner:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        {stat.active_sessions}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Totalt deltakere:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {stat.total_participants}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Totalt drinks:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {stat.total_drinks}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Snitt deltakere/sesjon:
                      </Typography>
                      <Typography variant="body2">
                        {stat.avg_participants_per_session.toFixed(1)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Most Popular Theme */}
      {mostPopular && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon /> Mest populære tema
          </Typography>

          <Card
            variant="outlined"
            sx={{ mt: 2, borderLeft: 4, borderColor: 'warning.main' }}
          >
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {themeEmojis[mostPopular.session_type]}{' '}
                {themeDisplayNames[mostPopular.session_type]}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip
                  label={`${mostPopular.total_sessions} sesjoner`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`${mostPopular.total_participants} deltakere`}
                  color="secondary"
                  size="small"
                />
                <Chip
                  label={`Popularitetsscore: ${mostPopular.popularity_score.toFixed(0)}`}
                  color="warning"
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>
        </Paper>
      )}

      {/* Charts Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon /> Brukstrend
        </Typography>

        {/* Timeline Period Selector */}
        <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
          <InputLabel>Periode</InputLabel>
          <Select
            value={timelineDays}
            onChange={(e) => setTimelineDays(e.target.value as number)}
            label="Periode"
          >
            <MenuItem value={7}>Siste 7 dager</MenuItem>
            <MenuItem value={30}>Siste 30 dager</MenuItem>
            <MenuItem value={90}>Siste 90 dager</MenuItem>
          </Select>
        </FormControl>

        {/* Line Chart: Sessions over time */}
        <Box sx={{ width: '100%', height: 300, mb: 3 }}>
          {dates.length > 0 ? (
            <LineChart
              xAxis={[
                {
                  data: dates.map((_, i) => i),
                  scaleType: 'point',
                  valueFormatter: (value) =>
                    new Date(dates[value]).toLocaleDateString('nb-NO', {
                      month: 'short',
                      day: 'numeric',
                    }),
                },
              ]}
              series={[
                {
                  data: standardData,
                  label: 'Standard',
                  color: '#003049',
                  curve: 'linear',
                },
                {
                  data: julebordData,
                  label: 'Julebord',
                  color: '#165B33',
                  curve: 'linear',
                },
              ]}
              height={300}
            />
          ) : (
            <Alert severity="info">Ingen data tilgjengelig for valgt periode</Alert>
          )}
        </Box>

        {/* Pie Chart: Session Distribution */}
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Sesjonfordeling
        </Typography>
        {pieData.length > 0 && (
          <Box sx={{ width: '100%', height: 300 }}>
            <PieChart
              series={[
                {
                  data: pieData,
                  highlightScope: { faded: 'global', highlighted: 'item' },
                },
              ]}
              height={300}
            />
          </Box>
        )}
      </Paper>

      {/* Theme Comparison */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Temasammenligning
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tema A</InputLabel>
              <Select
                value={compareThemeA}
                onChange={(e) => setCompareThemeA(e.target.value as SessionType)}
                label="Tema A"
              >
                <MenuItem value="standard">
                  {themeEmojis.standard} Standard
                </MenuItem>
                <MenuItem value="julebord">
                  {themeEmojis.julebord} Julebord
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tema B</InputLabel>
              <Select
                value={compareThemeB}
                onChange={(e) => setCompareThemeB(e.target.value as SessionType)}
                label="Tema B"
              >
                <MenuItem value="standard">
                  {themeEmojis.standard} Standard
                </MenuItem>
                <MenuItem value="julebord">
                  {themeEmojis.julebord} Julebord
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {comparison && comparison.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Metrikk</TableCell>
                  <TableCell align="right">
                    {themeEmojis[compareThemeA]} {themeDisplayNames[compareThemeA]}
                  </TableCell>
                  <TableCell align="right">
                    {themeEmojis[compareThemeB]} {themeDisplayNames[compareThemeB]}
                  </TableCell>
                  <TableCell align="right">Forskjell</TableCell>
                  <TableCell align="right">% Forskjell</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparison.map((row) => (
                  <TableRow key={row.metric_name}>
                    <TableCell component="th" scope="row">
                      {row.metric_name}
                    </TableCell>
                    <TableCell align="right">{row.theme_a_value}</TableCell>
                    <TableCell align="right">{row.theme_b_value}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: row.difference > 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold',
                      }}
                    >
                      {row.difference > 0 ? '+' : ''}
                      {row.difference}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color:
                          row.percent_difference && row.percent_difference > 0
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      {row.percent_difference !== null
                        ? `${row.percent_difference > 0 ? '+' : ''}${row.percent_difference.toFixed(1)}%`
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Badge Statistics */}
      {badgeStats && badgeStats.length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Badge-statistikk etter tema
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tema</TableCell>
                  <TableCell>Badge</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell align="right">Totalt utdelt</TableCell>
                  <TableCell align="right">Unike mottakere</TableCell>
                  <TableCell align="right">Sesjoner med utdeling</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {badgeStats.slice(0, 10).map((stat, index) => (
                  <TableRow key={`${stat.session_type}-${stat.badge_id}-${index}`}>
                    <TableCell>
                      {themeEmojis[stat.session_type]} {themeDisplayNames[stat.session_type]}
                    </TableCell>
                    <TableCell>{stat.badge_name}</TableCell>
                    <TableCell>
                      <Chip label={stat.category} size="small" />
                    </TableCell>
                    <TableCell align="right">{stat.total_awards}</TableCell>
                    <TableCell align="right">{stat.unique_recipients}</TableCell>
                    <TableCell align="right">{stat.sessions_with_awards}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
