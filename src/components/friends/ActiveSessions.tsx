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

  // Empty state - return null to hide the component entirely
  if (limitedFriends.length === 0) {
    return null;
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

      <Card
        variant="outlined"
        sx={{
          // Match custom design system
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'all 250ms ease-in-out',
          '&:hover': {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          }
        }}
      >
        <CardContent sx={{ p: compact ? 2 : 3, '&:last-child': { pb: compact ? 2 : 3 } }}>
          <Box>
            {limitedFriends.map((friend, index) => {
              const isJoining = joiningSessionId === friend.session_id;
              const isLastItem = index === limitedFriends.length - 1;

              return (
                <Box
                  key={`${friend.friend_id}-${friend.session_id}`}
                  sx={{
                    py: 2,
                    borderBottom: isLastItem ? 'none' : '1px solid #e5e7eb',
                  }}
                >
                  {/* Desktop layout: horizontal */}
                  <Box
                    sx={{
                      display: { xs: 'none', sm: 'flex' },
                      gap: 2,
                      alignItems: 'center',
                    }}
                  >
                    <Avatar
                      src={friend.friend_avatar_url || undefined}
                      sx={{
                        width: 48,
                        height: 48,
                        border: '2px solid #e5e7eb',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      {friend.friend_name?.[0]?.toUpperCase() || '?'}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="body1" fontWeight="medium" sx={{ color: '#1a1a1a' }}>
                          {friend.friend_name}
                        </Typography>
                        <Chip
                          label={getStatusText(friend.status)}
                          color={getStatusColor(friend.status)}
                          size="small"
                          icon={<CircleIcon sx={{ fontSize: 12 }} />}
                          sx={{
                            borderRadius: '4px',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: '24px',
                          }}
                        />
                      </Box>

                      <Typography variant="body2" fontWeight="medium" sx={{ color: '#003049', mb: 0.5 }}>
                        {friend.session_name}
                      </Typography>

                      <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PeopleIcon sx={{ fontSize: 14, color: '#4a4a4a' }} />
                          <Typography variant="caption" sx={{ color: '#4a4a4a' }}>
                            {friend.participant_count} {friend.participant_count === 1 ? 'deltaker' : 'deltakere'}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={0.5}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: '#4a4a4a' }} />
                          <Typography variant="caption" sx={{ color: '#4a4a4a' }}>
                            {formatLastSeen(friend.last_seen)}
                          </Typography>
                        </Box>

                        <Typography
                          variant="caption"
                          sx={{
                            color: '#6b6b6b',
                            fontFamily: 'monospace',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {friend.session_code}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      size="medium"
                      onClick={() => handleJoinSession(friend)}
                      disabled={isJoining || joinLoading}
                      sx={{
                        minWidth: 100,
                        backgroundColor: '#003049',
                        color: '#ffffff',
                        borderRadius: '4px',
                        fontWeight: 500,
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: '#002333',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 48, 73, 0.3)',
                        },
                        '&:disabled': {
                          opacity: 0.6,
                          backgroundColor: '#003049',
                          color: '#ffffff',
                        }
                      }}
                    >
                      {isJoining ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Bli med'
                      )}
                    </Button>
                  </Box>

                  {/* Mobile layout: vertical with card feel */}
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                    <Box display="flex" gap={2} mb={2}>
                      <Avatar
                        src={friend.friend_avatar_url || undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          border: '2px solid #e5e7eb',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        }}
                      >
                        {friend.friend_name?.[0]?.toUpperCase() || '?'}
                      </Avatar>

                      <Box sx={{ flex: 1 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                          <Typography variant="body1" fontWeight="medium" sx={{ color: '#1a1a1a' }}>
                            {friend.friend_name}
                          </Typography>
                          <Chip
                            label={getStatusText(friend.status)}
                            color={getStatusColor(friend.status)}
                            size="small"
                            icon={<CircleIcon sx={{ fontSize: 12 }} />}
                            sx={{
                              borderRadius: '4px',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              height: '24px',
                            }}
                          />
                        </Box>

                        <Typography variant="body2" fontWeight="medium" sx={{ color: '#003049', mb: 0.75 }}>
                          {friend.session_name}
                        </Typography>

                        <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <PeopleIcon sx={{ fontSize: 14, color: '#4a4a4a' }} />
                            <Typography variant="caption" sx={{ color: '#4a4a4a' }}>
                              {friend.participant_count} {friend.participant_count === 1 ? 'deltaker' : 'deltakere'}
                            </Typography>
                          </Box>

                          <Box display="flex" alignItems="center" gap={0.5}>
                            <AccessTimeIcon sx={{ fontSize: 14, color: '#4a4a4a' }} />
                            <Typography variant="caption" sx={{ color: '#4a4a4a' }}>
                              {formatLastSeen(friend.last_seen)}
                            </Typography>
                          </Box>

                          <Typography
                            variant="caption"
                            sx={{
                              color: '#6b6b6b',
                              fontFamily: 'monospace',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {friend.session_code}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleJoinSession(friend)}
                      disabled={isJoining || joinLoading}
                      sx={{
                        backgroundColor: '#003049',
                        color: '#ffffff',
                        borderRadius: '4px',
                        fontWeight: 500,
                        textTransform: 'none',
                        boxShadow: 'none',
                        py: 1,
                        '&:hover': {
                          backgroundColor: '#002333',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0, 48, 73, 0.3)',
                        },
                        '&:disabled': {
                          opacity: 0.6,
                          backgroundColor: '#003049',
                          color: '#ffffff',
                        }
                      }}
                    >
                      {isJoining ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Bli med'
                      )}
                    </Button>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
