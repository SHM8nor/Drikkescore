/**
 * System Analytics Calculator
 *
 * Pure utility functions for calculating system-wide analytics and statistics.
 * These functions work with aggregated data and do not make API calls.
 */

import type { DrinkEntry, Profile, Session } from '../types/database';
import type { TopUser } from '../api/systemAnalytics';
import { calculateBAC } from './bacCalculator';

// =============================================================================
// BAC Calculation Functions
// =============================================================================

/**
 * Calculate system-wide average BAC from all drinks and profiles
 * Samples BAC at regular intervals for all users and averages
 *
 * @param allDrinks All drink entries in the system
 * @param allProfiles All user profiles
 * @returns Average BAC across all users and time
 */
export function calculateSystemBAC(
  allDrinks: DrinkEntry[],
  allProfiles: Profile[]
): number {
  if (allDrinks.length === 0 || allProfiles.length === 0) {
    return 0;
  }

  // Group drinks by user
  const drinksByUser = new Map<string, DrinkEntry[]>();
  allDrinks.forEach((drink) => {
    if (!drinksByUser.has(drink.user_id)) {
      drinksByUser.set(drink.user_id, []);
    }
    drinksByUser.get(drink.user_id)!.push(drink);
  });

  // Create profile map for quick lookup
  const profileMap = new Map<string, Profile>();
  allProfiles.forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  // Calculate average BAC for each user
  const userAverageBacs: number[] = [];

  drinksByUser.forEach((drinks, userId) => {
    const profile = profileMap.get(userId);
    if (!profile) return;

    // Find time range for this user's drinks
    const times = drinks.map((d) => new Date(d.consumed_at).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Sample BAC every 10 minutes
    const sampleInterval = 10 * 60 * 1000; // 10 minutes in ms
    const samples: number[] = [];

    for (let time = minTime; time <= maxTime; time += sampleInterval) {
      const bac = calculateBAC(drinks, profile, new Date(time));
      samples.push(bac);
    }

    if (samples.length > 0) {
      const avgBac = samples.reduce((sum, bac) => sum + bac, 0) / samples.length;
      userAverageBacs.push(avgBac);
    }
  });

  // Calculate overall average
  if (userAverageBacs.length === 0) return 0;

  const systemAvgBAC =
    userAverageBacs.reduce((sum, bac) => sum + bac, 0) / userAverageBacs.length;

  return Math.round(systemAvgBAC * 10000) / 10000;
}

/**
 * Calculate peak BAC for each user and return the user with highest peak BAC
 *
 * @param allDrinks All drink entries in the system
 * @param allProfiles All user profiles
 * @param topUsers Array of top users to calculate peak BAC for
 * @returns Array of top users with peak BAC calculated
 */
export function calculateTopUsersPeakBAC(
  allDrinks: DrinkEntry[],
  allProfiles: Profile[],
  topUsers: TopUser[]
): TopUser[] {
  // Group drinks by user
  const drinksByUser = new Map<string, DrinkEntry[]>();
  allDrinks.forEach((drink) => {
    if (!drinksByUser.has(drink.user_id)) {
      drinksByUser.set(drink.user_id, []);
    }
    drinksByUser.get(drink.user_id)!.push(drink);
  });

  // Create profile map for quick lookup
  const profileMap = new Map<string, Profile>();
  allProfiles.forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  // Calculate peak BAC for each top user
  return topUsers.map((user) => {
    const drinks = drinksByUser.get(user.user_id);
    const profile = profileMap.get(user.user_id);

    if (!drinks || !profile || drinks.length === 0) {
      return { ...user, peak_bac: 0 };
    }

    // Find time range for this user's drinks
    const times = drinks.map((d) => new Date(d.consumed_at).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Sample BAC every 10 minutes to find peak
    const sampleInterval = 10 * 60 * 1000; // 10 minutes in ms
    let peakBAC = 0;

    for (let time = minTime; time <= maxTime; time += sampleInterval) {
      const bac = calculateBAC(drinks, profile, new Date(time));
      peakBAC = Math.max(peakBAC, bac);
    }

    return {
      ...user,
      peak_bac: Math.round(peakBAC * 10000) / 10000,
    };
  });
}

// =============================================================================
// Session Metrics Functions
// =============================================================================

export interface SessionMetrics {
  totalSessions: number;
  avgDuration: number; // hours
  avgParticipants: number;
  longestSession: {
    duration: number;
    session_name: string;
  } | null;
  shortestSession: {
    duration: number;
    session_name: string;
  } | null;
}

/**
 * Aggregate session metrics from session data
 *
 * @param sessions All sessions
 * @param participants Session participants count by session ID
 * @returns Aggregated session metrics
 */
export function aggregateSessionMetrics(
  sessions: Session[],
  participants: Map<string, number>
): SessionMetrics {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      avgDuration: 0,
      avgParticipants: 0,
      longestSession: null,
      shortestSession: null,
    };
  }

  // Calculate durations
  const durations = sessions.map((session) => {
    const start = new Date(session.start_time).getTime();
    const end = new Date(session.end_time).getTime();
    const durationHours = (end - start) / (1000 * 60 * 60);
    return {
      duration: durationHours,
      session_name: session.session_name,
    };
  });

  // Average duration
  const avgDuration =
    durations.reduce((sum, d) => sum + d.duration, 0) / durations.length;

  // Longest and shortest sessions
  const sortedDurations = [...durations].sort((a, b) => b.duration - a.duration);
  const longestSession = sortedDurations[0];
  const shortestSession = sortedDurations[sortedDurations.length - 1];

  // Average participants
  let totalParticipants = 0;
  sessions.forEach((session) => {
    totalParticipants += participants.get(session.id) || 0;
  });
  const avgParticipants = totalParticipants / sessions.length;

  return {
    totalSessions: sessions.length,
    avgDuration: Math.round(avgDuration * 100) / 100,
    avgParticipants: Math.round(avgParticipants * 10) / 10,
    longestSession: {
      duration: Math.round(longestSession.duration * 100) / 100,
      session_name: longestSession.session_name,
    },
    shortestSession: {
      duration: Math.round(shortestSession.duration * 100) / 100,
      session_name: shortestSession.session_name,
    },
  };
}

