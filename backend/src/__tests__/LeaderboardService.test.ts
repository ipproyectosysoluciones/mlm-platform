/**
 * @fileoverview Unit tests for LeaderboardService
 * @description Tests for LeaderboardService including:
 *              - getTopSellers with weekly/monthly/all-time period filters
 *              - getTopReferrers shape validation
 *              - In-memory cache hit behavior
 *              - invalidateCache selective clearing
 *              - getMyRank null rank when user not in top 100
 * @module __tests__/LeaderboardService
 */

// Mock sequelize before importing service
jest.mock('../config/database', () => ({
  sequelize: {
    query: jest.fn(),
    transaction: jest.fn(),
    sync: jest.fn().mockResolvedValue({}),
    authenticate: jest.fn().mockResolvedValue(undefined),
  },
  resetSequelize: jest.fn(),
}));

import { LeaderboardService } from '../services/LeaderboardService';
import { sequelize } from '../config/database';

// Typed mock helper
const mockQuery = sequelize.query as jest.Mock;

// ============================================
// HELPERS
// ============================================

/** Build fake seller DB rows returned by sequelize.query */
function makeSellerRows(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    userId: `user-${i + 1}`,
    name: `seller-${i + 1}@example.com`,
    username: `REF-${i + 1}`,
    profileImage: null,
    totalSales: (count - i) * 100,
  }));
}

/** Build fake referrer DB rows returned by sequelize.query */
function makeReferrerRows(count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    userId: `user-${i + 1}`,
    name: `referrer-${i + 1}@example.com`,
    username: `REF-${i + 1}`,
    profileImage: null,
    referralCount: (count - i) * 5,
  }));
}

