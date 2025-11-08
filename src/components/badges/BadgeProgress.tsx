/**
 * BadgeProgress Component
 *
 * Displays progress toward earning a badge with:
 * - Linear or circular progress indicator
 * - Progress percentage
 * - Current value / target value display
 * - Tier-based color scheme
 */

import { Box, Typography, LinearProgress, CircularProgress } from '@mui/material';
import type { BadgeTier } from '../../types/badges';

// Tier color mapping
const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  legendary: '#9C27B0',
} as const;

interface BadgeProgressProps {
  current: number;
  target: number;
  tier: BadgeTier;
  variant?: 'linear' | 'circular';
  showLabel?: boolean;
}

/**
 * BadgeProgressBar Component
 *
 * Shows progress as a linear or circular indicator with tier-based colors
 */
export function BadgeProgressBar({
  current,
  target,
  tier,
  variant = 'linear',
  showLabel = true,
}: BadgeProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const tierColor = TIER_COLORS[tier];

  if (variant === 'circular') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={percentage}
            size={80}
            thickness={5}
            sx={{
              color: tierColor,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              sx={{
                color: 'var(--color-text-primary)',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              {Math.round(percentage)}%
            </Typography>
          </Box>
        </Box>
        {showLabel && (
          <Typography
            variant="caption"
            sx={{
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {current.toLocaleString('nb-NO')} / {target.toLocaleString('nb-NO')}
          </Typography>
        )}
      </Box>
    );
  }

  // Linear variant
  return (
    <Box sx={{ width: '100%' }}>
      {showLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Fremgang
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: tierColor,
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {Math.round(percentage)}%
          </Typography>
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: `${tierColor}20`,
          '& .MuiLinearProgress-bar': {
            backgroundColor: tierColor,
            borderRadius: 'var(--radius-sm)',
          },
        }}
      />
      {showLabel && (
        <Typography
          variant="caption"
          sx={{
            color: 'var(--color-text-muted)',
            fontSize: '11px',
            mt: 0.5,
            display: 'block',
          }}
        >
          {current.toLocaleString('nb-NO')} / {target.toLocaleString('nb-NO')}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Tier Progress Component
 *
 * Shows overall progress across multiple tiers
 */
interface TierProgressProps {
  tierCounts: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    legendary: number;
  };
  totalBadges: number;
}

export function TierProgress({ tierCounts, totalBadges }: TierProgressProps) {
  const tiers: Array<{ key: BadgeTier; label: string; color: string }> = [
    { key: 'bronze', label: 'Bronse', color: TIER_COLORS.bronze },
    { key: 'silver', label: 'Sølv', color: TIER_COLORS.silver },
    { key: 'gold', label: 'Gull', color: TIER_COLORS.gold },
    { key: 'platinum', label: 'Platina', color: TIER_COLORS.platinum },
    { key: 'legendary', label: 'Legendarisk', color: TIER_COLORS.legendary },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {tiers.map(({ key, label, color }) => {
        const count = tierCounts[key];
        if (count === 0) return null;

        return (
          <Box key={key} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {label}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: color,
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {count}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(count / totalBadges) * 100}
              sx={{
                height: 6,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: `${color}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 'var(--radius-sm)',
                },
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}
