/**
 * Chart helper functions specifically for Analytics feature
 */

import type { LineChartPoint } from './chartHelpers';

/**
 * Prepare data for BAC trend line chart (analytics view)
 *
 * @param bacTrend Array of BAC trend points
 * @returns Line chart series for average and peak BAC
 */
export function prepareBACTrendChartData(
  bacTrend: { date: string; averageBAC: number; peakBAC: number }[]
): { averageSeries: LineChartPoint[]; peakSeries: LineChartPoint[]; dates: string[] } {
  const averageSeries: LineChartPoint[] = [];
  const peakSeries: LineChartPoint[] = [];
  const dates: string[] = [];

  bacTrend.forEach((point, index) => {
    averageSeries.push({
      x: index,
      y: point.averageBAC,
    });

    peakSeries.push({
      x: index,
      y: point.peakBAC,
    });

    dates.push(point.date);
  });

  return { averageSeries, peakSeries, dates };
}

/**
 * Prepare data for weekly consumption bar chart
 *
 * @param weeklyData Array of weekly consumption data
 * @param unit Unit to display ('grams' or 'beers')
 * @returns Array of bar chart data points
 */
export function prepareWeeklyConsumptionChartData(
  weeklyData: { week: string; grams: number; beers: number; calories: number }[],
  unit: 'grams' | 'beers'
): { week: string; value: number }[] {
  return weeklyData.map((data) => ({
    week: formatWeekLabel(data.week),
    value: unit === 'beers' ? data.beers : data.grams,
  }));
}

/**
 * Prepare data for monthly consumption bar chart
 *
 * @param monthlyData Array of monthly consumption data
 * @param unit Unit to display ('grams' or 'beers')
 * @returns Array of bar chart data points
 */
export function prepareMonthlyConsumptionChartData(
  monthlyData: { month: string; grams: number; beers: number; calories: number }[],
  unit: 'grams' | 'beers'
): { month: string; value: number }[] {
  return monthlyData.map((data) => ({
    month: formatMonthLabel(data.month),
    value: unit === 'beers' ? data.beers : data.grams,
  }));
}

/**
 * Prepare data for calorie bar chart
 *
 * @param weeklyData Array of weekly consumption data
 * @returns Array of bar chart data points for calories
 */
export function prepareCalorieChartData(
  weeklyData: { week: string; grams: number; beers: number; calories: number }[]
): { week: string; calories: number }[] {
  return weeklyData.map((data) => ({
    week: formatWeekLabel(data.week),
    calories: data.calories,
  }));
}

/**
 * Format week label for display (e.g., "2025-01-06" -> "Uke 1")
 *
 * @param weekString ISO date string for week start (Monday)
 * @returns Formatted week label
 */
function formatWeekLabel(weekString: string): string {
  const date = new Date(weekString);
  const weekNumber = getWeekNumber(date);
  return `Uke ${weekNumber}`;
}

/**
 * Format month label for display (e.g., "2025-01" -> "Jan 2025")
 *
 * @param monthString Month string in format YYYY-MM
 * @returns Formatted month label
 */
function formatMonthLabel(monthString: string): string {
  const [year, month] = monthString.split('-');
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

/**
 * Get ISO week number for a date
 *
 * @param date Date to get week number for
 * @returns Week number (1-53)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
