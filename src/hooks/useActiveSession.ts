import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Session } from '../types/database';

/**
 * Hook to fetch the user's active sessions
 * An active session is one where:
 * 1. The user is a participant
 * 2. The session end_time is in the future (session not expired)
 */
export function useActiveSession() {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchActiveSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all sessions the user is participating in
        const { data: participantData, error: participantError } = await supabase
          .from('session_participants')
          .select('session_id')
          .eq('user_id', user.id);

        if (participantError) throw participantError;

        if (!participantData || participantData.length === 0) {
          setActiveSessions([]);
          setLoading(false);
          return;
        }

        // Get session IDs
        const sessionIds = participantData.map((p) => p.session_id);

        // Fetch sessions that are still active (end_time > now)
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .in('id', sessionIds)
          .gt('end_time', new Date().toISOString())
          .order('start_time', { ascending: false });

        if (sessionsError) throw sessionsError;

        setActiveSessions((sessionsData as Session[]) || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching active sessions:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchActiveSessions();

    // Poll for updates every 30 seconds to check for new/expired sessions
    const pollInterval = setInterval(fetchActiveSessions, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [user]);

  return {
    activeSessions,
    loading,
    error,
  };
}
