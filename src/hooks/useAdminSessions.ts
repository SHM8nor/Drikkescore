import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '../types/database';

/**
 * Extended session type with joined creator profile and participant count
 */
export interface AdminSession extends Session {
  creator?: {
    full_name: string;
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
  } | null;
  session_participants?: Array<{ count: number }>;
}

/**
 * Hook to fetch and manage all sessions (admin-only)
 * Includes real-time subscription for live updates
 */
export function useAdminSessions(): UseAdminSessionsReturn {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all sessions with creator and participant count
  const fetchSessions = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      // Fetch sessions with creator profile joined and participant count
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`
          *,
          creator:profiles!sessions_created_by_fkey(full_name),
          session_participants(count)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform the data to flatten the participants count
      const transformedData: AdminSession[] = (data as RawSessionData[] || []).map((session) => ({
        id: session.id,
        session_code: session.session_code,
        session_name: session.session_name,
        created_by: session.created_by,
        start_time: session.start_time,
        end_time: session.end_time,
        created_at: session.created_at,
        updated_at: session.updated_at,
        participants_count: session.session_participants?.[0]?.count || 0,
        creator: session.creator || { full_name: 'Unknown' },
      }));

      setSessions(transformedData);

      if (isInitialLoad) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching admin sessions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSessions(true);

    // Subscribe to real-time updates for sessions table
    const channel = supabase.channel('admin-sessions');

    // Subscribe to session changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
      },
      (payload) => {
        console.log('Real-time session update received:', payload);
        // Refetch all sessions when any change occurs
        // This ensures creator and participant count are up to date
        fetchSessions(false);
      }
    );

    // Subscribe to session_participants changes to update participant counts
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_participants',
      },
      (payload) => {
        console.log('Real-time participant update received:', payload);
        // Refetch to update participant counts
        fetchSessions(false);
      }
    );

    channel.subscribe((status) => {
      console.log('Admin sessions subscription status:', status);
    });

    return () => {
      console.log('Cleaning up admin sessions subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    sessions,
    loading,
    error,
    refetch: () => fetchSessions(false),
  };
}
