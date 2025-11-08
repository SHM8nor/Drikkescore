// =============================================================================
// Badge Metrics Extraction Utilities
// =============================================================================
// Functions for extracting metric values from the database for badge evaluation
// Each function queries Supabase and returns a numeric value, returning 0 on error

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, DrinkEntry } from '../types/database';
import { calculateBAC } from './bacCalculator';

/**
 * Get total drinks across all sessions for a user
 *
 * @param supabase Supabase client instance
 * @param userId User ID to query
 * @returns Total number of drinks, or 0 on error
 */
export async function getTotalDrinks(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('drink_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('[getTotalDrinks] Error querying drink_entries:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('[getTotalDrinks] Unexpected error:', error);
    return 0;
  }
}

/**
 * Get total number of sessions user has participated in
 *
 * @param supabase Supabase client instance
 * @param userId User ID to query
 * @returns Total session count, or 0 on error
 */
export async function getSessionCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('session_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('[getSessionCount] Error querying session_participants:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('[getSessionCount] Unexpected error:', error);
    return 0;
  }
}

/**
 * Get number of drinks in a specific session for a user
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to query
 * @param userId User ID to query
 * @returns Drink count in session, or 0 on error
 */
export async function getSessionDrinkCount(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('drink_entries')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('[getSessionDrinkCount] Error querying drink_entries:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('[getSessionDrinkCount] Unexpected error:', error);
    return 0;
  }
}

/**
 * Calculate max BAC reached in a session
 *
 * Strategy: Fetch all drinks for the user in the session, then calculate BAC
 * at each drink's consumption time + absorption time to find the peak.
 * This accounts for the realistic absorption curves.
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to query
 * @param userId User ID to query
 * @param profile User profile for BAC calculation
 * @returns Maximum BAC in promille, or 0 on error
 */
export async function getMaxBACInSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  profile: Profile
): Promise<number> {
  try {
    // Fetch all drinks for this user in this session
    const { data: drinks, error } = await supabase
      .from('drink_entries')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('consumed_at', { ascending: true });

    if (error) {
      console.error('[getMaxBACInSession] Error querying drink_entries:', error);
      return 0;
    }

    // No drinks = 0 BAC
    if (!drinks || drinks.length === 0) {
      return 0;
    }

    // Calculate BAC at multiple time points to find the peak
    // We'll sample at each drink time + every 5 minutes up to 2 hours after last drink
    const timePoints: Date[] = [];

    // Add time point at each drink consumption
    drinks.forEach((drink) => {
      timePoints.push(new Date(drink.consumed_at));
    });

    // Add sample points every 5 minutes from first to last drink + 2 hours
    const firstDrinkTime = new Date(drinks[0].consumed_at).getTime();
    const lastDrinkTime = new Date(drinks[drinks.length - 1].consumed_at).getTime();
    const endTime = lastDrinkTime + (2 * 60 * 60 * 1000); // 2 hours after last drink

    for (let time = firstDrinkTime; time <= endTime; time += 5 * 60 * 1000) {
      timePoints.push(new Date(time));
    }

    // Calculate BAC at each time point and find maximum
    let maxBAC = 0;

    for (const timePoint of timePoints) {
      const bac = calculateBAC(drinks as DrinkEntry[], profile, timePoint);
      if (bac > maxBAC) {
        maxBAC = bac;
      }
    }

    return maxBAC;
  } catch (error) {
    console.error('[getMaxBACInSession] Unexpected error:', error);
    return 0;
  }
}

/**
 * Count unique friends in a session (participants who are friends with user)
 *
 * Strategy: Get all participants in the session, then check which ones
 * have an accepted friendship with the user.
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to query
 * @param userId User ID to query
 * @returns Number of unique friends in session, or 0 on error
 */
