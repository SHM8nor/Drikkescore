import type { DrinkEntry, Profile, Session } from '../types/database';
import type { PeriodStats, SessionAnalytics, AnalyticsData } from '../types/analytics';
import { calculateBAC } from './bacCalculator';
import { calculateTotalAlcoholGrams, convertGramsToBeers } from './chartHelpers';
import { calculateTotalCalories } from './calorieCalculator';

/**
 * Filter sessions by time period
 *
 * @param sessions Array of all sessions
 * @param period Time period to filter
 * @returns Filtered sessions within the period
 */
export function filterSessionsByPeriod(
  sessions: Session[],
  period: AnalyticsData['period']
): Session[] {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      break;
    case 'all':
      return sessions;
  }

  return sessions.filter((session) => {
    const sessionDate = new Date(session.start_time);
    return sessionDate >= startDate;
  });
}

/**
 * Calculate analytics for a single session
 *
 * @param session Session data
 * @param drinks Drinks in this session for the user
 * @param profile User profile
 * @param totalSpent Total spent in this session (from price calculator)
 * @returns Session analytics
 */
export function calculateSessionAnalytics(
  session: Session,
  drinks: DrinkEntry[],
  profile: Profile,
  totalSpent: number = 0
): SessionAnalytics {
  const sessionDrinks = drinks.filter((d) => d.session_id === session.id);
  const totalAlcoholGrams = calculateTotalAlcoholGrams(sessionDrinks);
  const totalCalories = calculateTotalCalories(sessionDrinks);

  // Calculate peak BAC (at session end time)
  const sessionEndTime = new Date(session.end_time);
  const peakBAC = calculateBAC(sessionDrinks, profile, sessionEndTime);

  // Calculate average BAC by sampling every 10 minutes
  let averageBAC = 0;
  if (sessionDrinks.length > 0) {
    const startTime = new Date(session.start_time).getTime();
    const endTime = sessionEndTime.getTime();
    // const duration = endTime - startTime;
    const sampleInterval = 10 * 60 * 1000; // 10 minutes in ms
    const samples: number[] = [];

    for (let time = startTime; time <= endTime; time += sampleInterval) {
      const bac = calculateBAC(sessionDrinks, profile, new Date(time));
      samples.push(bac);
    }

    averageBAC = samples.reduce((sum, bac) => sum + bac, 0) / samples.length;
  }

  // Calculate duration in hours
  const durationMs =
    new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  return {
    session_id: session.id,
    session_name: session.session_name,
    session_date: session.start_time,
    drinks_count: sessionDrinks.length,
    total_alcohol_grams: Math.round(totalAlcoholGrams * 10) / 10,
    peak_bac: Math.round(peakBAC * 10000) / 10000,
    average_bac: Math.round(averageBAC * 10000) / 10000,
    total_calories: totalCalories,
    total_spent: totalSpent,
    duration_hours: Math.round(durationHours * 10) / 10,
  };
}

/**
 * Calculate aggregated statistics for a period
 *
 * @param sessionAnalytics Array of session analytics
 * @returns Period statistics
 */
export function calculatePeriodStats(
  sessionAnalytics: SessionAnalytics[]
): PeriodStats {
  if (sessionAnalytics.length === 0) {
    return {
      totalDrinks: 0,
      totalSessions: 0,
      totalAlcoholGrams: 0,
      totalAlcoholBeers: 0,
      totalCalories: 0,
      totalSpent: 0,
      averageBAC: 0,
      peakBAC: 0,
      averageDrinksPerSession: 0,
    };
  }

  const totalDrinks = sessionAnalytics.reduce((sum, s) => sum + s.drinks_count, 0);
  const totalSessions = sessionAnalytics.length;
  const totalAlcoholGrams = sessionAnalytics.reduce(
    (sum, s) => sum + s.total_alcohol_grams,
    0
  );
  const totalCalories = sessionAnalytics.reduce((sum, s) => sum + s.total_calories, 0);
  const totalSpent = sessionAnalytics.reduce((sum, s) => sum + s.total_spent, 0);

  // Calculate average BAC across all sessions
  const averageBAC =
    sessionAnalytics.reduce((sum, s) => sum + s.average_bac, 0) / totalSessions;

  // Find peak BAC across all sessions
  const peakBAC = Math.max(...sessionAnalytics.map((s) => s.peak_bac));

  const averageDrinksPerSession = totalDrinks / totalSessions;

  return {
    totalDrinks,
    totalSessions,
    totalAlcoholGrams: Math.round(totalAlcoholGrams * 10) / 10,
    totalAlcoholBeers: Math.round(convertGramsToBeers(totalAlcoholGrams) * 10) / 10,
    totalCalories,
    totalSpent: Math.round(totalSpent * 100) / 100,
    averageBAC: Math.round(averageBAC * 10000) / 10000,
    peakBAC: Math.round(peakBAC * 10000) / 10000,
    averageDrinksPerSession: Math.round(averageDrinksPerSession * 10) / 10,
  };
}

