/**
 * SessionRecapModal Component
 *
 * Beautiful, full-screen modal for displaying session recaps with fun statistics
 * and guilt-trip messages. Features gradient background, glass-morphism cards,
 * and responsive design matching the FriendsPage aesthetic.
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
  Fade,
  Divider,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  LocalBar as LocalBarIcon,
  AttachMoney as AttachMoneyIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  AccessTime as AccessTimeIcon,
  ShowChart as ShowChartIcon,
  Warning as WarningIcon,
  SentimentVeryDissatisfied as SadIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import type { Session } from '../../types/database';
import type { SessionAnalytics } from '../../types/analytics';
import { formatBAC } from '../../utils/bacCalculator';
import RecapStatCard from './RecapStatCard';

interface SessionRecapModalProps {
  open: boolean;
  session: Session | null;
  analytics: SessionAnalytics | null;
  onDismiss: () => void;
  onViewDetails: () => void;
}

interface StatCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

/**
 * Generate funny guilt-trip messages based on analytics
 */
function generateRecapMessages(analytics: SessionAnalytics): Array<{
  icon: React.ReactNode;
  text: string;
  severity: 'warning' | 'info' | 'error';
}> {
  const messages: Array<{ icon: React.ReactNode; text: string; severity: 'warning' | 'info' | 'error' }> = [];

  // BAC-based messages
  if (analytics.peak_bac > 0.15) {
    messages.push({
      icon: <WarningIcon />,
      text: `Topp promille på ${formatBAC(analytics.peak_bac)}? Du hadde visst en god kveld! 🎉`,
      severity: 'error',
    });
  } else if (analytics.peak_bac > 0.08) {
    messages.push({
      icon: <TrendingUpIcon />,
      text: `${formatBAC(analytics.peak_bac)} i promille - du var i god form! 🍻`,
      severity: 'warning',
    });
  }

  // Drinks count messages
  if (analytics.drinks_count > 10) {
    messages.push({
      icon: <LocalBarIcon />,
      text: `${analytics.drinks_count} enheter? Leveren din fortjener en pause! 😅`,
      severity: 'error',
    });
  } else if (analytics.drinks_count > 5) {
    messages.push({
      icon: <LocalBarIcon />,
      text: `${analytics.drinks_count} enheter registrert - du holdt tel! 📊`,
      severity: 'warning',
    });
  }

  // Calorie messages
  if (analytics.total_calories > 2000) {
    messages.push({
      icon: <LocalFireDepartmentIcon />,
      text: `${analytics.total_calories.toLocaleString('nb-NO')} kalorier = omtrent 3 Big Mac-menyer! 🍔`,
      severity: 'warning',
    });
  } else if (analytics.total_calories > 1000) {
    messages.push({
      icon: <LocalFireDepartmentIcon />,
      text: `${analytics.total_calories.toLocaleString('nb-NO')} kalorier i flytende form. Treninga venter! 💪`,
      severity: 'info',
    });
  }

  // Money spent messages
  if (analytics.total_spent > 1000) {
    messages.push({
      icon: <AttachMoneyIcon />,
      text: `${analytics.total_spent.toLocaleString('nb-NO')} kr - det kunne vært en flybillett! ✈️`,
      severity: 'error',
    });
  } else if (analytics.total_spent > 500) {
    messages.push({
      icon: <AttachMoneyIcon />,
      text: `${analytics.total_spent.toLocaleString('nb-NO')} kr brukt. Lommeboka gråter! 💸`,
      severity: 'warning',
    });
  }

  // Duration messages
  if (analytics.duration_hours > 8) {
    messages.push({
      icon: <AccessTimeIcon />,
      text: `${analytics.duration_hours.toFixed(1)} timer - en hel arbeidsdag på baren! ⏰`,
      severity: 'warning',
    });
  }

  // Default message if none triggered
  if (messages.length === 0) {
    messages.push({
      icon: <ScienceIcon />,
      text: 'En rolig økt - men fortsatt verdt å se nærmere på statistikken! 📈',
      severity: 'info',
    });
  }

  return messages;
}

/**
 * Get severity color based on value
 */
function getSeverityColor(value: number, thresholds: { low: number; high: number }): string {
  if (value <= thresholds.low) return 'var(--color-success)';
  if (value <= thresholds.high) return 'var(--orange-wheel)';
  return 'var(--fire-engine-red)';
}

