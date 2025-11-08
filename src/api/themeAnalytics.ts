/**
 * Theme Analytics API Functions
 *
 * Centralized API layer for fetching theme usage statistics and analytics.
 * Used by admin theme management panel.
 */

import { supabase } from '../lib/supabase';
import type { SessionType } from '../types/database';

// =============================================================================
// Types
// =============================================================================

export interface ThemeStatistics {
  session_type: SessionType;
  total_sessions: number;
  total_participants: number;
  active_sessions: number;
  total_drinks: number;
  avg_participants_per_session: number;
  first_session_created: string | null;
  last_session_created: string | null;
}

export interface ThemeBadgeStatistics {
  session_type: SessionType;
  category: string;
  total_awards: number;
  unique_recipients: number;
  sessions_with_awards: number;
  badge_name: string;
  badge_id: string;
}

export interface ThemeUsageTimeline {
  date: string;
  session_type: SessionType;
  sessions_created: number;
  unique_participants: number;
  total_drinks: number;
}

export interface ThemePeakHours {
  session_type: SessionType;
  hour_of_day: number;
  sessions_started: number;
  participants: number;
  day_of_week: number; // 0=Sunday, 6=Saturday
}

export interface ThemeAnalytics {
  session_type: SessionType;
  total_sessions: number;
  active_sessions: number;
  total_participants: number;
  total_drinks: number;
  avg_participants_per_session: number;
  avg_drinks_per_session: number;
  first_session_created: string | null;
  last_session_created: string | null;
  most_popular_badge_name: string | null;
  most_popular_badge_awards: number;
}

export interface MostPopularTheme {
  session_type: SessionType;
  total_sessions: number;
  total_participants: number;
  popularity_score: number;
}

export interface ThemeComparison {
  metric_name: string;
  theme_a_value: number;
  theme_b_value: number;
  difference: number;
  percent_difference: number | null;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch theme statistics from database view
 */
export async function getThemeStatistics(): Promise<ThemeStatistics[]> {
  const { data, error } = await supabase
    .from('theme_statistics')
    .select('*')
    .order('total_sessions', { ascending: false });

  if (error) {
    console.error('Error fetching theme statistics:', error);
    throw new Error('Kunne ikke hente temastatistikk');
  }

  return data || [];
}

/**
 * Fetch badge statistics grouped by theme
 */
export async function getThemeBadgeStatistics(): Promise<ThemeBadgeStatistics[]> {
  const { data, error } = await supabase
    .from('theme_badge_statistics')
    .select('*')
    .order('total_awards', { ascending: false });

  if (error) {
    console.error('Error fetching theme badge statistics:', error);
    throw new Error('Kunne ikke hente badge-statistikk');
  }

  return data || [];
}

/**
 * Fetch theme usage timeline (daily aggregation)
 * @param days Number of days to look back (default: 30)
 */
export async function getThemeUsageTimeline(days: number = 30): Promise<ThemeUsageTimeline[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('theme_usage_timeline')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching theme usage timeline:', error);
    throw new Error('Kunne ikke hente brukstidslinje');
  }

  return data || [];
}

/**
 * Fetch peak usage hours for each theme
 */
export async function getThemePeakHours(): Promise<ThemePeakHours[]> {
  const { data, error } = await supabase
    .from('theme_peak_hours')
    .select('*')
    .order('sessions_started', { ascending: false });

  if (error) {
    console.error('Error fetching theme peak hours:', error);
    throw new Error('Kunne ikke hente toppbrukstimer');
  }

  return data || [];
}

/**
 * Get comprehensive theme analytics via database function
 * @param sessionType Optional filter for specific theme
 */
export async function getThemeAnalytics(
  sessionType?: SessionType
): Promise<ThemeAnalytics[]> {
  const { data, error } = await supabase.rpc('get_theme_analytics', {
    theme_type: sessionType || null,
  });

  if (error) {
    console.error('Error fetching theme analytics:', error);
    throw new Error('Kunne ikke hente temaanalyse');
  }

  return data || [];
}

/**
 * Get the most popular theme based on usage metrics
 */
export async function getMostPopularTheme(): Promise<MostPopularTheme | null> {
  const { data, error } = await supabase.rpc('get_most_popular_theme');

  if (error) {
    console.error('Error fetching most popular theme:', error);
    throw new Error('Kunne ikke hente mest populære tema');
  }

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Compare two themes side-by-side
 * @param themeA First theme to compare
 * @param themeB Second theme to compare
 */
export async function compareThemes(
  themeA: SessionType,
  themeB: SessionType
): Promise<ThemeComparison[]> {
  const { data, error } = await supabase.rpc('compare_themes', {
    theme_a: themeA,
    theme_b: themeB,
  });

  if (error) {
    console.error('Error comparing themes:', error);
    throw new Error('Kunne ikke sammenligne temaer');
  }

  return data || [];
}

/**
 * Get session count by theme type
 * Lightweight query for quick stats
 */
export async function getSessionCountByTheme(): Promise<
  Record<SessionType, number>
> {
  const { data, error } = await supabase
    .from('sessions')
    .select('session_type');

  if (error) {
    console.error('Error fetching session counts:', error);
    throw new Error('Kunne ikke hente sesjonstellinger');
  }

  // Count sessions by type
  const counts: Record<string, number> = {};
  data?.forEach((session) => {
    const type = session.session_type;
    counts[type] = (counts[type] || 0) + 1;
  });

  return counts as Record<SessionType, number>;
}

/**
 * Get active sessions grouped by theme
 */
export async function getActiveSessionsByTheme(): Promise<
  Record<SessionType, number>
> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('sessions')
    .select('session_type')
    .gt('end_time', now);

  if (error) {
    console.error('Error fetching active sessions by theme:', error);
    throw new Error('Kunne ikke hente aktive sesjoner');
  }

  // Count active sessions by type
  const counts: Record<string, number> = {};
  data?.forEach((session) => {
    const type = session.session_type;
    counts[type] = (counts[type] || 0) + 1;
  });

  return counts as Record<SessionType, number>;
}
