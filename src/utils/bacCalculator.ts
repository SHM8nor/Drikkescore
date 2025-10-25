import type { DrinkEntry, Gender, Profile } from '../types/database';

/**
 * Widmark constant for BAC calculation
 * Male: 0.68, Female: 0.55
 */
const WIDMARK_CONSTANT: Record<Gender, number> = {
  male: 0.68,
  female: 0.55,
};

/**
 * Average alcohol elimination rate (% per hour)
 */
const ELIMINATION_RATE = 0.015;

/**
 * Density of ethanol in g/ml
 */
const ETHANOL_DENSITY = 0.789;

/**
 * Calculate the amount of pure alcohol in grams from a drink
 * Formula: volume_ml × (alcohol_percentage / 100) × ethanol_density
 */
export function calculateAlcoholGrams(
  volumeMl: number,
  alcoholPercentage: number
): number {
  return volumeMl * (alcoholPercentage / 100) * ETHANOL_DENSITY;
}

/**
 * Calculate Blood Alcohol Content using the Widmark formula
 *
 * Formula: BAC = (A / (W × r)) × 100 - (0.015 × t)
 *
 * Where:
 * - A = Total alcohol consumed in grams
 * - W = Body weight in kilograms
 * - r = Widmark constant (0.68 for males, 0.55 for females)
 * - t = Time elapsed since first drink (in hours)
 * - 0.015 = Average alcohol elimination rate per hour
 *
 * @param drinks Array of drink entries
 * @param profile User profile with weight and gender
 * @param currentTime Current time for calculation (defaults to now)
 * @returns BAC as a percentage (e.g., 0.08 for 0.08%)
 */
export function calculateBAC(
  drinks: DrinkEntry[],
  profile: Profile,
  currentTime: Date = new Date()
): number {
  // No drinks = no BAC
  if (drinks.length === 0) {
    return 0;
  }

  // Sort drinks by consumption time
  const sortedDrinks = [...drinks].sort(
    (a, b) => new Date(a.consumed_at).getTime() - new Date(b.consumed_at).getTime()
  );

  // Get first drink time
  const firstDrinkTime = new Date(sortedDrinks[0].consumed_at);

  // Calculate total alcohol consumed in grams
  let totalAlcoholGrams = 0;
  for (const drink of sortedDrinks) {
    const drinkTime = new Date(drink.consumed_at);
    // Only count drinks consumed before current time
    if (drinkTime <= currentTime) {
      totalAlcoholGrams += calculateAlcoholGrams(
        drink.volume_ml,
        drink.alcohol_percentage
      );
    }
  }

  // Get Widmark constant for gender
  const widmarkR = WIDMARK_CONSTANT[profile.gender];

  // Calculate BAC using Widmark formula
  // BAC = (alcohol in grams / (body weight in kg × widmark constant)) × 100
  const weightInGrams = profile.weight_kg * 1000;
  let bac = (totalAlcoholGrams / (weightInGrams * widmarkR)) * 100;

  // Apply elimination rate based on time elapsed since first drink
  const timeElapsedMs = currentTime.getTime() - firstDrinkTime.getTime();
  const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
  bac = bac - (ELIMINATION_RATE * timeElapsedHours);

  // BAC cannot be negative
  bac = Math.max(bac, 0);

  // Round to 4 decimal places
  return Math.round(bac * 10000) / 10000;
}

/**
 * Calculate time until BAC reaches zero
 * @param currentBAC Current BAC level
 * @returns Hours until BAC reaches zero
 */
export function calculateTimeToSober(currentBAC: number): number {
  if (currentBAC <= 0) {
    return 0;
  }
  return currentBAC / ELIMINATION_RATE;
}

/**
 * Format BAC for display
 * @param bac BAC value
 * @returns Formatted string (e.g., "0.08%")
 */
export function formatBAC(bac: number): string {
  return `${bac.toFixed(2)}%`;
}

/**
 * Get BAC level description
 * @param bac BAC value
 * @returns Description of impairment level
 */
export function getBACDescription(bac: number): string {
  if (bac === 0) return 'Edru';
  if (bac < 0.02) return 'Minimale effekter';
  if (bac < 0.05) return 'Lett påvirket';
  if (bac < 0.08) return 'Redusert koordinasjon';
  if (bac < 0.15) return 'Tydelig påvirket';
  if (bac < 0.30) return 'Kraftig påvirket';
  return 'Livstruende';
}

/**
 * Check if user is over legal driving limit (0.08% in most places)
 * @param bac BAC value
 * @returns True if over limit
 */
export function isOverDrivingLimit(bac: number): boolean {
  return bac >= 0.08;
}
