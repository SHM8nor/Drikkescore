/**
 * Friendship API
 *
 * Handles all friend-related operations including:
 * - Sending friend requests
 * - Accepting/declining friend requests
 * - Getting friends list
 * - Blocking/unblocking users
 * - Real-time friend status updates
 */

import { supabase } from '../lib/supabase';
import type {
  Friendship,
  Friend,
  FriendRequest,
  SentFriendRequest,
  FriendshipStatus,
} from '../types/database';

// =============================================================================
// Error Handling
// =============================================================================

export class FriendshipError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'FriendshipError';
    this.code = code;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validate UUID format
 * @param id - The ID to validate
 * @returns True if valid UUID
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) && id.length === 36;
}

/**
 * Validate and sanitize user ID
 * @param id - The ID to validate
 * @param fieldName - Name of the field for error messages
 * @throws {FriendshipError} If ID is invalid
 */
function validateUserId(id: string, fieldName: string = 'User ID'): void {
  if (!isValidUUID(id)) {
    throw new FriendshipError(`${fieldName} må være en gyldig UUID`);
  }
}

// =============================================================================
// Friend Requests
// =============================================================================

/**
 * Send a friend request to another user
 * @param friendId - The user ID to send the friend request to
 * @returns The created friendship record
 * @throws {FriendshipError} If the request fails or already exists
 */
export async function sendFriendRequest(friendId: string): Promise<Friendship> {
  // Validate friendId BEFORE using it in queries
  validateUserId(friendId, 'Venn ID');

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new FriendshipError('Du må være logget inn for å sende venneforespørsler');
  }

  if (user.id === friendId) {
    throw new FriendshipError('Du kan ikke sende venneforespørsel til deg selv');
  }

  // Check if friendship already exists in either direction
  // Use maybeSingle() to avoid throwing on no results
  // SECURITY: IDs validated above, safe to use in .or() filter
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'pending') {
      throw new FriendshipError('Venneforespørsel allerede sendt');
    } else if (existing.status === 'accepted') {
      throw new FriendshipError('Dere er allerede venner');
    } else if (existing.status === 'blocked') {
      throw new FriendshipError('Kan ikke sende venneforespørsel');
    }
  }

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending' as FriendshipStatus,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending friend request:', error);
    throw new FriendshipError('Kunne ikke sende venneforespørsel');
  }

  return data;
}

/**
 * Accept a friend request
 * @param friendshipId - The friendship record ID to accept
 * @returns The updated friendship record
 * @throws {FriendshipError} If the request fails
 */
export async function acceptFriendRequest(friendshipId: string): Promise<Friendship> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new FriendshipError('Du må være logget inn');
  }

  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' as FriendshipStatus })
    .eq('id', friendshipId)
    .eq('friend_id', user.id) // Ensure user is the recipient
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    console.error('Error accepting friend request:', error);
    throw new FriendshipError('Kunne ikke akseptere venneforespørsel');
  }

  if (!data) {
    throw new FriendshipError('Venneforespørsel ikke funnet');
  }

  return data;
}

/**
 * Decline a friend request
 * @param friendshipId - The friendship record ID to decline
 * @throws {FriendshipError} If the request fails
 *
 * Note: Declined requests are deleted rather than marked as 'declined' to allow
 * the sender to send a new request in the future if desired.
 */
export async function declineFriendRequest(friendshipId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new FriendshipError('Du må være logget inn');
  }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('friend_id', user.id) // Ensure user is the recipient
    .eq('status', 'pending');

  if (error) {
    console.error('Error declining friend request:', error);
    throw new FriendshipError('Kunne ikke avslå venneforespørsel');
  }
}

/**
 * Cancel a sent friend request
 * @param friendshipId - The friendship record ID to cancel
 * @throws {FriendshipError} If the request fails
 */
export async function cancelFriendRequest(friendshipId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new FriendshipError('Du må være logget inn');
  }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
    .eq('user_id', user.id) // Ensure user is the sender
    .eq('status', 'pending');

  if (error) {
    console.error('Error canceling friend request:', error);
    throw new FriendshipError('Kunne ikke kansellere venneforespørsel');
  }
}

// =============================================================================
// Friend Lists
// =============================================================================

/**
 * Get all accepted friends for the current user
 * @returns Array of friends
 * @throws {FriendshipError} If the request fails
 */
export async function getFriends(): Promise<Friend[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new FriendshipError('Du må være logget inn');
  }

  const { data, error } = await supabase.rpc('get_friends', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Error fetching friends:', error);
    throw new FriendshipError('Kunne ikke hente venner');
  }

  return data || [];
}

