/**
 * @fileoverview LeaderboardController Unit Tests
 * @description Tests for leaderboard controller handlers
 * @module __tests__/unit/LeaderboardController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../services/LeaderboardService', () => ({
  leaderboardService: {
    getTopSellers: jest.fn(),
    getTopReferrers: jest.fn(),
    getMyRank: jest.fn(),
  },
  Period: {},
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { LeaderboardController } from '../../controllers/LeaderboardController';
import { leaderboardService } from '../../services/LeaderboardService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: 'user-uuid', email: 'test@test.com', role: 'user', referralCode: 'REF-001' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LeaderboardController', () => {
  let controller: LeaderboardController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new LeaderboardController();
  });

  // ── getTopSellers ─────────────────────────────────────────────────────────

  describe('getTopSellers', () => {
    it('returns 400 for invalid period', async () => {
      const req = createMockReq({ query: { period: 'invalid-period' } });
      const res = createMockRes();

      await controller.getTopSellers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'INVALID_PERIOD' }),
        })
      );
    });

    it('returns sellers list for weekly period', async () => {
      const mockData = [
        { userId: 'u1', total: 500 },
        { userId: 'u2', total: 300 },
      ];
      (leaderboardService.getTopSellers as jest.Mock).mockResolvedValue(mockData);

      const req = createMockReq({ query: { period: 'weekly', limit: '5' } });
      const res = createMockRes();

      await controller.getTopSellers(req, res);

      expect(leaderboardService.getTopSellers).toHaveBeenCalledWith('weekly', 5);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockData, period: 'weekly' })
      );
    });

    it('uses default period weekly when period param is omitted', async () => {
      (leaderboardService.getTopSellers as jest.Mock).mockResolvedValue([]);

      const req = createMockReq({ query: {} });
      const res = createMockRes();

      await controller.getTopSellers(req, res);

      expect(leaderboardService.getTopSellers).toHaveBeenCalledWith('weekly', 10);
    });

    it('caps limit at 50', async () => {
      (leaderboardService.getTopSellers as jest.Mock).mockResolvedValue([]);

      const req = createMockReq({ query: { period: 'monthly', limit: '999' } });
      const res = createMockRes();

      await controller.getTopSellers(req, res);

      expect(leaderboardService.getTopSellers).toHaveBeenCalledWith('monthly', 50);
    });

    it('uses default limit 10 for invalid limit value', async () => {
      (leaderboardService.getTopSellers as jest.Mock).mockResolvedValue([]);

      const req = createMockReq({ query: { period: 'all-time', limit: 'abc' } });
      const res = createMockRes();

      await controller.getTopSellers(req, res);

      expect(leaderboardService.getTopSellers).toHaveBeenCalledWith('all-time', 10);
    });
  });

  // ── getTopReferrers ───────────────────────────────────────────────────────

  describe('getTopReferrers', () => {
    it('returns 400 for invalid period', async () => {
      const req = createMockReq({ query: { period: 'yearly' } });
      const res = createMockRes();

      await controller.getTopReferrers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns referrers list for monthly period', async () => {
      const mockData = [{ userId: 'u1', referralCount: 10 }];
      (leaderboardService.getTopReferrers as jest.Mock).mockResolvedValue(mockData);

      const req = createMockReq({ query: { period: 'monthly' } });
      const res = createMockRes();

      await controller.getTopReferrers(req, res);

      expect(leaderboardService.getTopReferrers).toHaveBeenCalledWith('monthly', 10);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockData, period: 'monthly' })
      );
    });

    it('response includes generatedAt timestamp', async () => {
      (leaderboardService.getTopReferrers as jest.Mock).mockResolvedValue([]);

      const req = createMockReq({ query: { period: 'all-time' } });
      const res = createMockRes();

      await controller.getTopReferrers(req, res);

      const call = (res.json as jest.Mock).mock.calls[0][0];
      expect(call).toHaveProperty('generatedAt');
      expect(typeof call.generatedAt).toBe('string');
    });
  });

  // ── getMyRank ─────────────────────────────────────────────────────────────

  describe('getMyRank', () => {
    it('returns 400 for invalid period', async () => {
      const req = createMockReq({ query: { period: 'daily' } });
      const res = createMockRes();

      await controller.getMyRank(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns user rank for sellers category', async () => {
      const mockRank = { rank: 3, userId: 'user-uuid', total: 250 };
      (leaderboardService.getMyRank as jest.Mock).mockResolvedValue(mockRank);

      const req = createMockReq({ query: { period: 'weekly', category: 'sellers' } });
      const res = createMockRes();

      await controller.getMyRank(req, res);

      expect(leaderboardService.getMyRank).toHaveBeenCalledWith('user-uuid', 'sellers', 'weekly');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockRank })
      );
    });

    it('defaults to sellers category when not specified', async () => {
      (leaderboardService.getMyRank as jest.Mock).mockResolvedValue({ rank: 1 });

      const req = createMockReq({ query: { period: 'monthly' } });
      const res = createMockRes();

      await controller.getMyRank(req, res);

      expect(leaderboardService.getMyRank).toHaveBeenCalledWith('user-uuid', 'sellers', 'monthly');
    });
  });
});
