import type { Gender } from '../types/database';
import type { WHOComparisonData } from '../types/analytics';

/**
 * WHO recommended maximum weekly alcohol intake in grams
 * Source: WHO guidelines (conservative recommendation)
 * Male: ~140g per week (10 standard drinks)
 * Female: ~98g per week (7 standard drinks)
 */
const WHO_WEEKLY_LIMIT_GRAMS: Record<Gender, number> = {
  male: 140,
  female: 98,
};

/**
 * Calculate WHO comparison data based on weekly alcohol consumption
 *
 * @param weeklyGrams Weekly alcohol consumption in grams
 * @param gender User's gender
 * @returns WHO comparison data with risk level
 */
export function calculateWHOComparison(
  weeklyGrams: number,
  gender: Gender
): WHOComparisonData {
  const whoLimitGrams = WHO_WEEKLY_LIMIT_GRAMS[gender];
  const percentageOfLimit = (weeklyGrams / whoLimitGrams) * 100;

  let riskLevel: WHOComparisonData['riskLevel'];

  if (percentageOfLimit <= 50) {
    riskLevel = 'low';
  } else if (percentageOfLimit <= 100) {
    riskLevel = 'moderate';
  } else if (percentageOfLimit <= 200) {
    riskLevel = 'high';
  } else {
    riskLevel = 'very_high';
  }

  return {
    weeklyGrams,
    whoLimitGrams,
    riskLevel,
    percentageOfLimit: Math.round(percentageOfLimit),
  };
}

/**
 * Get risk level description in Norwegian
 *
 * @param riskLevel Risk level from WHO comparison
 * @returns Norwegian description of risk level
 */
export function getRiskLevelDescription(
  riskLevel: WHOComparisonData['riskLevel']
): string {
  switch (riskLevel) {
    case 'low':
      return 'Lavt risikonivå';
    case 'moderate':
      return 'Moderat risikonivå';
    case 'high':
      return 'Høyt risikonivå';
    case 'very_high':
      return 'Svært høyt risikonivå';
  }
}

/**
 * Get detailed health recommendation based on risk level
 *
 * @param riskLevel Risk level from WHO comparison
 * @returns Norwegian health recommendation
 */
export function getHealthRecommendation(
  riskLevel: WHOComparisonData['riskLevel']
): string {
  switch (riskLevel) {
    case 'low':
      return 'Du holder deg godt innenfor WHOs anbefalinger. Fortsett med moderat inntak.';
    case 'moderate':
      return 'Du nærmer deg WHOs anbefalte grense. Vurder å redusere inntaket noe.';
    case 'high':
      return 'Du overskrider WHOs anbefalinger. Det anbefales å redusere alkoholinntaket betydelig.';
    case 'very_high':
      return 'Du ligger langt over WHOs anbefalinger. Kraftig reduksjon av alkoholinntak er sterkt anbefalt. Vurder å søke hjelp.';
  }
}

/**
 * Get color for risk level (for UI visualization)
 *
 * @param riskLevel Risk level from WHO comparison
 * @returns Color code
 */
export function getRiskLevelColor(
  riskLevel: WHOComparisonData['riskLevel']
): string {
  switch (riskLevel) {
    case 'low':
      return '#047857'; // Green
    case 'moderate':
      return '#d9a03a'; // Yellow/Orange
    case 'high':
      return '#f77f00'; // Orange
    case 'very_high':
      return '#d62828'; // Red
  }
}

/**
 * Calculate recommended maximum drinks per session based on WHO guidelines
 * WHO recommends max 2-3 standard drinks per session
 *
 * @param gender User's gender
 * @returns Recommended maximum standard drinks per session
 */
export function getRecommendedMaxDrinksPerSession(gender: Gender): number {
  // Conservative recommendation: 2 for females, 3 for males
  return gender === 'female' ? 2 : 3;
}
