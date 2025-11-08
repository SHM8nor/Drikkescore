/**
 * BadgeNotification Component
 *
 * Celebratory notification that appears when a user earns a badge.
 * Features tier-based styling, points display, and optional confetti for legendary badges.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Slide,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  Brightness1 as DotIcon,
} from '@mui/icons-material';
import type { Badge } from '../../types/badges';

interface BadgeNotificationProps {
  badge: Badge;
  earnedAt: string;
  onDismiss: () => void;
  onClick?: () => void;
  autoHideDelay?: number; // ms before auto-hiding (0 = no auto-hide)
}

// Tier color mappings
const tierColors = {
  bronze: {
    primary: '#CD7F32',
    light: '#E6A75F',
    bg: 'rgba(205, 127, 50, 0.1)',
    border: '#CD7F32',
  },
  silver: {
    primary: '#C0C0C0',
    light: '#E8E8E8',
    bg: 'rgba(192, 192, 192, 0.1)',
    border: '#C0C0C0',
  },
  gold: {
    primary: '#FFD700',
    light: '#FFED4E',
    bg: 'rgba(255, 215, 0, 0.1)',
    border: '#FFD700',
  },
  platinum: {
    primary: '#E5E4E2',
    light: '#F5F5F5',
    bg: 'rgba(229, 228, 226, 0.15)',
    border: '#B4B4B4',
  },
  legendary: {
    primary: '#9333EA',
    light: '#C084FC',
    bg: 'rgba(147, 51, 234, 0.1)',
    border: '#9333EA',
  },
};

// Norwegian tier labels
const tierLabels = {
  bronze: 'Bronse',
  silver: 'Sølv',
  gold: 'Gull',
  platinum: 'Platina',
  legendary: 'Legendarisk',
};

export function BadgeNotification({
  badge,
  onDismiss,
  onClick,
  autoHideDelay = 5000,
}: BadgeNotificationProps) {
  const [visible, setVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const tierStyle = tierColors[badge.tier];

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Wait for slide-out animation
  }, [onDismiss]);

  // Auto-hide timer
  useEffect(() => {
    if (autoHideDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHideDelay, handleDismiss]);

  // Confetti animation for legendary badges
  useEffect(() => {
    if (badge.tier === 'legendary') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [badge.tier]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Slide direction="down" in={visible} mountOnEnter unmountOnExit>
      <Card
        onClick={handleClick}
        sx={{
          position: 'fixed',
          top: 80,
          right: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 'auto' },
          width: { xs: 'auto', sm: 400 },
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 400 },
          zIndex: 1400,
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 1) 100%)`,
          backdropFilter: 'blur(20px)',
          border: `3px solid ${tierStyle.border}`,
          borderRadius: 2,
          boxShadow: `0 12px 48px ${tierStyle.primary}40, 0 0 0 1px ${tierStyle.border}`,
          cursor: onClick ? 'pointer' : 'default',
          overflow: 'visible',
          animation:
            badge.tier === 'legendary'
              ? 'badge-legendary 2s ease-in-out infinite, badge-entrance 0.5s ease-out'
              : 'badge-pulse 2s ease-in-out 3, badge-entrance 0.5s ease-out',
          '@keyframes badge-entrance': {
            '0%': {
              transform: 'scale(0.8) translateY(-20px)',
              opacity: 0,
            },
            '50%': {
              transform: 'scale(1.05) translateY(0)',
            },
            '100%': {
              transform: 'scale(1) translateY(0)',
              opacity: 1,
            },
          },
          '@keyframes badge-pulse': {
            '0%, 100%': {
              boxShadow: `0 12px 48px ${tierStyle.primary}40, 0 0 0 1px ${tierStyle.border}`,
            },
            '50%': {
              boxShadow: `0 12px 64px ${tierStyle.primary}60, 0 0 0 2px ${tierStyle.border}`,
            },
          },
          '@keyframes badge-legendary': {
            '0%, 100%': {
              boxShadow: `0 12px 48px ${tierStyle.primary}40, 0 0 20px ${tierStyle.primary}30`,
              borderColor: tierStyle.border,
            },
            '25%': {
              boxShadow: `0 12px 64px #FFD70060, 0 0 30px #FFD70040`,
              borderColor: '#FFD700',
            },
            '50%': {
              boxShadow: `0 12px 64px ${tierStyle.primary}60, 0 0 40px ${tierStyle.primary}50`,
              borderColor: tierStyle.border,
            },
            '75%': {
              boxShadow: `0 12px 64px #C084FC60, 0 0 30px #C084FC40`,
              borderColor: '#C084FC',
            },
          },
          '&:hover': onClick
            ? {
                transform: 'translateY(-2px)',
                boxShadow: `0 16px 56px ${tierStyle.primary}50, 0 0 0 2px ${tierStyle.border}`,
              }
            : {},
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Confetti animation for legendary badges */}
        {showConfetti && badge.tier === 'legendary' && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
              borderRadius: 2,
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '100%',
                background:
                  'radial-gradient(circle, #FFD700 0%, transparent 70%), radial-gradient(circle, #9333EA 0%, transparent 70%), radial-gradient(circle, #C084FC 0%, transparent 70%)',
                backgroundSize: '20px 20px, 30px 30px, 25px 25px',
                backgroundPosition: '0 0, 10px 10px, 20px 5px',
                animation: 'confetti-fall 3s linear infinite',
                opacity: 0.6,
              },
              '&::after': {
                animationDelay: '1.5s',
              },
              '@keyframes confetti-fall': {
                '0%': {
                  transform: 'translateY(-100%) rotate(0deg)',
                  opacity: 0.6,
                },
                '100%': {
                  transform: 'translateY(100%) rotate(360deg)',
                  opacity: 0,
                },
              },
            }}
          />
        )}

        <CardContent sx={{ position: 'relative', p: 2.5, '&:last-child': { pb: 2.5 } }}>
          {/* Close Button */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'var(--color-text-muted)',
              zIndex: 1,
              '&:hover': {
                color: tierStyle.primary,
                background: tierStyle.bg,
              },
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Header */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: tierStyle.primary,
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              🎉 Ny Utmerkelse Opptjent!
            </Typography>
          </Box>

          {/* Badge Display */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              mb: 2,
            }}
          >
            {/* Badge Icon */}
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${tierStyle.light} 0%, ${tierStyle.primary} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `3px solid ${tierStyle.border}`,
                boxShadow: `0 4px 16px ${tierStyle.primary}40`,
                animation: badge.tier === 'legendary' ? 'icon-rotate 3s linear infinite' : 'icon-pulse 2s ease-in-out 3',
                '@keyframes icon-pulse': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                  },
                },
                '@keyframes icon-rotate': {
                  '0%': {
                    transform: 'rotate(0deg) scale(1)',
                  },
                  '25%': {
                    transform: 'rotate(5deg) scale(1.05)',
                  },
                  '50%': {
                    transform: 'rotate(0deg) scale(1.1)',
                  },
                  '75%': {
                    transform: 'rotate(-5deg) scale(1.05)',
                  },
                  '100%': {
                    transform: 'rotate(0deg) scale(1)',
                  },
                },
              }}
            >
              {badge.icon_url ? (
                <img
                  src={badge.icon_url}
                  alt={badge.title}
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <TrophyIcon
                  sx={{
                    fontSize: 48,
                    color: 'white',
                  }}
                />
              )}
            </Box>

            {/* Badge Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Tier Chip */}
              <Chip
                label={tierLabels[badge.tier]}
                size="small"
                icon={<DotIcon sx={{ fontSize: 12, color: `${tierStyle.primary} !important` }} />}
                sx={{
                  mb: 0.75,
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: tierStyle.bg,
                  color: tierStyle.primary,
                  border: `1px solid ${tierStyle.border}`,
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />

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
                  lineHeight: 1.2,
                }}
              >
                {badge.title}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.875rem',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {badge.description}
              </Typography>
            </Box>
          </Box>

          {/* Points Display */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: 1.5,
              borderTop: `1px solid ${tierStyle.border}40`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'var(--color-text-muted)',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              {onClick ? 'Klikk for å se detaljer' : 'Gratulerer!'}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: tierStyle.bg,
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                border: `1px solid ${tierStyle.border}`,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: tierStyle.primary,
                  fontSize: '1.125rem',
                  lineHeight: 1,
                }}
              >
                +{badge.points}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: tierStyle.primary,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                poeng
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Slide>
  );
}
