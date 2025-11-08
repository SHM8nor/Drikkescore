import type { UserBadgeWithDetails, UserBadgeGrouped } from '../types/badges';

/**
 * Group user badges by badge_id and count occurrences
 *
 * This is used for badges that can be earned multiple times (e.g., session badges).
 * Instead of showing the same badge 5 times, we show it once with a count of "x5".
 *
 * @param userBadges - Array of user badges with full badge details
 * @returns Array of grouped badges with counts
 *
 * @example
 * const badges = await getUserBadges(userId);
 * const grouped = groupBadgesByCount(badges);
 * // grouped[0].badge = "FIVE_BEER"
 * // grouped[0].count = 3
 * // grouped[0].instances.length = 3
 */
export function groupBadgesByCount(
  userBadges: UserBadgeWithDetails[]
): UserBadgeGrouped[] {
  // Create a map to group badges by badge_id
  const badgeMap = new Map<string, UserBadgeGrouped>();

  for (const userBadge of userBadges) {
    const badgeId = userBadge.badge_id;

    if (badgeMap.has(badgeId)) {
      // Badge already exists, increment count and update dates
      const existing = badgeMap.get(badgeId)!;
      existing.count++;
      existing.instances.push(userBadge);

      // Update first_earned if this instance is earlier
      if (new Date(userBadge.earned_at) < new Date(existing.first_earned)) {
        existing.first_earned = userBadge.earned_at;
      }

      // Update last_earned if this instance is more recent
      if (new Date(userBadge.earned_at) > new Date(existing.last_earned)) {
        existing.last_earned = userBadge.earned_at;
      }
    } else {
      // First time seeing this badge, create new entry
      badgeMap.set(badgeId, {
        badge: userBadge.badge,
        count: 1,
        first_earned: userBadge.earned_at,
        last_earned: userBadge.earned_at,
        instances: [userBadge],
      });
    }
  }

  // Convert map to array and sort by most recent earned date
  return Array.from(badgeMap.values()).sort(
    (a, b) => new Date(b.last_earned).getTime() - new Date(a.last_earned).getTime()
  );
}

/**
 * Get total unique badges count (not counting duplicates)
 *
 * @param userBadges - Array of user badges
 * @returns Number of unique badges
 */
export function getUniqueBadgeCount(userBadges: UserBadgeWithDetails[]): number {
  const uniqueBadgeIds = new Set(userBadges.map((b) => b.badge_id));
  return uniqueBadgeIds.size;
}

/**
 * Get total instances count (counting all duplicates)
 *
 * @param userBadges - Array of user badges
 * @returns Total number of badge instances
 */
export function getTotalBadgeInstancesCount(userBadges: UserBadgeWithDetails[]): number {
  return userBadges.length;
}
