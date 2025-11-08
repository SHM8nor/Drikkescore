/**
 * BadgeTooltip Component
 *
 * Hover tooltip showing detailed badge information:
 * - Full badge information
 * - Criteria description
 * - Earned date or progress
 * - Points value
 *
 * Uses MUI Tooltip with custom styled content
 */

import { Tooltip, Box, Typography, Divider, Chip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Badge, UserBadge, BadgeProgress } from '../../types/badges';
import { BadgeProgressBar } from './BadgeProgress';

// Tier color mapping
const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  legendary: '#9C27B0',
} as const;

// Category labels in Norwegian
const CATEGORY_LABELS = {
  session: 'Økt',
  global: 'Global',
  social: 'Sosial',
  milestone: 'Milepæl',
} as const;

interface BadgeTooltipProps {
  badge: Badge;
  earned?: UserBadge;
  progress?: BadgeProgress;
  children: React.ReactElement;
}

/**
 * BadgeTooltip Component
 *
 * Wraps any child element with a tooltip showing badge details
 */
export function BadgeTooltip({ badge, earned, progress, children }: BadgeTooltipProps) {
  const isEarned = Boolean(earned);
  const tierColor = TIER_COLORS[badge.tier];

  const tooltipContent = (
    <Box
      sx={{
        p: 2,
        maxWidth: 320,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            backgroundColor: isEarned ? tierColor : 'rgba(255, 255, 255, 0.1)',
            border: `2px solid ${tierColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isEarned ? (
            <CheckCircleIcon sx={{ fontSize: 28, color: 'white' }} />
          ) : (
            <LockIcon sx={{ fontSize: 28, color: 'white' }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'white',
              fontWeight: 700,
              mb: 0.5,
              lineHeight: 1.3,
            }}
          >
            {badge.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
              size="small"
              sx={{
                backgroundColor: tierColor,
                color: badge.tier === 'silver' || badge.tier === 'platinum' ? 'black' : 'white',
                fontWeight: 600,
                fontSize: '10px',
                height: 20,
                textTransform: 'uppercase',
              }}
            />
            <Chip
              label={CATEGORY_LABELS[badge.category]}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600,
                fontSize: '10px',
                height: 20,
              }}
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', mb: 1.5 }} />

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255, 255, 255, 0.9)',
          mb: 1.5,
          lineHeight: 1.5,
        }}
      >
        {badge.description}
      </Typography>

      {/* Criteria Summary */}
      <Box
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 'var(--radius-sm)',
          p: 1.5,
          mb: 1.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
            mb: 0.5,
            display: 'block',
          }}
        >
          Krav
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'white',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          {badge.criteria.conditions.map((condition, index) => (
            <Box key={index} component="span" sx={{ display: 'block', mb: 0.5 }}>
              • {formatCondition(condition)}
            </Box>
          ))}
        </Typography>
      </Box>

      {/* Status Section */}
      {isEarned && earned ? (
        <Box
          sx={{
            backgroundColor: `${tierColor}30`,
            borderRadius: 'var(--radius-sm)',
            p: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600,
                display: 'block',
              }}
            >
              Oppnådd
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              {new Date(earned.earned_at).toLocaleDateString('nb-NO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: tierColor,
              fontWeight: 700,
              fontSize: '20px',
            }}
          >
            +{badge.points}
          </Typography>
        </Box>
      ) : progress ? (
        <Box>
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
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '11px',
              mt: 1,
              display: 'block',
              textAlign: 'center',
            }}
          >
            {badge.points} poeng ved fullføring
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 'var(--radius-sm)',
            p: 1.5,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600,
            }}
          >
            Låst • {badge.points} poeng
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Tooltip
      title={tooltipContent}
      arrow
      enterDelay={300}
      leaveDelay={200}
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: 'var(--prussian-blue)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            p: 0,
            maxWidth: 'none',
          },
        },
        arrow: {
          sx: {
            color: 'var(--prussian-blue)',
          },
        },
      }}
    >
      {children}
    </Tooltip>
  );
}

/**
 * Helper function to format badge criteria conditions
 */
function formatCondition(condition: any): string {
  const { metric, operator, value, timeframe } = condition;

  // Format metric name
  const metricNames: Record<string, string> = {
    total_drinks: 'totalt antall enheter',
    max_bac: 'maksimal promille',
    session_count: 'antall økter',
    total_sessions: 'totalt økter',
    consecutive_sessions: 'påfølgende økter',
    friend_count: 'antall venner',
    drinks_in_session: 'enheter i en økt',
  };

  const metricName = metricNames[metric] || metric;

  // Format operator
  const operatorMap: Record<string, string> = {
    '>=': 'minst',
    '==': 'nøyaktig',
    '<=': 'maksimalt',
    '>': 'mer enn',
    '<': 'mindre enn',
    'between': 'mellom',
  };

  const operatorText = operatorMap[operator] || operator;

  // Format value
  let valueText = '';
  if (operator === 'between' && Array.isArray(value)) {
    valueText = `${value[0]} og ${value[1]}`;
  } else {
    valueText = String(value);
  }

  // Format timeframe
  const timeframeMap: Record<string, string> = {
    session: 'i én økt',
    all_time: 'totalt',
    '30_days': 'siste 30 dager',
    '7_days': 'siste 7 dager',
    '24_hours': 'siste 24 timer',
  };

  const timeframeText = timeframe ? ` (${timeframeMap[timeframe] || timeframe})` : '';

  return `${operatorText} ${valueText} ${metricName}${timeframeText}`;
}
