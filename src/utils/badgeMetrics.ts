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
