import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { useSupabaseSubscription } from './useSupabaseSubscription';
import {
  getSessionDetail,
  getSessionDrinks,
  type SessionDetailParticipant,
  type SessionDrinkWithUser,
} from '../api/sessionDetails';
import type { Session } from '../types/database';

interface UseSessionDetailReturn {
  session: Session | null;
  participants: SessionDetailParticipant[];
  drinks: SessionDrinkWithUser[];
  leaderboard: Array<{
    rank: number;
    user_id: string;
    display_name: string;
    avatar_url?: string;
    bac: number;
    drinkCount: number;
    peakBAC: number;
  }>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch comprehensive session details for admin deep dive
 * Includes realtime subscriptions for live updates
 *
 * @param sessionId - The session ID to fetch details for
 * @returns Session detail data with participants, drinks, and leaderboard
 */
export function useSessionDetail(sessionId: string): UseSessionDetailReturn {
  const queryClient = useQueryClient();

  // Query for session and participants
  const sessionDetailQuery = useQuery({
    queryKey: queryKeys.admin.sessionDetail(sessionId),
    queryFn: () => getSessionDetail(sessionId),
    enabled: Boolean(sessionId),
    refetchInterval: 5000, // Refetch every 5 seconds for live BAC updates
  });

  // Query for drinks with user info
  const drinksQuery = useQuery({
    queryKey: queryKeys.sessions.drinks(sessionId),
    queryFn: () => getSessionDrinks(sessionId),
    enabled: Boolean(sessionId),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Realtime subscriptions for live updates
  useSupabaseSubscription(
    `admin-session-detail:${sessionId}`,
    useCallback(
      (channel) => {
        // Listen for session updates
        channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sessions',
            filter: `id=eq.${sessionId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.sessionDetail(sessionId) });
          },
        );

        // Listen for participant changes
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${sessionId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.sessionDetail(sessionId) });
          },
        );

        // Listen for drink entries
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'drink_entries',
            filter: `session_id=eq.${sessionId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.sessionDetail(sessionId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.drinks(sessionId) });
          },
        );

        // Listen for profile updates (for participant data)
        channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.sessionDetail(sessionId) });
          },
        );
      },
      [queryClient, sessionId],
    ),
    Boolean(sessionId),
  );

  // Build leaderboard from participant data
  const leaderboard = useMemo(() => {
    if (!sessionDetailQuery.data?.participants) {
      return [];
    }

    return sessionDetailQuery.data.participants
      .map((participant) => ({
        rank: 0, // Will be set after sorting
        user_id: participant.userId,
        display_name: participant.profile.display_name,
        avatar_url: participant.profile.avatar_url,
        bac: participant.currentBAC,
        drinkCount: participant.drinkCount,
        peakBAC: participant.peakBAC,
      }))
      .sort((a, b) => b.bac - a.bac)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [sessionDetailQuery.data]);

  const refetch = useCallback(async () => {
    await Promise.all([sessionDetailQuery.refetch(), drinksQuery.refetch()]);
  }, [sessionDetailQuery, drinksQuery]);

  const errorMessage =
    sessionDetailQuery.error || drinksQuery.error;

  const error =
    errorMessage instanceof Error
      ? errorMessage.message
      : errorMessage
        ? String(errorMessage)
        : null;

  const loading = sessionDetailQuery.isPending || drinksQuery.isPending;

  return {
    session: sessionDetailQuery.data?.session || null,
    participants: sessionDetailQuery.data?.participants || [],
    drinks: drinksQuery.data || [],
    leaderboard,
    loading,
    error,
    refetch,
  };
}
