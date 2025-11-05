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
 * Average alcohol elimination rate (promille per hour)
 */
const ELIMINATION_RATE = 0.15;

/**
 * Density of ethanol in g/ml
 */
const ETHANOL_DENSITY = 0.789;

/**
 * Drink types inferred from alcohol percentage
 */
export type DrinkType = 'beer' | 'wine' | 'spirits';

/**
 * Absorption time in minutes for each drink type
 * Beer absorbs slower due to carbonation and volume
 * Wine and spirits absorb faster
 */
const ABSORPTION_TIME_MINUTES: Record<DrinkType, number> = {
  beer: 20,
  wine: 15,
  spirits: 15,
};

/**
 * Infer drink type from alcohol percentage
 * <8% = Beer, 8-20% = Wine, >20% = Spirits
 */
export function inferDrinkType(alcoholPercentage: number): DrinkType {
  if (alcoholPercentage < 8) {
    return 'beer';
  } else if (alcoholPercentage <= 20) {
    return 'wine';
  } else {
    return 'spirits';
  }
}

/**
 * Calculate absorption percentage using sigmoid curve (S-curve)
 * This creates a realistic absorption pattern: slow start, rapid middle, slow finish
 *
 * @param minutesSinceConsumption Time elapsed since drink was consumed
 * @param absorptionTimeMinutes Total time for full absorption
 * @returns Percentage absorbed (0 to 1)
 */
function calculateAbsorptionPercentage(
  minutesSinceConsumption: number,
  absorptionTimeMinutes: number
): number {
  // Sigmoid function: 1 / (1 + e^(-k*(t - midpoint)))
  // k controls steepness, midpoint is center of absorption period
  const midpoint = absorptionTimeMinutes / 2;
  const k = 8 / absorptionTimeMinutes; // Steepness factor

  const exponent = -k * (minutesSinceConsumption - midpoint);
  const absorption = 1 / (1 + Math.exp(exponent));

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, absorption));
}

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
 * Calculate Blood Alcohol Content using the Widmark formula with two-phase absorption model
 *
 * Two-phase model for realistic BAC curves:
 * Phase 1: Absorption phase - alcohol enters bloodstream (minimal elimination)
 * Phase 2: Elimination phase - after absorption peak, steady elimination
 *
 * Modified formula with per-drink absorption and elimination:
 * BAC = Σ (A_i × absorption_i - elimination_i)
 *
 * Where for each drink i:
 * - A_i = Alcohol from drink i / (W × r) × 1000 (peak BAC from that drink in promille)
 * - absorption_i = Sigmoid curve percentage based on time since consumption
 * - elimination_i = Starts after absorption completes (more realistic)
 * - W = Body weight in kilograms
 * - r = Widmark constant (0.68 for males, 0.55 for females)
 *
 * @param drinks Array of drink entries
 * @param profile User profile with weight and gender
 * @param currentTime Current time for calculation (defaults to now)
 * @returns BAC in promille (e.g., 0.8 for 0.8‰)
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

  // Get Widmark constant for gender and body weight
  const widmarkR = WIDMARK_CONSTANT[profile.gender];
  const weightInGrams = profile.weight_kg * 1000;

  let totalBAC = 0;

  // Calculate BAC contribution from each drink individually
  for (const drink of drinks) {
    const drinkTime = new Date(drink.consumed_at);

    // Skip drinks consumed after current time
    if (drinkTime > currentTime) {
      continue;
    }

    // Calculate time elapsed since consumption
    const timeElapsedMs = currentTime.getTime() - drinkTime.getTime();
    const minutesSinceConsumption = timeElapsedMs / (1000 * 60);

    // Infer drink type and get base absorption time
    const drinkType = inferDrinkType(drink.alcohol_percentage);
    let absorptionTimeMinutes = ABSORPTION_TIME_MINUTES[drinkType];

    // Check for rapid consumption (chugging/shotgunning)
    // This drastically reduces absorption time (much faster peak)
    const rapidConsumption = (drink as any).rapid_consumption === true;
    if (rapidConsumption) {
      absorptionTimeMinutes = 5; // Chugged drinks absorb in ~5 minutes
    } else {
      // Factor in food consumption (doubles absorption time if eating normally)
      const foodConsumed = (drink as any).food_consumed === true;
      if (foodConsumed) {
        absorptionTimeMinutes *= 2;
      }
    }

    // Calculate alcohol grams from this drink
    const alcoholGrams = calculateAlcoholGrams(
      drink.volume_ml,
      drink.alcohol_percentage
    );

    // Calculate peak BAC this drink would produce (if fully absorbed)
    const peakBACFromDrink = (alcoholGrams / (weightInGrams * widmarkR)) * 1000;

    let bacFromDrink = 0;

    // TWO-PHASE MODEL
    if (minutesSinceConsumption <= absorptionTimeMinutes) {
      // PHASE 1: ABSORPTION
      // Still absorbing - minimal elimination (only 10% of normal rate)
      const absorptionPercentage = calculateAbsorptionPercentage(
        minutesSinceConsumption,
        absorptionTimeMinutes
      );

      bacFromDrink = peakBACFromDrink * absorptionPercentage;

      // Minimal elimination during absorption phase
      const hoursElapsed = minutesSinceConsumption / 60;
      const minimalElimination = ELIMINATION_RATE * hoursElapsed * 0.1;
      bacFromDrink = Math.max(0, bacFromDrink - minimalElimination);
    } else {
      // PHASE 2: ELIMINATION
      // Past absorption peak - full elimination rate
      const hoursSincePeak = (minutesSinceConsumption - absorptionTimeMinutes) / 60;
      const eliminatedBAC = ELIMINATION_RATE * hoursSincePeak;
      bacFromDrink = Math.max(0, peakBACFromDrink - eliminatedBAC);
    }

    // Add this drink's contribution to total BAC
    totalBAC += bacFromDrink;
  }

  // BAC cannot be negative
  totalBAC = Math.max(0, totalBAC);

  // Round to 4 decimal places
  return Math.round(totalBAC * 10000) / 10000;
}

