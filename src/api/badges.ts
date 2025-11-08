/**
 * Badges API
 *
 * Handles all badge-related operations including:
 * - Badge CRUD (admin)
 * - User badge management
 * - Badge progress tracking
 * - Badge statistics
 */

import { supabase } from '../lib/supabase';
import type {
  Badge,
  UserBadge,
  UserBadgeWithDetails,
  BadgeProgress,
  UserBadgeStats,
  CreateBadgeFormData,
  UpdateBadgeFormData,
  AwardBadgeFormData,
} from '../types/badges';

// =============================================================================
// Error Handling
// =============================================================================

export class BadgeError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'BadgeError';
    this.code = code;
  }
}

// =============================================================================
// Badge CRUD (Admin)
// =============================================================================

/**
 * Fetch all badges from the system
 * @returns Array of all badges
 * @throws {BadgeError} If the request fails
 */
export async function getBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('tier_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching badges:', error);
    throw new BadgeError('Kunne ikke hente merker');
  }

  return data || [];
}

/**
 * Get a single badge by ID
 * @param badgeId - The badge ID to fetch
 * @returns The badge or null if not found
 * @throws {BadgeError} If the request fails
 */
export async function getBadge(badgeId: string): Promise<Badge | null> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('id', badgeId)
    .single();

  if (error) {
    // Handle case where badge doesn't exist
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching badge:', error);
    throw new BadgeError('Kunne ikke hente merke');
  }

  return data;
}

/**
 * Get a badge by its unique code
 * @param code - The badge code to fetch
 * @returns The badge or null if not found
 * @throws {BadgeError} If the request fails
 */
export async function getBadgeByCode(code: string): Promise<Badge | null> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    console.error('Error fetching badge by code:', error);
    throw new BadgeError('Kunne ikke hente merke');
  }

  return data;
}

/**
 * Create a new badge (admin only)
 * @param data - Badge creation data
 * @returns The created badge
 * @throws {BadgeError} If the request fails
 */
export async function createBadge(data: CreateBadgeFormData): Promise<Badge> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BadgeError('Du må være logget inn for å opprette merker');
  }

  const { data: badge, error } = await supabase
    .from('badges')
    .insert({
      code: data.code,
      title: data.title,
      description: data.description,
      category: data.category,
      tier: data.tier,
      tier_order: data.tier_order,
      icon_url: data.icon_url || null,
      criteria: data.criteria,
      is_active: data.is_active,
      is_automatic: data.is_automatic,
      points: data.points,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating badge:', error);
    if (error.code === '23505') {
      throw new BadgeError('Et merke med denne koden finnes allerede');
    }
    throw new BadgeError('Kunne ikke opprette merke');
  }

  return badge;
}

/**
 * Update an existing badge (admin only)
 * @param badgeId - The badge ID to update
 * @param data - Updated badge data
 * @returns The updated badge
 * @throws {BadgeError} If the request fails
 */
export async function updateBadge(
  badgeId: string,
  data: UpdateBadgeFormData
): Promise<Badge> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BadgeError('Du må være logget inn for å oppdatere merker');
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  // Only include fields that are provided
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tier !== undefined) updateData.tier = data.tier;
  if (data.tier_order !== undefined) updateData.tier_order = data.tier_order;
  // Allow icon_url to be set to null (for deletion)
  if ('icon_url' in data) updateData.icon_url = data.icon_url;
  if (data.criteria !== undefined) updateData.criteria = data.criteria;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.is_automatic !== undefined) updateData.is_automatic = data.is_automatic;
  if (data.points !== undefined) updateData.points = data.points;

  const { data: badge, error } = await supabase
    .from('badges')
    .update(updateData)
    .eq('id', badgeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating badge:', error);
    throw new BadgeError('Kunne ikke oppdatere merke');
  }

  if (!badge) {
    throw new BadgeError('Merke ikke funnet');
  }

  return badge;
}

/**
 * Delete a badge (admin only)
 * @param badgeId - The badge ID to delete
 * @throws {BadgeError} If the request fails
 */
