/**
 * Session Details API
 *
 * Handles detailed session data fetching for admin deep dive feature.
 * Provides comprehensive session information with all participants, drinks, and BAC calculations.
 */

import { supabase } from '../lib/supabase';
import type { Session, DrinkEntry, Profile } from '../types/database';
import { calculateBAC } from '../utils/bacCalculator';

export class SessionDetailsError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'SessionDetailsError';
    this.code = code;
  }
}

export interface SessionDetailParticipant {
  userId: string;
  profile: Profile;
  joinedAt: string;
  drinkCount: number;
  currentBAC: number;
  peakBAC: number;
}

export interface SessionDrinkWithUser extends DrinkEntry {
  user: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface SessionDetailData {
  session: Session;
  participants: SessionDetailParticipant[];
}

/**
 * Get comprehensive session details with all participants and their profiles
 * @param sessionId - The session ID to fetch
 * @returns Session with detailed participant information
 * @throws {SessionDetailsError} If the request fails
 */
export async function getSessionDetail(sessionId: string): Promise<SessionDetailData> {
  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    console.error('Error fetching session:', sessionError);
    throw new SessionDetailsError('Kunne ikke hente økt', sessionError.code);
  }

  if (!session) {
    throw new SessionDetailsError('Økt ikke funnet');
  }

  // Fetch all participants with join times
  const { data: participants, error: participantsError } = await supabase
    .from('session_participants')
    .select('user_id, joined_at')
    .eq('session_id', sessionId);

  if (participantsError) {
    console.error('Error fetching participants:', participantsError);
    throw new SessionDetailsError('Kunne ikke hente deltakere', participantsError.code);
  }

  if (!participants || participants.length === 0) {
    return {
      session: session as Session,
      participants: [],
    };
  }

  // Fetch all profiles for participants
  const userIds = participants.map((p) => p.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw new SessionDetailsError('Kunne ikke hente profiler', profilesError.code);
  }

  // Fetch all drinks for this session
  const { data: drinks, error: drinksError } = await supabase
    .from('drink_entries')
    .select('*')
    .eq('session_id', sessionId);

  if (drinksError) {
    console.error('Error fetching drinks:', drinksError);
    throw new SessionDetailsError('Kunne ikke hente drinker', drinksError.code);
  }

  const now = new Date();
  const profilesMap = new Map((profiles || []).map((p) => [p.id, p as Profile]));
  const drinksData = (drinks || []) as DrinkEntry[];

  // Build detailed participant data
  const detailedParticipants: SessionDetailParticipant[] = participants.map((participant) => {
    const profile = profilesMap.get(participant.user_id);
    if (!profile) {
      throw new SessionDetailsError(`Profil ikke funnet for bruker ${participant.user_id}`);
    }

    const userDrinks = drinksData.filter((d) => d.user_id === participant.user_id);
    const currentBAC = calculateBAC(userDrinks, profile, now);

    // Calculate peak BAC (max BAC achieved during session)
    let peakBAC = currentBAC;
    if (userDrinks.length > 0) {
      // Check BAC at different time points to find peak
      const sessionStart = new Date(session.start_time);
      const sessionEnd = new Date(session.end_time);
      const now = new Date();
      const endTime = sessionEnd < now ? sessionEnd : now;

      // Sample BAC every 5 minutes to find peak
      const startTime = sessionStart.getTime();
      const endTimeMs = endTime.getTime();
      const interval = 5 * 60 * 1000; // 5 minutes in ms

      for (let time = startTime; time <= endTimeMs; time += interval) {
        const bacAtTime = calculateBAC(userDrinks, profile, new Date(time));
        if (bacAtTime > peakBAC) {
          peakBAC = bacAtTime;
        }
      }
    }

    return {
      userId: participant.user_id,
      profile,
      joinedAt: participant.joined_at,
      drinkCount: userDrinks.length,
      currentBAC,
      peakBAC,
    };
  });

  return {
    session: session as Session,
    participants: detailedParticipants,
  };
}

/**
 * Get all drink entries for a session with user information
 * @param sessionId - The session ID to fetch drinks for
 * @returns Array of drinks with user data
 * @throws {SessionDetailsError} If the request fails
 */
export async function getSessionDrinks(sessionId: string): Promise<SessionDrinkWithUser[]> {
  const { data, error } = await supabase
    .from('drink_entries')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .eq('session_id', sessionId)
    .order('consumed_at', { ascending: false });

  if (error) {
    console.error('Error fetching session drinks:', error);
    throw new SessionDetailsError('Kunne ikke hente drinker', error.code);
  }

  if (!data) {
    return [];
  }

  // Transform the data to match our interface
  return data.map((item) => {
    const { profiles, ...drink } = item as DrinkEntry & {
      profiles: { full_name: string; avatar_url?: string } | null;
    };

    return {
      ...drink,
      user: {
        full_name: profiles?.full_name || 'Ukjent',
        avatar_url: profiles?.avatar_url,
      },
    } as SessionDrinkWithUser;
  });
}

/**
 * Get session leaderboard with all participants ranked by current BAC
 * @param sessionId - The session ID
 * @returns Array of participants with BAC and rankings
 * @throws {SessionDetailsError} If the request fails
 */
export async function getSessionLeaderboard(sessionId: string) {
  const sessionDetail = await getSessionDetail(sessionId);

  const leaderboard = sessionDetail.participants
    .map((participant) => ({
      rank: 0, // Will be set after sorting
      user_id: participant.userId,
      full_name: participant.profile.full_name,
      avatar_url: participant.profile.avatar_url,
      bac: participant.currentBAC,
      drinkCount: participant.drinkCount,
      peakBAC: participant.peakBAC,
    }))
    .sort((a, b) => b.bac - a.bac);

  // Assign ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}