export async function getUniqueFriendsInSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<number> {
  try {
    // Get all participants in the session (excluding the user themselves)
    const { data: participants, error: participantsError } = await supabase
      .from('session_participants')
      .select('user_id')
      .eq('session_id', sessionId)
      .neq('user_id', userId);

    if (participantsError) {
      console.error('[getUniqueFriendsInSession] Error querying session_participants:', participantsError);
      return 0;
    }

    if (!participants || participants.length === 0) {
      return 0;
    }

    // Get all participant IDs
    const participantIds = participants.map((p) => p.user_id);

    // Query friendships to see which participants are friends
    // A friendship exists if:
    // - (user_id = userId AND friend_id = participantId) OR
    // - (user_id = participantId AND friend_id = userId)
    // AND status = 'accepted'
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .or(
        `user_id.eq.${userId},friend_id.eq.${userId}`
      );

    if (friendshipsError) {
      console.error('[getUniqueFriendsInSession] Error querying friendships:', friendshipsError);
      return 0;
    }

    if (!friendships || friendships.length === 0) {
      return 0;
    }

    // Extract friend IDs from the bidirectional friendship table
    const friendIds = new Set<string>();
    friendships.forEach((friendship) => {
      if (friendship.user_id === userId) {
        friendIds.add(friendship.friend_id);
      } else if (friendship.friend_id === userId) {
        friendIds.add(friendship.user_id);
      }
    });

    // Count how many participants are in the friend set
    const friendCount = participantIds.filter((id) => friendIds.has(id)).length;

    return friendCount;
  } catch (error) {
    console.error('[getUniqueFriendsInSession] Unexpected error:', error);
    return 0;
  }
}

/**
 * Get total volume of alcohol consumed in milliliters
 *
 * @param supabase Supabase client instance
 * @param userId User ID to query
 * @returns Total volume in ml, or 0 on error
 */
export async function getTotalVolume(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { data: drinks, error } = await supabase
      .from('drink_entries')
      .select('volume_ml')
      .eq('user_id', userId);

    if (error) {
      console.error('[getTotalVolume] Error querying drink_entries:', error);
      return 0;
    }

    if (!drinks || drinks.length === 0) {
      return 0;
    }

    const totalVolume = drinks.reduce((sum, drink) => sum + drink.volume_ml, 0);
    return totalVolume;
  } catch (error) {
    console.error('[getTotalVolume] Unexpected error:', error);
    return 0;
  }
}

/**
 * Get number of accepted friends
 *
 * @param supabase Supabase client instance
 * @param userId User ID to query
 * @returns Number of accepted friends, or 0 on error
 */
export async function getFriendCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    // Friendships are bidirectional, so we need to count both directions
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) {
      console.error('[getFriendCount] Error querying friendships:', error);
      return 0;
    }

    return friendships?.length ?? 0;
  } catch (error) {
    console.error('[getFriendCount] Unexpected error:', error);
    return 0;
  }
}

/**
 * Check if user logged at least one beer in session
 * Beer is defined as alcohol_percentage < 8%
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to query
 * @param userId User ID to query
 * @returns 1 if user has beer, 0 otherwise
 */
export async function getSessionHasBeer(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('drink_entries')
      .select('alcohol_percentage')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .lt('alcohol_percentage', 8)
      .limit(1);

    if (error) {
      console.error('[getSessionHasBeer] Error querying drink_entries:', error);
      return 0;
    }

    return data && data.length > 0 ? 1 : 0;
  } catch (error) {
    console.error('[getSessionHasBeer] Unexpected error:', error);
    return 0;
  }
}

/**
 * Check if user logged at least one wine in session
 * Wine is defined as 8% <= alcohol_percentage <= 20%
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to query
 * @param userId User ID to query
 * @returns 1 if user has wine, 0 otherwise
 */
export async function getSessionHasWine(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('drink_entries')
      .select('alcohol_percentage')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .gte('alcohol_percentage', 8)
      .lte('alcohol_percentage', 20)
      .limit(1);

    if (error) {
      console.error('[getSessionHasWine] Error querying drink_entries:', error);
      return 0;
    }

    return data && data.length > 0 ? 1 : 0;
  } catch (error) {
    console.error('[getSessionHasWine] Unexpected error:', error);
    return 0;
  }
}

/**
 * Check if at least one friend in session logged beer
 * Beer is defined as alcohol_percentage < 8%
 *
 * Strategy:
 * 1. Get all participants in session (excluding user)
 * 2. Check which participants are friends with user
 * 3. Check if any friend has logged beer
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to query
 * @param userId User ID to query
 * @returns 1 if at least one friend has beer, 0 otherwise
 */
