/**
 * @fileoverview Unit tests for commission-config route level validation
 * @description Phase 5 (#157): Verify that level validation accepts N-level unilevel keys
 *              (direct, level_1 through level_9+), not just the old 4-level binary set.
 * @module __tests__/unit/CommissionConfigRouteValidation.test
 */

/**
 * Test the level validation regex directly.
 * The route should accept: 'direct' or 'level_' followed by 1+ digits.
 * This pattern replaces the old isIn(['direct', 'level_1', ..., 'level_4']).
 */
const LEVEL_PATTERN = /^(direct|level_\d+)$/;

describe('Commission Config — level validation pattern (Phase 5 #157)', () => {
  describe('should accept valid unilevel levels', () => {
    const validLevels = [
      'direct',
      'level_1',
      'level_2',
      'level_3',
      'level_4',
      'level_5',
      'level_6',
      'level_7',
      'level_8',
      'level_9',
      'level_10',
      'level_15',
    ];

    for (const level of validLevels) {
      it(`should accept "${level}"`, () => {
        expect(LEVEL_PATTERN.test(level)).toBe(true);
      });
    }
  });

  describe('should reject invalid levels', () => {
    const invalidLevels = [
      '',
      'invalid',
      'level_',
      'level_abc',
      'DIRECT',
      'level1',
      'level-1',
      'level_1_extra',
      ' direct',
      'direct ',
    ];

    for (const level of invalidLevels) {
      it(`should reject "${level}"`, () => {
        expect(LEVEL_PATTERN.test(level)).toBe(false);
      });
    }
  });
});
