/**
 * Users API
 *
 * Handles user search and profile lookups.
 */

import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export class UserSearchError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'UserSearchError';
    this.code = code;
  }
}

export interface UserSearchResult {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

/**
 * Escape special SQL LIKE wildcard characters
 * @param input - The input string to escape
 * @returns Escaped string safe for LIKE queries
 */
function escapeLikeWildcards(input: string): string {
  // Escape % and _ characters that have special meaning in LIKE queries
  return input.replace(/[%_]/g, '\\$&');
}

/**
 * Search for users by full name
 * @param query - The search query (partial name match)
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of matching users
 * @throws {UserSearchError} If the request fails
 */
export async function searchUsers(
  query: string,
  limit: number = 10
): Promise<UserSearchResult[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new UserSearchError('Du må være logget inn for å søke etter brukere');
  }

  if (!query || query.trim().length < 2) {
    return [];
  }

  // Sanitize search query - escape LIKE wildcards to prevent SQL injection
  const sanitizedQuery = escapeLikeWildcards(query.trim().toLowerCase());

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .neq('id', user.id) // Exclude current user
    .ilike('full_name', `%${sanitizedQuery}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching users:', error);
    throw new UserSearchError('Kunne ikke søke etter brukere');
  }

  return data || [];
}

/**
 * Get a user profile by ID
 * @param userId - The user ID to fetch
 * @returns The user profile
 * @throws {UserSearchError} If the request fails
 */
export async function getUserProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw new UserSearchError('Kunne ikke hente brukerprofil');
  }

  if (!data) {
    throw new UserSearchError('Bruker ikke funnet');
  }

  return data;
}

// =============================================================================
// Account Deletion Functions
// =============================================================================

export interface DeleteDrinkingDataResult {
  drinks_deleted: number;
  active_sessions_deleted: number;
  participations_deleted: number;
  sessions_deleted: number;
  success: boolean;
}

/**
 * Delete all drinking-related data for a user (drinks, sessions, participations)
 * This does NOT delete the user's account, only their drinking history
 * @param userId - The user ID whose data should be deleted
 * @returns Summary of deleted data
 * @throws {UserSearchError} If the request fails or user is unauthorized
 */
export async function deleteUserDrinkingData(
  userId: string
): Promise<DeleteDrinkingDataResult> {
  const { data, error } = await supabase.rpc('delete_user_drinking_data', {
    target_user_id: userId,
  });

  if (error) {
    console.error('Error deleting drinking data:', error);
    throw new UserSearchError(
      'Kunne ikke slette drikkedata',
      error.code
    );
  }

  if (!data) {
    throw new UserSearchError('Ingen data ble returnert');
  }

  return data as DeleteDrinkingDataResult;
}

export interface DeleteAccountResult {
  success: boolean;
  message: string;
  deleted_data?: {
    avatar_deleted: boolean;
    user_deleted: boolean;
  };
}

/**
 * Completely delete a user account including all associated data
 * This calls a Supabase Edge Function with admin privileges
 * @returns Result of the deletion operation
 * @throws {UserSearchError} If the request fails or user is unauthorized
 */
export async function deleteUserAccount(): Promise<DeleteAccountResult> {
  // Get the current session to retrieve the access token
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new UserSearchError('Du må være logget inn for å slette kontoen');
  }

  // Get the Supabase URL from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new UserSearchError('Konfigureringsfeil: Mangler Supabase URL');
  }

  // Call the Edge Function
  const response = await fetch(
    `${supabaseUrl}/functions/v1/delete-user-account`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error deleting account:', errorData);
    throw new UserSearchError(
      errorData.error || 'Kunne ikke slette kontoen',
      errorData.details
    );
  }

  const result = await response.json();
  return result as DeleteAccountResult;
}