export async function getSessionFriendHasBeer(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<number> {
  try {
    // Get all participants in the session (excluding the user themselves)
    const { data: participants, error: participantsError } = await supabase
      .from('session_participants')
      .select('user_id')
      .eq('session_id', sessionId)
      .neq('user_id', userId);

    if (participantsError) {
      console.error('[getSessionFriendHasBeer] Error querying session_participants:', participantsError);
      return 0;
    }

    if (!participants || participants.length === 0) {
      return 0;
    }

    const participantIds = participants.map((p) => p.user_id);

    // Query friendships to see which participants are friends
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (friendshipsError) {
      console.error('[getSessionFriendHasBeer] Error querying friendships:', friendshipsError);
      return 0;
    }

    if (!friendships || friendships.length === 0) {
      return 0;
    }

    // Extract friend IDs from the bidirectional friendship table
    const friendIds = new Set<string>();
    friendships.forEach((friendship) => {
      if (friendship.user_id === userId) {
        friendIds.add(friendship.friend_id);
      } else if (friendship.friend_id === userId) {
        friendIds.add(friendship.user_id);
      }
    });

    // Get friends who are in this session
    const friendsInSession = participantIds.filter((id) => friendIds.has(id));

    if (friendsInSession.length === 0) {
      return 0;
    }

    // Check if any friend has logged beer (< 8%)
    for (const friendId of friendsInSession) {
      const { data: beerDrinks, error: drinksError } = await supabase
        .from('drink_entries')
        .select('alcohol_percentage')
        .eq('session_id', sessionId)
        .eq('user_id', friendId)
        .lt('alcohol_percentage', 8)
        .limit(1);

      if (drinksError) {
        console.error('[getSessionFriendHasBeer] Error querying drinks for friend:', drinksError);
        continue;
      }

      if (beerDrinks && beerDrinks.length > 0) {
        return 1; // Found at least one friend with beer
      }
    }

    return 0;
  } catch (error) {
    console.error('[getSessionFriendHasBeer] Unexpected error:', error);
    return 0;
  }
}

/**
 * Check if at least one friend in session logged wine
 * Wine is defined as 8% <= alcohol_percentage <= 20%
 *
 * Strategy:
 * 1. Get all participants in session (excluding user)
 * 2. Check which participants are friends with user
 * 3. Check if any friend has logged wine
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to query
 * @param userId User ID to query
 * @returns 1 if at least one friend has wine, 0 otherwise
 */
export async function getSessionFriendHasWine(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<number> {
  try {
    // Get all participants in the session (excluding the user themselves)
    const { data: participants, error: participantsError } = await supabase
      .from('session_participants')
      .select('user_id')
      .eq('session_id', sessionId)
      .neq('user_id', userId);

    if (participantsError) {
      console.error('[getSessionFriendHasWine] Error querying session_participants:', participantsError);
      return 0;
    }

    if (!participants || participants.length === 0) {
      return 0;
    }

    const participantIds = participants.map((p) => p.user_id);

    // Query friendships to see which participants are friends
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (friendshipsError) {
      console.error('[getSessionFriendHasWine] Error querying friendships:', friendshipsError);
      return 0;
    }

    if (!friendships || friendships.length === 0) {
      return 0;
    }

    // Extract friend IDs from the bidirectional friendship table
    const friendIds = new Set<string>();
    friendships.forEach((friendship) => {
      if (friendship.user_id === userId) {
        friendIds.add(friendship.friend_id);
      } else if (friendship.friend_id === userId) {
        friendIds.add(friendship.user_id);
      }
    });

    // Get friends who are in this session
    const friendsInSession = participantIds.filter((id) => friendIds.has(id));

    if (friendsInSession.length === 0) {
      return 0;
    }

    // Check if any friend has logged wine (8-20%)
    for (const friendId of friendsInSession) {
      const { data: wineDrinks, error: drinksError } = await supabase
        .from('drink_entries')
        .select('alcohol_percentage')
        .eq('session_id', sessionId)
        .eq('user_id', friendId)
        .gte('alcohol_percentage', 8)
        .lte('alcohol_percentage', 20)
        .limit(1);

      if (drinksError) {
        console.error('[getSessionFriendHasWine] Error querying drinks for friend:', drinksError);
        continue;
      }

      if (wineDrinks && wineDrinks.length > 0) {
        return 1; // Found at least one friend with wine
      }
    }

    return 0;
  } catch (error) {
    console.error('[getSessionFriendHasWine] Unexpected error:', error);
    return 0;
  }
}

/**
 * Check if session ended after midnight (00:00)
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to query
 * @returns 1 if session ended after midnight, 0 otherwise
 */
export async function getSessionEndedAfterMidnight(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('end_time')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('[getSessionEndedAfterMidnight] Error querying sessions:', error);
      return 0;
    }

    if (!session || !session.end_time) {
      return 0;
    }

    const endTime = new Date(session.end_time);
    const hours = endTime.getHours();

    // Check if time is after midnight (00:00) and before 6:00 AM
    // This catches late-night sessions that end in the early morning
    return hours >= 0 && hours < 6 ? 1 : 0;
  } catch (error) {
    console.error('[getSessionEndedAfterMidnight] Unexpected error:', error);
    return 0;
  }
}

