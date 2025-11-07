import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Session } from '../types/database';
import { queryKeys } from '../lib/queryKeys';

/**
 * Hook to fetch the user's active sessions
 * An active session is one where:
 * 1. The user is a participant
 * 2. The session end_time is in the future (session not expired)
 */
export function useActiveSession() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.sessions.active(user?.id ?? null),
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

      const sessionIds = participantData.map((p) => p.session_id);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .in('id', sessionIds)
        .gt('end_time', new Date().toISOString())
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      return (sessionsData as Session[]) || [];
    },
    enabled: Boolean(user),
    refetchInterval: 30000,
  });

  const error = useMemo(() => {
    if (query.error instanceof Error) {
      return query.error.message;
    }
    return null;
  }, [query.error]);

  return {
    activeSessions: query.data ?? [],
    loading: query.isPending,
    error,
  };
}
