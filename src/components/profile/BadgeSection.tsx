/**
 * BadgeSection Component
 *
 * Profile section wrapper for badge showcase.
 * Displays user's top badges with stats and link to full badge page.
 * Matches glass-morphism styling of profile page.
 */

import { useState } from 'react';
import { Box, Typography, Stack, Skeleton, Button, IconButton, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import { useUserBadges, useUserBadgeStats } from '../../hooks/useBadges';
import { BadgeShowcase } from '../badges/BadgeShowcase';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../hooks/useAdmin';
import BadgeAwardDialog from '../badges/BadgeAwardDialog';

interface BadgeSectionProps {
  userId: string;
}

export function BadgeSection({ userId }: BadgeSectionProps) {
  const { user } = useAuth();
  const isAdmin = useAdmin();
  const isOwnProfile = user?.id === userId;
  const isOtherUserProfile = userId !== user?.id;
  const showAwardButton = isAdmin && isOtherUserProfile;

  const [awardDialogOpen, setAwardDialogOpen] = useState(false);

  const { data: userBadges, isLoading: badgesLoading } = useUserBadges(userId);
  const { data: stats, isLoading: statsLoading } = useUserBadgeStats(userId);

  // Don't show section if no badges and not own profile (unless admin viewing to award badges)
  if (!badgesLoading && (!userBadges || userBadges.length === 0) && !isOwnProfile && !showAwardButton) {
    return null;
  }

  // Sort badges by tier_order DESC (highest tier first), then by earned_at DESC (most recent first)
  const sortedBadges = userBadges
    ? [...userBadges].sort((a, b) => {
        // First sort by tier (lower tier_order = higher tier)
        const tierComparison = a.badge.tier_order - b.badge.tier_order;
        if (tierComparison !== 0) return tierComparison;

        // If same tier, sort by recency (most recent first)
        return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
      })
    : [];

  const topBadges = sortedBadges.slice(0, 5);

  if (badgesLoading || statsLoading) {
    return (
      <Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={200} height={32} />
        </Stack>
        <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Section Header */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, var(--orange-wheel) 0%, var(--xanthous) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(247, 127, 0, 0.3)',
            }}
          >
            <EmojiEventsIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'var(--prussian-blue)',
                fontSize: { xs: '1.125rem', sm: '1.25rem' },
              }}
            >
              Merker og Prestasjoner
            </Typography>
            {stats && (
              <Typography
                variant="body2"
                sx={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.875rem',
                }}
              >
                {stats.total_earned} merker oppnådd • {stats.total_points} poeng
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Actions Section (Desktop) */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
          {/* Admin Award Button */}
          {showAwardButton && (
            <Tooltip title="Tildel merke">
              <IconButton
                onClick={() => setAwardDialogOpen(true)}
                sx={{
                  color: 'var(--orange-wheel)',
                  backgroundColor: 'rgba(247, 127, 0, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(247, 127, 0, 0.16)',
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* View All Link */}
          <Button
            component={Link}
            to="/badges"
            endIcon={<ArrowForwardIcon />}
            sx={{
              color: 'var(--orange-wheel)',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(247, 127, 0, 0.08)',
              },
            }}
          >
            Se alle merker
          </Button>
        </Stack>
      </Stack>

      {/* Badge Showcase */}
      {topBadges.length > 0 ? (
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 48, 73, 0.08)',
          }}
        >
          <BadgeShowcase badges={topBadges} maxDisplay={5} compact />
        </Box>
      ) : (
        <Box
          sx={{
            p: 4,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 48, 73, 0.08)',
            textAlign: 'center',
          }}
        >
          <EmojiEventsIcon
            sx={{
              fontSize: 48,
              color: 'var(--color-text-muted)',
              mb: 2,
              opacity: 0.5,
            }}
          />
          <Typography
            variant="body1"
            sx={{
              color: 'var(--color-text-secondary)',
              mb: 1,
            }}
          >
            {isOwnProfile ? 'Du har ikke oppnådd noen merker ennå' : 'Ingen merker oppnådd ennå'}
          </Typography>
          {isOwnProfile && (
            <Typography
              variant="body2"
              sx={{
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
              }}
            >
              Delta i økter og oppnå merker!
            </Typography>
          )}
        </Box>
      )}

      {/* Mobile Actions Section */}
      <Stack direction="column" spacing={1} sx={{ display: { xs: 'flex', sm: 'none' }, mt: 2 }}>
        {/* Admin Award Button (Mobile) */}
        {showAwardButton && (
          <Button
            onClick={() => setAwardDialogOpen(true)}
            startIcon={<AddIcon />}
            fullWidth
            sx={{
              color: 'var(--orange-wheel)',
              fontWeight: 600,
              textTransform: 'none',
              justifyContent: 'center',
              backgroundColor: 'rgba(247, 127, 0, 0.08)',
              '&:hover': {
                backgroundColor: 'rgba(247, 127, 0, 0.16)',
              },
            }}
          >
            Tildel merke
          </Button>
        )}

        {/* View All Link (Mobile) */}
        <Button
          component={Link}
          to="/badges"
          endIcon={<ArrowForwardIcon />}
          fullWidth
          sx={{
            color: 'var(--orange-wheel)',
            fontWeight: 600,
            textTransform: 'none',
            justifyContent: 'center',
            '&:hover': {
              backgroundColor: 'rgba(247, 127, 0, 0.08)',
            },
          }}
        >
          Se alle merker
        </Button>
      </Stack>

      {/* Badge Award Dialog */}
      <BadgeAwardDialog
        open={awardDialogOpen}
        userId={userId}
        onClose={() => setAwardDialogOpen(false)}
        onSuccess={() => {
          // Success handled by dialog, just close it
          setAwardDialogOpen(false);
        }}
      />
    </Box>
  );
}
