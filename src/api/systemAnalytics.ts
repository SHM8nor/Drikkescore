/**
 * System Analytics API
 *
 * Handles admin-level system-wide analytics and statistics.
 */

import { supabase } from '../lib/supabase';
import type { Profile, DrinkEntry } from '../types/database';

export class SystemAnalyticsError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'SystemAnalyticsError';
    this.code = code;
  }
}

// =============================================================================
// Type Definitions
// =============================================================================

export interface SystemStats {
  totalUsers: number;
  activeUsers: number; // Users with at least one session
  totalSessions: number;
  activeSessions: number; // Sessions currently in progress
  totalDrinks: number;
  totalFriendships: number;
  avgBACAllTime: number;
  avgSessionDuration: number; // In hours
}

export interface GrowthData {
  date: string;
  users: number;
  sessions: number;
}

export interface ActivityHeatmap {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  hour: number; // 0-23
  count: number;
}

export interface TopUser {
  user_id: string;
  full_name: string;
  display_name: string;
  avatar_url: string | null;
  total_drinks: number;
  total_sessions: number;
  peak_bac: number;
  total_friends: number;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get system-wide aggregate statistics
 * @returns System statistics
 * @throws {SystemAnalyticsError} If the request fails
 */
export async function getSystemStats(): Promise<SystemStats> {
  try {
    // Fetch multiple statistics in parallel
    const [
      usersResult,
      activeUsersResult,
      sessionsResult,
      activeSessionsResult,
      drinksResult,
      friendshipsResult,
    ] = await Promise.all([
      // Total users
      supabase.from('profiles').select('id', { count: 'exact', head: true }),

      // Active users (users with at least one session participation)
      supabase.from('session_participants').select('user_id', { count: 'exact', head: false }),

      // Total sessions
      supabase.from('sessions').select('id', { count: 'exact', head: true }),

      // Active sessions (end_time in the future)
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .gt('end_time', new Date().toISOString()),

      // Total drinks
      supabase.from('drink_entries').select('id', { count: 'exact', head: true }),

      // Total friendships (count only accepted friendships once)
      supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted'),
    ]);

    // Check for errors
    if (usersResult.error) throw usersResult.error;
    if (activeUsersResult.error) throw activeUsersResult.error;
    if (sessionsResult.error) throw sessionsResult.error;
    if (activeSessionsResult.error) throw activeSessionsResult.error;
    if (drinksResult.error) throw drinksResult.error;
    if (friendshipsResult.error) throw friendshipsResult.error;

    // Count unique active users
    const uniqueActiveUsers = new Set(
      (activeUsersResult.data || []).map((p) => p.user_id)
    ).size;

    // Fetch session durations for average calculation
    const { data: sessions, error: sessionDurationError } = await supabase
      .from('sessions')
      .select('start_time, end_time');

    if (sessionDurationError) throw sessionDurationError;

    // Calculate average session duration
    let avgSessionDuration = 0;
    if (sessions && sessions.length > 0) {
      const totalDuration = sessions.reduce((sum, session) => {
        const start = new Date(session.start_time).getTime();
        const end = new Date(session.end_time).getTime();
        return sum + (end - start);
      }, 0);
      avgSessionDuration = totalDuration / sessions.length / (1000 * 60 * 60); // Convert to hours
    }

    return {
      totalUsers: usersResult.count || 0,
      activeUsers: uniqueActiveUsers,
      totalSessions: sessionsResult.count || 0,
      activeSessions: activeSessionsResult.count || 0,
      totalDrinks: drinksResult.count || 0,
      totalFriendships: (friendshipsResult.count || 0) / 2, // Divide by 2 since friendships are bidirectional
      avgBACAllTime: 0, // Will be calculated by utility function with actual drink data
      avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw new SystemAnalyticsError(
      'Kunne ikke hente systemstatistikk',
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * Get growth data over time (users and sessions by date)
 * @param period Number of days to look back (default: 30)
 * @returns Time-series growth data
 * @throws {SystemAnalyticsError} If the request fails
 */
export async function getGrowthData(period: number = 30): Promise<GrowthData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    const startDateStr = startDate.toISOString();

    // Fetch users created within period
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDateStr)
      .order('created_at');

    if (usersError) throw usersError;

    // Fetch sessions created within period
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('created_at')
      .gte('created_at', startDateStr)
      .order('created_at');

    if (sessionsError) throw sessionsError;

    // Group by date
    const growthMap = new Map<string, { users: number; sessions: number }>();

    // Initialize all dates in the period
    for (let i = 0; i <= period; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      growthMap.set(dateStr, { users: 0, sessions: 0 });
    }

    // Count users by date
    users?.forEach((user) => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      const existing = growthMap.get(date);
      if (existing) {
        existing.users += 1;
      }
    });

    // Count sessions by date
    sessions?.forEach((session) => {
      const date = new Date(session.created_at).toISOString().split('T')[0];
      const existing = growthMap.get(date);
      if (existing) {
        existing.sessions += 1;
      }
    });

    // Convert to array and calculate cumulative counts
    const growthData: GrowthData[] = [];
    let cumulativeUsers = 0;
    let cumulativeSessions = 0;

    Array.from(growthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, counts]) => {
        cumulativeUsers += counts.users;
        cumulativeSessions += counts.sessions;
        growthData.push({
          date,
          users: cumulativeUsers,
          sessions: cumulativeSessions,
        });
      });