export async function deleteBadge(badgeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BadgeError('Du må være logget inn for å slette merker');
  }

  const { error } = await supabase
    .from('badges')
    .delete()
    .eq('id', badgeId);

  if (error) {
    console.error('Error deleting badge:', error);
    throw new BadgeError('Kunne ikke slette merke');
  }
}

// =============================================================================
// User Badges
// =============================================================================

/**
 * Get all badges earned by a user with full badge details
 * @param userId - The user ID to fetch badges for
 * @returns Array of earned badges with details
 * @throws {BadgeError} If the request fails
 */
export async function getUserBadges(userId: string): Promise<UserBadgeWithDetails[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching user badges:', error);
    throw new BadgeError('Kunne ikke hente brukermerker');
  }

  return data || [];
}

/**
 * Get user's progress toward all active badges
 * @param userId - The user ID to fetch progress for
 * @returns Array of badge progress records
 * @throws {BadgeError} If the request fails
 */
export async function getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
  const { data, error } = await supabase
    .from('badge_progress')
    .select('*')
    .eq('user_id', userId)
    .order('last_updated', { ascending: false });

  if (error) {
    console.error('Error fetching badge progress:', error);
    throw new BadgeError('Kunne ikke hente merkeprogresjon');
  }

  return data || [];
}

/**
 * Get progress for a specific badge for a user
 * @param userId - The user ID
 * @param badgeId - The badge ID
 * @returns Badge progress record or null if not found
 * @throws {BadgeError} If the request fails
 */
export async function getUserBadgeProgress(
  userId: string,
  badgeId: string
): Promise<BadgeProgress | null> {
  const { data, error } = await supabase
    .from('badge_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user badge progress:', error);
    throw new BadgeError('Kunne ikke hente merkeprogresjon');
  }

  return data;
}

/**
 * Award a badge to a user
 * Uses the database function 'award_badge' to ensure proper validation
 * @param data - Badge award data
 * @returns The created user badge record
 * @throws {BadgeError} If the request fails
 */
export async function awardBadge(data: AwardBadgeFormData): Promise<UserBadge> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BadgeError('Du må være logget inn for å tildele merker');
  }

  // First fetch the badge to get its code (RPC function expects code, not ID)
  const { data: badge, error: badgeError } = await supabase
    .from('badges')
    .select('code')
    .eq('id', data.badge_id)
    .single();

  if (badgeError || !badge) {
    console.error('Error fetching badge:', badgeError);
    throw new BadgeError('Badge ikke funnet');
  }

  // Call the database function to award the badge
  const { data: userBadgeId, error } = await supabase.rpc('award_badge', {
    p_user_id: data.user_id,
    p_badge_code: badge.code,
    p_session_id: data.session_id || null,
    p_metadata: data.metadata || null,
  });

  if (error) {
    console.error('Error awarding badge:', error);
    if (error.message.includes('already earned')) {
      throw new BadgeError('Brukeren har allerede fått dette merket');
    }
    throw new BadgeError('Kunne ikke tildele merke');
  }

  if (!userBadgeId) {
    throw new BadgeError('Ingen ID returnert fra merketildeling');
  }

  // Fetch the full user_badge record (RPC function returns only UUID)
  const { data: userBadge, error: fetchError } = await supabase
    .from('user_badges')
    .select('*')
    .eq('id', userBadgeId)
    .single();

  if (fetchError || !userBadge) {
    console.error('Error fetching awarded badge:', fetchError);
    throw new BadgeError('Kunne ikke hente tildelt merke');
  }

  return userBadge;
}

/**
 * Revoke a badge from a user (admin only)
 * @param userBadgeId - The user_badge ID to revoke
 * @throws {BadgeError} If the request fails
 */
export async function revokeBadge(userBadgeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new BadgeError('Du må være logget inn for å tilbakekalle merker');
  }

  const { error } = await supabase
    .from('user_badges')
    .delete()
    .eq('id', userBadgeId);

  if (error) {
    console.error('Error revoking badge:', error);
    throw new BadgeError('Kunne ikke tilbakekalle merke');
  }
}

// =============================================================================
// Badge Statistics
// =============================================================================

