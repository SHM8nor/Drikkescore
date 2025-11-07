import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { calculateSessionAnalytics } from '../utils/analyticsCalculator';
import type { Session, DrinkEntry } from '../types/database';
import type { SessionAnalytics } from '../types/analytics';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to manage session recap display logic
 *
 * Checks if a session recap should be shown to the user based on:
 * 1. User has session_recaps_enabled in profile
 * 2. Most recent completed session where end_time is >3 hours ago
 * 3. Session hasn't been viewed yet (session.id !== profile.last_session_recap_viewed)
 *
 * @returns Object containing:
 *   - shouldShow: boolean indicating if recap should be displayed
 *   - session: Session data or null
 *   - analytics: Full analytics for the session or null
 *   - markAsViewed: Function to mark the recap as viewed
 *   - loading: Loading state
 *   - error: Error message if any
 */
export function useSessionRecap() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const recapQuery = useQuery<{ session: Session | null; analytics: SessionAnalytics | null }>({
    queryKey: queryKeys.sessions.recap(user?.id ?? null),
    enabled: Boolean(user && profile?.session_recaps_enabled),
    queryFn: async () => {
      if (!user || !profile) {
        return { session: null, analytics: null };
      }

      if (!profile.session_recaps_enabled) {
        return { session: null, analytics: null };
      }

      const threeHoursAgo = new Date();
      threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
      const threeHoursAgoIso = threeHoursAgo.toISOString();

      const { data: participantData, error: participantError } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        return { session: null, analytics: null };
      }

      const sessionIds = participantData.map((p) => p.session_id);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .in('id', sessionIds)
        .lt('end_time', new Date().toISOString())
        .lt('end_time', threeHoursAgoIso)
        .order('end_time', { ascending: false })
        .limit(1);

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        return { session: null, analytics: null };
      }

      const mostRecentSession = sessionsData[0] as Session;

      if (profile.last_session_recap_viewed === mostRecentSession.id) {
        return { session: null, analytics: null };
      }

      const { data: drinksData, error: drinksError } = await supabase
        .from('drink_entries')
        .select('*')
        .eq('session_id', mostRecentSession.id)
        .eq('user_id', user.id)
        .order('consumed_at', { ascending: true });

      if (drinksError) throw drinksError;

      const sessionDrinks = (drinksData || []) as DrinkEntry[];
      const estimatedTotalSpent = sessionDrinks.length * 80;

      const sessionAnalytics = calculateSessionAnalytics(
        mostRecentSession,
        sessionDrinks,
        profile,
        estimatedTotalSpent,
      );

      return {
        session: mostRecentSession,
        analytics: sessionAnalytics,
      };
    },
  });

  const markAsViewedMutation = useMutation({
    mutationFn: async (viewedDetails: boolean) => {
      if (!user || !recapQuery.data?.session) {
        throw new Error('Kan ikke oppdatere oppsummering nå');
      }

      const updateData: {
        last_session_recap_viewed: string;
        last_recap_dismissed_at?: string;
      } = {
        last_session_recap_viewed: recapQuery.data.session.id,
      };

      if (!viewedDetails) {
        updateData.last_recap_dismissed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      if (user) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile(user.id) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.sessions.recap(user.id) }),
        ]);
      }
    },
  });

  const shouldShow = useMemo(() => {
    return Boolean(recapQuery.data?.session && recapQuery.data.analytics);
  }, [recapQuery.data]);

  const error = useMemo(() => {
    if (recapQuery.error instanceof Error) {
      return recapQuery.error.message;
    }
    if (markAsViewedMutation.error instanceof Error) {
      return markAsViewedMutation.error.message;
    }
    return null;
  }, [recapQuery.error, markAsViewedMutation.error]);

  return {
    shouldShow,
    session: recapQuery.data?.session ?? null,
    analytics: recapQuery.data?.analytics ?? null,
    markAsViewed: markAsViewedMutation.mutateAsync,
    loading: recapQuery.isPending || markAsViewedMutation.isPending,
    error,
  };
}