// =============================================================================
// Growth Rate Functions
// =============================================================================

export interface GrowthRate {
  value: number; // Percentage
  trend: 'up' | 'down' | 'stable';
}

/**
 * Calculate growth rate between two periods
 *
 * @param current Current period value
 * @param previous Previous period value
 * @returns Growth rate as percentage and trend
 */
export function calculateGrowthRate(current: number, previous: number): GrowthRate {
  if (previous === 0) {
    return {
      value: current > 0 ? 100 : 0,
      trend: current > 0 ? 'up' : 'stable',
    };
  }

  const rate = ((current - previous) / previous) * 100;
  const roundedRate = Math.round(rate * 10) / 10;

  let trend: 'up' | 'down' | 'stable';
  if (roundedRate > 0.5) {
    trend = 'up';
  } else if (roundedRate < -0.5) {
    trend = 'down';
  } else {
    trend = 'stable';
  }

  return {
    value: roundedRate,
    trend,
  };
}

/**
 * Calculate growth rate from time-series data
 * Compares last value to first value
 *
 * @param data Array of values over time
 * @returns Growth rate as percentage and trend
 */
export function calculateTimeSeriesGrowth(data: number[]): GrowthRate {
  if (data.length < 2) {
    return { value: 0, trend: 'stable' };
  }

  const first = data[0];
  const last = data[data.length - 1];

  return calculateGrowthRate(last, first);
}

// =============================================================================
// Drink Distribution Functions
// =============================================================================

export interface DrinkTypeDistribution {
  beer: number; // percentage
  wine: number; // percentage
  spirits: number; // percentage
}

/**
 * Calculate distribution of drink types across all drinks
 * Types are inferred from alcohol percentage:
 * - Beer: < 8%
 * - Wine: 8-20%
 * - Spirits: > 20%
 *
 * @param drinks All drink entries
 * @returns Distribution percentages
 */
export function calculateDrinkTypeDistribution(
  drinks: DrinkEntry[]
): DrinkTypeDistribution {
  if (drinks.length === 0) {
    return { beer: 0, wine: 0, spirits: 0 };
  }

  let beerCount = 0;
  let wineCount = 0;
  let spiritsCount = 0;

  drinks.forEach((drink) => {
    if (drink.alcohol_percentage < 8) {
      beerCount++;
    } else if (drink.alcohol_percentage <= 20) {
      wineCount++;
    } else {
      spiritsCount++;
    }
  });

  const total = drinks.length;

  return {
    beer: Math.round((beerCount / total) * 100 * 10) / 10,
    wine: Math.round((wineCount / total) * 100 * 10) / 10,
    spirits: Math.round((spiritsCount / total) * 100 * 10) / 10,
  };
}

// =============================================================================
// Time-based Analysis Functions
// =============================================================================

export interface PeakActivityTime {
  dayOfWeek: string;
  hour: number;
  count: number;
}

/**
 * Find the peak activity time from heatmap data
 *
 * @param heatmap Activity heatmap data
 * @returns Peak activity time with formatted day name
 */
export function findPeakActivityTime(
  heatmap: Array<{ dayOfWeek: number; hour: number; count: number }>
): PeakActivityTime | null {
  if (heatmap.length === 0) return null;

  const peak = heatmap.reduce((max, current) =>
    current.count > max.count ? current : max
  );

  const dayNames = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

  return {
    dayOfWeek: dayNames[peak.dayOfWeek],
    hour: peak.hour,
    count: peak.count,
  };
}

/**
 * Calculate average daily activity from heatmap
 *
 * @param heatmap Activity heatmap data
 * @returns Average sessions per day
 */
export function calculateAverageDailyActivity(
  heatmap: Array<{ dayOfWeek: number; hour: number; count: number }>
): number {
  if (heatmap.length === 0) return 0;

  // Sum activity by day
  const activityByDay = new Map<number, number>();
  heatmap.forEach((entry) => {
    const currentCount = activityByDay.get(entry.dayOfWeek) || 0;
    activityByDay.set(entry.dayOfWeek, currentCount + entry.count);
  });

  // Calculate average
  const days = Array.from(activityByDay.values());
  if (days.length === 0) return 0;

  const avgActivity = days.reduce((sum, count) => sum + count, 0) / days.length;
  return Math.round(avgActivity * 10) / 10;
}
