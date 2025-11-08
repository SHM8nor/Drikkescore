/**
 * Badge Components
 *
 * Components for the badge/achievement system admin interface and notifications
 */

export { default as BadgeIconUploader } from './BadgeIconUploader';
export { BadgeNotification } from './BadgeNotification';
export { BadgeNotificationManager } from './BadgeNotificationManager';

// Badge display components
export { BadgeCard } from './BadgeCard';
export { BadgeProgressBar, TierProgress } from './BadgeProgress';
export { BadgeGrid, CompactBadgeGrid } from './BadgeGrid';
export { BadgeTooltip } from './BadgeTooltip';
export { BadgeFilter } from './BadgeFilter';
export { BadgeDetailDialog } from './BadgeDetailDialog';

// Re-export types for convenience
export type {
  Badge,
  BadgeWithProgress,
  UserBadge,
  BadgeProgress,
  BadgeTier,
  BadgeCategory,
} from '../../types/badges';
