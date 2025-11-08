import { useCallback, useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Session, DrinkEntry, LeaderboardEntry, Profile } from '../types/database';
import { calculateBAC } from '../utils/bacCalculator';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import { useSupabaseSubscription } from './useSupabaseSubscription';
import { useCheckAndAwardBadges } from './useBadgeAwarding';

interface AddDrinkPayload {
  volumeMl: number;
  alcoholPercentage: number;
  foodConsumed: boolean;
  rapidConsumption: boolean;
}

/**
 * Hook to manage session operations powered by React Query
 */
export function useSession(sessionId: string | null) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { checkAndAward } = useCheckAndAwardBadges();

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
    refetchInterval: 5000,
  });

  // Realtime invalidation for drinks and participants
  useSupabaseSubscription(
    `session:${sessionId ?? 'unknown'}`,
    useCallback(
      (channel) => {
        if (!sessionId) return;

        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'drink_entries',
            filter: `session_id=eq.${sessionId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.drinks(sessionId) });
          },
        );

        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'session_participants',
            filter: `session_id=eq.${sessionId}`,
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: queryKeys.sessions.participants(sessionId),
            });
          },
        );

        channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sessions',
            filter: `id=eq.${sessionId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
          },
        );
      },
      [queryClient, sessionId],
    ),
    Boolean(sessionId),
  );

  const addDrinkMutation = useMutation({
    mutationFn: async (payload: AddDrinkPayload) => {
      if (!user || !sessionId) {
        throw new Error('User not authenticated or session missing');
      }

      const { error } = await supabase.from('drink_entries').insert({
        session_id: sessionId,
        user_id: user.id,
        volume_ml: payload.volumeMl,
        alcohol_percentage: payload.alcoholPercentage,
        food_consumed: payload.foodConsumed,
        rapid_consumption: payload.rapidConsumption,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.drinks(sessionId) });

        // Check and award badges after drink added (fire and forget)
        checkAndAward('drink_added', sessionId).catch((error) => {
          console.error('[BadgeAwarding] Error checking badges after drink added:', error);
        });
      }
    },
  });

  const deleteDrinkMutation = useMutation({
    mutationFn: async (drinkId: string) => {
      if (!user || !sessionId) {
        throw new Error('User not authenticated or session missing');
      }

      const { error } = await supabase
        .from('drink_entries')
        .delete()
        .eq('id', drinkId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.drinks(sessionId) });
      }
    },
  });

  const extendSessionMutation = useMutation({
    mutationFn: async (additionalMinutes: number) => {
      if (!user || !sessionId) {
        throw new Error('User not authenticated or session missing');
      }

      const session = sessionQuery.data;
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.created_by !== user.id) {
        throw new Error('Only the session creator can extend the session');
      }

      const currentEndTime = new Date(session.end_time);
      const newEndTime = new Date(currentEndTime.getTime() + additionalMinutes * 60 * 1000);

      const { error } = await supabase
        .from('sessions')
        .update({ end_time: newEndTime.toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
      }
    },
  });

  const drinks = useMemo(() => drinksQuery.data ?? [], [drinksQuery.data]);
  const participants = useMemo(
    () => participantsQuery.data ?? [],
    [participantsQuery.data],
  );

  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    if (!participants.length) {
      return [];
    }

    const now = new Date();
    const data = participants.map((participant) => {
      const userDrinks = drinks.filter((d) => d.user_id === participant.id);
      const bac = calculateBAC(userDrinks, participant, now);
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
  }, [drinks, participants]);

  const errorMessage =
    sessionQuery.error ||
    participantsQuery.error ||
    drinksQuery.error ||
    addDrinkMutation.error ||
    deleteDrinkMutation.error ||
    extendSessionMutation.error;

  const error =
    errorMessage instanceof Error ? errorMessage.message : errorMessage ? String(errorMessage) : null;

  const loading =
    sessionQuery.isPending || participantsQuery.isPending || drinksQuery.isPending;

  const addDrink = useCallback(
    (
      volumeMl: number,
      alcoholPercentage: number,
      foodConsumed: boolean = false,
      rapidConsumption: boolean = false,
    ) => {
      return addDrinkMutation.mutateAsync({
        volumeMl,
        alcoholPercentage,
        foodConsumed,
        rapidConsumption,
      });
    },
    [addDrinkMutation],
  );

  const deleteDrink = useCallback(
    (drinkId: string) => deleteDrinkMutation.mutateAsync(drinkId),
    [deleteDrinkMutation],
  );

  const getCurrentUserBAC = useCallback(() => {
    if (!profile || !user) return 0;
    const userDrinks = drinks.filter((d) => d.user_id === user.id);
    return calculateBAC(userDrinks, profile, new Date());
  }, [drinks, profile, user]);

  const extendSession = useCallback(
    (additionalMinutes: number) => extendSessionMutation.mutateAsync(additionalMinutes),
    [extendSessionMutation],
  );

  return {
    session: sessionQuery.data ?? null,
    drinks,
    leaderboard,
    participants,
    loading,
    error,
    addDrink,
    deleteDrink,
    getCurrentUserBAC,
    extendSession,
    isExtending: extendSessionMutation.isPending,
  };
}

/**
 * Hook to create a new session
 */
export function useCreateSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      sessionName,
      startTime,
      endTime,
    }: {
      sessionName: string;
      startTime: Date;
      endTime: Date;
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: sessionCode, error: codeError } = await supabase.rpc('generate_session_code');
      if (codeError) throw codeError;

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          session_code: sessionCode,
          session_name: sessionName,
          created_by: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: participantError } = await supabase.from('session_participants').insert({
        session_id: sessionData.id,
        user_id: user.id,
      });

      if (participantError) throw participantError;

      return sessionData as Session;
    },
    onSuccess: async () => {
      if (user) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active(user.id) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.sessions.history(user.id) }),
        ]);
      }
    },
  });

  return {
    createSession: (sessionName: string, startTime: Date, endTime: Date) =>
      mutation.mutateAsync({ sessionName, startTime, endTime }),
    loading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

/**
 * Hook to join an existing session
 */
export function useJoinSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (sessionCode: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_code', sessionCode)
        .single();

      if (sessionError) {
        throw new Error('Session not found');
      }

      const { data: existingParticipant } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionData.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingParticipant) {
        const { error: participantError } = await supabase.from('session_participants').insert({
          session_id: sessionData.id,
          user_id: user.id,
        });

        if (participantError) throw participantError;
      }

      return sessionData as Session;
    },
    onSuccess: async () => {
      if (user) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active(user.id) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.sessions.history(user.id) }),
        ]);
      }
    },
  });

  return {
    joinSession: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}
