// =============================================================================
// Badge Criteria Evaluation Engine
// =============================================================================
// Functions for evaluating badge criteria against user metrics
// Handles condition evaluation, criteria logic (AND/OR), and eligibility checking

import type { Badge, BadgeCriteria, BadgeCondition } from '../types/badges';
import type { Profile } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  getTotalDrinks,
  getSessionCount,
  getSessionDrinkCount,
  getMaxBACInSession,
  getUniqueFriendsInSession,
  getTotalVolume,
  getFriendCount,
  getSessionHasBeer,
  getSessionHasWine,
  getSessionFriendHasBeer,
  getSessionFriendHasWine,
  getSessionEndedAfterMidnight,
  getJulebordSessionCount,
  getIsJulebordSession,
  getCreatedJulebordSessionCount,
  getAdminAwardedFlag,
} from './badgeMetrics';

/**
 * Evaluate a single condition against a metric value
 *
 * Supported operators:
 * - '>=': Greater than or equal
 * - '==': Equal to
 * - '<=': Less than or equal
 * - '>': Greater than
 * - '<': Less than
 * - 'between': Value within range [min, max] (inclusive)
 *
 * @param condition Badge condition with metric, operator, and value
 * @param metricValue Actual metric value to evaluate
 * @returns True if condition is met, false otherwise
 */
export function evaluateCondition(
  condition: BadgeCondition,
  metricValue: number
): boolean {
  const { operator, value } = condition;

  switch (operator) {
    case '>=':
      return metricValue >= (value as number);

    case '==':
      return metricValue === (value as number);

    case '<=':
      return metricValue <= (value as number);

    case '>':
      return metricValue > (value as number);

    case '<':
      return metricValue < (value as number);

    case 'between':
      // Value should be a tuple [min, max]
      if (!Array.isArray(value) || value.length !== 2) {
        console.error('[evaluateCondition] Invalid "between" value:', value);
        return false;
      }
      const [min, max] = value as [number, number];
      return metricValue >= min && metricValue <= max;

    default:
      console.error('[evaluateCondition] Unknown operator:', operator);
      return false;
  }
}

/**
 * Evaluate full criteria (all conditions + requireAll logic)
 *
 * Logic:
 * - If requireAll is true (default): ALL conditions must be met (AND logic)
 * - If requireAll is false: ANY condition must be met (OR logic)
 *
 * Progress calculation:
 * - For AND logic: percentage of conditions that are met
 * - For OR logic: maximum progress among all conditions
 *
 * @param criteria Badge criteria with type, conditions, and requireAll flag
 * @param metrics Record of metric values keyed by metric name
 * @returns Object with eligibility status and optional progress percentage
 */
export function evaluateCriteria(
  criteria: BadgeCriteria,
  metrics: Record<string, number>
): { eligible: boolean; progress?: number } {
  const { conditions, requireAll = true } = criteria;

  if (!conditions || conditions.length === 0) {
    console.warn('[evaluateCriteria] No conditions provided in criteria');
    return { eligible: false, progress: 0 };
  }

  // Evaluate each condition
  const results = conditions.map((condition) => {
    const metricValue = metrics[condition.metric] ?? 0;
    const isMet = evaluateCondition(condition, metricValue);

    // Calculate individual condition progress (0-100)
    let conditionProgress = 0;
    if (isMet) {
      conditionProgress = 100;
    } else {
      // Estimate progress toward this condition
      const targetValue = Array.isArray(condition.value)
        ? condition.value[0] // For 'between', use min value
        : (condition.value as number);

      if (targetValue > 0) {
        conditionProgress = Math.min(100, (metricValue / targetValue) * 100);
      }
    }

    return { isMet, progress: conditionProgress };
  });

  // Apply AND/OR logic
  if (requireAll) {
    // AND logic: ALL conditions must be met
    const eligible = results.every((r) => r.isMet);
    const progress = results.reduce((sum, r) => sum + r.progress, 0) / results.length;

    return { eligible, progress: Math.round(progress) };
  } else {
    // OR logic: ANY condition must be met
    const eligible = results.some((r) => r.isMet);
    const progress = Math.max(...results.map((r) => r.progress));

    return { eligible, progress: Math.round(progress) };
  }
}

/**
 * Main eligibility checker for badges
 *
 * Process:
 * 1. Parse badge criteria to identify required metrics
 * 2. Call appropriate metric extractors from badgeMetrics.ts
 * 3. Evaluate each condition using evaluateCondition
 * 4. Combine with AND/OR logic based on requireAll
 * 5. Return eligibility + metrics for metadata
 *
 * @param supabase Supabase client instance
 * @param badge Badge to check eligibility for
 * @param userId User ID to check
 * @param profile User profile for BAC calculations
 * @param sessionId Optional session ID for session-scoped metrics
 * @returns Object with eligibility status, extracted metrics, and optional metadata
 */
