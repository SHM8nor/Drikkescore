import type { DrinkEntry } from '../types/database';
import type { DrinkPrice } from '../types/analytics';

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = 'NOK';

/**
 * Match a drink entry to a saved price
 * Matches based on volume and ABV percentage (with tolerance)
 *
 * @param drink Drink entry to match
 * @param prices Array of saved drink prices
 * @returns Matched price or null
 */
export function matchDrinkToPrice(
  drink: DrinkEntry,
  prices: DrinkPrice[]
): DrinkPrice | null {
  const VOLUME_TOLERANCE = 50; // ±50ml
  const ABV_TOLERANCE = 1; // ±1%

  // Try to find exact match first
  const exactMatch = prices.find(
    (price) =>
      price.volume_ml === drink.volume_ml &&
      price.alcohol_percentage === drink.alcohol_percentage
  );

  if (exactMatch) {
    return exactMatch;
  }

  // Try to find match within tolerance
  const tolerantMatch = prices.find((price) => {
    const volumeMatch =
      price.volume_ml &&
      Math.abs(price.volume_ml - drink.volume_ml) <= VOLUME_TOLERANCE;

    const abvMatch =
      price.alcohol_percentage &&
      Math.abs(price.alcohol_percentage - drink.alcohol_percentage) <=
        ABV_TOLERANCE;

    return volumeMatch && abvMatch;
  });

  if (tolerantMatch) {
    return tolerantMatch;
  }

  // Fall back to default price if available
  const defaultPrice = prices.find((price) => price.is_default);

  return defaultPrice || null;
}

/**
 * Calculate total spending from drink entries and prices
 *
 * @param drinks Array of drink entries
 * @param prices Array of saved drink prices
 * @returns Total spent in default currency
 */
export function calculateTotalSpending(
  drinks: DrinkEntry[],
  prices: DrinkPrice[]
): number {
  if (prices.length === 0) {
    return 0; // Cannot calculate without prices
  }

  let total = 0;

  for (const drink of drinks) {
    const matchedPrice = matchDrinkToPrice(drink, prices);

    if (matchedPrice) {
      total += matchedPrice.price_amount;
    }
  }

  return Math.round(total * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate spending per drink type
 *
 * @param drinks Array of drink entries
 * @param prices Array of saved drink prices
 * @returns Map of drink names to total spent
 */
export function calculateSpendingByDrinkType(
  drinks: DrinkEntry[],
  prices: DrinkPrice[]
): Map<string, number> {
  const spendingMap = new Map<string, number>();

  for (const drink of drinks) {
    const matchedPrice = matchDrinkToPrice(drink, prices);

    if (matchedPrice) {
      const currentTotal = spendingMap.get(matchedPrice.drink_name) || 0;
      spendingMap.set(
        matchedPrice.drink_name,
        currentTotal + matchedPrice.price_amount
      );
    }
  }

  return spendingMap;
}

/**
 * Calculate average cost per drink
 *
 * @param totalSpent Total amount spent
 * @param totalDrinks Total number of drinks
 * @returns Average cost per drink
 */
export function calculateAverageCostPerDrink(
  totalSpent: number,
  totalDrinks: number
): number {
  if (totalDrinks === 0) {
    return 0;
  }

  return Math.round((totalSpent / totalDrinks) * 100) / 100;
}

/**
 * Format currency for display
 *
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Get spending level description
 *
 * @param totalSpent Total amount spent
 * @returns Norwegian description of spending level
 */
export function getSpendingDescription(totalSpent: number): string {
  if (totalSpent === 0) return 'Ingen utgifter';
  if (totalSpent < 500) return 'Lave utgifter';
  if (totalSpent < 1000) return 'Moderate utgifter';
  if (totalSpent < 2000) return 'Høye utgifter';
  return 'Svært høye utgifter';
}