/**
 * Get pending friend requests sent to the current user
 * @returns Array of friend requests
 * @throws {FriendshipError} If the request fails
 */
export async function getPendingRequests(): Promise<FriendRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new FriendshipError('Du må være logget inn');
  }

  const { data, error } = await supabase.rpc('get_pending_requests', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Error fetching pending requests:', error);
    throw new FriendshipError('Kunne ikke hente venneforespørsler');
  }

  return data || [];
}

/**
 * Get pending friend requests sent by the current user
 * @returns Array of sent friend requests
 * @throws {FriendshipError} If the request fails
 */
export async function getSentRequests(): Promise<SentFriendRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new FriendshipError('Du må være logget inn');
  }

  const { data, error } = await supabase.rpc('get_sent_requests', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Error fetching sent requests:', error);
    throw new FriendshipError('Kunne ikke hente sendte forespørsler');
  }

  return data || [];
}

// =============================================================================
// Friend Management
// =============================================================================

/**
 * Remove a friend (unfriend)
 * @param friendId - The user ID to unfriend
 * @throws {FriendshipError} If the request fails
 */
export async function removeFriend(friendId: string): Promise<void> {
  // Validate friendId BEFORE using it in queries
  validateUserId(friendId, 'Venn ID');

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new FriendshipError('Du må være logget inn');
  }

  // SECURITY: IDs validated above, safe to use in .or() filter
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error removing friend:', error);
    throw new FriendshipError('Kunne ikke fjerne venn');
  }
}

/**
 * Block a user
 * @param userId - The user ID to block
 * @returns The updated friendship record
 * @throws {FriendshipError} If the request fails
 */
export async function blockUser(userId: string): Promise<Friendship> {
  // Validate userId BEFORE using it in queries
  validateUserId(userId, 'Bruker ID');

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new FriendshipError('Du må være logget inn');
  }

  // First, try to find existing friendship
  // Use maybeSingle() to avoid throwing on no results
  // SECURITY: IDs validated above, safe to use in .or() filter
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    // Update existing friendship to blocked
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'blocked' as FriendshipStatus })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error blocking user:', error);
      throw new FriendshipError('Kunne ikke blokkere bruker');
    }

    return data;
  } else {
    // Create new blocked friendship
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: userId,
        status: 'blocked' as FriendshipStatus,
      })
      .select()
      .single();

    if (error) {
      console.error('Error blocking user:', error);
      throw new FriendshipError('Kunne ikke blokkere bruker');
    }

    return data;
  }
}

/**
 * Unblock a user
 * @param userId - The user ID to unblock
 * @throws {FriendshipError} If the request fails
 */
export async function unblockUser(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new FriendshipError('Du må være logget inn');
  }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', user.id)
    .eq('friend_id', userId)
    .eq('status', 'blocked');

  if (error) {
    console.error('Error unblocking user:', error);
    throw new FriendshipError('Kunne ikke fjerne blokkering');
  }
}

// =============================================================================
// Friendship Status Checks
// =============================================================================

/**
 * Check if two users are friends
 * @param friendId - The user ID to check friendship with
 * @returns True if users are friends
 */
export async function areFriends(friendId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase.rpc('are_friends', {
    p_user_id: user.id,
    p_friend_id: friendId,
  });

  if (error) {
    console.error('Error checking friendship:', error);
    return false;
  }

  return data || false;
}

/**
 * Get friendship status between current user and another user
 * @param userId - The user ID to check status with
 * @returns The friendship status or 'none' if no relationship exists
 */
export async function getFriendshipStatus(userId: string): Promise<FriendshipStatus | 'none'> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return 'none';
  }

  const { data, error } = await supabase.rpc('get_friendship_status', {
    p_user_id: user.id,
    p_friend_id: userId,
  });

  if (error) {
    console.error('Error getting friendship status:', error);
    return 'none';
  }

  return data || 'none';
}

// =============================================================================
// Real-time Subscriptions
// =============================================================================

/**
 * Subscribe to friendship changes for the current user
 * @param callback - Function to call when friendships change
 * @returns Unsubscribe function
 */
export async function subscribeFriendships(
  callback: (payload: { eventType: string; new: Friendship; old: Friendship }) => void
): Promise<() => void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn('User not authenticated, cannot subscribe to friendships');
    return () => {};
  }

  const subscription = supabase
    .channel('friendships')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friendships',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as Friendship,
          old: payload.old as Friendship,
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friendships',
        filter: `friend_id=eq.${user.id}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as Friendship,
          old: payload.old as Friendship,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}
