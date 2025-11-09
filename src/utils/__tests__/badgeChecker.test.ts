import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  evaluateCriteria,
  filterEligibleBadges,
} from '../badgeChecker';
import type { BadgeCondition, BadgeCriteria, Badge } from '../../types/badges';

describe('badgeChecker', () => {
  describe('evaluateCondition', () => {
    describe('greater than or equal (>=)', () => {
      const condition: BadgeCondition = {
        metric: 'total_drinks',
        operator: '>=',
        value: 10,
      };

      it('should return true when value equals threshold', () => {
        expect(evaluateCondition(condition, 10)).toBe(true);
      });

      it('should return true when value exceeds threshold', () => {
        expect(evaluateCondition(condition, 15)).toBe(true);
        expect(evaluateCondition(condition, 100)).toBe(true);
      });

      it('should return false when value is below threshold', () => {
        expect(evaluateCondition(condition, 9)).toBe(false);
        expect(evaluateCondition(condition, 0)).toBe(false);
      });
    });

    describe('equal to (==)', () => {
      const condition: BadgeCondition = {
        metric: 'session_count',
        operator: '==',
        value: 5,
      };

      it('should return true when values match exactly', () => {
        expect(evaluateCondition(condition, 5)).toBe(true);
      });

      it('should return false when values do not match', () => {
        expect(evaluateCondition(condition, 4)).toBe(false);
        expect(evaluateCondition(condition, 6)).toBe(false);
        expect(evaluateCondition(condition, 0)).toBe(false);
      });
    });

    describe('less than or equal (<=)', () => {
      const condition: BadgeCondition = {
        metric: 'total_drinks',
        operator: '<=',
        value: 3,
      };

      it('should return true when value equals threshold', () => {
        expect(evaluateCondition(condition, 3)).toBe(true);
      });

      it('should return true when value is below threshold', () => {
        expect(evaluateCondition(condition, 2)).toBe(true);
        expect(evaluateCondition(condition, 0)).toBe(true);
      });

      it('should return false when value exceeds threshold', () => {
        expect(evaluateCondition(condition, 4)).toBe(false);
        expect(evaluateCondition(condition, 10)).toBe(false);
      });
    });

    describe('greater than (>)', () => {
      const condition: BadgeCondition = {
        metric: 'max_bac',
        operator: '>',
        value: 1.0,
      };

      it('should return true when value exceeds threshold', () => {
        expect(evaluateCondition(condition, 1.1)).toBe(true);
        expect(evaluateCondition(condition, 2.0)).toBe(true);
      });

      it('should return false when value equals threshold', () => {
        expect(evaluateCondition(condition, 1.0)).toBe(false);
      });

      it('should return false when value is below threshold', () => {
        expect(evaluateCondition(condition, 0.9)).toBe(false);
        expect(evaluateCondition(condition, 0)).toBe(false);
      });
    });

    describe('less than (<)', () => {
      const condition: BadgeCondition = {
        metric: 'max_bac',
        operator: '<',
        value: 0.5,
      };

      it('should return true when value is below threshold', () => {
        expect(evaluateCondition(condition, 0.4)).toBe(true);
        expect(evaluateCondition(condition, 0)).toBe(true);
      });

      it('should return false when value equals threshold', () => {
        expect(evaluateCondition(condition, 0.5)).toBe(false);
      });

      it('should return false when value exceeds threshold', () => {
        expect(evaluateCondition(condition, 0.6)).toBe(false);
        expect(evaluateCondition(condition, 1.0)).toBe(false);
      });
    });

    describe('between', () => {
      const condition: BadgeCondition = {
        metric: 'total_drinks',
        operator: 'between',
        value: [5, 10],
      };

      it('should return true when value is within range (inclusive)', () => {
        expect(evaluateCondition(condition, 5)).toBe(true);
        expect(evaluateCondition(condition, 7)).toBe(true);
        expect(evaluateCondition(condition, 10)).toBe(true);
      });

      it('should return false when value is below range', () => {
        expect(evaluateCondition(condition, 4)).toBe(false);
        expect(evaluateCondition(condition, 0)).toBe(false);
      });

      it('should return false when value is above range', () => {
        expect(evaluateCondition(condition, 11)).toBe(false);
        expect(evaluateCondition(condition, 100)).toBe(false);
      });

      it('should handle invalid value format gracefully', () => {
        const invalidCondition: BadgeCondition = {
          metric: 'test',
          operator: 'between',
          value: 5, // Should be an array
        };
        expect(evaluateCondition(invalidCondition, 7)).toBe(false);
      });

      it('should handle array with wrong length gracefully', () => {
        const invalidCondition: BadgeCondition = {
          metric: 'test',
          operator: 'between',
          value: [5], // Should have 2 elements
        };
        expect(evaluateCondition(invalidCondition, 7)).toBe(false);
      });
    });

    describe('unknown operator', () => {
      it('should return false for unknown operator', () => {
        const condition = {
          metric: 'test',
          operator: 'unknown' as any,
          value: 10,
        };
        expect(evaluateCondition(condition, 10)).toBe(false);
      });
    });
  });

  describe('evaluateCriteria', () => {
    describe('AND logic (requireAll: true)', () => {
      it('should return eligible when all conditions are met', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          requireAll: true,
          conditions: [
            { metric: 'total_drinks', operator: '>=', value: 10 },
            { metric: 'session_count', operator: '>=', value: 5 },
          ],
        };

        const metrics = {
          total_drinks: 15,
          session_count: 6,
        };

        const result = evaluateCriteria(criteria, metrics);
        expect(result.eligible).toBe(true);
        expect(result.progress).toBe(100);
      });

      it('should return not eligible when any condition fails', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          requireAll: true,
          conditions: [
            { metric: 'total_drinks', operator: '>=', value: 10 },
            { metric: 'session_count', operator: '>=', value: 5 },
          ],
        };

        const metrics = {
          total_drinks: 15, // Meets condition
          session_count: 3, // Fails condition
        };

        const result = evaluateCriteria(criteria, metrics);
        expect(result.eligible).toBe(false);
        expect(result.progress).toBeLessThan(100);
      });

      it('should calculate progress as average of all conditions', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          requireAll: true,
          conditions: [
            { metric: 'total_drinks', operator: '>=', value: 10 },
            { metric: 'session_count', operator: '>=', value: 10 },
          ],
        };

        const metrics = {
          total_drinks: 10, // 100% progress (met)
          session_count: 5, // 50% progress (5/10)
        };

        const result = evaluateCriteria(criteria, metrics);
        expect(result.eligible).toBe(false);
        expect(result.progress).toBe(75); // (100 + 50) / 2
      });

      it('should handle missing metrics as 0', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          requireAll: true,
          conditions: [
            { metric: 'total_drinks', operator: '>=', value: 10 },
          ],
        };

        const metrics = {}; // Missing total_drinks

        const result = evaluateCriteria(criteria, metrics);
        expect(result.eligible).toBe(false);
        expect(result.progress).toBe(0);
      });
    });

    describe('OR logic (requireAll: false)', () => {
      it('should return eligible when any condition is met', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          requireAll: false,
          conditions: [
            { metric: 'total_drinks', operator: '>=', value: 100 },
            { metric: 'session_count', operator: '>=', value: 5 },
          ],
        };

        const metrics = {
          total_drinks: 10, // Fails
          session_count: 6, // Meets
        };

        const result = evaluateCriteria(criteria, metrics);
        expect(result.eligible).toBe(true);
        expect(result.progress).toBe(100);
      });

      it('should return not eligible when all conditions fail', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          requireAll: false,
          conditions: [
            { metric: 'total_drinks', operator: '>=', value: 100 },
            { metric: 'session_count', operator: '>=', value: 50 },
          ],
        };

        const metrics = {
          total_drinks: 10, // Fails
          session_count: 5, // Fails
        };

        const result = evaluateCriteria(criteria, metrics);
        expect(result.eligible).toBe(false);
        expect(result.progress).toBeLessThan(100);
      });

      it('should calculate progress as maximum among all conditions', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          requireAll: false,
          conditions: [
            { metric: 'total_drinks', operator: '>=', value: 10 },
            { metric: 'session_count', operator: '>=', value: 20 },
          ],
        };

        const metrics = {
          total_drinks: 5, // 50% progress (5/10)
          session_count: 15, // 75% progress (15/20)
        };

        const result = evaluateCriteria(criteria, metrics);
        expect(result.eligible).toBe(false);
        expect(result.progress).toBe(75); // Max of 50 and 75
      });
    });

    describe('default requireAll behavior', () => {
      it('should default to AND logic when requireAll is undefined', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          conditions: [
            { metric: 'total_drinks', operator: '>=', value: 10 },
            { metric: 'session_count', operator: '>=', value: 5 },
          ],
        };

        const metrics = {
          total_drinks: 15,
          session_count: 3, // Fails
        };

        const result = evaluateCriteria(criteria, metrics);
        expect(result.eligible).toBe(false); // AND logic by default
      });
    });

    describe('edge cases', () => {
      it('should return not eligible for empty conditions', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          conditions: [],
        };

        const result = evaluateCriteria(criteria, {});
        expect(result.eligible).toBe(false);
        expect(result.progress).toBe(0);
      });

      it('should handle single condition', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          conditions: [
            { metric: 'total_drinks', operator: '>=', value: 10 },
          ],
        };

        const metrics = { total_drinks: 15 };
        const result = evaluateCriteria(criteria, metrics);
        expect(result.eligible).toBe(true);
        expect(result.progress).toBe(100);
      });

      it('should handle "between" operator in progress calculation', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          conditions: [
            { metric: 'total_drinks', operator: 'between', value: [10, 20] },
          ],
        };

        const metrics = { total_drinks: 5 }; // 5/10 = 50% toward min value
        const result = evaluateCriteria(criteria, metrics);
        expect(result.eligible).toBe(false);
        expect(result.progress).toBe(50);
      });

      it('should not exceed 100% progress', () => {
        const criteria: BadgeCriteria = {
          type: 'global',
          conditions: [
            { metric: 'total_drinks', operator: '>=', value: 10 },
          ],
        };

        const metrics = { total_drinks: 500 }; // Way over target
        const result = evaluateCriteria(criteria, metrics);
        expect(result.progress).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('filterEligibleBadges', () => {
    const mockBadge1: Badge = {
      id: 'badge-1',
      code: 'TEST_BADGE_1',
      name: 'Test Badge 1',
      description: 'Test description',
      category: 'session',
      tier: 'bronze',
      icon_url: null,
      is_active: true,
      award_type: 'automatic',
      criteria: {
        type: 'session',
        conditions: [{ metric: 'total_drinks', operator: '>=', value: 10 }],
      },
      created_at: new Date().toISOString(),
      theme: 'standard',
    };

    const mockBadge2: Badge = {
      ...mockBadge1,
      id: 'badge-2',
      code: 'TEST_BADGE_2',
      name: 'Test Badge 2',
    };

    const mockBadge3: Badge = {
      ...mockBadge1,
      id: 'badge-3',
      code: 'TEST_BADGE_3',
      name: 'Test Badge 3',
    };

    it('should filter to only eligible badges', () => {
      const results = [
        {
          badge: mockBadge1,
          eligible: true,
          metrics: { total_drinks: 15 },
        },
        {
          badge: mockBadge2,
          eligible: false,
          metrics: { total_drinks: 5 },
        },
        {
          badge: mockBadge3,
          eligible: true,
          metrics: { total_drinks: 20 },
        },
      ];

      const filtered = filterEligibleBadges(results);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].badge.code).toBe('TEST_BADGE_1');
      expect(filtered[1].badge.code).toBe('TEST_BADGE_3');
    });

    it('should return empty array when no badges are eligible', () => {
      const results = [
        {
          badge: mockBadge1,
          eligible: false,
          metrics: { total_drinks: 5 },
        },
        {
          badge: mockBadge2,
          eligible: false,
          metrics: { total_drinks: 3 },
        },
      ];

      const filtered = filterEligibleBadges(results);
      expect(filtered).toHaveLength(0);
    });

    it('should return all badges when all are eligible', () => {
      const results = [
        {
          badge: mockBadge1,
          eligible: true,
          metrics: { total_drinks: 15 },
        },
        {
          badge: mockBadge2,
          eligible: true,
          metrics: { total_drinks: 12 },
        },
      ];

      const filtered = filterEligibleBadges(results);
      expect(filtered).toHaveLength(2);
    });

    it('should handle empty input array', () => {
      const filtered = filterEligibleBadges([]);
      expect(filtered).toHaveLength(0);
    });

    it('should preserve metadata in filtered results', () => {
      const results = [
        {
          badge: mockBadge1,
          eligible: true,
          metrics: { total_drinks: 15 },
          metadata: { session_id: 'session-123', progress: 100 },
        },
      ];

      const filtered = filterEligibleBadges(results);
      expect(filtered[0].metadata).toEqual({
        session_id: 'session-123',
        progress: 100,
      });
    });
  });
});
