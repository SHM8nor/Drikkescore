import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Session } from '../types/database';
import { useSupabaseSubscription } from './useSupabaseSubscription';
import { queryKeys } from '../lib/queryKeys';

/**
 * Extended session type with joined creator profile and participant count
 */
export interface AdminSession extends Session {
  creator?: {
    full_name: string;
    display_name: string;
  };
  participants_count?: number;
}

interface UseAdminSessionsReturn {
  sessions: AdminSession[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Raw session data from Supabase with nested relations
 */
interface RawSessionData {
  id: string;
  session_code: string;
  session_name: string;
  created_by: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name: string;
    display_name: string;
  } | null;
  session_participants?: Array<{ count: number }>;
}

/**
 * Hook to fetch and manage all sessions (admin-only)
 * Includes real-time subscription for live updates
 */
export function useAdminSessions(): UseAdminSessionsReturn {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: queryKeys.admin.sessions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          creator:profiles!sessions_created_by_fkey(full_name, display_name),
          session_participants(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return ((data as RawSessionData[]) || []).map((session) => ({
        id: session.id,
        session_code: session.session_code,
        session_name: session.session_name,
        created_by: session.created_by,
        start_time: session.start_time,
        end_time: session.end_time,
        created_at: session.created_at,
        updated_at: session.updated_at,
        participants_count: session.session_participants?.[0]?.count || 0,
        creator: session.creator || { full_name: 'Unknown', display_name: 'Unknown' },
      })) as AdminSession[];
    },
  });

  const invalidateSessions = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.admin.sessions });
  }, [queryClient]);

  useSupabaseSubscription(
    'admin-sessions',
    useCallback(
      (channel) => {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sessions' },
          invalidateSessions,
        );
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'session_participants' },
          invalidateSessions,
        );
      },
      [invalidateSessions],
    ),
    true,
  );

  const error = useMemo(() => {
    if (sessionsQuery.error instanceof Error) {
      return sessionsQuery.error.message;
    }
    return null;
  }, [sessionsQuery.error]);

  return {
    sessions: sessionsQuery.data ?? [],
    loading: sessionsQuery.isPending,
    error,
    refetch: async () => {
      await sessionsQuery.refetch();
    },
  };
}
