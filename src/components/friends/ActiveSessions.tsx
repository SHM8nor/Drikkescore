/**
 * ActiveSessions Component
 *
 * Displays active sessions from friends with real-time updates.
 * Allows one-tap joining of friend sessions.
 *
 * Features:
 * - Real-time friend session updates via useActiveFriends hook
 * - Status indicators (active/idle/offline)
 * - One-click join functionality
 * - Mobile responsive design
 * - Empty state when no active friends
 */

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Circle as CircleIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useActiveFriends } from '../../hooks/useActiveFriends';
import { useJoinSession } from '../../hooks/useSession';
import type { ActiveFriendSession } from '../../types/database';
import { useState } from 'react';

interface ActiveSessionsProps {
  /**
   * Limit the number of sessions to display
   */
  maxDisplay?: number;

  /**
   * Show only active friends (exclude idle)
   */
  activeOnly?: boolean;

  /**
   * Compact mode for smaller displays
   */
  compact?: boolean;
}

export function ActiveSessions({
  maxDisplay,
  activeOnly = false,
  compact = false
}: ActiveSessionsProps) {
  const navigate = useNavigate();
  const { joinSession, loading: joinLoading } = useJoinSession();
  const {
    activeFriends,
    activeOnly: activeFriendsOnly,
    loading,
    error,
    refresh
  } = useActiveFriends();

  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Determine which friends to display
  const displayFriends = activeOnly ? activeFriendsOnly : activeFriends;
  const limitedFriends = maxDisplay
    ? displayFriends.slice(0, maxDisplay)
    : displayFriends;

  // Handle joining a friend's session
  const handleJoinSession = async (friend: ActiveFriendSession) => {
    setJoiningSessionId(friend.session_id);
    setJoinError(null);

    try {
      const session = await joinSession(friend.session_code);
      navigate(`/session/${session.id}`);
    } catch (err) {
      console.error('Error joining session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Kunne ikke bli med i økt';
      setJoinError(errorMessage);
      setJoiningSessionId(null);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'idle':
        return 'warning';
      case 'offline':
      default:
        return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'idle':
        return 'Inaktiv';
      case 'offline':
      default:
        return 'Offline';
    }
  };

  // Format last seen time
  const formatLastSeen = (lastSeen: string): string => {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Akkurat nå';
    if (diffMinutes < 60) return `${diffMinutes} min siden`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}t siden`;

    return lastSeenDate.toLocaleDateString('nb-NO');
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        severity="error"
        onClose={refresh}
        action={
          <Button color="inherit" size="small" onClick={refresh}>
            Prøv igjen
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  // Empty state
  if (limitedFriends.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={compact ? 2 : 4}
            textAlign="center"
          >
            <PeopleIcon
              sx={{
                fontSize: compact ? 48 : 64,
                color: 'text.disabled',
                mb: 2
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Ingen venner spiller akkurat nå
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Når vennene dine starter en økt, vises de her
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Error message for join failures */}
      {joinError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setJoinError(null)}
        >
          {joinError}
        </Alert>
      )}

      <Card variant="outlined">
        <CardContent sx={{ p: compact ? 2 : 3, '&:last-child': { pb: compact ? 2 : 3 } }}>
          <List disablePadding>
            {limitedFriends.map((friend, index) => {
              const isJoining = joiningSessionId === friend.session_id;
              const isLastItem = index === limitedFriends.length - 1;

              return (
                <ListItem
                  key={`${friend.friend_id}-${friend.session_id}`}
                  disableGutters
                  sx={{
                    py: compact ? 1.5 : 2,
                    borderBottom: isLastItem ? 'none' : '1px solid',
                    borderColor: 'divider',
                    gap: 2,
                    flexWrap: compact ? 'wrap' : 'nowrap',
                  }}
                  secondaryAction={
                    <Button
                      variant="contained"
                      size={compact ? 'small' : 'medium'}
                      onClick={() => handleJoinSession(friend)}
                      disabled={isJoining || joinLoading}
                      sx={{
                        minWidth: compact ? 80 : 100,
                        ml: 2,
                      }}
                    >
                      {isJoining ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Bli med'
                      )}
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      src={friend.friend_avatar_url || undefined}
                      sx={{
                        width: compact ? 40 : 48,
                        height: compact ? 40 : 48,
                      }}
                    >
                      {friend.friend_name?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                          variant={compact ? 'body2' : 'body1'}
                          fontWeight="medium"
                        >
                          {friend.friend_name}
                        </Typography>
                        <Chip
                          label={getStatusText(friend.status)}
                          color={getStatusColor(friend.status)}
                          size="small"
                          icon={<CircleIcon sx={{ fontSize: 12 }} />}
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Typography
                          variant="body2"
                          component="div"
                          color="text.primary"
                          fontWeight="medium"
                        >
                          {friend.session_name}
                        </Typography>

                        <Box
                          display="flex"
                          flexWrap="wrap"
                          gap={1}
                          mt={0.5}
                          alignItems="center"
                        >
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <PeopleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {friend.participant_count} {friend.participant_count === 1 ? 'deltaker' : 'deltakere'}
                            </Typography>
                          </Box>

                          <Box display="flex" alignItems="center" gap={0.5}>
                            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatLastSeen(friend.last_seen)}
                            </Typography>
                          </Box>

                          <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{
                              fontFamily: 'monospace',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {friend.session_code}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
