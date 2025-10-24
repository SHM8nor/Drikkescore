import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, DrinkEntry, LeaderboardEntry, Profile } from '../types/database';
import { calculateBAC } from '../utils/bacCalculator';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to manage session operations
 */
export function useSession(sessionId: string | null) {
  const { user, profile } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [drinks, setDrinks] = useState<DrinkEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session data
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const fetchSessionData = async () => {
      try {
        // Fetch session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;
        setSession(sessionData);

        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('session_participants')
          .select(`
            user_id,
            profiles (*)
          `)
          .eq('session_id', sessionId);

        if (participantsError) throw participantsError;

        const participantProfiles = participantsData
          .map((p: any) => p.profiles)
          .filter(Boolean) as Profile[];
        setParticipants(participantProfiles);

        // Fetch all drinks for the session
        const { data: drinksData, error: drinksError } = await supabase
          .from('drink_entries')
          .select('*')
          .eq('session_id', sessionId)
          .order('consumed_at', { ascending: false });

        if (drinksError) throw drinksError;
        setDrinks(drinksData);

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSessionData();

    // Subscribe to real-time drink updates
    const drinkSubscription = supabase
      .channel(`drinks:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drink_entries',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDrinks((prev) => [payload.new as DrinkEntry, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDrinks((prev) =>
              prev.map((d) => (d.id === payload.new.id ? (payload.new as DrinkEntry) : d))
            );
          } else if (payload.eventType === 'DELETE') {
            setDrinks((prev) => prev.filter((d) => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      drinkSubscription.unsubscribe();
    };
  }, [sessionId]);

  // Calculate leaderboard based on drinks and participants
  useEffect(() => {
    if (participants.length === 0) {
      setLeaderboard([]);
      return;
    }

    const now = new Date();
    const leaderboardData: LeaderboardEntry[] = participants.map((participant) => {
      const userDrinks = drinks.filter((d) => d.user_id === participant.id);
      const bac = calculateBAC(userDrinks, participant, now);

      return {
        user_id: participant.id,
        full_name: participant.full_name,
        bac,
        rank: 0, // Will be set after sorting
      };
    });

    // Sort by BAC descending and assign ranks
    leaderboardData.sort((a, b) => b.bac - a.bac);
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setLeaderboard(leaderboardData);
  }, [drinks, participants]);

  // Add a drink
  const addDrink = async (volumeMl: number, alcoholPercentage: number) => {
    if (!user || !sessionId) {
      throw new Error('User not authenticated or no session');
    }

    const { error } = await supabase.from('drink_entries').insert({
      session_id: sessionId,
      user_id: user.id,
      volume_ml: volumeMl,
      alcohol_percentage: alcoholPercentage,
    });

    if (error) throw error;
  };

  // Get current user's BAC
  const getCurrentUserBAC = () => {
    if (!profile || !user) return 0;
    const userDrinks = drinks.filter((d) => d.user_id === user.id);
    return calculateBAC(userDrinks, profile, new Date());
  };

  return {
    session,
    drinks,
    leaderboard,
    participants,
    loading,
    error,
    addDrink,
    getCurrentUserBAC,
  };
}

/**
 * Hook to create a new session
 */
export function useCreateSession() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = async (startTime: Date, endTime: Date) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      // Generate session code (done by database function)
      const { data, error: createError } = await supabase.rpc('generate_session_code');

      if (createError) throw createError;

      const sessionCode = data;

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          session_code: sessionCode,
          created_by: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionData.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

      setLoading(false);
      return sessionData as Session;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { createSession, loading, error };
}

/**
 * Hook to join an existing session
 */
export function useJoinSession() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinSession = async (sessionCode: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      // Find session by code
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_code', sessionCode)
        .single();

      if (sessionError) throw new Error('Session not found');

      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionData.id)
        .eq('user_id', user.id)
        .single();

      if (existingParticipant) {
        // Already joined, just return session
        setLoading(false);
        return sessionData as Session;
      }

      // Add as participant
      const { error: participantError } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionData.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

      setLoading(false);
      return sessionData as Session;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { joinSession, loading, error };
}
