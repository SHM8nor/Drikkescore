import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Session } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryKeys';

type ParticipantRow = { session_id: string };

/**
 * Hook to fetch user's session history (completed sessions)
 */
export function useSessionHistory() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.sessions.history(user?.id ?? null),
    queryFn: async () => {
      if (!user) {
        return [];
      }

      const { data: participantData, error: participantError } = await supabase
        .from('session_participants')
        .select('session_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        return [];
      }

      const sessionIds = (participantData as ParticipantRow[]).map((p) => p.session_id);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .in('id', sessionIds)
        .lt('end_time', new Date().toISOString())
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      return (sessionsData as Session[]) || [];
    },
    enabled: Boolean(user),
  });

  const error = useMemo(() => {
    if (query.error instanceof Error) {
      return query.error.message;
    }
    return null;
  }, [query.error]);

  return {
    sessions: query.data ?? [],
    loading: query.isPending,
    error,
  };
}
