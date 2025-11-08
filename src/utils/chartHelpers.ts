import type { DrinkEntry, Profile } from '../types/database';
import { calculateBAC, calculateAlcoholGrams } from './bacCalculator';

/**
 * Time series point for BAC chart
 */
export interface TimeSeriesPoint {
  time: Date;
  bac: number;
}

/**
 * Line chart data point for MUI charts
 */
export interface LineChartPoint {
  x: number;
  y: number;
}

/**
 * Line chart series for MUI charts
 */
export interface LineChartSeries {
  id: string;
  data: LineChartPoint[];
  label: string;
}

/**
 * Bar chart data point
 */
export interface BarChartPoint {
  participant: string;
  value: number;
}

/**
 * Density of ethanol in g/ml
 */
const ETHANOL_DENSITY = 0.789;

/**
 * Standard beer unit in grams (500ml @ 4.7% ABV × 0.789)
 */
const BEER_UNIT_GRAMS = 500 * 0.047 * ETHANOL_DENSITY; // 18.5415 grams

/**
 * Calculate BAC at multiple time points from session start to current time
 *
 * @param drinks Array of drink entries for a specific user
 * @param profile User profile with weight and gender
 * @param sessionStartTime Session start time
 * @param currentTime Current time (end of calculation period)
 * @returns Array of time series points with BAC values
 */
export function calculateBACTimeSeries(
  drinks: DrinkEntry[],
  profile: Profile,
  sessionStartTime: Date,
  currentTime: Date
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];

  // If no drinks, return empty array
  if (drinks.length === 0) {
    return points;
  }

  // Calculate time span in milliseconds
  const startTime = sessionStartTime.getTime();
  const endTime = currentTime.getTime();
  const timeSpanMs = endTime - startTime;

  // If session hasn't started yet or is invalid, return empty array
  if (timeSpanMs <= 0) {
    return points;
  }

  // Sample every 5 minutes (300000 ms)
  const sampleIntervalMs = 5 * 60 * 1000;

  // Generate time points
  for (let time = startTime; time <= endTime; time += sampleIntervalMs) {
    const pointTime = new Date(time);
    const bac = calculateBAC(drinks, profile, pointTime);
    points.push({
      time: pointTime,
      bac: bac,
    });
  }

  // Always include the current time as the final point
  const lastPointTime = points[points.length - 1]?.time.getTime();
  if (lastPointTime !== endTime) {
    const bac = calculateBAC(drinks, profile, currentTime);
    points.push({
      time: currentTime,
      bac: bac,
    });
  }

  return points;
}

/**
 * Calculate total pure alcohol in grams across all drinks
 *
 * @param drinks Array of drink entries
 * @returns Total alcohol in grams
 */
export function calculateTotalAlcoholGrams(drinks: DrinkEntry[]): number {
  return drinks.reduce((total, drink) => {
    return total + calculateAlcoholGrams(drink.volume_ml, drink.alcohol_percentage);
  }, 0);
}

/**
 * Convert grams of pure alcohol to "beer units"
 *
 * @param grams Grams of pure alcohol
 * @returns Number of beer units
 */
export function convertGramsToBeers(grams: number): number {
  return grams / BEER_UNIT_GRAMS;
}

/**
 * Prepare data format for MUI LineChart
 * Creates one series per participant showing BAC over time
 * Uses dense sampling (5-minute intervals) to accurately represent BAC curves
 * including absorption peaks and elimination slopes between drink entries
 *
 * @param participants Array of participant profiles
 * @param drinks Array of all drink entries
 * @param sessionStartTime Session start time
 * @param currentTime Current time
 * @returns Array of line chart series
 */
export function prepareLineChartData(
  participants: Profile[],
  drinks: DrinkEntry[],
  sessionStartTime: Date,
  currentTime: Date
): LineChartSeries[] {
  const series: LineChartSeries[] = [];

  // Calculate minutes since session start for reference
  const sessionStartMs = sessionStartTime.getTime();

  for (const participant of participants) {
    // Filter drinks for this participant
    const participantDrinks = drinks.filter(
      (drink) => drink.user_id === participant.id
    );

    const data: LineChartPoint[] = [];

    // Use dense sampling to accurately represent BAC curves
    // This captures absorption peaks and elimination slopes that would be
    // missed with sparse points only at drink entry times
    const timeSeries = calculateBACTimeSeries(
      participantDrinks,
      participant,
      sessionStartTime,
      currentTime
    );

    // Convert TimeSeriesPoint[] to LineChartPoint[] format
    for (const point of timeSeries) {
      const minutesSinceStart = (point.time.getTime() - sessionStartMs) / (1000 * 60);
      data.push({
        x: Math.round(minutesSinceStart * 10) / 10, // Round to 1 decimal
        y: point.bac,
      });
    }

    // If no drinks, add a single point at session start with 0 BAC
    if (data.length === 0) {
      data.push({
        x: 0,
        y: 0,
      });
    }

    series.push({
      id: participant.id,
      data: data,
      label: participant.full_name,
    });
  }

  return series;
}

/**
 * Prepare data for bar chart showing per-participant alcohol consumption
 *
 * @param participants Array of participant profiles
 * @param drinks Array of all drink entries
 * @param unit Unit to display ('grams' or 'beers')
 * @returns Array of bar chart data points
 */
export function prepareBarChartData(
  participants: Profile[],
  drinks: DrinkEntry[],
  unit: 'grams' | 'beers'
): BarChartPoint[] {
  const data: BarChartPoint[] = [];

  for (const participant of participants) {
    // Filter drinks for this participant
    const participantDrinks = drinks.filter(
      (drink) => drink.user_id === participant.id
    );

    // Calculate total alcohol in grams
    const totalGrams = calculateTotalAlcoholGrams(participantDrinks);

    // Convert to appropriate unit
    const value = unit === 'beers' ? convertGramsToBeers(totalGrams) : totalGrams;

    data.push({
      participant: participant.full_name,
      value: Math.round(value * 100) / 100, // Round to 2 decimals
    });
  }

  return data;
}
