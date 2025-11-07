import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Session, DrinkEntry } from '../types/database';
import type { AnalyticsData } from '../types/analytics';
import { queryKeys } from '../lib/queryKeys';
import {
  filterSessionsByPeriod,
  calculateSessionAnalytics,
  calculatePeriodStats,
  calculateBACTrend,
  calculateWeeklyConsumption,
  calculateMonthlyConsumption,
} from '../utils/analyticsCalculator';

/**
 * Hook to fetch and compute user analytics data
 *
 * Fetches all user sessions and drink entries, then computes analytics
 * using the analyticsCalculator utility functions.
 *
 * @param period Time period to filter ('7days' | '30days' | '90days' | 'all')
 * @returns Analytics data, loading state, and error
 */
export function useAnalytics(period: AnalyticsData['period'] = '30days') {
  const { user, profile } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.analytics.period(user?.id ?? null, period),
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user || !profile) {
        throw new Error('Brukerdata mangler');
      }

      const { data: participantData, error: participantError } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        return {
          period,
          stats: {
            totalDrinks: 0,
            totalSessions: 0,
            totalAlcoholGrams: 0,
            totalAlcoholBeers: 0,
            totalCalories: 0,
            totalSpent: 0,
            averageBAC: 0,
            peakBAC: 0,
            averageDrinksPerSession: 0,
          },
          sessions: [],
          bacTrend: [],
          weeklyConsumption: [],
          monthlyConsumption: [],
        };
      }

      const sessionIds = participantData.map((p) => p.session_id);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .in('id', sessionIds)
        .lt('end_time', new Date().toISOString())
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;
      const allSessions = (sessionsData || []) as Session[];

      const { data: drinksData, error: drinksError } = await supabase
        .from('drink_entries')
        .select('*')
        .in('session_id', sessionIds)
        .eq('user_id', user.id)
        .order('consumed_at', { ascending: true });

      if (drinksError) throw drinksError;
      const allDrinks = (drinksData || []) as DrinkEntry[];

      const filteredSessions = filterSessionsByPeriod(allSessions, period);

      const sessionAnalytics = filteredSessions.map((session) => {
        const sessionDrinks = allDrinks.filter((d) => d.session_id === session.id);
        return calculateSessionAnalytics(session, sessionDrinks, profile, 0);
      });

      const stats = calculatePeriodStats(sessionAnalytics);
      const bacTrend = calculateBACTrend(sessionAnalytics);
      const weeklyConsumption = calculateWeeklyConsumption(sessionAnalytics);
      const monthlyConsumption = calculateMonthlyConsumption(sessionAnalytics);

      return {
        period,
        stats,
        sessions: sessionAnalytics,
        bacTrend,
        weeklyConsumption,
        monthlyConsumption,
      };
    },
    enabled: Boolean(user && profile),
    staleTime: 1000 * 60 * 5,
  });

  const error = useMemo(() => {
    if (query.error instanceof Error) {
      return query.error.message;
    }
    return null;
  }, [query.error]);

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error,
  };
}
