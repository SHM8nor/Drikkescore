/**
 * Theme Analytics Hooks
 *
 * React Query hooks for fetching theme usage statistics and analytics.
 * Used by admin theme management panel.
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import {
  getThemeStatistics,
  getThemeBadgeStatistics,
  getThemeUsageTimeline,
  getThemePeakHours,
  getThemeAnalytics,
  getMostPopularTheme,
  compareThemes,
  getSessionCountByTheme,
  getActiveSessionsByTheme,
  type ThemeStatistics,
  type ThemeBadgeStatistics,
  type ThemeUsageTimeline,
  type ThemePeakHours,
  type ThemeAnalytics,
  type MostPopularTheme,
  type ThemeComparison,
} from '../api/themeAnalytics';
import type { SessionType } from '../types/database';

// =============================================================================
// Hook Options
// =============================================================================

export interface UseThemeAnalyticsOptions {
  /**
   * Timeline period in days
   * Default: 30
   */
  timelineDays?: number;

  /**
   * Filter analytics by specific theme
   * Default: undefined (all themes)
   */
  sessionType?: SessionType;
}

// =============================================================================
// Individual Query Hooks
// =============================================================================

/**
 * Fetch theme statistics from database view
 * Shows aggregated stats for each theme type
 */
export function useThemeStatistics() {
  return useQuery<ThemeStatistics[], Error>({
    queryKey: [...queryKeys.admin.themes, 'statistics'],
    queryFn: getThemeStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch badge statistics grouped by theme
 * Shows which badges are awarded in which themed sessions
 */
export function useThemeBadgeStatistics() {
  return useQuery<ThemeBadgeStatistics[], Error>({
    queryKey: [...queryKeys.admin.themes, 'badges'],
    queryFn: getThemeBadgeStatistics,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch theme usage timeline (daily aggregation)
 * Shows how theme usage changes over time
 *
 * @param days Number of days to look back (default: 30)
 */
export function useThemeUsageTimeline(days: number = 30) {
  return useQuery<ThemeUsageTimeline[], Error>({
    queryKey: [...queryKeys.admin.themes, 'timeline', days],
    queryFn: () => getThemeUsageTimeline(days),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch peak usage hours for each theme
 * Shows when themes are most popular (hour of day, day of week)
 */
export function useThemePeakHours() {
  return useQuery<ThemePeakHours[], Error>({
    queryKey: [...queryKeys.admin.themes, 'peakHours'],
    queryFn: getThemePeakHours,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get comprehensive theme analytics via database function
 * Includes all key metrics in one query
 *
 * @param sessionType Optional filter for specific theme
 */
export function useThemeAnalytics(sessionType?: SessionType) {
  return useQuery<ThemeAnalytics[], Error>({
    queryKey: [...queryKeys.admin.themes, 'analytics', sessionType || 'all'],
    queryFn: () => getThemeAnalytics(sessionType),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get the most popular theme based on usage metrics
 * Returns the single most popular theme
 */
export function useMostPopularTheme() {
  return useQuery<MostPopularTheme | null, Error>({
    queryKey: [...queryKeys.admin.themes, 'mostPopular'],
    queryFn: getMostPopularTheme,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Compare two themes side-by-side
 * Shows metrics for both themes and differences
 *
 * @param themeA First theme to compare
 * @param themeB Second theme to compare
 */
export function useThemeComparison(themeA: SessionType, themeB: SessionType) {
  return useQuery<ThemeComparison[], Error>({
    queryKey: [...queryKeys.admin.themes, 'comparison', themeA, themeB],
    queryFn: () => compareThemes(themeA, themeB),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: themeA !== themeB, // Only fetch if themes are different
  });
}

/**
 * Get session count by theme type
 * Lightweight query for quick overview
 */
export function useSessionCountByTheme() {
  return useQuery<Record<SessionType, number>, Error>({
    queryKey: [...queryKeys.admin.themes, 'sessionCount'],
    queryFn: getSessionCountByTheme,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Get active sessions grouped by theme
 * Shows real-time theme distribution
 */
export function useActiveSessionsByTheme() {
  return useQuery<Record<SessionType, number>, Error>({
    queryKey: [...queryKeys.admin.themes, 'activeSessions'],
    queryFn: getActiveSessionsByTheme,
    staleTime: 30 * 1000, // 30 seconds - more frequent for real-time data
    gcTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });
}

// =============================================================================
// Composite Hook
// =============================================================================

/**
 * Fetch all theme analytics data in one hook
 * Use this for the theme management dashboard
 *
 * @param options Hook options
 */
export function useAllThemeAnalytics(options: UseThemeAnalyticsOptions = {}) {
  const { timelineDays = 30, sessionType } = options;

  const statistics = useThemeStatistics();
  const badgeStats = useThemeBadgeStatistics();
  const timeline = useThemeUsageTimeline(timelineDays);
  const peakHours = useThemePeakHours();
  const analytics = useThemeAnalytics(sessionType);
  const mostPopular = useMostPopularTheme();
  const sessionCount = useSessionCountByTheme();
  const activeSessions = useActiveSessionsByTheme();

  return {
    statistics: statistics.data,
    badgeStats: badgeStats.data,
    timeline: timeline.data,
    peakHours: peakHours.data,
    analytics: analytics.data,
    mostPopular: mostPopular.data,
    sessionCount: sessionCount.data,
    activeSessions: activeSessions.data,
    isLoading:
      statistics.isLoading ||
      badgeStats.isLoading ||
      timeline.isLoading ||
      peakHours.isLoading ||
      analytics.isLoading ||
      mostPopular.isLoading ||
      sessionCount.isLoading ||
      activeSessions.isLoading,
    error:
      statistics.error ||
      badgeStats.error ||
      timeline.error ||
      peakHours.error ||
      analytics.error ||
      mostPopular.error ||
      sessionCount.error ||
      activeSessions.error,
    refetch: () => {
      statistics.refetch();
      badgeStats.refetch();
      timeline.refetch();
      peakHours.refetch();
      analytics.refetch();
      mostPopular.refetch();
      sessionCount.refetch();
      activeSessions.refetch();
    },
  };
}
