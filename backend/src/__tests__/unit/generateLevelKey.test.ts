/**
 * @fileoverview Unit tests for generateLevelKey utility
 * @description Tests the depth-to-level-key mapping helper.
 *              depth 0 → 'direct', depth > 0 → 'level_N'
 * @module __tests__/unit/generateLevelKey
 * @issue #157 — Commission Model Migration Binary → Unilevel
 */

import { generateLevelKey } from '../../types';

describe('generateLevelKey(depth)', () => {
  it('should return "direct" for depth 0 (sponsor)', () => {
    expect(generateLevelKey(0)).toBe('direct');
  });

  it('should return "level_1" for depth 1', () => {
    expect(generateLevelKey(1)).toBe('level_1');
  });

  it('should return "level_5" for depth 5', () => {
    expect(generateLevelKey(5)).toBe('level_5');
  });

  it('should return "level_9" for depth 9', () => {
    expect(generateLevelKey(9)).toBe('level_9');
  });

  it('should return "level_10" for depth 10 (beyond default config)', () => {
    expect(generateLevelKey(10)).toBe('level_10');
  });
});
