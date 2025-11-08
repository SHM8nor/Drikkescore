/**
 * ChristmasBadgeCollection Component
 *
 * Special view for displaying Christmas-themed badges earned during julebord sessions.
 * Features:
 * - Festive styling with Christmas colors
 * - Progress indicators for multi-session badges
 * - Displays all 7 Christmas badges from the julebord collection
 * - Shows earned/locked states with Christmas theming
 * - Norwegian language
 *
 * Usage:
 * - Display during December
 * - Display when user is in a julebord session
 * - Can be used as a dedicated Christmas badges page section
 */

import { Box, Card, CardContent, Typography, Grid, LinearProgress, Chip, Avatar } from '@mui/material';
import { useBadgesByCategory, useUserBadges } from '../../hooks/useBadges';
import { useAuth } from '../../context/AuthContext';
import type { Badge, UserBadge } from '../../types/badges';
import LockIcon from '@mui/icons-material/Lock';

// Christmas badge tier colors with festive theme
const CHRISTMAS_TIER_COLORS = {
  bronze: '#C87533', // Warm bronze
  silver: '#C0C0C0', // Silver
  gold: '#FFD700', // Gold
  platinum: '#E5E4E2', // Platinum
  legendary: '#8B0000', // Dark red (Christmas)
} as const;

// Emoji icons for each badge (as placeholders until proper icons are uploaded)
const BADGE_EMOJIS: Record<string, string> = {
  juleglede: '🎄',
  nissehue: '🎅',
  gloggmester: '🍷',
  julestjerne: '⭐',
  snowmann: '⛄',
  julenisse: '🎁',
  pepperkake: '🍪',
};

interface ChristmasBadgeCollectionProps {
  /** Optional filter to show only earned badges */
  showOnlyEarned?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Individual Christmas Badge Card
 */
function ChristmasBadgeCard({
  badge,
  earned,
  compact = false,
}: {
  badge: Badge;
  earned?: UserBadge;
  compact?: boolean;
}) {
  const isEarned = Boolean(earned);
  const tierColor = CHRISTMAS_TIER_COLORS[badge.tier];
  const emoji = BADGE_EMOJIS[badge.code] || '🎄';

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 'var(--radius-md)',
        background: isEarned
          ? `linear-gradient(135deg, ${tierColor}15 0%, ${tierColor}05 100%)`
          : 'rgba(200, 200, 200, 0.1)',
        border: isEarned ? `2px solid ${tierColor}` : '1px solid rgba(139, 0, 0, 0.2)',
        opacity: isEarned ? 1 : 0.7,
        transition: 'all var(--transition-base)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: isEarned ? 'translateY(-4px)' : 'none',
          boxShadow: isEarned ? `0 8px 24px ${tierColor}40` : 'none',
        },
      }}
    >
      {/* Christmas stripe */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: isEarned
            ? `linear-gradient(90deg, #8B0000 0%, ${tierColor} 50%, #006400 100%)`
            : 'linear-gradient(90deg, #ccc 0%, #999 100%)',
        }}
      />

      <CardContent sx={{ p: compact ? 2 : 2.5, pt: compact ? 2.5 : 3 }}>
        {/* Badge Icon and Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Avatar
            sx={{
              width: compact ? 56 : 72,
              height: compact ? 56 : 72,
              backgroundColor: isEarned ? tierColor : 'rgba(139, 0, 0, 0.2)',
              border: `2px solid ${tierColor}`,
              fontSize: compact ? '32px' : '40px',
              boxShadow: isEarned ? `0 0 20px ${tierColor}60` : 'none',
            }}
          >
            {isEarned ? emoji : <LockIcon sx={{ fontSize: compact ? 28 : 36, color: 'rgba(0, 0, 0, 0.3)' }} />}
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
          variant={compact ? 'h6' : 'h5'}
          sx={{
            fontWeight: 700,
            color: isEarned ? '#8B0000' : 'rgba(0, 0, 0, 0.5)',
            mb: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {badge.title}
        </Typography>

        {/* Badge Description */}
        <Typography
          variant="body2"
          sx={{
            color: 'var(--color-text-secondary)',
            mb: compact ? 1.5 : 2,
            minHeight: compact ? 36 : 40,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {badge.description}
        </Typography>

        {/* Earned Status or Locked */}
        {isEarned && earned ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: `${tierColor}20`,
              borderRadius: 'var(--radius-sm)',
              p: 1.5,
              border: `1px solid ${tierColor}40`,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--color-text-muted)',
                  fontSize: '10px',
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
                  color: '#8B0000',
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
                  fontSize: '10px',
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
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              backgroundColor: 'rgba(139, 0, 0, 0.1)',
              borderRadius: 'var(--radius-sm)',
              p: 1.5,
              border: '1px solid rgba(139, 0, 0, 0.2)',
            }}
          >
            <LockIcon sx={{ fontSize: 18, color: 'rgba(139, 0, 0, 0.6)' }} />
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(139, 0, 0, 0.7)',
                fontWeight: 600,
              }}
            >
              Låst • {badge.points} poeng
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Main ChristmasBadgeCollection Component
 */
