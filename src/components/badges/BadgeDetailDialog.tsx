/**
 * BadgeDetailDialog Component
 *
 * Modal dialog showing full badge details with:
 * - Large badge icon with tier styling
 * - Badge title and tier chip
 * - Full description
 * - Criteria display formatted as Norwegian text
 * - Progress bar for locked badges
 * - Earned date and metadata for earned badges
 * - Responsive design
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import type { Badge, UserBadge, BadgeProgress, BadgeCondition } from '../../types/badges';
import { BadgeProgressBar } from './BadgeProgress';

interface BadgeDetailDialogProps {
  badge: Badge | null;
  userBadge?: UserBadge;
  progress?: BadgeProgress;
  open: boolean;
  onClose: () => void;
}

// Tier color mapping
const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  legendary: '#9C27B0',
} as const;

// Norwegian labels for tiers
const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronse',
  silver: 'Sølv',
  gold: 'Gull',
  platinum: 'Platina',
  legendary: 'Legendarisk',
};

// Norwegian labels for categories
const CATEGORY_LABELS: Record<string, string> = {
  session: 'Økt',
  global: 'Global',
  social: 'Sosial',
  milestone: 'Milepæl',
};

// Norwegian labels for metrics
const METRIC_LABELS: Record<string, string> = {
  total_drinks: 'totalt antall drikker',
  max_bac: 'maksimal promille',
  session_count: 'antall økter',
  friend_count: 'antall venner',
  consecutive_days: 'dager på rad',
  total_sessions: 'totalt antall økter',
  drinks_in_session: 'drikker i én økt',
  bac_peak: 'promilletopp',
  session_duration: 'øktvarighet (timer)',
  avg_bac: 'gjennomsnittlig promille',
};

// Norwegian labels for operators
const OPERATOR_LABELS: Record<string, string> = {
  '>=': 'minst',
  '==': 'nøyaktig',
  '<=': 'maks',
  '>': 'mer enn',
  '<': 'mindre enn',
  between: 'mellom',
};

// Norwegian labels for timeframes
const TIMEFRAME_LABELS: Record<string, string> = {
  session: 'i én økt',
  all_time: 'totalt',
  '30_days': 'siste 30 dager',
  '7_days': 'siste 7 dager',
  '24_hours': 'siste 24 timer',
};

/**
 * Format a badge condition to Norwegian text
 */
function formatCondition(condition: BadgeCondition): string {
  const metric = METRIC_LABELS[condition.metric] || condition.metric;
  const operator = OPERATOR_LABELS[condition.operator] || condition.operator;
  const timeframe = condition.timeframe ? TIMEFRAME_LABELS[condition.timeframe] : '';

  if (condition.operator === 'between' && Array.isArray(condition.value)) {
    const [min, max] = condition.value;
    return `${metric}: ${operator} ${min} og ${max} ${timeframe}`.trim();
  }

  return `${metric}: ${operator} ${condition.value} ${timeframe}`.trim();
}

