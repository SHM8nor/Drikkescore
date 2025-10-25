import type { DrinkEntry } from '../types/database';

/**
 * Calories per gram of pure alcohol
 * Standard nutritional value
 */
const CALORIES_PER_GRAM_ALCOHOL = 7;

/**
 * Density of ethanol in g/ml
 */
const ETHANOL_DENSITY = 0.789;

/**
 * Calculate calories from a single drink entry
 * Formula: volume_ml × (alcohol_percentage / 100) × ethanol_density × calories_per_gram
 *
 * @param volumeMl Volume of the drink in milliliters
 * @param alcoholPercentage Alcohol by volume percentage (ABV)
 * @returns Calories from alcohol in the drink
 */
export function calculateDrinkCalories(
  volumeMl: number,
  alcoholPercentage: number
): number {
  // Calculate grams of pure alcohol
  const alcoholGrams = volumeMl * (alcoholPercentage / 100) * ETHANOL_DENSITY;

  // Calculate calories from alcohol
  const calories = alcoholGrams * CALORIES_PER_GRAM_ALCOHOL;

  return Math.round(calories);
}

/**
 * Calculate total calories from an array of drink entries
 *
 * @param drinks Array of drink entries
 * @returns Total calories from all drinks
 */
export function calculateTotalCalories(drinks: DrinkEntry[]): number {
  return drinks.reduce((total, drink) => {
    return total + calculateDrinkCalories(drink.volume_ml, drink.alcohol_percentage);
  }, 0);
}

/**
 * Calculate calories per day over a period
 *
 * @param drinks Array of drink entries
 * @param periodDays Number of days in the period
 * @returns Average calories per day
 */
export function calculateAverageCaloriesPerDay(
  drinks: DrinkEntry[],
  periodDays: number
): number {
  const totalCalories = calculateTotalCalories(drinks);

  if (periodDays === 0) {
    return 0;
  }

  return Math.round(totalCalories / periodDays);
}

/**
 * Get calorie description category
 * @param totalCalories Total calories consumed from alcohol
 * @returns Norwegian description of calorie intake level
 */
export function getCalorieDescription(totalCalories: number): string {
  if (totalCalories === 0) return 'Ingen kalorier';
  if (totalCalories < 500) return 'Lavt kaloriinntak';
  if (totalCalories < 1000) return 'Moderat kaloriinntak';
  if (totalCalories < 2000) return 'Høyt kaloriinntak';
  return 'Svært høyt kaloriinntak';
}

/**
 * Compare calories to food equivalents (Norwegian context)
 * @param calories Total calories
 * @returns Object with food comparisons
 */
export function getCalorieFoodComparison(calories: number): {
  hamburgers: number;
  pizzaSlices: number;
  chocolateBars: number;
} {
  return {
    hamburgers: Math.round((calories / 540) * 10) / 10, // Average burger ~540 kcal
    pizzaSlices: Math.round((calories / 285) * 10) / 10, // Average pizza slice ~285 kcal
    chocolateBars: Math.round((calories / 230) * 10) / 10, // Average chocolate bar ~230 kcal
  };
}
