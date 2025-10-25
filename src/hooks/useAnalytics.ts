import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Session, DrinkEntry } from '../types/database';
import type { AnalyticsData } from '../types/analytics';
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
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !profile) {
      setLoading(false);
      setData(null);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Get all session IDs where user was a participant
        const { data: participantData, error: participantError } = await supabase
          .from('session_participants')
          .select('session_id')
          .eq('user_id', user.id);

        if (participantError) throw participantError;

        if (!participantData || participantData.length === 0) {
          // No sessions - return empty analytics
          setData({
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
          });
          setLoading(false);
          return;
        }

        const sessionIds = participantData.map((p) => p.session_id);

        // Step 2: Fetch all sessions where user participated (completed sessions only)
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .in('id', sessionIds)
          .lt('end_time', new Date().toISOString()) // Only completed sessions
          .order('start_time', { ascending: false });

        if (sessionsError) throw sessionsError;

        const allSessions = (sessionsData || []) as Session[];

        // Step 3: Fetch all drink entries for these sessions (only user's drinks)
        const { data: drinksData, error: drinksError } = await supabase
          .from('drink_entries')
          .select('*')
          .in('session_id', sessionIds)
          .eq('user_id', user.id)
          .order('consumed_at', { ascending: true });

        if (drinksError) throw drinksError;

        const allDrinks = (drinksData || []) as DrinkEntry[];

        // Step 4: Filter sessions by period
        const filteredSessions = filterSessionsByPeriod(allSessions, period);

        // Step 5: Calculate analytics for each session
        // Note: We're not fetching drink prices yet, so totalSpent will be 0
        const sessionAnalytics = filteredSessions.map((session) => {
          const sessionDrinks = allDrinks.filter((d) => d.session_id === session.id);
          return calculateSessionAnalytics(session, sessionDrinks, profile, 0);
        });

        // Step 6: Calculate aggregated statistics
        const stats = calculatePeriodStats(sessionAnalytics);

        // Step 7: Calculate BAC trend
        const bacTrend = calculateBACTrend(sessionAnalytics);

        // Step 8: Calculate weekly consumption
        const weeklyConsumption = calculateWeeklyConsumption(sessionAnalytics);

        // Step 9: Calculate monthly consumption
        const monthlyConsumption = calculateMonthlyConsumption(sessionAnalytics);

        // Set analytics data
        setData({
          period,
          stats,
          sessions: sessionAnalytics,
          bacTrend,
          weeklyConsumption,
          monthlyConsumption,
        });

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'En feil oppstod ved henting av analysedata');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, profile, period]);

  return { data, loading, error };
}