/**
 * Calculate BAC trend data (daily average and peak BAC)
 *
 * @param sessionAnalytics Array of session analytics
 * @returns Array of BAC trend points
 */
export function calculateBACTrend(
  sessionAnalytics: SessionAnalytics[]
): { date: string; averageBAC: number; peakBAC: number }[] {
  // Group sessions by date
  const sessionsByDate = new Map<
    string,
    { averageBacs: number[]; peakBacs: number[] }
  >();

  for (const session of sessionAnalytics) {
    const date = new Date(session.session_date).toISOString().split('T')[0];

    if (!sessionsByDate.has(date)) {
      sessionsByDate.set(date, { averageBacs: [], peakBacs: [] });
    }

    const dayData = sessionsByDate.get(date)!;
    dayData.averageBacs.push(session.average_bac);
    dayData.peakBacs.push(session.peak_bac);
  }

  // Calculate average and peak for each date
  const trend = Array.from(sessionsByDate.entries()).map(([date, data]) => {
    const averageBAC =
      data.averageBacs.reduce((sum, bac) => sum + bac, 0) / data.averageBacs.length;
    const peakBAC = Math.max(...data.peakBacs);

    return {
      date,
      averageBAC: Math.round(averageBAC * 10000) / 10000,
      peakBAC: Math.round(peakBAC * 10000) / 10000,
    };
  });

  // Sort by date
  trend.sort((a, b) => a.date.localeCompare(b.date));

  return trend;
}

/**
 * Calculate weekly consumption aggregation
 *
 * @param sessionAnalytics Array of session analytics
 * @returns Weekly consumption data
 */
export function calculateWeeklyConsumption(
  sessionAnalytics: SessionAnalytics[]
): { week: string; grams: number; beers: number; calories: number }[] {
  // Group by week
  const weeklyData = new Map<
    string,
    { grams: number; calories: number }
  >();

  for (const session of sessionAnalytics) {
    const sessionDate = new Date(session.session_date);
    const weekStart = getWeekStart(sessionDate);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, { grams: 0, calories: 0 });
    }

    const week = weeklyData.get(weekKey)!;
    week.grams += session.total_alcohol_grams;
    week.calories += session.total_calories;
  }

  return Array.from(weeklyData.entries())
    .map(([week, data]) => ({
      week,
      grams: Math.round(data.grams * 10) / 10,
      beers: Math.round(convertGramsToBeers(data.grams) * 10) / 10,
      calories: data.calories,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

/**
 * Calculate monthly consumption aggregation
 *
 * @param sessionAnalytics Array of session analytics
 * @returns Monthly consumption data
 */
export function calculateMonthlyConsumption(
  sessionAnalytics: SessionAnalytics[]
): { month: string; grams: number; beers: number; calories: number }[] {
  // Group by month
  const monthlyData = new Map<
    string,
    { grams: number; calories: number }
  >();

  for (const session of sessionAnalytics) {
    const sessionDate = new Date(session.session_date);
    const monthKey = `${sessionDate.getFullYear()}-${String(
      sessionDate.getMonth() + 1
    ).padStart(2, '0')}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { grams: 0, calories: 0 });
    }

    const month = monthlyData.get(monthKey)!;
    month.grams += session.total_alcohol_grams;
    month.calories += session.total_calories;
  }

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      grams: Math.round(data.grams * 10) / 10,
      beers: Math.round(convertGramsToBeers(data.grams) * 10) / 10,
      calories: data.calories,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get the start of the week (Monday) for a given date
 *
 * @param date Date to find week start for
 * @returns Date object for Monday of that week
 */
function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const weekStart = new Date(date);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}
