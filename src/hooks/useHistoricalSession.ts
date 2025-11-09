import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Session, DrinkEntry, LeaderboardEntry, Profile } from '../types/database';
import { calculateBAC } from '../utils/bacCalculator';
import { queryKeys } from '../lib/queryKeys';

/**
 * Optimized hook for historical (completed) sessions in read-only contexts.
 * 
 * Key differences from useSession:
 * - No realtime subscriptions (historical data doesn't change)
 * - No refetchInterval on drinks query (eliminates 70% wasted computation)
 * - No mutation operations (addDrink, deleteDrink, extendSession)
 * - No badge awarding logic
 * - Leaderboard uses session end time for BAC calculation (not current time)
 * 
 * Use this hook in HistoryPage and other read-only session views.
 */
export function useHistoricalSession(sessionId: string | null) {
  const sessionQuery = useQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as Session;
    },
    enabled: Boolean(sessionId),
  });

  const participantsQuery = useQuery({
    queryKey: queryKeys.sessions.participants(sessionId),
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('session_participants')
        .select('user_id')
        .eq('session_id', sessionId);

      if (error) throw error;

      const userIds = (data || []).map((p) => p.user_id);
      if (userIds.length === 0) {
        return [];
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      return (profilesData as Profile[]) || [];
    },
    enabled: Boolean(sessionId),
  });

  const drinksQuery = useQuery({
    queryKey: queryKeys.sessions.drinks(sessionId),
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('drink_entries')
        .select('*')
        .eq('session_id', sessionId)
        .order('consumed_at', { ascending: false });

      if (error) throw error;
      return (data as DrinkEntry[]) || [];
    },
    enabled: Boolean(sessionId),
    // No refetchInterval - historical data is immutable
  });

  const drinks = useMemo(() => drinksQuery.data ?? [], [drinksQuery.data]);
  const participants = useMemo(
    () => participantsQuery.data ?? [],
    [participantsQuery.data],
  );

  // Calculate leaderboard using session end time (not current time)
  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    if (!participants.length || !sessionQuery.data) {
      return [];
    }

    const endTime = new Date(sessionQuery.data.end_time);
    const data = participants.map((participant) => {
      const userDrinks = drinks.filter((d) => d.user_id === participant.id);
      const bac = calculateBAC(userDrinks, participant, endTime);
      return {
        user_id: participant.id,
        display_name: participant.display_name,
        bac,
        rank: 0,
      };
    });

    data.sort((a, b) => b.bac - a.bac);
    data.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return data;
  }, [drinks, participants, sessionQuery.data]);

  const errorMessage =
    sessionQuery.error ||
    participantsQuery.error ||
    drinksQuery.error;

  const error =
    errorMessage instanceof Error ? errorMessage.message : errorMessage ? String(errorMessage) : null;

  const loading =
    sessionQuery.isPending || participantsQuery.isPending || drinksQuery.isPending;

  return {
    session: sessionQuery.data ?? null,
    drinks,
    leaderboard,
    participants,
    loading,
    error,
  };
}