export function BadgeDetailDialog({
  badge,
  userBadge,
  progress,
  open,
  onClose,
}: BadgeDetailDialogProps) {
  if (!badge) {
    return null;
  }

  const isEarned = Boolean(userBadge);
  const tierColor = TIER_COLORS[badge.tier];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 'var(--radius-lg)',
          border: isEarned ? `2px solid ${tierColor}` : '1px solid rgba(0, 48, 73, 0.1)',
          maxHeight: { xs: '90vh', sm: '80vh' },
        },
      }}
    >
      {/* Close Button */}
      <IconButton
        aria-label="lukk"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'var(--color-text-muted)',
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Dialog Header with Tier Stripe */}
      <Box
        sx={{
          position: 'relative',
          background: `linear-gradient(135deg, ${tierColor}20 0%, ${tierColor}05 100%)`,
          borderBottom: `3px solid ${tierColor}`,
          pt: 2,
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            pt: 1,
            pb: 2,
          }}
        >
          {/* Large Badge Icon */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar
              src={badge.icon_url || undefined}
              alt={badge.title}
              sx={{
                width: 120,
                height: 120,
                backgroundColor: isEarned ? tierColor : 'rgba(0, 0, 0, 0.1)',
                border: `3px solid ${tierColor}`,
                boxShadow: isEarned ? `0 0 30px ${tierColor}60` : 'none',
              }}
            >
              {!badge.icon_url && (
                isEarned ? (
                  <EmojiEventsIcon sx={{ fontSize: 60, color: 'white' }} />
                ) : (
                  <LockIcon sx={{ fontSize: 60, color: 'rgba(0, 0, 0, 0.3)' }} />
                )
              )}
            </Avatar>
          </Box>

          {/* Badge Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'var(--prussian-blue)',
              mb: 1,
            }}
          >
            {badge.title}
          </Typography>

          {/* Tier and Category Chips */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={TIER_LABELS[badge.tier]}
              size="small"
              sx={{
                backgroundColor: tierColor,
                color: badge.tier === 'silver' || badge.tier === 'platinum' ? 'black' : 'white',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            />
            <Chip
              label={CATEGORY_LABELS[badge.category]}
              size="small"
              variant="outlined"
              sx={{
                borderColor: tierColor,
                color: tierColor,
                fontWeight: 600,
              }}
            />
          </Box>
        </DialogTitle>
      </Box>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            color: 'var(--color-text-secondary)',
            mb: 3,
            textAlign: 'center',
          }}
        >
          {badge.description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Criteria */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: 'var(--prussian-blue)',
              mb: 1.5,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '12px',
            }}
          >
            Krav
          </Typography>
          <List dense sx={{ bgcolor: 'var(--prussian-blue-bg)', borderRadius: 'var(--radius-sm)' }}>
            {badge.criteria.conditions.map((condition, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <StarIcon sx={{ fontSize: 20, color: tierColor }} />
                </ListItemIcon>
                <ListItemText
                  primary={formatCondition(condition)}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: '14px',
                      color: 'var(--color-text-primary)',
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
          {badge.criteria.requireAll === false && (
            <Typography
              variant="caption"
              sx={{
                color: 'var(--color-text-muted)',
                display: 'block',
                mt: 1,
                fontStyle: 'italic',
              }}
            >
              * Du trenger bare å oppfylle én av kravene
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Progress or Earned Info */}
        {isEarned && userBadge ? (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 24, color: 'var(--color-success)' }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: 'var(--color-success)',
                }}
              >
                Merke oppnådd!
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: `${tierColor}15`,
                borderRadius: 'var(--radius-md)',
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
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
                    Oppnådd dato
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'var(--color-text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {new Date(userBadge.earned_at).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'long',
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
                    Poeng opptjent
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: tierColor,
                      fontWeight: 700,
                    }}
                  >
                    +{badge.points}
                  </Typography>
                </Box>
              </Box>

              {/* Display metadata if available */}
              {userBadge.metadata && Object.keys(userBadge.metadata).length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 48, 73, 0.1)' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'var(--color-text-muted)',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 600,
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    Detaljer
                  </Typography>
                  {Object.entries(userBadge.metadata).map(([key, value]) => (
                    <Typography
                      key={key}
                      variant="body2"
                      sx={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '13px',
                      }}
                    >
                      {key}: {String(value)}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ) : progress ? (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: 'var(--prussian-blue)',
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '12px',
              }}
            >
              Fremgang
            </Typography>
            <BadgeProgressBar
              current={progress.current_value}
              target={progress.target_value}
              tier={badge.tier}
              variant="linear"
              showLabel
            />
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: 'var(--xanthous-bg)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'var(--color-text-secondary)',
                  fontWeight: 600,
                }}
              >
                {badge.points} poeng ved fullføring
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              p: 3,
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <LockIcon sx={{ fontSize: 48, color: 'var(--color-text-muted)', opacity: 0.5 }} />
            <Typography
              variant="body1"
              sx={{
                color: 'var(--color-text-muted)',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Dette merket er fortsatt låst
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
              }}
            >
              Oppfyll kravene over for å låse det opp og tjene {badge.points} poeng
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" fullWidth>
          Lukk
        </Button>
      </DialogActions>
    </Dialog>
  );
}
