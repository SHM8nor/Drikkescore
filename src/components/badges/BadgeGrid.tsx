/**
 * BadgeGrid Component
 *
 * Grid layout for displaying multiple badges with:
 * - Responsive grid (3-4 columns on desktop, 2 on tablet, 1 on mobile)
 * - Filtering by category, tier, and earned/locked status
 * - Empty state messaging
 * - Loading skeleton
 */

import { Box, Grid, Typography, Skeleton, Card, CardContent } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { BadgeWithProgress, BadgeCategory, BadgeTier, Badge } from '../../types/badges';
import { BadgeCard } from './BadgeCard';

interface BadgeGridProps {
  badges: BadgeWithProgress[];
  onBadgeClick?: (badge: Badge) => void;
  filterCategory?: BadgeCategory;
  filterTier?: BadgeTier;
  showOnlyEarned?: boolean;
  loading?: boolean;
}

/**
 * Loading Skeleton for Badge Grid
 */
function BadgeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
          <Card
            sx={{
              height: 280,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <CardContent sx={{ p: 2.5, pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Skeleton variant="circular" width={64} height={64} />
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 'var(--radius-sm)' }} />
              </Box>
              <Skeleton variant="text" width="80%" height={28} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="90%" height={20} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 'var(--radius-sm)' }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ message, filterApplied = false }: { message?: string; filterApplied?: boolean }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          backgroundColor: 'var(--prussian-blue-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          mb: 3,
        }}
      >
        <EmojiEventsIcon
          sx={{
            fontSize: 60,
            color: 'var(--prussian-blue)',
            opacity: 0.5,
          }}
        />
      </Box>
      <Typography
        variant="h5"
        sx={{
          color: 'var(--color-text-secondary)',
          fontWeight: 600,
          mb: 1,
        }}
      >
        {filterApplied ? 'Ingen merker funnet' : 'Ingen merker ennå'}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'var(--color-text-muted)',
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        {message || (filterApplied
          ? 'Prøv å justere filtrene dine for å se flere merker.'
          : 'Start å delta i økter og spor drikkene dine for å låse opp merker!'
        )}
      </Typography>
    </Box>
  );
}

/**
 * BadgeGrid Component
 *
 * Main component for displaying badges in a responsive grid
 */
export function BadgeGrid({
  badges,
  onBadgeClick,
  filterCategory,
  filterTier,
  showOnlyEarned = false,
  loading = false,
}: BadgeGridProps) {
  // Show loading skeleton
  if (loading) {
    return <BadgeGridSkeleton />;
  }

  // Apply filters
  let filteredBadges = [...badges];

  if (filterCategory) {
    filteredBadges = filteredBadges.filter((b) => b.category === filterCategory);
  }

  if (filterTier) {
    filteredBadges = filteredBadges.filter((b) => b.tier === filterTier);
  }

  if (showOnlyEarned) {
    filteredBadges = filteredBadges.filter((b) => !b.isLocked);
  }

  // Show empty state if no badges
  if (filteredBadges.length === 0) {
    const hasFilters = Boolean(filterCategory || filterTier || showOnlyEarned);
    return <EmptyState filterApplied={hasFilters} />;
  }

  // Sort badges: earned first, then by tier order
  const sortedBadges = filteredBadges.sort((a, b) => {
    // Earned badges first
    if (!a.isLocked && b.isLocked) return -1;
    if (a.isLocked && !b.isLocked) return 1;

    // Then by tier order (lower is better)
    const tierOrder = {
      legendary: 1,
      platinum: 2,
      gold: 3,
      silver: 4,
      bronze: 5,
    };
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;

    // Then by tier_order within same tier
    return a.tier_order - b.tier_order;
  });

  return (
    <Grid container spacing={2}>
      {sortedBadges.map((badge) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={badge.id}>
          <BadgeCard
            badge={badge}
            earned={badge.earned}
            progress={badge.progress}
            onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
          />
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Compact Badge Grid
 *
 * More condensed version for sidebars or smaller spaces
 */
interface CompactBadgeGridProps {
  badges: BadgeWithProgress[];
  onBadgeClick?: (badge: Badge) => void;
  maxItems?: number;
  loading?: boolean;
}

export function CompactBadgeGrid({
  badges,
  onBadgeClick,
  maxItems,
  loading = false,
}: CompactBadgeGridProps) {
  if (loading) {
    return <BadgeGridSkeleton count={3} />;
  }

  const displayBadges = maxItems ? badges.slice(0, maxItems) : badges;

  if (displayBadges.length === 0) {
    return <EmptyState />;
  }

  return (
    <Grid container spacing={1.5}>
      {displayBadges.map((badge) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={badge.id}>
          <BadgeCard
            badge={badge}
            earned={badge.earned}
            progress={badge.progress}
            onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
            compact
          />
        </Grid>
      ))}
    </Grid>
  );
}