export default function SessionRecapModal({
  open,
  session,
  analytics,
  onDismiss,
  onViewDetails,
}: SessionRecapModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!session || !analytics) {
    return null;
  }

  const messages = generateRecapMessages(analytics);

  // Format session date
  const sessionDate = new Date(session.start_time).toLocaleDateString('nb-NO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Prepare stat cards data
  const statCards: StatCardData[] = [
    {
      title: 'Antall enheter',
      value: analytics.drinks_count,
      subtitle: `${(analytics.drinks_count / analytics.duration_hours).toFixed(1)} per time`,
      icon: <LocalBarIcon fontSize={isMobile ? 'small' : 'medium'} />,
      color: getSeverityColor(analytics.drinks_count, { low: 3, high: 7 }),
    },
    {
      title: 'Topp promille',
      value: formatBAC(analytics.peak_bac),
      subtitle: 'Høyeste måling',
      icon: <TrendingUpIcon fontSize={isMobile ? 'small' : 'medium'} />,
      color: getSeverityColor(analytics.peak_bac, { low: 0.05, high: 0.1 }),
    },
    {
      title: 'Penger brukt',
      value: `~${analytics.total_spent.toLocaleString('nb-NO')} kr`,
      subtitle: 'Estimat',
      icon: <AttachMoneyIcon fontSize={isMobile ? 'small' : 'medium'} />,
      color: getSeverityColor(analytics.total_spent, { low: 300, high: 700 }),
    },
    {
      title: 'Kalorier',
      value: analytics.total_calories.toLocaleString('nb-NO'),
      subtitle: 'Fra alkohol',
      icon: <LocalFireDepartmentIcon fontSize={isMobile ? 'small' : 'medium'} />,
      color: getSeverityColor(analytics.total_calories, { low: 500, high: 1500 }),
    },
    {
      title: 'Varighet',
      value: `${analytics.duration_hours.toFixed(1)} t`,
      subtitle: 'Total tid',
      icon: <AccessTimeIcon fontSize={isMobile ? 'small' : 'medium'} />,
      color: 'var(--prussian-blue)',
    },
    {
      title: 'Gj.snitt promille',
      value: formatBAC(analytics.average_bac),
      subtitle: 'Over hele økten',
      icon: <ShowChartIcon fontSize={isMobile ? 'small' : 'medium'} />,
      color: getSeverityColor(analytics.average_bac, { low: 0.03, high: 0.08 }),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 400 }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 'var(--radius-xl)',
          background: 'linear-gradient(135deg, var(--vanilla) 0%, var(--vanilla-light) 50%, var(--xanthous-bg) 100%)',
          overflow: 'hidden',
          '& .MuiDialogContent-root': {
            backgroundColor: 'transparent',
            backgroundImage: 'none',
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 48, 73, 0.1)',
          pb: 2,
          pt: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--prussian-blue) 0%, var(--prussian-blue-light) 50%, var(--orange-wheel) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                mb: 0.5,
              }}
            >
              🎉 Oppsummering av festen! 🎊
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'var(--color-text-primary)',
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              {session.session_name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'var(--color-text-secondary)',
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                textTransform: 'capitalize',
              }}
            >
              {sessionDate}
            </Typography>
          </Box>
          <IconButton
            onClick={onDismiss}
            sx={{
              color: 'var(--color-text-secondary)',
              '&:hover': {
                backgroundColor: 'rgba(0, 48, 73, 0.1)',
                color: 'var(--prussian-blue)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
          backgroundColor: 'transparent !important',
          backgroundImage: 'none !important',
        }}
      >
        {/* Stats Grid */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: 'var(--prussian-blue)',
              mb: 2,
              fontSize: { xs: '1rem', sm: '1.125rem' },
            }}
          >
            Statistikk
          </Typography>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {statCards.map((stat, index) => (
              <Grid size={{ xs: 6, md: 4 }} key={index}>
                <RecapStatCard {...stat} />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 3, borderColor: 'rgba(0, 48, 73, 0.1)' }} />

        {/* Funny Messages Section */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: 'var(--prussian-blue)',
              mb: 2,
              fontSize: { xs: '1rem', sm: '1.125rem' },
            }}
          >
            Tanker fra oss
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  background:
                    message.severity === 'error'
                      ? 'rgba(214, 40, 40, 0.1)'
                      : message.severity === 'warning'
                      ? 'rgba(247, 127, 0, 0.1)'
                      : 'rgba(0, 48, 73, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${
                    message.severity === 'error'
                      ? 'rgba(214, 40, 40, 0.2)'
                      : message.severity === 'warning'
                      ? 'rgba(247, 127, 0, 0.2)'
                      : 'rgba(0, 48, 73, 0.2)'
                  }`,
                  p: { xs: 1.5, sm: 2 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Box
                  sx={{
                    color:
                      message.severity === 'error'
                        ? 'var(--fire-engine-red)'
                        : message.severity === 'warning'
                        ? 'var(--orange-wheel)'
                        : 'var(--prussian-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  }}
                >
                  {message.icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--color-text-primary)',
                    fontSize: { xs: '0.85rem', sm: '0.9375rem' },
                    fontWeight: 500,
                    flex: 1,
                  }}
                >
                  {message.text}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Final encouragement */}
          <Box
            sx={{
              mt: 2,
              p: { xs: 1.5, sm: 2 },
              background: 'linear-gradient(135deg, rgba(0, 48, 73, 0.05) 0%, rgba(247, 127, 0, 0.05) 100%)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 48, 73, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <SadIcon sx={{ color: 'var(--orange-wheel)', fontSize: { xs: '1.5rem', sm: '2rem' } }} />
            <Typography
              variant="body2"
              sx={{
                color: 'var(--color-text-primary)',
                fontSize: { xs: '0.85rem', sm: '0.9375rem' },
                fontStyle: 'italic',
              }}
            >
              Se detaljert analyse for å lære mer om drikkemønstrene dine og få bedre innsikt! 📈
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0, 48, 73, 0.1)',
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          gap: 1,
        }}
      >
        <Button
          onClick={onDismiss}
          variant="outlined"
          sx={{
            borderColor: 'var(--prussian-blue)',
            color: 'var(--prussian-blue)',
            fontWeight: 600,
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            px: { xs: 2, sm: 3 },
            '&:hover': {
              borderColor: 'var(--prussian-blue-dark)',
              backgroundColor: 'rgba(0, 48, 73, 0.05)',
            },
          }}
        >
          Kanskje senere
        </Button>
        <Button
          onClick={onViewDetails}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, var(--prussian-blue) 0%, var(--prussian-blue-light) 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            px: { xs: 2, sm: 3 },
            boxShadow: '0 4px 12px rgba(0, 48, 73, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, var(--prussian-blue-dark) 0%, var(--prussian-blue) 100%)',
              boxShadow: '0 6px 16px rgba(0, 48, 73, 0.4)',
            },
          }}
        >
          Se full analyse
        </Button>
      </DialogActions>
    </Dialog>
  );
}
