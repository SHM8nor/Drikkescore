/**
 * System Analytics Hook
 *
 * React Query hook for fetching and managing system-wide analytics data.
 * Intended for admin use only.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { queryKeys } from '../lib/queryKeys';
import {
  getSystemStats,
  getGrowthData,
  getActivityHeatmap,
  getTopUsers,
  getAllDrinksAndProfiles,
  type SystemStats,
  type GrowthData,
  type ActivityHeatmap,
  type TopUser,
} from '../api/systemAnalytics';
import {
  calculateSystemBAC,
  calculateTopUsersPeakBAC,
} from '../utils/systemAnalyticsCalculator';
import { supabase } from '../lib/supabase';

// =============================================================================
// Hook Options
// =============================================================================

export interface UseSystemAnalyticsOptions {
  /**
   * Enable realtime updates (invalidate queries on table changes)
   * Default: false (analytics don't need instant updates)
   */
  realtime?: boolean;

  /**
   * Growth data period in days
   * Default: 30
   */
  growthPeriod?: number;

  /**
   * Number of top users to fetch
   * Default: 10
   */
  topUsersLimit?: number;
}

// =============================================================================
// Return Type
// =============================================================================

export interface SystemAnalyticsData {
  stats: SystemStats | undefined;
  growthData: GrowthData[] | undefined;
  activityHeatmap: ActivityHeatmap[] | undefined;
  topUsers: TopUser[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Fetch system-wide analytics data
 *
 * @param options Hook options
 * @returns System analytics data and loading state
 */
export function useSystemAnalytics(
  options: UseSystemAnalyticsOptions = {}
): SystemAnalyticsData {
  const {
    realtime = false,
    growthPeriod = 30,
    topUsersLimit = 10,
  } = options;

  const queryClient = useQueryClient();

  // Fetch system stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: [...queryKeys.admin.analytics, 'stats'],
    queryFn: async () => {
      const stats = await getSystemStats();

      // Fetch drinks and profiles to calculate average BAC
      const { drinks, profiles } = await getAllDrinksAndProfiles();
      const avgBACAllTime = calculateSystemBAC(drinks, profiles);

      return {
        ...stats,
        avgBACAllTime,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch growth data
  const {
    data: growthData,
    isLoading: growthLoading,
    error: growthError,
    refetch: refetchGrowth,
  } = useQuery({
    queryKey: [...queryKeys.admin.analytics, 'growth', growthPeriod],
    queryFn: () => getGrowthData(growthPeriod),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch activity heatmap
  const {
    data: activityHeatmap,
    isLoading: heatmapLoading,
    error: heatmapError,
    refetch: refetchHeatmap,
  } = useQuery({
    queryKey: [...queryKeys.admin.analytics, 'heatmap'],
    queryFn: getActivityHeatmap,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch top users
  const {
    data: topUsers,
    isLoading: topUsersLoading,
    error: topUsersError,
    refetch: refetchTopUsers,
  } = useQuery({
    queryKey: [...queryKeys.admin.analytics, 'topUsers', topUsersLimit],
    queryFn: async () => {
      const topUsers = await getTopUsers(topUsersLimit);

      // Calculate peak BAC for top users
      const { drinks, profiles } = await getAllDrinksAndProfiles();
      return calculateTopUsersPeakBAC(drinks, profiles, topUsers);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Realtime subscriptions (optional)
  useEffect(() => {
    if (!realtime) return;

    const channel = supabase
      .channel('system-analytics-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drink_entries' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.admin.analytics });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtime, queryClient]);

  // Combined refetch function
  const refetch = useCallback(() => {
    refetchStats();
    refetchGrowth();
    refetchHeatmap();
    refetchTopUsers();
  }, [refetchStats, refetchGrowth, refetchHeatmap, refetchTopUsers]);

  // Aggregate loading and error states
  const loading =
    statsLoading || growthLoading || heatmapLoading || topUsersLoading;
  const error = statsError || growthError || heatmapError || topUsersError;

  return {
    stats,
    growthData,
    activityHeatmap,
    topUsers,
    loading,
    error: error ? (error as Error) : null,
    refetch,
  };
}

// =============================================================================
// Individual Query Hooks (for more granular control)
// =============================================================================

/**
 * Fetch only system stats
 */
export function useSystemStats() {
  return useQuery({
    queryKey: [...queryKeys.admin.analytics, 'stats'],
    queryFn: async () => {
      const stats = await getSystemStats();
      const { drinks, profiles } = await getAllDrinksAndProfiles();
      const avgBACAllTime = calculateSystemBAC(drinks, profiles);
      return { ...stats, avgBACAllTime };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch only growth data
 */
export function useGrowthData(period: number = 30) {
  return useQuery({
    queryKey: [...queryKeys.admin.analytics, 'growth', period],
    queryFn: () => getGrowthData(period),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch only activity heatmap
 */
export function useActivityHeatmap() {
  return useQuery({
    queryKey: [...queryKeys.admin.analytics, 'heatmap'],
    queryFn: getActivityHeatmap,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch only top users
 */
export function useTopUsers(limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.admin.analytics, 'topUsers', limit],
    queryFn: async () => {
      const topUsers = await getTopUsers(limit);
      const { drinks, profiles } = await getAllDrinksAndProfiles();
      return calculateTopUsersPeakBAC(drinks, profiles, topUsers);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
