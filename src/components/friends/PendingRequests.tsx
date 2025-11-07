/**
 * PendingRequests Component
 *
 * Displays incoming friend requests with accept/decline actions.
 * Uses the useFriends hook for data and real-time updates.
 */

import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  CircularProgress,
  Typography,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useFriends } from '../../hooks/useFriends';
import type { FriendRequest } from '../../types/database';

interface PendingRequestsProps {
  /** Pending friend requests to display */
  requests: FriendRequest[];
  /** Custom loading state override */
  isLoading?: boolean;
}

export default function PendingRequests({ requests, isLoading }: PendingRequestsProps) {
  const { acceptRequest, declineRequest } = useFriends();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    try {
      await acceptRequest(friendshipId);
    } catch (error) {
      console.error('Feil ved akseptering av forespørsel:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    try {
      await declineRequest(friendshipId);
    } catch (error) {
      console.error('Feil ved avslag av forespørsel:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Akkurat nå';
    if (diffInMinutes < 60) return `${diffInMinutes} min siden`;
    if (diffInHours < 24) return `${diffInHours} t siden`;
    if (diffInDays < 7) return `${diffInDays} d siden`;

    return date.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          backgroundColor: 'background.default',
          borderRadius: 2,
        }}
      >
        <PersonAddIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Ingen ventende forespørsler
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Du har ingen nye venneforespørsler akkurat nå
        </Typography>
      </Paper>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'transparent', borderRadius: 2 }}>
      {requests.map((request: FriendRequest, index: number) => (
        <ListItem
          key={request.friendship_id}
          divider={index < requests.length - 1}
          sx={{
            py: 2,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
          secondaryAction={
            <Box display="flex" gap={1}>
              <Tooltip title="Aksepter">
                <span>
                  <IconButton
                    edge="end"
                    color="success"
                    onClick={() => handleAccept(request.friendship_id)}
                    disabled={processingId === request.friendship_id}
                    size="medium"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'success.light',
                      },
                    }}
                  >
                    {processingId === request.friendship_id ? (
                      <CircularProgress size={24} color="success" />
                    ) : (
                      <CheckIcon />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Avslå">
                <span>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => handleDecline(request.friendship_id)}
                    disabled={processingId === request.friendship_id}
                    size="medium"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'error.light',
                      },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          }
        >
          <ListItemAvatar>
            <Avatar
              src={request.avatar_url || undefined}
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
              }}
            >
              {(request.display_name || '?').charAt(0).toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography variant="h6" component="span">
                {request.display_name}
              </Typography>
            }
            secondary={
              <Typography variant="body2" color="text.secondary" component="span">
                Sendt {formatTimestamp(request.created_at)}
              </Typography>
            }
            sx={{ ml: 2 }}
          />
        </ListItem>
      ))}
    </List>
  );
}
