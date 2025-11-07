/**
 * FriendRequestNotification Component
 *
 * Game-style notification popup that appears when receiving a friend request.
 * Allows users to accept or decline requests directly from the notification.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  IconButton,
  Slide,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import type { FriendRequest } from '../../types/database';

interface FriendRequestNotificationProps {
  request: FriendRequest;
  onAccept: (friendshipId: string) => Promise<void>;
  onDecline: (friendshipId: string) => Promise<void>;
  onDismiss: () => void;
  autoHideDelay?: number; // ms before auto-hiding (0 = no auto-hide)
}

export function FriendRequestNotification({
  request,
  onAccept,
  onDecline,
  onDismiss,
  autoHideDelay = 10000, // 10 seconds default
}: FriendRequestNotificationProps) {
  const [visible, setVisible] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [actionTaken, setActionTaken] = useState<'accepted' | 'declined' | null>(null);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Wait for slide-out animation
  }, [onDismiss]);

  useEffect(() => {
    if (autoHideDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHideDelay, handleDismiss]);

  const handleAccept = async () => {
    setProcessing(true);
    try {
      await onAccept(request.friendship_id);
      setActionTaken('accepted');
      // Auto-dismiss after showing success
      setTimeout(() => {
        handleDismiss();
      }, 2000);
    } catch (err) {
      console.error('Error accepting friend request:', err);
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      await onDecline(request.friendship_id);
      setActionTaken('declined');
      // Auto-dismiss after showing success
      setTimeout(() => {
        handleDismiss();
      }, 1500);
    } catch (err) {
      console.error('Error declining friend request:', err);
      setProcessing(false);
    }
  };

  return (
    <Slide direction="down" in={visible} mountOnEnter unmountOnExit>
      <Card
        sx={{
          position: 'fixed',
          top: 80,
          right: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 'auto' },
          width: { xs: 'auto', sm: 380 },
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 380 },
          zIndex: 1400,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '2px solid var(--prussian-blue)',
          borderRadius: 2,
          boxShadow: '0 12px 48px rgba(0, 48, 73, 0.3)',
          animation: 'pulse-border 2s ease-in-out infinite',
          '@keyframes pulse-border': {
            '0%, 100%': {
              borderColor: 'var(--prussian-blue)',
              boxShadow: '0 12px 48px rgba(0, 48, 73, 0.3)',
            },
            '50%': {
              borderColor: 'var(--orange-wheel)',
              boxShadow: '0 12px 48px rgba(227, 99, 0, 0.3)',
            },
          },
        }}
      >
        <CardContent sx={{ position: 'relative', p: 2.5, '&:last-child': { pb: 2.5 } }}>
          {/* Close Button */}
          <IconButton
            onClick={handleDismiss}
            disabled={processing}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'var(--color-text-muted)',
              '&:hover': {
                color: 'var(--prussian-blue)',
                background: 'rgba(0, 48, 73, 0.05)',
              },
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'var(--prussian-blue)',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Venneforespørsel
            </Typography>
          </Box>

          {/* User Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2.5,
            }}
          >
            <Avatar
              src={request.avatar_url || undefined}
              alt={request.full_name}
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'var(--prussian-blue-bg)',
                color: 'var(--prussian-blue)',
                border: '2px solid var(--prussian-blue)',
              }}
            >
              {!request.avatar_url && <PersonIcon sx={{ fontSize: 32 }} />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: 'var(--prussian-blue)',
                  fontSize: '1.125rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.5,
                }}
              >
                {request.full_name}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.875rem',
                }}
              >
                vil være venn med deg
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          {!actionTaken ? (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                onClick={handleAccept}
                disabled={processing}
                startIcon={processing ? <CircularProgress size={16} /> : <CheckIcon />}
                sx={{
                  flex: 1,
                  bgcolor: 'var(--color-success)',
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 1,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: 'var(--color-success-dark)',
                  },
                  '&:disabled': {
                    bgcolor: 'var(--color-success)',
                    opacity: 0.7,
                  },
                }}
              >
                {processing ? 'Aksepterer...' : 'Aksepter'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleDecline}
                disabled={processing}
                startIcon={<ClearIcon />}
                sx={{
                  flex: 1,
                  borderColor: 'var(--color-error)',
                  color: 'var(--color-error)',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 1,
                  borderRadius: 1.5,
                  '&:hover': {
                    borderColor: 'var(--color-error-dark)',
                    bgcolor: 'rgba(211, 47, 47, 0.04)',
                  },
                }}
              >
                Avslå
              </Button>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: actionTaken === 'accepted' ? 'var(--color-success)' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {actionTaken === 'accepted' ? '✓ Forespørsel akseptert!' : 'Forespørsel avslått'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Slide>
  );
}