/**
 * Calculate time until BAC reaches its peak
 * Peak occurs when the most recent drink finishes absorbing
 *
 * @param drinks Array of drink entries
 * @param currentTime Current time (defaults to now)
 * @returns Minutes until peak BAC (0 if already peaked or no drinks)
 */
export function calculateTimeToPeak(
  drinks: DrinkEntry[],
  currentTime: Date = new Date()
): number {
  if (drinks.length === 0) {
    return 0;
  }

  let latestPeakTime = 0;

  for (const drink of drinks) {
    const drinkTime = new Date(drink.consumed_at);

    // Skip drinks consumed after current time
    if (drinkTime > currentTime) {
      continue;
    }

    // Infer drink type and get base absorption time
    const drinkType = inferDrinkType(drink.alcohol_percentage);
    let absorptionTimeMinutes = ABSORPTION_TIME_MINUTES[drinkType];

    // Check for rapid consumption
    const rapidConsumption = (drink as any).rapid_consumption === true;
    if (rapidConsumption) {
      absorptionTimeMinutes = 5; // Chugged drinks peak in ~5 minutes
    } else {
      // Factor in food consumption
      const foodConsumed = (drink as any).food_consumed === true;
      if (foodConsumed) {
        absorptionTimeMinutes *= 2;
      }
    }

    // Calculate when this drink peaks
    const peakTime = drinkTime.getTime() + (absorptionTimeMinutes * 60 * 1000);

    // Track the latest peak time
    if (peakTime > latestPeakTime) {
      latestPeakTime = peakTime;
    }
  }

  // If latest peak is in the past, return 0 (already peaked)
  if (latestPeakTime <= currentTime.getTime()) {
    return 0;
  }

  // Return minutes until peak
  const minutesToPeak = (latestPeakTime - currentTime.getTime()) / (1000 * 60);
  return Math.round(minutesToPeak);
}

/**
 * Calculate time until BAC reaches zero
 * @param currentBAC Current BAC level in promille
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
 * @param bac BAC value in promille
 * @returns Formatted string (e.g., "0.80‰")
 */
export function formatBAC(bac: number): string {
  return `${bac.toFixed(2)}‰`;
}

/**
 * Get BAC level description
 * @param bac BAC value in promille
 * @returns Description of impairment level
 */
export function getBACDescription(bac: number): string {
  if (bac === 0) return 'Edru';
  if (bac < 0.2) return 'Minimale effekter';
  if (bac < 0.5) return 'Lett påvirket';
  if (bac < 0.8) return 'Redusert koordinasjon';
  if (bac < 1.5) return 'Tydelig påvirket';
  if (bac < 3.0) return 'Kraftig påvirket';
  return 'Livstruende';
}

/**
 * Check if user is over legal driving limit (0.8‰ in most places)
 * @param bac BAC value in promille
 * @returns True if over limit
 */
export function isOverDrivingLimit(bac: number): boolean {
  return bac >= 0.8;
}