    return growthData;
  } catch (error) {
    console.error('Error fetching growth data:', error);
    throw new SystemAnalyticsError(
      'Kunne ikke hente vekstdata',
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * Get activity heatmap (sessions by day of week and hour)
 * @returns Activity heatmap data
 * @throws {SystemAnalyticsError} If the request fails
 */
export async function getActivityHeatmap(): Promise<ActivityHeatmap[]> {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('start_time');

    if (error) throw error;

    // Count sessions by day of week and hour
    const heatmapMap = new Map<string, number>();

    sessions?.forEach((session) => {
      const date = new Date(session.start_time);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}`;
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    });

    // Convert to array
    const heatmap: ActivityHeatmap[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        heatmap.push({
          dayOfWeek: day,
          hour,
          count: heatmapMap.get(key) || 0,
        });
      }
    }

    return heatmap;
  } catch (error) {
    console.error('Error fetching activity heatmap:', error);
    throw new SystemAnalyticsError(
      'Kunne ikke hente aktivitetskart',
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * Get top users by various metrics
 * @param limit Maximum number of users to return (default: 10)
 * @returns Top users with their statistics
 * @throws {SystemAnalyticsError} If the request fails
 */
export async function getTopUsers(limit: number = 10): Promise<TopUser[]> {
  try {
    // Fetch all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, avatar_url');

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) return [];

    // Fetch drinks and sessions for all users in parallel
    const [drinksResult, participationsResult, friendshipsResult] = await Promise.all([
      supabase.from('drink_entries').select('user_id, id'),
      supabase.from('session_participants').select('user_id, session_id'),
      supabase
        .from('friendships')
        .select('user_id, friend_id')
        .eq('status', 'accepted'),
    ]);

    if (drinksResult.error) throw drinksResult.error;
    if (participationsResult.error) throw participationsResult.error;
    if (friendshipsResult.error) throw friendshipsResult.error;

    // Aggregate user statistics
    const userStatsMap = new Map<string, {
      total_drinks: number;
      total_sessions: Set<string>;
      total_friends: number;
    }>();

    profiles.forEach((profile) => {
      userStatsMap.set(profile.id, {
        total_drinks: 0,
        total_sessions: new Set(),
        total_friends: 0,
      });
    });

    // Count drinks
    drinksResult.data?.forEach((drink) => {
      const stats = userStatsMap.get(drink.user_id);
      if (stats) {
        stats.total_drinks += 1;
      }
    });

    // Count unique sessions
    participationsResult.data?.forEach((participation) => {
      const stats = userStatsMap.get(participation.user_id);
      if (stats) {
        stats.total_sessions.add(participation.session_id);
      }
    });

    // Count friends
    friendshipsResult.data?.forEach((friendship) => {
      const stats = userStatsMap.get(friendship.user_id);
      if (stats) {
        stats.total_friends += 1;
      }
    });

    // Build top users array
    const topUsers: TopUser[] = profiles.map((profile) => {
      const stats = userStatsMap.get(profile.id)!;
      return {
        user_id: profile.id,
        full_name: profile.full_name,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url || null,
        total_drinks: stats.total_drinks,
        total_sessions: stats.total_sessions.size,
        peak_bac: 0, // Will be calculated by utility function
        total_friends: stats.total_friends,
      };
    });

    // Sort by total drinks (can be changed to different metric)
    topUsers.sort((a, b) => b.total_drinks - a.total_drinks);

    return topUsers.slice(0, limit);
  } catch (error) {
    console.error('Error fetching top users:', error);
    throw new SystemAnalyticsError(
      'Kunne ikke hente toppliste',
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * Fetch all drinks and profiles for BAC calculation
 * Used by utility functions to calculate system-wide BAC statistics
 * @returns All drinks and profiles
 * @throws {SystemAnalyticsError} If the request fails
 */
export async function getAllDrinksAndProfiles(): Promise<{
  drinks: DrinkEntry[];
  profiles: Profile[];
}> {
  try {
    const [drinksResult, profilesResult] = await Promise.all([
      supabase.from('drink_entries').select('*'),
      supabase.from('profiles').select('*'),
    ]);

    if (drinksResult.error) throw drinksResult.error;
    if (profilesResult.error) throw profilesResult.error;

    return {
      drinks: drinksResult.data || [],
      profiles: profilesResult.data || [],
    };
  } catch (error) {
    console.error('Error fetching drinks and profiles:', error);
    throw new SystemAnalyticsError(
      'Kunne ikke hente drikke- og profildata',
      error instanceof Error ? error.message : undefined
    );
  }
}