// ============================================
// TESTS
// ============================================

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Fresh instance per test — avoids shared cache contamination
    service = new LeaderboardService();
  });

  // ------------------------------------------
  // getTopSellers — period date filters
  // ------------------------------------------

  describe('getTopSellers', () => {
    it('weekly — calls sequelize.query with a startDate ~7 days ago', async () => {
      mockQuery.mockResolvedValue(makeSellerRows());

      const beforeCall = new Date();
      beforeCall.setDate(beforeCall.getDate() - 7);

      await service.getTopSellers('weekly');

      expect(mockQuery).toHaveBeenCalledTimes(1);

      const [, options] = mockQuery.mock.calls[0];
      expect(options.replacements).toHaveProperty('startDate');

      const startDate = new Date(options.replacements.startDate as string);
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      // Should be within 5 seconds of expected value
      expect(Math.abs(startDate.getTime() - sevenDaysAgo.getTime())).toBeLessThan(5_000);
    });

    it('monthly — calls sequelize.query with startDate = first day of current month', async () => {
      mockQuery.mockResolvedValue(makeSellerRows());

      await service.getTopSellers('monthly');

      expect(mockQuery).toHaveBeenCalledTimes(1);

      const [, options] = mockQuery.mock.calls[0];
      expect(options.replacements).toHaveProperty('startDate');

      const startDate = new Date(options.replacements.startDate as string);
      const now = new Date();

      expect(startDate.getFullYear()).toBe(now.getFullYear());
      expect(startDate.getMonth()).toBe(now.getMonth());
      expect(startDate.getDate()).toBe(1);
      expect(startDate.getHours()).toBe(0);
    });

    it('all-time — calls sequelize.query WITHOUT startDate replacement', async () => {
      mockQuery.mockResolvedValue(makeSellerRows());

      await service.getTopSellers('all-time');

      expect(mockQuery).toHaveBeenCalledTimes(1);

      const [, options] = mockQuery.mock.calls[0];
      expect(options.replacements).not.toHaveProperty('startDate');
    });

    it('returns correct SellerEntry shape with rank assigned', async () => {
      mockQuery.mockResolvedValue(makeSellerRows(2));

      const result = await service.getTopSellers('weekly');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        rank: 1,
        userId: 'user-1',
        name: 'seller-1@example.com',
        username: 'REF-1',
        totalSales: expect.any(Number),
        period: 'weekly',
      });
      expect(result[1].rank).toBe(2);
    });
  });

  // ------------------------------------------
  // Cache behavior
  // ------------------------------------------

  describe('cache', () => {
    it('cache hit — second call to same method/period does NOT call sequelize.query again', async () => {
      mockQuery.mockResolvedValue(makeSellerRows());

      await service.getTopSellers('weekly');
      await service.getTopSellers('weekly');

      // Should have queried only once; second call served from cache
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('different periods use separate cache keys — both call sequelize.query', async () => {
      mockQuery.mockResolvedValue(makeSellerRows());

      await service.getTopSellers('weekly');
      await service.getTopSellers('monthly');

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  // ------------------------------------------
  // invalidateCache
  // ------------------------------------------

  describe('invalidateCache', () => {
    it('invalidateCache("sellers") — clears seller entries, referrer cache remains intact', async () => {
      mockQuery.mockResolvedValue(makeSellerRows());

      // Warm up both caches
      await service.getTopSellers('weekly');
      await service.getTopReferrers('weekly');

      // Both should be cached — no extra calls yet
      expect(mockQuery).toHaveBeenCalledTimes(2);

      // Invalidate only sellers
      service.invalidateCache('sellers');

      // Seller cache is gone — next call must hit DB
      mockQuery.mockResolvedValue(makeSellerRows());
      await service.getTopSellers('weekly');
      expect(mockQuery).toHaveBeenCalledTimes(3);

      // Referrer cache is still valid — no extra call
      await service.getTopReferrers('weekly');
      expect(mockQuery).toHaveBeenCalledTimes(3); // still 3, served from cache
    });
  });

  // ------------------------------------------
  // getTopReferrers
  // ------------------------------------------

  describe('getTopReferrers', () => {
    it('weekly — returns correct ReferrerEntry shape { rank, userId, name, referralCount }', async () => {
      mockQuery.mockResolvedValue(makeReferrerRows(3));

      const result = await service.getTopReferrers('weekly');

      expect(result).toHaveLength(3);

      // Verify required fields are present and correctly typed
      result.forEach((entry, i) => {
        expect(entry).toMatchObject({
          rank: i + 1,
          userId: expect.any(String),
          name: expect.any(String),
          referralCount: expect.any(Number),
          period: 'weekly',
        });
      });

      // Rank 1 has the highest referral count
      expect(result[0].referralCount).toBeGreaterThan(result[1].referralCount);
    });

    it('calls sequelize.query with startDate for weekly period', async () => {
      mockQuery.mockResolvedValue(makeReferrerRows());

      await service.getTopReferrers('weekly');

      const [, options] = mockQuery.mock.calls[0];
      expect(options.replacements).toHaveProperty('startDate');
    });

    it('all-time — calls sequelize.query without startDate', async () => {
      mockQuery.mockResolvedValue(makeReferrerRows());

      await service.getTopReferrers('all-time');

      const [, options] = mockQuery.mock.calls[0];
      expect(options.replacements).not.toHaveProperty('startDate');
    });
  });

  // ------------------------------------------
  // getMyRank
  // ------------------------------------------

  describe('getMyRank', () => {
    it('returns rank: null when userId is not in top-100 result', async () => {
      // Return rows that do NOT include our userId
      const sellerRows = makeSellerRows(5); // user-1 through user-5
      const referrerRows = makeReferrerRows(5);

      // getMyRank calls getTopSellers then getTopReferrers (limit=100)
      mockQuery.mockResolvedValueOnce(sellerRows).mockResolvedValueOnce(referrerRows);

      const result = await service.getMyRank('user-999', 'sellers', 'weekly');

      expect(result.sellers.rank).toBeNull();
      expect(result.sellers.totalSales).toBe(0);
      expect(result.referrers.rank).toBeNull();
      expect(result.referrers.referralCount).toBe(0);
      expect(result.period).toBe('weekly');
    });

    it('returns correct rank and value when userId IS in top-100', async () => {
      const sellerRows = makeSellerRows(5);
      const referrerRows = makeReferrerRows(5);

      mockQuery.mockResolvedValueOnce(sellerRows).mockResolvedValueOnce(referrerRows);

      // user-2 is rank 2 in both
      const result = await service.getMyRank('user-2', 'sellers', 'weekly');

      expect(result.sellers.rank).toBe(2);
      expect(result.sellers.totalSales).toBeGreaterThan(0);
      expect(result.referrers.rank).toBe(2);
      expect(result.period).toBe('weekly');
    });

    it('returns sellers rank null even when user is found in referrers', async () => {
      // Sellers: user-1 to user-3 (no user-99)
      // Referrers: user-99 is rank 1
      const sellerRows = makeSellerRows(3);
      const referrerRows = [
        {
          userId: 'user-99',
          name: 'top@example.com',
          username: 'REF-99',
          profileImage: null,
          referralCount: 50,
        },
        ...makeReferrerRows(2),
      ];

      mockQuery.mockResolvedValueOnce(sellerRows).mockResolvedValueOnce(referrerRows);

      const result = await service.getMyRank('user-99', 'referrers', 'all-time');

      expect(result.sellers.rank).toBeNull();
      expect(result.referrers.rank).toBe(1);
      expect(result.referrers.referralCount).toBe(50);
    });
  });
});