export function ChristmasBadgeCollection({ showOnlyEarned = false, compact = false }: ChristmasBadgeCollectionProps) {
  const { user } = useAuth();
  const { data: christmasBadges, isLoading: badgesLoading } = useBadgesByCategory('special');
  const { data: userBadges, isLoading: userBadgesLoading } = useUserBadges(user?.id);

  const loading = badgesLoading || userBadgesLoading;

  // Create earned badges map for quick lookup
  const earnedBadgesMap = new Map<string, UserBadge>();
  userBadges?.forEach((ub) => {
    earnedBadgesMap.set(ub.badge_id, ub);
  });

  // Filter and sort badges
  let displayBadges = christmasBadges || [];

  if (showOnlyEarned) {
    displayBadges = displayBadges.filter((badge) => earnedBadgesMap.has(badge.id));
  }

  // Sort by tier and tier_order
  displayBadges = [...displayBadges].sort((a, b) => {
    const tierOrder = { legendary: 1, platinum: 2, gold: 3, silver: 4, bronze: 5 };
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return a.tier_order - b.tier_order;
  });

  // Calculate stats
  const totalBadges = christmasBadges?.length || 0;
  const earnedCount = displayBadges.filter((badge) => earnedBadgesMap.has(badge.id)).length;
  const earnedPercentage = totalBadges > 0 ? (earnedCount / totalBadges) * 100 : 0;

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)' }}>
          Laster julemerker...
        </Typography>
      </Box>
    );
  }

  if (!christmasBadges || christmasBadges.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ color: 'var(--color-text-secondary)', mb: 1 }}>
          Ingen julemerker tilgjengelig
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--color-text-muted)' }}>
          Julemerker vil vises når de aktiveres.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              fontSize: '40px',
              lineHeight: 1,
            }}
          >
            🎄
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#8B0000',
                mb: 0.5,
              }}
            >
              Julemerker
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'var(--color-text-secondary)',
              }}
            >
              Spesielle merker for julebord-økter
            </Typography>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              Din progresjon
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: '#8B0000',
              }}
            >
              {earnedCount} / {totalBadges}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={earnedPercentage}
            sx={{
              height: 8,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(139, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(90deg, #8B0000 0%, #FFD700 50%, #006400 100%)',
              },
            }}
          />
        </Box>
      </Box>

      {/* Badge Grid */}
      <Grid container spacing={compact ? 2 : 3}>
        {displayBadges.map((badge) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={badge.id}>
            <ChristmasBadgeCard badge={badge} earned={earnedBadgesMap.get(badge.id)} compact={compact} />
          </Grid>
        ))}
      </Grid>

      {/* Empty State for showOnlyEarned */}
      {showOnlyEarned && earnedCount === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            px: 3,
            backgroundColor: 'rgba(139, 0, 0, 0.05)',
            borderRadius: 'var(--radius-md)',
            border: '2px dashed rgba(139, 0, 0, 0.2)',
          }}
        >
          <Box sx={{ fontSize: '48px', mb: 2 }}>⛄</Box>
          <Typography
            variant="h6"
            sx={{
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              mb: 1,
            }}
          >
            Ingen julemerker oppnådd ennå
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'var(--color-text-muted)',
              maxWidth: 400,
              margin: '0 auto',
            }}
          >
            Delta i julebord-økter for å låse opp festlige merker!
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/**
 * Compact Christmas Badge Showcase
 * For use in sidebars or smaller sections
 */
export function CompactChristmasBadgeShowcase() {
  return <ChristmasBadgeCollection showOnlyEarned={true} compact={true} />;
}
