/**
 * BadgeDetailModal Component
 *
 * Game-like modal for displaying detailed badge information.
 * Shows badge icon, tier, category, points, earned date, and description.
 * Features smooth animations, tier-based color schemes, and glassmorphism design.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Drawer,
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Stack,
  Fade,
  Zoom,
  Paper,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import type { UserBadgeGrouped, BadgeCategory } from '../../types/badges';

// Tier color mapping with consistent color scheme
const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  legendary: '#9C27B0',
} as const;

// Category label mapping in Norwegian
const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  session: 'Sesjon',
  global: 'Global',
  social: 'Sosial',
  milestone: 'Milepæl',
  special: 'Spesiell',
};

interface BadgeDetailModalProps {
  open: boolean;
  badge: UserBadgeGrouped | null;
  onClose: () => void;
}

export function BadgeDetailModal({ open, badge, onClose }: BadgeDetailModalProps) {
  const [showContent, setShowContent] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Trigger content animation after dialog opens
  useEffect(() => {
    if (open && badge) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [open, badge]);

  if (!badge) return null;

  const tierColor = TIER_COLORS[badge.badge.tier];
  const categoryLabel = CATEGORY_LABELS[badge.badge.category];
  const isRepeatable = badge.count > 1;

  // Format date in Norwegian style (dd. month yyyy)
  const firstEarnedDate = new Date(badge.first_earned).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Determine text color based on tier (light tiers need dark text)
  const tierTextColor =
    badge.badge.tier === 'silver' || badge.badge.tier === 'platinum' ? 'black' : 'white';

  // Shared content wrapper styles
  const contentWrapperSx = {
    position: 'relative' as const,
    background: `linear-gradient(135deg, ${tierColor}08 0%, ${tierColor}15 100%)`,
    backdropFilter: 'blur(20px)',
    borderRadius: isMobile ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
    border: `2px solid ${tierColor}`,
    boxShadow: `0 20px 60px ${tierColor}40, 0 0 40px ${tierColor}20`,
    overflow: 'hidden',
  };

  // Use Drawer on mobile, Dialog on desktop
  const Container = isMobile ? Drawer : Dialog;
  const containerProps = isMobile
    ? {
        anchor: 'bottom' as const,
        open,
        onClose,
        PaperProps: {
          sx: {
            maxHeight: '85vh',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            background: 'transparent',
            boxShadow: 'none',
            overflow: 'visible',
          },
        },
      }
    : {
        open,
        onClose,
        maxWidth: 'sm' as const,
        fullWidth: true,
        PaperProps: {
          sx: {
            borderRadius: 'var(--radius-lg)',
            overflow: 'visible',
            background: 'transparent',
            boxShadow: 'none',
          },
        },
        TransitionComponent: Fade,
        transitionDuration: 300,
      };

  return (
    <Container {...containerProps}>
      <Box sx={contentWrapperSx}>
        {/* Animated gradient background overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 50% 0%, ${tierColor}20 0%, transparent 50%)`,
            opacity: showContent ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
            pointerEvents: 'none',
          }}
        />

        {/* Mobile Drawer Handle */}
        {isMobile && (
          <Box
            sx={{
              width: 40,
              height: 4,
              backgroundColor: tierColor,
              borderRadius: 2,
              mx: 'auto',
              mt: 1,
              mb: 0.5,
              opacity: 0.5,
            }}
          />
        )}

        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: isMobile ? 16 : 12,
            right: 12,
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--prussian-blue)',
            boxShadow: '0 2px 8px rgba(0, 48, 73, 0.15)',
            '&:hover': {
              backgroundColor: 'white',
              transform: 'rotate(90deg)',
            },
            transition: 'all var(--transition-base)',
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent
          sx={{
            p: { xs: 3, sm: 4 },
            position: 'relative',
            maxHeight: isMobile ? 'calc(85vh - 60px)' : 'none',
            overflowY: isMobile ? 'auto' : 'visible',
          }}
        >
          <Stack spacing={3} alignItems="center">
            {/* Badge Icon with Zoom Animation */}
            <Zoom in={showContent} timeout={500} style={{ transitionDelay: '100ms' }}>
              <Box
                sx={{
                  position: 'relative',
                  mt: 2,
                }}
              >
                {/* Pulsing glow effect */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${tierColor}40 0%, transparent 70%)`,
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': {
                        transform: 'translate(-50%, -50%) scale(1)',
                        opacity: 0.6,
                      },
                      '50%': {
                        transform: 'translate(-50%, -50%) scale(1.1)',
                        opacity: 0.3,
                      },
                    },
                  }}
                />

                {/* Badge Avatar */}
                <Avatar
                  src={badge.badge.icon_url || undefined}
                  alt={badge.badge.title}
                  sx={{
                    width: 120,
                    height: 120,
                    backgroundColor: tierColor,
                    border: `4px solid white`,
                    boxShadow: `0 8px 32px ${tierColor}60, 0 0 0 8px ${tierColor}20`,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {!badge.badge.icon_url && (
                    <TrophyIcon
                      sx={{
                        fontSize: 64,
                        color: 'white',
                      }}
                    />
                  )}
                </Avatar>
              </Box>
            </Zoom>

            {/* Badge Title */}
            <Fade in={showContent} timeout={600} style={{ transitionDelay: '200ms' }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${tierColor} 0%, var(--prussian-blue) 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  px: 2,
                  fontSize: { xs: '1.75rem', sm: '2.125rem' },
                }}
              >
                {badge.badge.title}
              </Typography>
            </Fade>

            {/* Tier and Category Chips */}
            <Fade in={showContent} timeout={600} style={{ transitionDelay: '300ms' }}>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center">
                {/* Tier Chip */}
                <Chip
                  label={badge.badge.tier.toUpperCase()}
                  sx={{
                    backgroundColor: tierColor,
                    color: tierTextColor,
                    fontWeight: 700,
                    fontSize: '13px',
                    height: 32,
                    px: 1,
                    letterSpacing: '1px',
                    boxShadow: `0 4px 12px ${tierColor}40`,
                  }}
                />

                {/* Category Chip */}
                <Chip
                  icon={<CategoryIcon sx={{ fontSize: 16, color: 'var(--prussian-blue)' }} />}
                  label={categoryLabel}
                  variant="outlined"
                  sx={{
                    borderColor: 'var(--prussian-blue)',
                    color: 'var(--prussian-blue)',
                    fontWeight: 600,
                    fontSize: '13px',
                    height: 32,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  }}
                />
              </Stack>
            </Fade>

            <Divider sx={{ width: '100%', borderColor: `${tierColor}30` }} />

            {/* Stats Section */}
            <Fade in={showContent} timeout={600} style={{ transitionDelay: '400ms' }}>
              <Paper
                elevation={0}
                sx={{
                  width: '100%',
                  p: 2.5,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${tierColor}30`,
                }}
              >
                <Stack spacing={2}>
                  {/* Points */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TrophyIcon sx={{ color: tierColor, fontSize: 24 }} />
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Poeng:
                      </Typography>
                    </Stack>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: tierColor,
                        fontSize: '1.5rem',
                      }}
                    >
                      +{badge.badge.points}
                    </Typography>
                  </Stack>

                  {/* Earned Date */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CalendarIcon sx={{ color: 'var(--color-text-muted)', fontSize: 24 }} />
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {isRepeatable ? 'Første gang oppnådd:' : 'Oppnådd:'}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {firstEarnedDate}
                    </Typography>
                  </Stack>

                  {/* Badge Count (if repeatable) */}
                  {isRepeatable && (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${tierColor}10 0%, ${tierColor}05 100%)`,
                        border: `1px solid ${tierColor}30`,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TrophyIcon sx={{ fontSize: 20, color: tierColor }} />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          Oppnådd totalt:
                        </Typography>
                      </Stack>
                      <Chip
                        label={`${badge.count} ganger`}
                        size="small"
                        sx={{
                          backgroundColor: tierColor,
                          color: tierTextColor,
                          fontWeight: 700,
                          fontSize: '0.875rem',
                        }}
                      />
                    </Stack>
                  )}

                  {/* Session Link (if exists) */}
                  {badge.instances[0].session_id && (
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinkIcon sx={{ color: 'var(--color-text-muted)', fontSize: 24 }} />
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          Tjent i økt:
                        </Typography>
                      </Stack>
                      <Typography
                        component={Link}
                        to={`/session/${badge.instances[0].session_id}`}
                        variant="body1"
                        onClick={onClose}
                        sx={{
                          fontWeight: 600,
                          color: 'var(--orange-wheel)',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Se første økt
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Fade>

            <Divider sx={{ width: '100%', borderColor: `${tierColor}30` }} />

            {/* Description Section */}
            <Fade in={showContent} timeout={600} style={{ transitionDelay: '500ms' }}>
              <Box sx={{ width: '100%' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: 'var(--prussian-blue)',
                    mb: 1.5,
                    fontSize: '1.125rem',
                  }}
                >
                  Beskrivelse
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${tierColor}30`,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.6,
                      fontSize: '0.95rem',
                    }}
                  >
                    {badge.badge.description}
                  </Typography>

                  {/* Criteria (if readable) */}
                  {badge.badge.criteria && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${tierColor}20` }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'var(--color-text-muted)',
                          fontSize: '0.8rem',
                          fontStyle: 'italic',
                          display: 'block',
                        }}
                      >
                        {formatCriteria(badge.badge.criteria)}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Fade>
          </Stack>
        </DialogContent>
      </Box>
    </Container>
  );
}

/**
 * Format badge criteria as human-readable text (simplified)
 */
function formatCriteria(criteria: any): string {
  try {
    if (!criteria || typeof criteria !== 'object') return '';

    const conditions = criteria.conditions;

    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
      return '';
    }

    // Simple formatting - just show the first condition
    const firstCondition = conditions[0];
    const metric = firstCondition.metric || '';
    const operator = firstCondition.operator || '';
    const value = firstCondition.value;

    if (!metric || !value) return '';

    // Create readable description
    let description = 'Kriterier: ';

    if (operator === '>=') {
      description += `${metric} må være minst ${value}`;
    } else if (operator === '==') {
      description += `${metric} må være nøyaktig ${value}`;
    } else if (operator === '<=') {
      description += `${metric} må være maksimalt ${value}`;
    } else if (operator === '>') {
      description += `${metric} må være over ${value}`;
    } else if (operator === '<') {
      description += `${metric} må være under ${value}`;
    } else if (operator === 'between' && Array.isArray(value)) {
      description += `${metric} må være mellom ${value[0]} og ${value[1]}`;
    } else {
      return '';
    }

    return description;
  } catch (error) {
    return '';
  }
}
