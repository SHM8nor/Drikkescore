// =============================================================================
// Badge System Types
// =============================================================================
// Type definitions for the achievement/badge system matching Supabase schema

/**
 * Badge tier levels indicating rarity and difficulty
 * Ordered from least to most prestigious
 */
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

/**
 * Badge categories for grouping achievements
 * - session: Earned during or related to specific sessions
 * - global: Based on all-time statistics
 * - social: Related to friend interactions
 * - milestone: Special one-time achievements
 * - special: Admin-only honorary badges (hidden from main badges page)
 */
export type BadgeCategory = 'session' | 'global' | 'social' | 'milestone' | 'special';

/**
 * Comparison operators for badge criteria conditions
 */
export type BadgeCriteriaOperator = '>=' | '==' | '<=' | '>' | '<' | 'between';

/**
 * Time frames for badge criteria evaluation
 */
export type BadgeCriteriaTimeframe = 'session' | 'all_time' | '30_days' | '7_days' | '24_hours';

/**
 * Criteria condition type for badge evaluation
 */
export type BadgeCriteriaType = 'threshold' | 'milestone' | 'streak' | 'combination';

/**
 * Individual condition within badge criteria
 */
export interface BadgeCondition {
  /** The metric to evaluate (e.g., 'total_drinks', 'max_bac', 'session_count') */
  metric: string;
  /** Comparison operator */
  operator: BadgeCriteriaOperator;
  /** Target value or range [min, max] for 'between' operator */
  value: number | [number, number];
  /** Optional time frame for evaluation (defaults to 'all_time') */
  timeframe?: BadgeCriteriaTimeframe;
}

/**
 * Badge criteria structure stored as JSONB in database
 * Defines the requirements for earning a badge
 */
export interface BadgeCriteria {
  /** Type of criteria evaluation */
  type: BadgeCriteriaType;
  /** Array of conditions to evaluate */
  conditions: BadgeCondition[];
  /** If true, all conditions must be met; if false, any condition suffices (default: true) */
  requireAll?: boolean;
}

/**
 * Badge entity from the database
 * Represents a specific achievement that can be earned
 */
export interface Badge {
  id: string;
  /** Unique code identifier for the badge (e.g., 'first_drink', 'party_animal') */
  code: string;
  /** Display title in Norwegian */
  title: string;
  /** Description of how to earn the badge in Norwegian */
  description: string;
  /** Category classification */
  category: BadgeCategory;
  /** Tier/rarity level */
  tier: BadgeTier;
  /** Numeric order within tier (1-5, where 1 is easiest) */
  tier_order: number;
  /** Optional URL to badge icon image */
  icon_url: string | null;
  /** JSONB criteria object defining requirements */
  criteria: BadgeCriteria;
  /** Whether badge is currently active and can be earned */
  is_active: boolean;
  /** Whether badge is automatically awarded by system (vs. manual admin award) */
  is_automatic: boolean;
  /** Points awarded when badge is earned */
  points: number;
  created_at: string;
  updated_at: string;
}

/**
 * User badge association from database
 * Represents a badge earned by a specific user
 */
export interface UserBadge {
  id: string;
  /** User who earned the badge */
  user_id: string;
  /** Badge that was earned */
  badge_id: string;
  /** Timestamp when badge was earned */
  earned_at: string;
  /** Optional session where badge was earned (null for global/milestone badges) */
  session_id: string | null;
  /** Optional metadata about earning context (JSONB) */
  metadata: Record<string, any> | null;
}

/**
 * Badge progress tracking from database
 * Tracks user's progress toward earning a specific badge
 */
export interface BadgeProgress {
  id: string;
  /** User making progress */
  user_id: string;
  /** Badge being tracked */
  badge_id: string;
  /** Current progress value */
  current_value: number;
  /** Target value needed to earn badge */
  target_value: number;
  /** Last time progress was updated */
  last_updated: string;
}

// =============================================================================
// Computed/UI Types
// =============================================================================

/**
 * Badge with progress and earned status for UI display
 * Combines badge data with user-specific progress and earning status
 */
export interface BadgeWithProgress extends Badge {
  /** Progress tracking data (undefined if not started) */
  progress?: BadgeProgress;
  /** Earned badge data (undefined if not earned) */
  earned?: UserBadge;
  /** Whether badge is locked (not yet earned) */
  isLocked: boolean;
  /** Progress percentage (0-100) */
  progressPercentage: number;
}

/**
 * User badge with full badge details for display
 * Used for showing earned badges with complete information
 */
export interface UserBadgeWithDetails extends UserBadge {
  /** Full badge information */
  badge: Badge;
}

/**
 * Badge statistics for a user
 * Summary of user's badge achievements
 */
export interface UserBadgeStats {
  /** Total badges earned */
  total_earned: number;
  /** Total points from badges */
  total_points: number;
  /** Count by tier */
  by_tier: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    legendary: number;
  };
  /** Count by category */
  by_category: {
    session: number;
    global: number;
    social: number;
    milestone: number;
    special: number;
  };
}

/**
 * Recent badge notification
 * Used for displaying recently earned badges to user
 */
export interface BadgeNotification {
  badge: Badge;
  earned_at: string;
  /** Whether user has seen this notification */
  seen: boolean;
}

// =============================================================================
// Form Data Types
// =============================================================================

/**
 * Form data for creating a new badge (admin)
 */
export interface CreateBadgeFormData {
  code: string;
  title: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  tier_order: number;
  icon_url?: string;
  criteria: BadgeCriteria;
  is_active: boolean;
  is_automatic: boolean;
  points: number;
}

/**
 * Form data for updating an existing badge (admin)
 */
export interface UpdateBadgeFormData {
  title?: string;
  description?: string;
  category?: BadgeCategory;
  tier?: BadgeTier;
  tier_order?: number;
  icon_url?: string | null;
  criteria?: BadgeCriteria;
  is_active?: boolean;
  is_automatic?: boolean;
  points?: number;
}

/**
 * Form data for manually awarding a badge (admin)
 */
export interface AwardBadgeFormData {
  user_id: string;
  badge_id: string;
  session_id?: string;
  metadata?: Record<string, any>;
}
