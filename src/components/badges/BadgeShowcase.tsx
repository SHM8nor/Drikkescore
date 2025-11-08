/**
 * BadgeShowcase Component
 *
 * Horizontal badge display for profile integration.
 * Shows top N badges with tier-colored avatars and compact spacing.
 * Responsive: Horizontal scroll on mobile, wraps on larger screens.
 * Now with click-to-view detailed badge modal.
 */

import { useState } from 'react';
import { Box, Stack, Avatar, Chip, Typography, Badge } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { UserBadgeGrouped } from '../../types/badges';
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
  badges: UserBadgeGrouped[];
  maxDisplay?: number;
  compact?: boolean;
  onClick?: (badge: UserBadgeGrouped) => void;
}

export function BadgeShowcase({
  badges,
  maxDisplay = 5,
  compact = true,
  onClick
}: BadgeShowcaseProps) {
  const [selectedBadge, setSelectedBadge] = useState<UserBadgeGrouped | null>(null);
  const displayBadges = badges.slice(0, maxDisplay);

  if (displayBadges.length === 0) {
    return null;
  }

  const handleBadgeClick = (badge: UserBadgeGrouped) => {
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
        {displayBadges.map((groupedBadge) => {
          const tierColor = TIER_COLORS[groupedBadge.badge.tier];
          const showCount = groupedBadge.count > 1;

          return (
            <Box
              key={groupedBadge.badge.id}
              onClick={() => handleBadgeClick(groupedBadge)}
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
                {/* Badge Avatar with Count Overlay */}
                <Badge
                  badgeContent={showCount ? `x${groupedBadge.count}` : null}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: 'var(--orange-wheel)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      minWidth: 24,
                      height: 24,
                      borderRadius: '12px',
                      border: '2px solid white',
                      boxShadow: '0 2px 8px rgba(247, 127, 0, 0.4)',
                    },
                  }}
                >
                  <Avatar
                    src={groupedBadge.badge.icon_url || undefined}
                    alt={groupedBadge.badge.title}
                    sx={{
                      width: compact ? 60 : 80,
                      height: compact ? 60 : 80,
                      backgroundColor: tierColor,
                      border: `3px solid white`,
                      boxShadow: `0 0 20px ${tierColor}40`,
                    }}
                  >
                    {!groupedBadge.badge.icon_url && (
                      <EmojiEventsIcon
                        sx={{
                          fontSize: compact ? 32 : 40,
                          color: 'white'
                        }}
                      />
                    )}
                  </Avatar>
                </Badge>

                {/* Tier Chip */}
                <Chip
                  label={groupedBadge.badge.tier.charAt(0).toUpperCase() + groupedBadge.badge.tier.slice(1)}
                  size="small"
                  sx={{
                    backgroundColor: tierColor,
                    color: groupedBadge.badge.tier === 'silver' || groupedBadge.badge.tier === 'platinum' ? 'black' : 'white',
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
                  {groupedBadge.badge.title}
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
