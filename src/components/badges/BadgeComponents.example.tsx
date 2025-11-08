/**
 * Badge Components Usage Examples
 *
 * This file demonstrates how to use the badge display components
 * in different contexts throughout the application.
 */

import { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, Button, Dialog, DialogContent } from '@mui/material';
import {
  BadgeCard,
  BadgeGrid,
  CompactBadgeGrid,
  BadgeTooltip,
  BadgeProgressBar,
  TierProgress,
} from './index';
import { useActiveBadges, useUserBadges, useBadgeProgress, useUserBadgeStats } from '../../hooks/useBadges';
import { useAuth } from '../../context/AuthContext';
import type { Badge, BadgeWithProgress, BadgeCategory } from '../../types/badges';

/**
 * Example 1: Full Badge Gallery Page
 *
 * Shows all available badges with filtering options
 */
export function BadgeGalleryPage() {
  const { user } = useAuth();
  const { data: allBadges = [], isLoading: badgesLoading } = useActiveBadges();
  const { data: userBadges = [], isLoading: userBadgesLoading } = useUserBadges(user?.id);
  const { data: progressData = [], isLoading: progressLoading } = useBadgeProgress(user?.id);
  const { data: stats } = useUserBadgeStats(user?.id);

  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | undefined>();
  const [showOnlyEarned, setShowOnlyEarned] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Combine badges with user progress
  const badgesWithProgress: BadgeWithProgress[] = allBadges.map((badge) => {
    const earned = userBadges.find((ub) => ub.badge_id === badge.id);
    const progress = progressData.find((p) => p.badge_id === badge.id);

    return {
      ...badge,
      earned,
      progress,
      isLocked: !earned,
      progressPercentage: progress ? (progress.current_value / progress.target_value) * 100 : 0,
    };
  });

  const isLoading = badgesLoading || userBadgesLoading || progressLoading;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Merker
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)' }}>
          Lås opp merker ved å nå ulike milepæler og fullføre utfordringer
        </Typography>
      </Box>

      {/* Stats Summary */}
      {stats && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Din fremgang
          </Typography>
          <TierProgress tierCounts={stats.by_tier} totalBadges={stats.total_earned} />
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedCategory || false}
          onChange={(_, value) => setSelectedCategory(value || undefined)}
          sx={{ mb: 2 }}
        >
          <Tab label="Alle" value={false} />
          <Tab label="Økt" value="session" />
          <Tab label="Global" value="global" />
          <Tab label="Sosial" value="social" />
          <Tab label="Milepæl" value="milestone" />
        </Tabs>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={showOnlyEarned ? 'contained' : 'outlined'}
            onClick={() => setShowOnlyEarned(!showOnlyEarned)}
          >
            Kun oppnådde
          </Button>
        </Box>
      </Box>

      {/* Badge Grid */}
      <BadgeGrid
        badges={badgesWithProgress}
        onBadgeClick={(badge) => setSelectedBadge(badge)}
        filterCategory={selectedCategory}
        showOnlyEarned={showOnlyEarned}
        loading={isLoading}
      />

      {/* Badge Detail Dialog */}
      <Dialog
        open={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          {selectedBadge && (
            <BadgeCard
              badge={selectedBadge}
              earned={badgesWithProgress.find((b) => b.id === selectedBadge.id)?.earned}
              progress={badgesWithProgress.find((b) => b.id === selectedBadge.id)?.progress}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}

/**
 * Example 2: Recent Badges Showcase
 *
 * Shows recently earned badges in a compact format
 */
export function RecentBadgesWidget() {
  const { user } = useAuth();
  const { data: userBadges = [], isLoading } = useUserBadges(user?.id);

  // Get 3 most recent badges
  const recentBadges: BadgeWithProgress[] = userBadges
    .slice(0, 3)
    .map((ub) => ({
      ...ub.badge,
      earned: ub,
      isLocked: false,
      progressPercentage: 100,
    }));

  return (
    <Box sx={{ p: 3, backgroundColor: 'white', borderRadius: 'var(--radius-lg)' }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Nylig oppnådde merker
      </Typography>
      <CompactBadgeGrid badges={recentBadges} loading={isLoading} maxItems={3} />
    </Box>
  );
}

/**
 * Example 3: Badge Progress Cards
 *
 * Shows progress toward unlocking specific badges
 */
export function BadgeProgressWidget() {
  const { user } = useAuth();
  const { data: allBadges = [] } = useActiveBadges();
  const { data: userBadges = [] } = useUserBadges(user?.id);
  const { data: progressData = [] } = useBadgeProgress(user?.id);

  // Find badges that are in progress (not earned, but have progress)
  const inProgressBadges: BadgeWithProgress[] = allBadges
    .filter((badge) => {
      const isEarned = userBadges.some((ub) => ub.badge_id === badge.id);
      const hasProgress = progressData.some((p) => p.badge_id === badge.id);
      return !isEarned && hasProgress;
    })
    .map((badge) => {
      const progress = progressData.find((p) => p.badge_id === badge.id);
      return {
        ...badge,
        progress,
        isLocked: true,
        progressPercentage: progress ? (progress.current_value / progress.target_value) * 100 : 0,
      };
    })
    .sort((a, b) => b.progressPercentage - a.progressPercentage)
    .slice(0, 3);

  return (
    <Box sx={{ p: 3, backgroundColor: 'white', borderRadius: 'var(--radius-lg)' }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Nesten låst opp
      </Typography>
      <CompactBadgeGrid badges={inProgressBadges} maxItems={3} />
    </Box>
  );
}

/**
 * Example 4: Badge with Tooltip
 *
 * Shows how to use BadgeTooltip for interactive badge display
 */
export function BadgeWithTooltipExample() {
  const { user } = useAuth();
  const { data: userBadges = [] } = useUserBadges(user?.id);

  if (userBadges.length === 0) {
    return null;
  }

  const firstBadge = userBadges[0];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Hover over the badge for details
      </Typography>
      <BadgeTooltip badge={firstBadge.badge} earned={firstBadge}>
        <Box
          sx={{
            display: 'inline-block',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          <BadgeCard badge={firstBadge.badge} earned={firstBadge} compact />
        </Box>
      </BadgeTooltip>
    </Box>
  );
}

/**
 * Example 5: Standalone Progress Bar
 *
 * Shows how to use BadgeProgressBar independently
 */
export function ProgressBarExample() {
  return (
    <Box sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Progress Examples
      </Typography>

      {/* Linear Progress */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Linear Progress (Gold Tier)
        </Typography>
        <BadgeProgressBar current={75} target={100} tier="gold" variant="linear" showLabel />
      </Box>

      {/* Circular Progress */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Circular Progress (Legendary Tier)
        </Typography>
        <BadgeProgressBar current={45} target={100} tier="legendary" variant="circular" showLabel />
      </Box>
    </Box>
  );
}

/**
 * Example 6: Badge Card States
 *
 * Shows different states of BadgeCard component
 */
export function BadgeCardStatesExample() {
  const exampleBadge: Badge = {
    id: 'example-1',
    code: 'first_drink',
    title: 'Første Enhet',
    description: 'Registrer din første drikk i appen',
    category: 'milestone',
    tier: 'bronze',
    tier_order: 1,
    icon_url: null,
    criteria: {
      type: 'threshold',
      conditions: [
        {
          metric: 'total_drinks',
          operator: '>=',
          value: 1,
        },
      ],
    },
    is_active: true,
    is_automatic: true,
    points: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Badge Card States
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3 }}>
        {/* Earned State */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Earned Badge
          </Typography>
          <BadgeCard
            badge={exampleBadge}
            earned={{
              id: 'earned-1',
              user_id: 'user-1',
              badge_id: exampleBadge.id,
              earned_at: new Date().toISOString(),
              session_id: null,
              metadata: null,
            }}
          />
        </Box>

        {/* Progress State */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            In Progress Badge
          </Typography>
          <BadgeCard
            badge={exampleBadge}
            progress={{
              id: 'progress-1',
              user_id: 'user-1',
              badge_id: exampleBadge.id,
              current_value: 65,
              target_value: 100,
              last_updated: new Date().toISOString(),
            }}
          />
        </Box>

        {/* Locked State */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Locked Badge
          </Typography>
          <BadgeCard badge={exampleBadge} />
        </Box>
      </Box>
    </Box>
  );
}