/**
 * Get badge statistics for a user
 * Calculates total earned, points, and breakdown by tier and category
 * @param userId - The user ID to get statistics for
 * @returns User badge statistics
 * @throws {BadgeError} If the request fails
 */
export async function getUserBadgeStats(userId: string): Promise<UserBadgeStats> {
  // Fetch all user badges with badge details
  const userBadges = await getUserBadges(userId);

  // Initialize stats
  const stats: UserBadgeStats = {
    total_earned: userBadges.length,
    total_points: 0,
    by_tier: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      legendary: 0,
    },
    by_category: {
      session: 0,
      global: 0,
      social: 0,
      milestone: 0,
    },
  };

  // Calculate totals
  userBadges.forEach((userBadge) => {
    const badge = userBadge.badge;
    stats.total_points += badge.points;
    stats.by_tier[badge.tier]++;
    stats.by_category[badge.category]++;
  });

  return stats;
}

/**
 * Get all users who have earned a specific badge
 * @param badgeId - The badge ID
 * @returns Array of user badges with user details
 * @throws {BadgeError} If the request fails
 */
export async function getBadgeRecipients(
  badgeId: string
): Promise<UserBadgeWithDetails[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*),
      user:profiles(id, display_name, avatar_url)
    `)
    .eq('badge_id', badgeId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching badge recipients:', error);
    throw new BadgeError('Kunne ikke hente merke-mottakere');
  }

  return data || [];
}

/**
 * Get recently earned badges for a user
 * @param userId - The user ID
 * @param limit - Maximum number of recent badges to return (default: 5)
 * @returns Array of recently earned badges with details
 * @throws {BadgeError} If the request fails
 */
export async function getRecentBadges(
  userId: string,
  limit: number = 5
): Promise<UserBadgeWithDetails[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent badges:', error);
    throw new BadgeError('Kunne ikke hente nylige merker');
  }

  return data || [];
}

// =============================================================================
// Badge Discovery
// =============================================================================

/**
 * Get all active badges available to be earned
 * @returns Array of active badges
 * @throws {BadgeError} If the request fails
 */
export async function getActiveBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('tier_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching active badges:', error);
    throw new BadgeError('Kunne ikke hente aktive merker');
  }

  return data || [];
}

/**
 * Get badges filtered by category
 * @param category - The badge category to filter by
 * @returns Array of badges in that category
 * @throws {BadgeError} If the request fails
 */
export async function getBadgesByCategory(category: string): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('tier_order', { ascending: true });

  if (error) {
    console.error('Error fetching badges by category:', error);
    throw new BadgeError('Kunne ikke hente merker etter kategori');
  }

  return data || [];
}

/**
 * Get badges filtered by tier
 * @param tier - The badge tier to filter by
 * @returns Array of badges in that tier
 * @throws {BadgeError} If the request fails
 */
export async function getBadgesByTier(tier: string): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('tier', tier)
    .eq('is_active', true)
    .order('tier_order', { ascending: true });

  if (error) {
    console.error('Error fetching badges by tier:', error);
    throw new BadgeError('Kunne ikke hente merker etter nivå');
  }

  return data || [];
}

// =============================================================================
// Real-time Subscriptions
// =============================================================================

/**
 * Subscribe to user badge changes for a specific user
 * @param userId - The user ID to monitor
 * @param callback - Function to call when badges change
 * @returns Unsubscribe function
 */
export function subscribeUserBadges(
  userId: string,
  callback: (payload: { eventType: string; new: UserBadge; old: UserBadge }) => void
): () => void {
  const subscription = supabase
    .channel(`user_badges:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_badges',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as UserBadge,
          old: payload.old as UserBadge,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Subscribe to badge progress changes for a specific user
 * @param userId - The user ID to monitor
 * @param callback - Function to call when progress changes
 * @returns Unsubscribe function
 */
export function subscribeBadgeProgress(
  userId: string,
  callback: (payload: { eventType: string; new: BadgeProgress; old: BadgeProgress }) => void
): () => void {
  const subscription = supabase
    .channel(`badge_progress:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'badge_progress',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as BadgeProgress,
          old: payload.old as BadgeProgress,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}
