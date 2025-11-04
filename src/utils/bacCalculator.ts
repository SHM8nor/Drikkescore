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
 * Calculate Blood Alcohol Content using the Widmark formula with gradual absorption
 *
 * Modified formula with per-drink absorption and elimination:
 * BAC = Σ (A_i × absorption_i - elimination_i)
 *
 * Where for each drink i:
 * - A_i = Alcohol from drink i / (W × r) × 100 (peak BAC from that drink)
 * - absorption_i = Sigmoid curve percentage based on time since consumption
 * - elimination_i = 0.015 × time_since_absorption_started (in hours)
 * - W = Body weight in kilograms
 * - r = Widmark constant (0.68 for males, 0.55 for females)
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

    // Infer drink type and get absorption time
    const drinkType = inferDrinkType(drink.alcohol_percentage);
    const absorptionTimeMinutes = ABSORPTION_TIME_MINUTES[drinkType];

    // Calculate alcohol grams from this drink
    const alcoholGrams = calculateAlcoholGrams(
      drink.volume_ml,
      drink.alcohol_percentage
    );

    // Calculate peak BAC this drink would produce (if fully absorbed)
    const peakBACFromDrink = (alcoholGrams / (weightInGrams * widmarkR)) * 100;

    // Calculate absorption percentage using sigmoid curve
    const absorptionPercentage = calculateAbsorptionPercentage(
      minutesSinceConsumption,
      absorptionTimeMinutes
    );

    // Calculate BAC from absorbed portion
    let bacFromDrink = peakBACFromDrink * absorptionPercentage;

    // Apply elimination based on time elapsed since consumption started
    // Elimination happens gradually as absorption occurs
    const hoursElapsed = minutesSinceConsumption / 60;
    const eliminatedBAC = ELIMINATION_RATE * hoursElapsed;
    bacFromDrink = Math.max(0, bacFromDrink - eliminatedBAC);

    // Add this drink's contribution to total BAC
    totalBAC += bacFromDrink;
  }

  // BAC cannot be negative
  totalBAC = Math.max(0, totalBAC);

  // Round to 4 decimal places
  return Math.round(totalBAC * 10000) / 10000;
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
