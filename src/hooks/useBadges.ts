/**
 * useBadges Hook
 *
 * Custom React hook for managing badge system state and operations.
 * Provides a simple interface for components to interact with badges, user achievements,
 * and badge progress tracking.
 *
 * Features:
 * - Automatic data loading with React Query
 * - Real-time updates via Supabase subscriptions
 * - Loading and error states
 * - Optimistic updates for mutations
 * - Badge CRUD operations (admin)
 * - Badge awarding and revocation
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getBadges,
  getPublicBadges,
  getActiveBadges,
  getBadge,
  getBadgeByCode,
  getUserBadges,
  getBadgeProgress,
  getUserBadgeProgress,
  getUserBadgeStats,
  getBadgeRecipients,
  getRecentBadges,
  getBadgesByCategory,
  getBadgesByTier,
  createBadge,
  updateBadge,
  deleteBadge,
  awardBadge,
  revokeBadge,
} from '../api/badges';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import type {
  CreateBadgeFormData,
  UpdateBadgeFormData,
  AwardBadgeFormData,
} from '../types/badges';

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Get all badges (admin view)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with all badges
 */
export function useBadges(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.badges.lists(),
    queryFn: getBadges,
    enabled,
  });
}

/**
 * Get public badges (excludes special/admin-only badges)
 * Used for main badges page where users browse earnable badges
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with public badges only
 */
export function usePublicBadges(enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.badges.lists(), 'public'],
    queryFn: getPublicBadges,
    enabled,
  });
}

/**
 * Get active badges only (user view)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with active badges
 */
export function useActiveBadges(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.badges.active(),
    queryFn: getActiveBadges,
    enabled,
  });
}

/**
 * Get a single badge by ID
 * @param badgeId - Badge ID
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with badge details
 */
export function useBadge(badgeId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.badges.detail(badgeId || ''),
    queryFn: () => {
      if (!badgeId) throw new Error('Badge ID is required');
      return getBadge(badgeId);
    },
    enabled: enabled && Boolean(badgeId),
  });
}

/**
 * Get a badge by its unique code
 * @param code - Badge code
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with badge details
 */
export function useBadgeByCode(code: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKeys.badges.all, 'code', code],
    queryFn: () => {
      if (!code) throw new Error('Badge code is required');
      return getBadgeByCode(code);
    },
    enabled: enabled && Boolean(code),
  });
}

/**
 * Get badges filtered by category
 * @param category - Badge category
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with filtered badges
 */
export function useBadgesByCategory(category: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.badges.category(category),
    queryFn: () => getBadgesByCategory(category),
    enabled,
  });
}

/**
 * Get badges filtered by tier
 * @param tier - Badge tier
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with filtered badges
 */
export function useBadgesByTier(tier: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.badges.tier(tier),
    queryFn: () => getBadgesByTier(tier),
    enabled,
  });
}

/**
 * Get user's earned badges
 * @param userId - User ID (defaults to current user)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with user's badges
 */
export function useUserBadges(userId?: string, enabled: boolean = true) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: queryKeys.badges.user(targetUserId),
    queryFn: () => {
      if (!targetUserId) throw new Error('User ID is required');
      return getUserBadges(targetUserId);
    },
    enabled: enabled && Boolean(targetUserId),
  });
}

/**
 * Get user's badge progress for all badges
 * @param userId - User ID (defaults to current user)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with badge progress
 */
export function useBadgeProgress(userId?: string, enabled: boolean = true) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: queryKeys.badges.progress(targetUserId),
    queryFn: () => {
      if (!targetUserId) throw new Error('User ID is required');
      return getBadgeProgress(targetUserId);
    },
    enabled: enabled && Boolean(targetUserId),
  });
}

/**
 * Get user's progress for a specific badge
 * @param badgeId - Badge ID
 * @param userId - User ID (defaults to current user)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with specific badge progress
 */
export function useUserBadgeProgress(
  badgeId: string | null,
  userId?: string,
  enabled: boolean = true
) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: [...queryKeys.badges.progress(targetUserId), badgeId],
    queryFn: () => {
      if (!targetUserId) throw new Error('User ID is required');
      if (!badgeId) throw new Error('Badge ID is required');
      return getUserBadgeProgress(targetUserId, badgeId);
    },
    enabled: enabled && Boolean(targetUserId) && Boolean(badgeId),
  });
}

/**
 * Get user's badge statistics
 * @param userId - User ID (defaults to current user)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with user badge stats
 */
export function useUserBadgeStats(userId?: string, enabled: boolean = true) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: queryKeys.badges.stats(targetUserId),
    queryFn: () => {
      if (!targetUserId) throw new Error('User ID is required');
      return getUserBadgeStats(targetUserId);
    },
    enabled: enabled && Boolean(targetUserId),
  });
}

