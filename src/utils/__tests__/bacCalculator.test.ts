import { describe, it, expect } from 'vitest';
import {
  calculateBAC,
  calculateAlcoholGrams,
  inferDrinkType,
  calculateTimeToPeak,
  calculateTimeToSober,
  formatBAC,
  getBACDescription,
  isOverDrivingLimit,
} from '../bacCalculator';
import type { DrinkEntry, Profile } from '../../types/database';

// Test profile: 80kg male
const testProfile: Profile = {
  id: 'test-user-id',
  full_name: 'Test User',
  display_name: 'TestUser',
  gender: 'male',
  weight_kg: 80,
  height_cm: 180,
  age: 30,
  created_at: new Date().toISOString(),
  role: 'user',
  drink_preferences: {},
};

// Test profile: 65kg female
const femaleProfile: Profile = {
  ...testProfile,
  id: 'test-female-id',
  gender: 'female',
  weight_kg: 65,
};

describe('bacCalculator', () => {
  describe('inferDrinkType', () => {
    it('should classify beer correctly (<8%)', () => {
      expect(inferDrinkType(4.5)).toBe('beer');
      expect(inferDrinkType(7.9)).toBe('beer');
      expect(inferDrinkType(0.5)).toBe('beer');
    });

    it('should classify wine correctly (8-20%)', () => {
      expect(inferDrinkType(8)).toBe('wine');
      expect(inferDrinkType(12.5)).toBe('wine');
      expect(inferDrinkType(20)).toBe('wine');
    });

    it('should classify spirits correctly (>20%)', () => {
      expect(inferDrinkType(20.1)).toBe('spirits');
      expect(inferDrinkType(40)).toBe('spirits');
      expect(inferDrinkType(60)).toBe('spirits');
    });
  });

  describe('calculateAlcoholGrams', () => {
    it('should calculate alcohol grams correctly for beer', () => {
      // 500ml of 4.5% beer
      // 500 * 0.045 * 0.789 = 17.7525g
      const grams = calculateAlcoholGrams(500, 4.5);
      expect(grams).toBeCloseTo(17.7525, 4);
    });

    it('should calculate alcohol grams correctly for wine', () => {
      // 150ml of 12% wine
      // 150 * 0.12 * 0.789 = 14.202g
      const grams = calculateAlcoholGrams(150, 12);
      expect(grams).toBeCloseTo(14.202, 3);
    });

    it('should calculate alcohol grams correctly for spirits', () => {
      // 40ml of 40% vodka (standard shot)
      // 40 * 0.40 * 0.789 = 12.624g
      const grams = calculateAlcoholGrams(40, 40);
      expect(grams).toBeCloseTo(12.624, 3);
    });

    it('should handle zero volume', () => {
      expect(calculateAlcoholGrams(0, 40)).toBe(0);
    });

    it('should handle zero alcohol percentage', () => {
      expect(calculateAlcoholGrams(500, 0)).toBe(0);
    });
  });

  describe('calculateBAC', () => {
    it('should return 0 for no drinks', () => {
      const bac = calculateBAC([], testProfile);
      expect(bac).toBe(0);
    });

    it('should calculate BAC correctly for single beer immediately after consumption', () => {
      const now = new Date();
      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: now.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: now.toISOString(),
        },
      ];

      const bac = calculateBAC(drinks, testProfile, now);

      // Should be very low initially (just starting absorption)
      expect(bac).toBeGreaterThan(0);
      expect(bac).toBeLessThan(0.1);
    });

    it('should calculate BAC correctly at peak absorption for beer (20 min)', () => {
      const drinkTime = new Date('2024-01-01T12:00:00Z');
      const peakTime = new Date('2024-01-01T12:20:00Z'); // 20 minutes later

      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: drinkTime.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: drinkTime.toISOString(),
        },
      ];

      const bac = calculateBAC(drinks, testProfile, peakTime);

      // Peak BAC calculation: 17.7525g / (80000g * 0.68) * 1000 ≈ 0.326‰
      // At peak, should be close to this value
      expect(bac).toBeGreaterThan(0.25);
      expect(bac).toBeLessThan(0.35);
    });

    it('should calculate higher BAC for female with same drink (lower Widmark constant)', () => {
      const drinkTime = new Date('2024-01-01T12:00:00Z');
      const peakTime = new Date('2024-01-01T12:20:00Z');

      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: drinkTime.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: drinkTime.toISOString(),
        },
      ];

      const maleBac = calculateBAC(drinks, testProfile, peakTime);
      const femaleBac = calculateBAC(drinks, femaleProfile, peakTime);

      // Female should have higher BAC (lower body water percentage)
      expect(femaleBac).toBeGreaterThan(maleBac);
    });

    it('should handle food consumption (doubles absorption time)', () => {
      const drinkTime = new Date('2024-01-01T12:00:00Z');
      const normalPeak = new Date('2024-01-01T12:20:00Z'); // 20 min

      const normalDrinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: drinkTime.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: drinkTime.toISOString(),
        },
      ];

      const foodDrinks: DrinkEntry[] = [
        {
          ...normalDrinks[0],
          id: '2',
          food_consumed: true,
        },
      ];

      const normalBac = calculateBAC(normalDrinks, testProfile, normalPeak);
      const foodBac = calculateBAC(foodDrinks, testProfile, normalPeak);

      // With food, absorption is slower, so BAC at 20min should be lower
      expect(foodBac).toBeLessThan(normalBac);
    });

    it('should handle rapid consumption (5 min absorption)', () => {
      const drinkTime = new Date('2024-01-01T12:00:00Z');
      const earlyTime = new Date('2024-01-01T12:05:00Z'); // 5 min

      const normalDrinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: drinkTime.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: drinkTime.toISOString(),
        },
      ];

      const chuggedDrinks: DrinkEntry[] = [
        {
          ...normalDrinks[0],
          id: '2',
          rapid_consumption: true,
        },
      ];

      const normalBac = calculateBAC(normalDrinks, testProfile, earlyTime);
      const chuggedBac = calculateBAC(chuggedDrinks, testProfile, earlyTime);

      // Chugged drink absorbs much faster, so BAC at 5min should be higher
      expect(chuggedBac).toBeGreaterThan(normalBac);
    });

    it('should eliminate BAC over time after peak', () => {
      const drinkTime = new Date('2024-01-01T12:00:00Z');
      const peakTime = new Date('2024-01-01T12:20:00Z'); // Peak at 20 min
      const laterTime = new Date('2024-01-01T14:00:00Z'); // 2 hours later

      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: drinkTime.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: drinkTime.toISOString(),
        },
      ];

      const peakBac = calculateBAC(drinks, testProfile, peakTime);
      const laterBac = calculateBAC(drinks, testProfile, laterTime);

      // BAC should be lower 2 hours after peak
      expect(laterBac).toBeLessThan(peakBac);
      // Should have eliminated approximately 0.15 per hour for ~1.67 hours
      // (2 hours total - 20min to peak = 100min = 1.67h)
      expect(peakBac - laterBac).toBeGreaterThan(0.2); // At least some elimination
    });

    it('should sum BAC from multiple drinks correctly', () => {
      const drinkTime1 = new Date('2024-01-01T12:00:00Z');
      const drinkTime2 = new Date('2024-01-01T12:30:00Z');
      const checkTime = new Date('2024-01-01T13:00:00Z');

      const singleDrink: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: drinkTime1.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: drinkTime1.toISOString(),
        },
      ];

      const twoDrinks: DrinkEntry[] = [
        ...singleDrink,
        {
          id: '2',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: drinkTime2.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: drinkTime2.toISOString(),
        },
      ];

      const singleBac = calculateBAC(singleDrink, testProfile, checkTime);
      const doubleBac = calculateBAC(twoDrinks, testProfile, checkTime);

      // Two drinks should produce higher BAC than one
      expect(doubleBac).toBeGreaterThan(singleBac);
      // Note: Due to absorption curves, total BAC can be higher than double
      // when second drink is still absorbing while first is eliminating
      expect(doubleBac).toBeGreaterThan(0); // Just verify it's positive
    });

    it('should eventually return to 0 BAC after long time', () => {
      const drinkTime = new Date('2024-01-01T12:00:00Z');
      const muchLater = new Date('2024-01-01T20:00:00Z'); // 8 hours later

      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: drinkTime.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: drinkTime.toISOString(),
        },
      ];

      const bac = calculateBAC(drinks, testProfile, muchLater);

      // After 8 hours, single beer should be completely eliminated
      expect(bac).toBe(0);
    });

    it('should ignore drinks consumed after current time', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const futureTime = new Date('2024-01-01T13:00:00Z');

      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: futureTime.toISOString(), // Future drink
          food_consumed: false,
          rapid_consumption: false,
          created_at: now.toISOString(),
        },
      ];

      const bac = calculateBAC(drinks, testProfile, now);
      expect(bac).toBe(0);
    });

    it('should never return negative BAC', () => {
      const drinkTime = new Date('2024-01-01T12:00:00Z');
      const wayLater = new Date('2024-01-02T12:00:00Z'); // 24 hours later

      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: drinkTime.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: drinkTime.toISOString(),
        },
      ];

      const bac = calculateBAC(drinks, testProfile, wayLater);
      expect(bac).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateTimeToPeak', () => {
    it('should return 0 for no drinks', () => {
      const timeToPeak = calculateTimeToPeak([]);
      expect(timeToPeak).toBe(0);
    });

    it('should calculate time to peak for beer (20 min absorption)', () => {
      const now = new Date();
      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: now.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: now.toISOString(),
        },
      ];

      const timeToPeak = calculateTimeToPeak(drinks, now);
      expect(timeToPeak).toBe(20);
    });

    it('should calculate time to peak for wine (15 min absorption)', () => {
      const now = new Date();
      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 150,
          alcohol_percentage: 12,
          consumed_at: now.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: now.toISOString(),
        },
      ];

      const timeToPeak = calculateTimeToPeak(drinks, now);
      expect(timeToPeak).toBe(15);
    });

    it('should calculate time to peak for rapid consumption (5 min)', () => {
      const now = new Date();
      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: now.toISOString(),
          food_consumed: false,
          rapid_consumption: true,
          created_at: now.toISOString(),
        },
      ];

      const timeToPeak = calculateTimeToPeak(drinks, now);
      expect(timeToPeak).toBe(5);
    });

    it('should double absorption time with food', () => {
      const now = new Date();
      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: now.toISOString(),
          food_consumed: true,
          rapid_consumption: false,
          created_at: now.toISOString(),
        },
      ];

      const timeToPeak = calculateTimeToPeak(drinks, now);
      expect(timeToPeak).toBe(40); // 20 * 2
    });

    it('should return 0 if already peaked', () => {
      const drinkTime = new Date('2024-01-01T12:00:00Z');
      const afterPeak = new Date('2024-01-01T12:30:00Z'); // 30 min later

      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: drinkTime.toISOString(),
          food_consumed: false,
          rapid_consumption: false,
          created_at: drinkTime.toISOString(),
        },
      ];

      const timeToPeak = calculateTimeToPeak(drinks, afterPeak);
      expect(timeToPeak).toBe(0); // Peak was at 20 min, now at 30 min
    });

    it('should use latest peak time for multiple drinks', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const drinks: DrinkEntry[] = [
        {
          id: '1',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: fiveMinutesAgo.toISOString(), // Peaks in 15 min from now
          food_consumed: false,
          rapid_consumption: false,
          created_at: fiveMinutesAgo.toISOString(),
        },
        {
          id: '2',
          session_id: 'session-1',
          user_id: testProfile.id,
          volume_ml: 500,
          alcohol_percentage: 4.5,
          consumed_at: now.toISOString(), // Peaks in 20 min from now
          food_consumed: false,
          rapid_consumption: false,
          created_at: now.toISOString(),
        },
      ];

      const timeToPeak = calculateTimeToPeak(drinks, now);
      expect(timeToPeak).toBe(20); // Uses latest peak
    });
  });

  describe('calculateTimeToSober', () => {
    it('should return 0 for zero BAC', () => {
      expect(calculateTimeToSober(0)).toBe(0);
    });

    it('should return 0 for negative BAC', () => {
      expect(calculateTimeToSober(-0.5)).toBe(0);
    });

    it('should calculate time to sober correctly', () => {
      // 0.15‰ elimination rate per hour
      // 1.5‰ BAC should take 10 hours
      const hours = calculateTimeToSober(1.5);
      expect(hours).toBe(10);
    });

    it('should calculate correctly for small BAC values', () => {
      // 0.3‰ should take 2 hours
      const hours = calculateTimeToSober(0.3);
      expect(hours).toBe(2);
    });
  });

  describe('formatBAC', () => {
    it('should format BAC with 2 decimal places and promille symbol', () => {
      expect(formatBAC(0.8)).toBe('0.80‰');
      expect(formatBAC(1.234)).toBe('1.23‰');
      expect(formatBAC(0)).toBe('0.00‰');
    });

    it('should round correctly', () => {
      expect(formatBAC(0.125)).toBe('0.13‰');
      expect(formatBAC(0.124)).toBe('0.12‰');
    });
  });

  describe('getBACDescription', () => {
    it('should return correct description for zero BAC', () => {
      expect(getBACDescription(0)).toBe('Edru');
    });

    it('should return correct description for minimal effects', () => {
      expect(getBACDescription(0.1)).toBe('Minimale effekter');
      expect(getBACDescription(0.19)).toBe('Minimale effekter');
    });

    it('should return correct description for light impairment', () => {
      expect(getBACDescription(0.2)).toBe('Lett påvirket');
      expect(getBACDescription(0.4)).toBe('Lett påvirket');
    });

    it('should return correct description for reduced coordination', () => {
      expect(getBACDescription(0.5)).toBe('Redusert koordinasjon');
      expect(getBACDescription(0.7)).toBe('Redusert koordinasjon');
    });

    it('should return correct description for clearly impaired', () => {
      expect(getBACDescription(0.8)).toBe('Tydelig påvirket');
      expect(getBACDescription(1.2)).toBe('Tydelig påvirket');
    });

    it('should return correct description for heavily impaired', () => {
      expect(getBACDescription(1.5)).toBe('Kraftig påvirket');
      expect(getBACDescription(2.5)).toBe('Kraftig påvirket');
    });

    it('should return correct description for life-threatening', () => {
      expect(getBACDescription(3.0)).toBe('Livstruende');
      expect(getBACDescription(4.0)).toBe('Livstruende');
    });
  });

  describe('isOverDrivingLimit', () => {
    it('should return false for BAC under 0.8', () => {
      expect(isOverDrivingLimit(0)).toBe(false);
      expect(isOverDrivingLimit(0.5)).toBe(false);
      expect(isOverDrivingLimit(0.79)).toBe(false);
    });

    it('should return true for BAC at or over 0.8', () => {
      expect(isOverDrivingLimit(0.8)).toBe(true);
      expect(isOverDrivingLimit(1.0)).toBe(true);
      expect(isOverDrivingLimit(2.0)).toBe(true);
    });
  });
});
