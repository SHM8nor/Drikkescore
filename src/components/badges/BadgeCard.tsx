/**
 * BadgeCard Component
 *
 * Displays an individual badge with its details, including:
 * - Badge icon/image
 * - Title and tier
 * - Description
 * - Progress bar (if locked) or earned date (if earned)
 * - Points value
 *
 * Supports both earned and locked states with tier-based color schemes.
 * Now with click-to-view detailed badge modal for earned badges.
 */

import { useState } from 'react';
import { Card, CardContent, Box, Typography, Avatar, Chip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { Badge, UserBadge, BadgeProgress, UserBadgeGrouped } from '../../types/badges';
import { BadgeProgressBar } from './BadgeProgress';
import { BadgeDetailModal } from './BadgeDetailModal';

// Tier color mapping
const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  legendary: '#9C27B0',
} as const;

// Special category (Christmas) uses different tier colors
const CHRISTMAS_TIER_COLORS = {
  bronze: '#C87533',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  legendary: '#8B0000', // Dark red for Christmas
} as const;

interface BadgeCardProps {
  badge: Badge;
  earned?: UserBadge;
  progress?: BadgeProgress;
  onClick?: (event: React.MouseEvent) => void;
  compact?: boolean;
}

export function BadgeCard({ badge, earned, progress, onClick, compact = false }: BadgeCardProps) {
  const [selectedBadge, setSelectedBadge] = useState<UserBadgeGrouped | null>(null);
  const isEarned = Boolean(earned);
  const isChristmas = badge.category === 'special';
  const tierColor = isChristmas ? CHRISTMAS_TIER_COLORS[badge.tier] : TIER_COLORS[badge.tier];

  const handleClick = (event: React.MouseEvent) => {
    // Prevent event from bubbling up to parent swipe handlers
    event.stopPropagation();

    if (onClick) {
      onClick(event);
    } else if (isEarned && earned) {
      // Default behavior for earned badges: open detail modal
      // Convert single badge to grouped format (count = 1)
      setSelectedBadge({
        badge,
        count: 1,
        first_earned: earned.earned_at,
        last_earned: earned.earned_at,
        instances: [{
          ...earned,
          badge,
        }],
      });
    }
    // Locked badges don't open modal
  };

  return (
    <>
      <Card
        onClick={handleClick}
        sx={{
          height: '100%',
          borderRadius: 'var(--radius-md)',
          boxShadow: isEarned ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          transition: 'all var(--transition-base)',
          cursor: onClick || isEarned ? 'pointer' : 'default',
          border: isEarned ? `2px solid ${tierColor}` : '1px solid rgba(0, 48, 73, 0.1)',
          opacity: isEarned ? 1 : 0.85,
          position: 'relative',
          overflow: 'visible',
          '&:hover': onClick || isEarned ? {
            boxShadow: 'var(--shadow-lg)',
            transform: 'translateY(-4px)',
          } : {},
        }}
      >
        {/* Tier indicator stripe - Christmas badges get festive gradient */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: isChristmas ? 6 : 4,
            background: isChristmas
              ? `linear-gradient(90deg, #8B0000 0%, ${tierColor} 50%, #006400 100%)`
              : tierColor,
          }}
        />

        <CardContent sx={{ p: compact ? 2 : 2.5, pt: compact ? 2.5 : 3 }}>
          {/* Badge Icon and Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Avatar
              src={badge.icon_url || undefined}
              alt={badge.title}
              sx={{
                width: compact ? 48 : 64,
                height: compact ? 48 : 64,
                backgroundColor: isEarned ? tierColor : 'rgba(0, 0, 0, 0.1)',
                border: `2px solid ${tierColor}`,
                boxShadow: isEarned ? `0 0 20px ${tierColor}40` : 'none',
              }}
            >
              {!badge.icon_url && (
                isEarned ? (
                  <EmojiEventsIcon sx={{ fontSize: compact ? 28 : 36, color: 'white' }} />
                ) : (
                  <LockIcon sx={{ fontSize: compact ? 28 : 36, color: 'rgba(0, 0, 0, 0.3)' }} />
                )
              )}
            </Avatar>

            {/* Tier Badge */}
            <Chip
              label={badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
              size="small"
              sx={{
                backgroundColor: tierColor,
                color: badge.tier === 'silver' || badge.tier === 'platinum' ? 'black' : 'white',
                fontWeight: 600,
                fontSize: '11px',
                height: 24,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            />
          </Box>

          {/* Badge Title */}
          <Typography
            variant={compact ? 'body1' : 'h6'}
            sx={{
              fontWeight: 700,
              color: 'var(--prussian-blue)',
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: compact ? 'nowrap' : 'normal',
              display: '-webkit-box',
              WebkitLineClamp: compact ? 1 : 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {badge.title}
          </Typography>

          {/* Badge Description */}
          {!compact && (
            <Typography
              variant="body2"
              sx={{
                color: 'var(--color-text-secondary)',
                mb: 2,
                minHeight: 40,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {badge.description}
            </Typography>
          )}

          {/* Progress or Earned Status */}
          {isEarned && earned ? (
            <Box sx={{ mt: compact ? 1.5 : 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: `${tierColor}15`,
                  borderRadius: 'var(--radius-sm)',
                  p: 1.5,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'var(--color-text-muted)',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 600,
                    }}
                  >
                    Oppnådd
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'var(--color-text-primary)',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    {new Date(earned.earned_at).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'var(--color-text-muted)',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 600,
                    }}
                  >
                    Poeng
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: tierColor,
                      fontWeight: 700,
                      fontSize: '18px',
                    }}
                  >
                    +{badge.points}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : progress ? (
            <Box sx={{ mt: compact ? 1.5 : 2 }}>
              <BadgeProgressBar
                current={progress.current_value}
                target={progress.target_value}
                tier={badge.tier}
                variant="linear"
                showLabel
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--color-text-muted)',
                  fontSize: '11px',
                  mt: 0.5,
                  display: 'block',
                }}
              >
                {badge.points} poeng ved fullføring
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: compact ? 1.5 : 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: 'var(--radius-sm)',
                  p: 1.5,
                }}
              >
                <LockIcon sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--color-text-muted)',
                    fontWeight: 600,
                  }}
                >
                  Låst • {badge.points} poeng
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          open={selectedBadge !== null}
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </>
  );
}
