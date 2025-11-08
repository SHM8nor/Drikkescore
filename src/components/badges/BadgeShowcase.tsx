/**
 * BadgeShowcase Component
 *
 * Horizontal badge display for profile integration.
 * Shows top N badges with tier-colored avatars and compact spacing.
 * Responsive: Horizontal scroll on mobile, wraps on larger screens.
 * Now with click-to-view detailed badge modal.
 */

import { useState } from 'react';
import { Box, Stack, Avatar, Chip, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { UserBadgeWithDetails } from '../../types/badges';
import { BadgeDetailModal } from './BadgeDetailModal';

// Tier color mapping
const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  legendary: '#9C27B0',
} as const;

interface BadgeShowcaseProps {
  badges: UserBadgeWithDetails[];
  maxDisplay?: number;
  compact?: boolean;
  onClick?: (badge: UserBadgeWithDetails) => void;
}

export function BadgeShowcase({
  badges,
  maxDisplay = 5,
  compact = true,
  onClick
}: BadgeShowcaseProps) {
  const [selectedBadge, setSelectedBadge] = useState<UserBadgeWithDetails | null>(null);
  const displayBadges = badges.slice(0, maxDisplay);

  if (displayBadges.length === 0) {
    return null;
  }

  const handleBadgeClick = (badge: UserBadgeWithDetails) => {
    if (onClick) {
      onClick(badge);
    } else {
      // Default behavior: open detail modal
      setSelectedBadge(badge);
    }
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          overflowX: { xs: 'auto', md: 'visible' },
          overflowY: 'visible',
          pb: 1,
          // Hide scrollbar but keep functionality
          '&::-webkit-scrollbar': {
            height: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 48, 73, 0.2)',
            borderRadius: 3,
            '&:hover': {
              backgroundColor: 'rgba(0, 48, 73, 0.3)',
            },
          },
        }}
      >
        {displayBadges.map((userBadge) => {
          const tierColor = TIER_COLORS[userBadge.badge.tier];

          return (
            <Box
              key={userBadge.id}
              onClick={() => handleBadgeClick(userBadge)}
              sx={{
                cursor: 'pointer',
                transition: 'transform var(--transition-base)',
                minWidth: compact ? 100 : 120,
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Stack
                spacing={1}
                alignItems="center"
                sx={{
                  p: 1.5,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: `2px solid ${tierColor}`,
                  boxShadow: `0 4px 12px ${tierColor}20`,
                }}
              >
                {/* Badge Avatar */}
                <Avatar
                  src={userBadge.badge.icon_url || undefined}
                  alt={userBadge.badge.title}
                  sx={{
                    width: compact ? 60 : 80,
                    height: compact ? 60 : 80,
                    backgroundColor: tierColor,
                    border: `3px solid white`,
                    boxShadow: `0 0 20px ${tierColor}40`,
                  }}
                >
                  {!userBadge.badge.icon_url && (
                    <EmojiEventsIcon
                      sx={{
                        fontSize: compact ? 32 : 40,
                        color: 'white'
                      }}
                    />
                  )}
                </Avatar>

                {/* Tier Chip */}
                <Chip
                  label={userBadge.badge.tier.charAt(0).toUpperCase() + userBadge.badge.tier.slice(1)}
                  size="small"
                  sx={{
                    backgroundColor: tierColor,
                    color: userBadge.badge.tier === 'silver' || userBadge.badge.tier === 'platinum' ? 'black' : 'white',
                    fontWeight: 600,
                    fontSize: '10px',
                    height: 20,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                />

                {/* Badge Title */}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: 'var(--prussian-blue)',
                    textAlign: 'center',
                    fontSize: '12px',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: 30,
                  }}
                >
                  {userBadge.badge.title}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        open={selectedBadge !== null}
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </>
  );
}
