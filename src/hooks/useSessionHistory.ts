import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Session } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import { useCheckAndAwardBadges } from './useBadgeAwarding';

type ParticipantRow = { session_id: string };

/**
 * Hook to fetch user's session history (completed sessions)
 */
export function useSessionHistory() {
  const { user } = useAuth();
  const { checkAndAward } = useCheckAndAwardBadges();
  const checkedSessionsRef = useRef<Set<string>>(new Set());

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

  // Check badges for newly ended sessions
  useEffect(() => {
    if (!query.data || !user) return;

    query.data.forEach((session) => {
      // Use atomic check-and-set pattern to prevent duplicates
      if (!checkedSessionsRef.current.has(session.id)) {
        checkedSessionsRef.current.add(session.id);

        // Check and award session-based badges (fire and forget)
        checkAndAward('session_ended', session.id).catch((error) => {
          // On error, remove from set to allow retry on next load
          checkedSessionsRef.current.delete(session.id);
          console.error('[BadgeAwarding] Error checking session badges:', error);
        });
      }
    });
  }, [query.data, user, checkAndAward]);

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
