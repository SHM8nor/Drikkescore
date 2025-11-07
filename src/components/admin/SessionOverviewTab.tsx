import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
} from '@mui/material';
import {
  CalendarToday,
  People,
  LocalBar,
  TrendingUp,
  Timer,
} from '@mui/icons-material';
import type { Session } from '../../types/database';
import type { SessionDetailParticipant, SessionDrinkWithUser } from '../../api/sessionDetails';

interface SessionOverviewTabProps {
  session: Session;
  participants: SessionDetailParticipant[];
  drinks: SessionDrinkWithUser[];
  leaderboard: Array<{
    rank: number;
    user_id: string;
    display_name: string;
    avatar_url?: string;
    bac: number;
    drinkCount: number;
    peakBAC: number;
  }>;
}

/**
 * Session Overview Tab - Summary of session statistics
 *
 * Displays:
 * - Basic session info (code, name, creator with both display_name and full_name, times)
 * - Quick stats (participants, drinks, avg/peak BAC)
 * - Session status indicator
 */
export default function SessionOverviewTab({
  session,
  participants,
  drinks,
  leaderboard,
}: SessionOverviewTabProps) {
  // Format date/time for display
  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('nb-NO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  // Calculate session duration
  const getDuration = () => {
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}t ${minutes}m`;
  };

  // Check if session is active
  const isActive = () => {
    const now = new Date();
    const end = new Date(session.end_time);
    return end > now;
  };

  // Calculate average and peak BAC
  const avgBAC = leaderboard.length > 0
    ? leaderboard.reduce((sum, p) => sum + p.bac, 0) / leaderboard.length
    : 0;

  const peakBAC = leaderboard.length > 0
    ? Math.max(...leaderboard.map((p) => p.peakBAC))
    : 0;

  // Find creator and build name display
  const creator = participants.find((p) => p.userId === session.created_by);
  const creatorDisplay = creator
    ? `${creator.profile.display_name} (${creator.profile.full_name})`
    : 'Ukjent';

  return (
    <Box>
      {/* Session Basic Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Typography variant="h5" component="h2">
              {session.session_name}
            </Typography>
            <Chip
              label={isActive() ? 'Aktiv' : 'Avsluttet'}
              color={isActive() ? 'success' : 'default'}
              size="small"
            />
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Sesjonskode:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {session.session_code}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Opprettet av:
                </Typography>
                <Typography variant="body1">{creatorDisplay}</Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Start:
                </Typography>
                <Typography variant="body2">
                  {formatDateTime(session.start_time)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Slutt:
                </Typography>
                <Typography variant="body2">
                  {formatDateTime(session.end_time)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Timer sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Varighet:
                </Typography>
                <Typography variant="body2">{getDuration()}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
      <Typography variant="h6" gutterBottom>
        Statistikk
      </Typography>
      <Grid container spacing={2}>
        {/* Total Participants */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Deltakere
                </Typography>
              </Box>
              <Typography variant="h4">{participants.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Drinks */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalBar sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Totalt drinker
                </Typography>
              </Box>
              <Typography variant="h4">{drinks.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Average BAC */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Gj.snitt BAC
                </Typography>
              </Box>
              <Typography variant="h4">{avgBAC.toFixed(2)}‰</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Peak BAC */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Topp BAC
                </Typography>
              </Box>
              <Typography
                variant="h4"
                color={peakBAC >= 0.8 ? 'error.main' : 'text.primary'}
              >
                {peakBAC.toFixed(2)}‰
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