// =============================================================================
// Julebord (Christmas) Badge Metrics
// =============================================================================

/**
 * Get total number of julebord sessions user has participated in
 *
 * Strategy:
 * - Query session_participants joined with sessions table
 * - Filter by session_type = 'julebord'
 * - Count distinct sessions
 *
 * @param supabase Supabase client instance
 * @param userId User ID to query
 * @returns Total julebord session count, or 0 on error
 */
export async function getJulebordSessionCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    // Join session_participants with sessions to filter by session_type
    const { data: participations, error } = await supabase
      .from('session_participants')
      .select('session_id, sessions!inner(session_type)')
      .eq('user_id', userId)
      .eq('sessions.session_type', 'julebord');

    if (error) {
      console.error('[getJulebordSessionCount] Error querying sessions:', error);
      return 0;
    }

    // Count unique sessions (in case of duplicate entries)
    const uniqueSessions = new Set(participations?.map(p => p.session_id) ?? []);
    return uniqueSessions.size;
  } catch (error) {
    console.error('[getJulebordSessionCount] Unexpected error:', error);
    return 0;
  }
}

/**
 * Check if a specific session is a julebord session
 *
 * Returns 1 if session is julebord type, 0 otherwise.
 * This is used as a boolean flag in badge criteria evaluation.
 *
 * @param supabase Supabase client instance
 * @param sessionId Session ID to check
 * @returns 1 if julebord, 0 if not or error
 */
export async function getIsJulebordSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('session_type')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('[getIsJulebordSession] Error querying session:', error);
      return 0;
    }

    return session?.session_type === 'julebord' ? 1 : 0;
  } catch (error) {
    console.error('[getIsJulebordSession] Unexpected error:', error);
    return 0;
  }
}

/**
 * Get number of julebord sessions created by user
 *
 * This tracks how many times a user has organized/created a julebord session,
 * which qualifies them for the "Julenisse" (Christmas Elf) badge.
 *
 * @param supabase Supabase client instance
 * @param userId User ID to query
 * @returns Number of julebord sessions created, or 0 on error
 */
export async function getCreatedJulebordSessionCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
      .eq('session_type', 'julebord');

    if (error) {
      console.error('[getCreatedJulebordSessionCount] Error querying sessions:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('[getCreatedJulebordSessionCount] Unexpected error:', error);
    return 0;
  }
}

/**
 * ADMIN ONLY: Marker metric for manually awarded badges
 *
 * This metric always returns 0 for automatic badge checks.
 * It's only a placeholder to indicate the badge is admin-awarded.
 *
 * The "Pepperkake" badge uses this metric to indicate it can only
 * be awarded manually through the admin panel.
 *
 * @returns Always returns 0 (badge cannot be auto-awarded)
 */
export function getAdminAwardedFlag(): number {
  return 0; // Always 0 - this badge is never automatically awarded
}