/**
 * Get all users who earned a specific badge
 * @param badgeId - Badge ID
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with badge recipients
 */
export function useBadgeRecipients(badgeId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.badges.recipients(badgeId || ''),
    queryFn: () => {
      if (!badgeId) throw new Error('Badge ID is required');
      return getBadgeRecipients(badgeId);
    },
    enabled: enabled && Boolean(badgeId),
  });
}

/**
 * Get recently earned badges for a user
 * @param userId - User ID (defaults to current user)
 * @param limit - Maximum number of recent badges (default: 5)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with recent badges
 */
export function useRecentBadges(
  userId?: string,
  limit: number = 5,
  enabled: boolean = true
) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: queryKeys.badges.recent(targetUserId),
    queryFn: () => {
      if (!targetUserId) throw new Error('User ID is required');
      return getRecentBadges(targetUserId, limit);
    },
    enabled: enabled && Boolean(targetUserId),
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new badge (admin only)
 * Invalidates badge list on success
 * @returns Mutation object for creating badges
 */
export function useCreateBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBadgeFormData) => createBadge(data),
    onSuccess: () => {
      // Invalidate all badge lists
      queryClient.invalidateQueries({ queryKey: queryKeys.badges.all });
    },
  });
}

/**
 * Update an existing badge (admin only)
 * Invalidates badge detail and lists on success
 * @returns Mutation object for updating badges
 */
export function useUpdateBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ badgeId, data }: { badgeId: string; data: UpdateBadgeFormData }) =>
      updateBadge(badgeId, data),
    onSuccess: (updatedBadge) => {
      // Invalidate specific badge detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.badges.detail(updatedBadge.id),
      });
      // Invalidate all badge lists
      queryClient.invalidateQueries({ queryKey: queryKeys.badges.all });
    },
  });
}

/**
 * Delete a badge (admin only)
 * Invalidates all badge queries on success
 * @returns Mutation object for deleting badges
 */
export function useDeleteBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (badgeId: string) => deleteBadge(badgeId),
    onSuccess: () => {
      // Invalidate all badge-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.badges.all });
    },
  });
}

/**
 * Award a badge to a user
 * Invalidates user badges, stats, and progress on success
 * @returns Mutation object for awarding badges
 */
export function useAwardBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AwardBadgeFormData) => awardBadge(data),
    onSuccess: (userBadge) => {
      // Invalidate user's badges
      queryClient.invalidateQueries({
        queryKey: queryKeys.badges.user(userBadge.user_id),
      });
      // Invalidate user's stats
      queryClient.invalidateQueries({
        queryKey: queryKeys.badges.stats(userBadge.user_id),
      });
      // Invalidate user's recent badges
      queryClient.invalidateQueries({
        queryKey: queryKeys.badges.recent(userBadge.user_id),
      });
      // Invalidate badge recipients
      queryClient.invalidateQueries({
        queryKey: queryKeys.badges.recipients(userBadge.badge_id),
      });
      // Invalidate badge progress (badge is now earned)
      queryClient.invalidateQueries({
        queryKey: queryKeys.badges.progress(userBadge.user_id),
      });
    },
  });
}

/**
 * Revoke a badge from a user (admin only)
 * Invalidates relevant queries on success
 * @returns Mutation object for revoking badges
 */
export function useRevokeBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userBadgeId: string) => revokeBadge(userBadgeId),
    onSuccess: () => {
      // Invalidate all user badge queries
      // We don't know which user it was, so invalidate all
      queryClient.invalidateQueries({ queryKey: queryKeys.badges.all });
    },
  });
}

// =============================================================================
// Helper Hooks
// =============================================================================

/**
 * Check if current user has earned a specific badge
 * @param badgeId - Badge ID to check
 * @returns Boolean indicating if user has earned the badge
 */
export function useHasBadge(badgeId: string | null): boolean {
  const { user } = useAuth();
  const { data: userBadges } = useUserBadges(user?.id, Boolean(user && badgeId));

  if (!badgeId || !userBadges) return false;

  return userBadges.some((ub) => ub.badge_id === badgeId);
}

/**
 * Get count of badges earned by current user
 * @returns Number of badges earned
 */
export function useBadgeCount(): number {
  const { user } = useAuth();
  const { data: userBadges } = useUserBadges(user?.id, Boolean(user));

  return userBadges?.length || 0;
}

/**
 * Get total points from badges for current user
 * @returns Total badge points
 */
export function useBadgePoints(): number {
  const { user } = useAuth();
  const { data: stats } = useUserBadgeStats(user?.id, Boolean(user));

  return stats?.total_points || 0;
}