export async function checkBadgeEligibility(
  supabase: SupabaseClient,
  badge: Badge,
  userId: string,
  profile: Profile,
  sessionId?: string
): Promise<{
  eligible: boolean;
  metrics: Record<string, number>;
  metadata?: Record<string, unknown>;
}> {
  try {
    const { criteria } = badge;

    if (!criteria || !criteria.conditions || criteria.conditions.length === 0) {
      console.warn('[checkBadgeEligibility] Badge has no criteria:', badge.code);
      return { eligible: false, metrics: {} };
    }

    // Extract unique metrics from all conditions
    const requiredMetrics = new Set<string>();
    criteria.conditions.forEach((condition) => {
      requiredMetrics.add(condition.metric);

      // Check if metric requires session context
      if (
        (condition.timeframe === 'session' ||
          condition.metric.includes('session')) &&
        !sessionId
      ) {
        console.warn(
          `[checkBadgeEligibility] Metric "${condition.metric}" requires sessionId but none provided`
        );
      }
    });

    // Fetch metric values
    const metrics: Record<string, number> = {};

    for (const metric of requiredMetrics) {
      let value = 0;

      // Route to appropriate metric extractor based on metric name
      switch (metric) {
        case 'total_drinks':
          value = await getTotalDrinks(supabase, userId);
          break;

        case 'session_count':
          value = await getSessionCount(supabase, userId);
          break;

        case 'session_drink_count':
          if (sessionId) {
            value = await getSessionDrinkCount(supabase, sessionId, userId);
          } else {
            console.warn('[checkBadgeEligibility] session_drink_count requires sessionId');
          }
          break;

        case 'max_bac_in_session':
          if (sessionId) {
            value = await getMaxBACInSession(supabase, sessionId, userId, profile);
          } else {
            console.warn('[checkBadgeEligibility] max_bac_in_session requires sessionId');
          }
          break;

        case 'unique_friends_in_session':
          if (sessionId) {
            value = await getUniqueFriendsInSession(supabase, sessionId, userId);
          } else {
            console.warn('[checkBadgeEligibility] unique_friends_in_session requires sessionId');
          }
          break;

        case 'total_volume':
          value = await getTotalVolume(supabase, userId);
          break;

        case 'friend_count':
          value = await getFriendCount(supabase, userId);
          break;

        case 'session_has_beer':
          if (sessionId) {
            value = await getSessionHasBeer(supabase, sessionId, userId);
          } else {
            console.warn('[checkBadgeEligibility] session_has_beer requires sessionId');
          }
          break;

        case 'session_has_wine':
          if (sessionId) {
            value = await getSessionHasWine(supabase, sessionId, userId);
          } else {
            console.warn('[checkBadgeEligibility] session_has_wine requires sessionId');
          }
          break;

        case 'session_friend_has_beer':
          if (sessionId) {
            value = await getSessionFriendHasBeer(supabase, sessionId, userId);
          } else {
            console.warn('[checkBadgeEligibility] session_friend_has_beer requires sessionId');
          }
          break;

        case 'session_friend_has_wine':
          if (sessionId) {
            value = await getSessionFriendHasWine(supabase, sessionId, userId);
          } else {
            console.warn('[checkBadgeEligibility] session_friend_has_wine requires sessionId');
          }
          break;

        case 'session_ended_after_midnight':
          if (sessionId) {
            value = await getSessionEndedAfterMidnight(supabase, sessionId);
          } else {
            console.warn('[checkBadgeEligibility] session_ended_after_midnight requires sessionId');
          }
          break;

        case 'julebord_session_count':
          value = await getJulebordSessionCount(supabase, userId);
          break;

        case 'is_julebord_session':
          if (sessionId) {
            value = await getIsJulebordSession(supabase, sessionId);
          } else {
            console.warn('[checkBadgeEligibility] is_julebord_session requires sessionId');
          }
          break;

        case 'created_julebord_session':
          value = await getCreatedJulebordSessionCount(supabase, userId);
          break;

        case 'admin_awarded':
          value = getAdminAwardedFlag();
          break;

        default:
          console.warn('[checkBadgeEligibility] Unknown metric:', metric);
          break;
      }

      metrics[metric] = value;

      // Debug logging for important metrics
      if (metric === 'max_bac_in_session') {
        console.debug(`[checkBadgeEligibility] ${badge.code}: max_bac_in_session = ${value.toFixed(4)}`);
      }
    }

    // Evaluate criteria with extracted metrics
    const { eligible, progress } = evaluateCriteria(criteria, metrics);

    // Debug log eligibility result
    console.debug(`[checkBadgeEligibility] ${badge.code}: eligible=${eligible}, metrics=`, metrics);

    // Build metadata
    const metadata: Record<string, unknown> = {
      progress,
      metrics,
      evaluated_at: new Date().toISOString(),
    };

    if (sessionId) {
      metadata.session_id = sessionId;
    }

    return { eligible, metrics, metadata };
  } catch (error) {
    console.error('[checkBadgeEligibility] Unexpected error:', error);
    return { eligible: false, metrics: {} };
  }
}

/**
 * Check multiple badges for eligibility in batch
 *
 * Useful for checking all active automatic badges at once (e.g., after a drink is logged)
 *
 * @param supabase Supabase client instance
 * @param badges Array of badges to check
 * @param userId User ID to check
 * @param profile User profile for BAC calculations
 * @param sessionId Optional session ID for session-scoped metrics
 * @returns Array of results with badge and eligibility info
 */
export async function checkMultipleBadges(
  supabase: SupabaseClient,
  badges: Badge[],
  userId: string,
  profile: Profile,
  sessionId?: string
): Promise<
  Array<{
    badge: Badge;
    eligible: boolean;
    metrics: Record<string, number>;
    metadata?: Record<string, unknown>;
  }>
> {
  const results = await Promise.all(
    badges.map(async (badge) => {
      const eligibility = await checkBadgeEligibility(
        supabase,
        badge,
        userId,
        profile,
        sessionId
      );

      return {
        badge,
        ...eligibility,
      };
    })
  );

  return results;
}

/**
 * Filter badges to only those that are eligible
 *
 * Convenience function for getting only earned badges from a batch check
 *
 * @param results Results from checkMultipleBadges
 * @returns Array of results where eligible is true
 */
export function filterEligibleBadges(
  results: Array<{
    badge: Badge;
    eligible: boolean;
    metrics: Record<string, number>;
    metadata?: Record<string, unknown>;
  }>
): Array<{
  badge: Badge;
  eligible: boolean;
  metrics: Record<string, number>;
  metadata?: Record<string, unknown>;
}> {
  return results.filter((result) => result.eligible);
}
