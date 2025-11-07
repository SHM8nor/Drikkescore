/**
 * Admin Users API
 *
 * Handles admin operations for user management including fetching all users
 * with statistics and updating user roles.
 */

import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types/database';

export class AdminUsersError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AdminUsersError';
    this.code = code;
  }
}

/**
 * Extended user profile with computed statistics
 */
export interface AdminUser extends Profile {
  session_count?: number;
  drink_count?: number;
  friend_count?: number;
  last_active?: string;
}

/**
 * Raw user data from Supabase with nested relations for counting
 */
interface RawUserData {
  id: string;
  full_name: string;
  display_name: string;
  weight_kg: number;
  height_cm: number;
  gender: 'male' | 'female';
  age: number;
  role: UserRole;
  avatar_url?: string;
  has_accepted_terms: boolean;
  terms_accepted_at: string | null;
  privacy_policy_version: number;
  last_session_recap_viewed: string | null;
  last_recap_dismissed_at: string | null;
  session_recaps_enabled: boolean;
  created_at: string;
  updated_at: string;
  session_participants?: Array<{ count: number }>;
  drink_entries?: Array<{ count: number }>;
  friendships_user?: Array<{ count: number }>;
  friendships_friend?: Array<{ count: number }>;
  session_active_users?: Array<{ last_seen: string }>;
}

/**
 * Fetch all users with aggregated statistics
 * Only accessible to admin users
 * @returns Array of users with statistics
 * @throws {AdminUsersError} If the request fails or user lacks permissions
 */
export async function getAllUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      session_participants(count),
      drink_entries(count),
      friendships_user:friendships!friendships_user_id_fkey(count),
      friendships_friend:friendships!friendships_friend_id_fkey(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all users:', error);
    throw new AdminUsersError(
      'Kunne ikke hente brukere',
      error.code
    );
  }

  return ((data as RawUserData[]) || []).map((user) => {
    const sessionCount = user.session_participants?.[0]?.count || 0;
    const drinkCount = user.drink_entries?.[0]?.count || 0;
    const friendCountUser = user.friendships_user?.[0]?.count || 0;
    const friendCountFriend = user.friendships_friend?.[0]?.count || 0;
    const friendCount = friendCountUser + friendCountFriend;

    // Note: last_active is currently undefined (session_active_users table not available)
    // This will be populated when the table exists with proper foreign key relationship
    const lastActive = user.session_active_users?.[0]?.last_seen;

    return {
      id: user.id,
      full_name: user.full_name,
      display_name: user.display_name,
      weight_kg: user.weight_kg,
      height_cm: user.height_cm,
      gender: user.gender,
      age: user.age,
      role: user.role,
      avatar_url: user.avatar_url,
      has_accepted_terms: user.has_accepted_terms,
      terms_accepted_at: user.terms_accepted_at,
      privacy_policy_version: user.privacy_policy_version,
      last_session_recap_viewed: user.last_session_recap_viewed,
      last_recap_dismissed_at: user.last_recap_dismissed_at,
      session_recaps_enabled: user.session_recaps_enabled,
      created_at: user.created_at,
      updated_at: user.updated_at,
      session_count: sessionCount,
      drink_count: drinkCount,
      friend_count: friendCount,
      last_active: lastActive,
    } as AdminUser;
  });
}

/**
 * Update a user's role
 * Only accessible to admin users
 * @param userId - The ID of the user to update
 * @param role - The new role to assign
 * @returns The updated profile
 * @throws {AdminUsersError} If the request fails or user lacks permissions
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user role:', error);
    throw new AdminUsersError(
      'Kunne ikke oppdatere brukerrolle',
      error.code
    );
  }

  if (!data) {
    throw new AdminUsersError('Bruker ikke funnet');
  }

  return data;
}
