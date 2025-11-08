/**
 * useSupabaseBadgeSubscription Hook
 *
 * Custom React hook for managing real-time Supabase subscriptions for badges.
 * Automatically invalidates React Query cache when badge-related data changes,
 * ensuring the UI stays in sync with the database.
 *
 * Features:
 * - Subscribe to user badge awards (new achievements)
 * - Subscribe to badge progress updates
 * - Automatic query invalidation on changes
 * - Proper cleanup on unmount
 *
 * Usage:
 * ```tsx
 * useSupabaseBadgeSubscription(userId, enabled);
 * ```
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSubscription } from './useSupabaseSubscription';
import { queryKeys } from '../lib/queryKeys';

/**
 * Subscribe to badge-related changes for a specific user
 *
 * This hook sets up real-time subscriptions to:
 * 1. user_badges table - when badges are awarded or revoked
 * 2. badge_progress table - when progress is updated
 *
 * When changes occur, relevant React Query caches are invalidated,
 * triggering automatic refetches and UI updates.
 *
 * @param userId - User ID to subscribe to badge changes for
 * @param enabled - Whether the subscription is active (default: true)
 */
export function useSupabaseBadgeSubscription(
  userId: string | null | undefined,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();

  // Subscribe to user badge changes (awards/revocations)
  useSupabaseSubscription(
    `user_badges:${userId ?? 'unknown'}`,
    useCallback(
      (channel) => {
        if (!userId) return;

        // Listen for INSERT events (badge awarded)
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_badges',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Invalidate user's badges
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.user(userId),
            });
            // Invalidate user's badge stats
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.stats(userId),
            });
            // Invalidate user's recent badges
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.recent(userId),
            });
            // Invalidate badge progress (now that badge is earned)
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.progress(userId),
            });
          }
        );

        // Listen for DELETE events (badge revoked)
        channel.on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'user_badges',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Invalidate same queries as INSERT
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.user(userId),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.stats(userId),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.recent(userId),
            });
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.progress(userId),
            });
          }
        );
      },
      [queryClient, userId]
    ),
    enabled && Boolean(userId)
  );

  // Subscribe to badge progress changes
  useSupabaseSubscription(
    `badge_progress:${userId ?? 'unknown'}`,
    useCallback(
      (channel) => {
        if (!userId) return;

        // Listen for all progress changes (INSERT, UPDATE, DELETE)
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'badge_progress',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // Invalidate badge progress queries
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.progress(userId),
            });
          }
        );
      },
      [queryClient, userId]
    ),
    enabled && Boolean(userId)
  );
}

/**
 * Subscribe to all badge changes (admin view)
 *
 * This hook subscribes to changes in the badges table itself,
 * useful for admin interfaces that need to show all badges
 * and their configurations in real-time.
 *
 * @param enabled - Whether the subscription is active (default: true)
 */
export function useSupabaseBadgeAdminSubscription(enabled: boolean = true) {
  const queryClient = useQueryClient();

  useSupabaseSubscription(
    'badges:admin',
    useCallback(
      (channel) => {
        // Listen for all badge table changes (CREATE, UPDATE, DELETE)
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'badges',
          },
          () => {
            // Invalidate all badge-related queries
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.all,
            });
          }
        );
      },
      [queryClient]
    ),
    enabled
  );
}

/**
 * Subscribe to badge recipient changes for a specific badge
 *
 * Useful for badge detail pages showing who has earned a badge.
 *
 * @param badgeId - Badge ID to monitor
 * @param enabled - Whether the subscription is active (default: true)
 */
export function useSupabaseBadgeRecipientsSubscription(
  badgeId: string | null,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();

  useSupabaseSubscription(
    `badge_recipients:${badgeId ?? 'unknown'}`,
    useCallback(
      (channel) => {
        if (!badgeId) return;

        // Listen for badge awards/revocations for this specific badge
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_badges',
            filter: `badge_id=eq.${badgeId}`,
          },
          () => {
            // Invalidate badge recipients query
            queryClient.invalidateQueries({
              queryKey: queryKeys.badges.recipients(badgeId),
            });
          }
        );
      },
      [queryClient, badgeId]
    ),
    enabled && Boolean(badgeId)
  );
}
