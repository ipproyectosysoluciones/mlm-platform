/**
 * @fileoverview DashboardController Unit Tests
 * @description Tests for the main dashboard aggregator handler
 * @module __tests__/unit/DashboardController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../services/UserService', () => ({
  userService: {
    findById: jest.fn(),
    getDirectReferrals: jest.fn(),
  },
  treeServiceInstance: {
    getLegCounts: jest.fn(),
  },
}));

jest.mock('../../services/CommissionService', () => ({
  CommissionService: jest.fn().mockImplementation(() => ({
    getCommissionStats: jest.fn(),
    getUserCommissions: jest.fn(),
  })),
}));

jest.mock('../../services/QRService', () => ({
  QRService: jest.fn().mockImplementation(() => ({
    getReferralLink: jest.fn(),
  })),
}));

jest.mock('../../models', () => ({
  User: {
    findAll: jest.fn(),
  },
  Commission: {
    findAll: jest.fn(),
  },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { getDashboard } from '../../controllers/dashboard/DashboardController';
import { userService, treeServiceInstance } from '../../services/UserService';
import { CommissionService } from '../../services/CommissionService';
import { QRService } from '../../services/QRService';
import { User, Commission } from '../../models';

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

describe('DashboardController - getDashboard', () => {
  let commissionServiceInstance: { getCommissionStats: jest.Mock; getUserCommissions: jest.Mock };
  let qrServiceInstance: { getReferralLink: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    // Grab the mock instances that will be created by new CommissionService() / new QRService()
    commissionServiceInstance = {
      getCommissionStats: jest.fn(),
      getUserCommissions: jest.fn(),
    };
    qrServiceInstance = {
      getReferralLink: jest.fn(),
    };

    (CommissionService as jest.Mock).mockImplementation(() => commissionServiceInstance);
    (QRService as jest.Mock).mockImplementation(() => qrServiceInstance);
  });

  it('returns 404 when user is not found', async () => {
    (userService.findById as jest.Mock).mockResolvedValue(null);

    const req = createMockReq();
    const res = createMockRes();

    await getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns complete dashboard data on success', async () => {
    const mockFullUser = {
      id: 'user-uuid',
      email: 'test@test.com',
      referralCode: 'REF-001',
      level: 2,
    };

    (userService.findById as jest.Mock).mockResolvedValue(mockFullUser);
    (userService.getDirectReferrals as jest.Mock).mockResolvedValue([
      { id: 'ref1' },
      { id: 'ref2' },
    ]);
    (treeServiceInstance.getLegCounts as jest.Mock).mockResolvedValue({
      leftCount: 3,
      rightCount: 1,
    });

    commissionServiceInstance.getCommissionStats.mockResolvedValue({
      totalEarned: 1000,
      pending: 200,
    });
    commissionServiceInstance.getUserCommissions.mockResolvedValue({ rows: [] });

    qrServiceInstance.getReferralLink.mockReturnValue('https://nexo.com/ref/REF-001');

    (User.findAll as jest.Mock).mockResolvedValue([]);
    (Commission.findAll as jest.Mock).mockResolvedValue([]);

    const req = createMockReq();
    const res = createMockRes();

    await getDashboard(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-uuid',
            referralCode: 'REF-001',
          }),
          stats: expect.objectContaining({
            totalReferrals: 2,
            leftCount: 3,
            rightCount: 1,
            totalEarnings: 1000,
            pendingEarnings: 200,
          }),
          referralLink: 'https://nexo.com/ref/REF-001',
        }),
      })
    );
  });

  it('includes referralsChart and commissionsChart arrays', async () => {
    const mockFullUser = {
      id: 'user-uuid',
      email: 'test@test.com',
      referralCode: 'REF-001',
      level: 1,
    };

    (userService.findById as jest.Mock).mockResolvedValue(mockFullUser);
    (userService.getDirectReferrals as jest.Mock).mockResolvedValue([]);
    (treeServiceInstance.getLegCounts as jest.Mock).mockResolvedValue({
      leftCount: 0,
      rightCount: 0,
    });

    commissionServiceInstance.getCommissionStats.mockResolvedValue({ totalEarned: 0, pending: 0 });
    commissionServiceInstance.getUserCommissions.mockResolvedValue({ rows: [] });

    qrServiceInstance.getReferralLink.mockReturnValue('https://nexo.com/ref/REF-001');

    (User.findAll as jest.Mock).mockResolvedValue([]);
    (Commission.findAll as jest.Mock).mockResolvedValue([]);

    const req = createMockReq();
    const res = createMockRes();

    await getDashboard(req, res);

    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.data.referralsChart).toHaveLength(6);
    expect(payload.data.commissionsChart).toHaveLength(6);
    expect(payload.data.referralsChart[0]).toHaveProperty('month');
    expect(payload.data.referralsChart[0]).toHaveProperty('count');
  });

  it('includes recentCommissions mapped correctly', async () => {
    const mockFullUser = {
      id: 'user-uuid',
      email: 'test@test.com',
      referralCode: 'REF-001',
      level: 1,
    };
    const mockCommission = {
      id: 'c1',
      type: 'direct',
      amount: 50,
      currency: 'USD',
      createdAt: new Date(),
      fromUser: { email: 'ref@test.com', referralCode: 'REF-002' },
    };

    (userService.findById as jest.Mock).mockResolvedValue(mockFullUser);
    (userService.getDirectReferrals as jest.Mock).mockResolvedValue([]);
    (treeServiceInstance.getLegCounts as jest.Mock).mockResolvedValue({
      leftCount: 0,
      rightCount: 0,
    });

    commissionServiceInstance.getCommissionStats.mockResolvedValue({ totalEarned: 50, pending: 0 });
    commissionServiceInstance.getUserCommissions.mockResolvedValue({ rows: [mockCommission] });

    qrServiceInstance.getReferralLink.mockReturnValue('https://nexo.com/ref/REF-001');

    (User.findAll as jest.Mock).mockResolvedValue([]);
    (Commission.findAll as jest.Mock).mockResolvedValue([]);

    const req = createMockReq();
    const res = createMockRes();

    await getDashboard(req, res);

    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.data.recentCommissions).toHaveLength(1);
    expect(payload.data.recentCommissions[0]).toMatchObject({
      id: 'c1',
      type: 'direct',
      amount: 50,
      fromUser: { email: 'ref@test.com' },
    });
  });
});
