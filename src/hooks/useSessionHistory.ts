import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '../types/database';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to fetch user's session history (completed sessions)
 */
export function useSessionHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSessionHistory = async () => {
      try {
        // Get all session IDs where user was a participant
        const { data: participantData, error: participantError } = await supabase
          .from('session_participants')
          .select('session_id')
          .eq('user_id', user.id);

        if (participantError) throw participantError;

        if (!participantData || participantData.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }

        const sessionIds = participantData.map((p: any) => p.session_id);

        // Fetch sessions where user participated and session has ended
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .in('id', sessionIds)
          .lt('end_time', new Date().toISOString()) // Only completed sessions
          .order('start_time', { ascending: false });

        if (sessionsError) throw sessionsError;

        setSessions(sessionsData as Session[]);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching session history:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSessionHistory();
  }, [user]);

  return { sessions, loading, error };
}
