import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Skeleton,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAdminSessions } from '../../hooks/useAdminSessions';

/**
 * RecentSessionsWidget Component
 *
 * Displays the 5 most recently created sessions
 * Click to navigate to session details
 */
export default function RecentSessionsWidget() {
  const { sessions, loading } = useAdminSessions();
  const navigate = useNavigate();

  // Get last 5 sessions (already sorted by created_at desc)
  const recentSessions = sessions.slice(0, 5);

  const handleSessionClick = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'nå nettopp';
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minutt' : 'minutter'} siden`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'time' : 'timer'} siden`;
      if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'dag' : 'dager'} siden`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'uke' : 'uker'} siden`;
      }
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'måned' : 'måneder'} siden`;
    } catch {
      return 'Ukjent tid';
    }
  };

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Nylige sesjoner
        </Typography>

        {loading ? (
          <Box>
            {[...Array(5)].map((_, index) => (
              <Box key={index} sx={{ mb: 1.5 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
            ))}
          </Box>
        ) : recentSessions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            Ingen sesjoner ennå
          </Typography>
        ) : (
          <List disablePadding>
            {recentSessions.map((session, index) => (
              <Box key={session.id}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleSessionClick(session.id)}
                    sx={{
                      py: 1.5,
                      px: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {session.session_name}
                          </Typography>
                          <Chip
                            label={session.session_code}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeTime(session.created_at)}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
