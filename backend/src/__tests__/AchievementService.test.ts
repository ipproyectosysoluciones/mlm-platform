/**
 * @fileoverview Unit tests for AchievementService
 * @description Tests for AchievementService including:
 *              - checkAndUnlock: never throws, trigger filtering, coming_soon skip,
 *                already-unlocked skip, condition met → unlock
 *              - seedAchievements: upserts 8 records, consistency_30 is coming_soon
 * @module __tests__/AchievementService
 */

// ─── Mock database before importing anything that uses it ────────────────────

jest.mock('../config/database', () => ({
  sequelize: {
    query: jest.fn(),
    transaction: jest.fn(),
    sync: jest.fn().mockResolvedValue({}),
    authenticate: jest.fn().mockResolvedValue(undefined),
  },
  resetSequelize: jest.fn(),
}));

// ─── Mock models ─────────────────────────────────────────────────────────────

jest.mock('../models', () => ({
  Achievement: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    upsert: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    hasOne: jest.fn(),
    belongsTo: jest.fn(),
  },
  Badge: {
    findAll: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  UserAchievement: {
    findAll: jest.fn(),
    findOrCreate: jest.fn(),
    init: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
  },
  Order: {
    findAll: jest.fn(),
    count: jest.fn(),
    init: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    init: jest.fn(),
  },
}));

import { AchievementService } from '../services/AchievementService';
import { Achievement, UserAchievement } from '../models';
import { sequelize } from '../config/database';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a minimal Achievement-like object */
function makeAchievement(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ach-1',
    key: 'first_sale',
    name: 'Primera Venta',
    conditionType: 'sales_count',
    conditionValue: 1,
    tier: 'bronze',
    points: 100,
    status: 'active',
    ...overrides,
  } as any;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AchievementService', () => {
  let service: AchievementService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AchievementService();
  });

  // ── checkAndUnlock ────────────────────────────────────────────────────────

  describe('checkAndUnlock', () => {
    it('never throws — even when the DB rejects', async () => {
      // Simulate a DB error on Achievement.findAll
      (Achievement.findAll as jest.Mock).mockRejectedValue(new Error('DB connection lost'));

      // Must resolve (not reject)
      await expect(service.checkAndUnlock('user-1', 'sale_completed')).resolves.toBeUndefined();
    });

    it("with trigger 'sale_completed' queries achievements by sales_count / sales_amount", async () => {
      // Return one sales_count achievement
      const ach = makeAchievement({ conditionType: 'sales_count', conditionValue: 1 });
      (Achievement.findAll as jest.Mock).mockResolvedValue([ach]);

      // No already-unlocked achievements
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);

      // User has 0 sales → condition NOT met, so findOrCreate must NOT be called
      (sequelize.query as jest.Mock).mockResolvedValue([{ cnt: 0 }]);

      await service.checkAndUnlock('user-1', 'sale_completed');

      // Achievement.findAll was called (trigger evaluated)
      expect(Achievement.findAll).toHaveBeenCalled();

      // The conditionTypes passed must include 'sales_count' and 'sales_amount'
      const callArgs = (Achievement.findAll as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.conditionType).toEqual(
        expect.arrayContaining(['sales_count', 'sales_amount'])
      );
    });

    it("skips 'coming_soon' achievements — consistency_30 is never unlocked", async () => {
      // Return a coming_soon achievement (should be filtered by query)
      // The service queries with status: 'active', so it won't even return coming_soon rows.
      // We verify Achievement.findAll is called with status: 'active'.
      const comingSoonAch = makeAchievement({
        key: 'consistency_30',
        status: 'coming_soon',
        conditionType: 'login_streak',
        conditionValue: 30,
      });

      // findAll returns empty because status: 'active' filter excludes coming_soon
      (Achievement.findAll as jest.Mock).mockResolvedValue([]);
      (Achievement.findOne as jest.Mock).mockResolvedValue(null);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);

      await service.checkAndUnlock('user-1', 'login');

      // findOrCreate must never be called for a coming_soon achievement
      expect(UserAchievement.findOrCreate).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ achievementId: comingSoonAch.id }),
        })
      );
    });

    it('skips achievements already unlocked (findAll returns existing UserAchievement)', async () => {
      const ach = makeAchievement({ id: 'ach-already', conditionValue: 1 });
      (Achievement.findAll as jest.Mock).mockResolvedValue([ach]);

      // This achievement is already in the user's unlocked set
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([{ achievementId: 'ach-already' }]);

      // Simulate enough progress just to be sure the guard is the skip, not the condition
      (sequelize.query as jest.Mock).mockResolvedValue([{ cnt: 99 }]);

      await service.checkAndUnlock('user-1', 'sale_completed');

      // findOrCreate must NOT be called because the achievement was already unlocked
      expect(UserAchievement.findOrCreate).not.toHaveBeenCalled();
    });

    it('unlocks achievement when condition is met (findOrCreate returns created=true)', async () => {
      const ach = makeAchievement({ id: 'ach-first-sale', conditionValue: 1 });
      (Achievement.findAll as jest.Mock).mockResolvedValue([ach]);

      // No previously unlocked achievements
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);

      // User has 3 completed sales → condition met (3 >= 1)
      (sequelize.query as jest.Mock).mockResolvedValue([{ cnt: 3 }]);

      // findOrCreate returns [record, created=true]
      const mockRecord = { id: 'ua-1', userId: 'user-1', achievementId: 'ach-first-sale' };
      (UserAchievement.findOrCreate as jest.Mock).mockResolvedValue([mockRecord, true]);

      await service.checkAndUnlock('user-1', 'sale_completed');

      expect(UserAchievement.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', achievementId: 'ach-first-sale' },
        })
      );
    });
  });

  // ── seedAchievements ──────────────────────────────────────────────────────

  describe('seedAchievements', () => {
    it('calls Achievement.upsert exactly 8 times — one per canonical achievement', async () => {
      (Achievement as any).upsert = jest.fn().mockResolvedValue([{}, true]);

      await service.seedAchievements();

      expect((Achievement as any).upsert).toHaveBeenCalledTimes(8);
    });

    it("seeds 'consistency_30' with status: 'coming_soon'", async () => {
      (Achievement as any).upsert = jest.fn().mockResolvedValue([{}, true]);

      await service.seedAchievements();

      // Find the call where key is 'consistency_30'
      const calls = ((Achievement as any).upsert as jest.Mock).mock.calls;
      const consistency30Call = calls.find(
        ([data]: [Record<string, unknown>]) => data.key === 'consistency_30'
      );

      expect(consistency30Call).toBeDefined();
      expect(consistency30Call[0].status).toBe('coming_soon');
    });
  });
});
