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
