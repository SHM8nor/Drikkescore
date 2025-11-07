/**
 * SentRequests Component
 *
 * Displays outgoing friend requests with cancel action.
 * Uses the useFriends hook for data and real-time updates.
 */

import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  CircularProgress,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import {
  HourglassEmpty as HourglassIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useFriends } from '../../hooks/useFriends';
import type { SentFriendRequest } from '../../types/database';

interface SentRequestsProps {
  /** Sent friend requests to display */
  requests: SentFriendRequest[];
  /** Custom loading state override */
  isLoading?: boolean;
}

export default function SentRequests({ requests, isLoading }: SentRequestsProps) {
  const { cancelRequest } = useFriends();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleCancel = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    try {
      await cancelRequest(friendshipId);
    } catch (error) {
      console.error('Feil ved kansellering av forespørsel:', error);
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
        <HourglassIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Ingen sendte forespørsler
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Du venter ikke på svar fra noen akkurat nå
        </Typography>
      </Paper>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'transparent', borderRadius: 2 }}>
      {requests.map((request: SentFriendRequest, index: number) => (
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
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={processingId === request.friendship_id ? null : <CancelIcon />}
              onClick={() => handleCancel(request.friendship_id)}
              disabled={processingId === request.friendship_id}
              sx={{ minWidth: 110 }}
            >
              {processingId === request.friendship_id ? (
                <CircularProgress size={20} color="error" />
              ) : (
                'Kanseller'
              )}
            </Button>
          }
        >
          <ListItemAvatar>
            <Avatar
              src={request.avatar_url || undefined}
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'secondary.main',
                fontSize: '1.5rem',
              }}
            >
              {(request.display_name || '?').charAt(0).toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" component="span">
                  {request.display_name}
                </Typography>
                <Chip
                  label="Venter"
                  size="small"
                  color="warning"
                  icon={<HourglassIcon sx={{ fontSize: '1rem' }} />}
                />
              </Box>
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
