/**
 * @fileoverview BotController Unit Tests (complementary)
 * @description Tests for getUserByPhone, getWalletInfo, getNetworkSummary,
 *              getRecentCommissions, getBotReservations, getBotHealth
 * @module __tests__/unit/BotController.unit
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn(),
    query: jest.fn(),
    sync: jest.fn(),
    authenticate: jest.fn(),
  },
  resetSequelize: jest.fn(),
}));

// Reservation imported directly, not via barrel
jest.mock('../../models/Reservation', () => ({
  Reservation: {
    findAll: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    count: jest.fn(),
  },
  Wallet: {
    findOne: jest.fn(),
  },
  Commission: {
    sum: jest.fn(),
    findAll: jest.fn(),
  },
  WithdrawalRequest: {
    findAll: jest.fn(),
  },
}));

jest.mock('../../services/PropertyService', () => ({
  propertyService: { findAll: jest.fn() },
}));

jest.mock('../../services/TourPackageService', () => ({
  tourPackageService: { findAll: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  getUserByPhone,
  getWalletInfo,
  getNetworkSummary,
  getRecentCommissions,
  getBotReservations,
  getBotHealth,
} from '../../controllers/BotController';
import { User, Wallet, Commission, WithdrawalRequest } from '../../models';
import { Reservation } from '../../models/Reservation';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
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

describe('BotController - getUserByPhone', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when phone param is missing', async () => {
    const req = createMockReq({ params: {} });
    const res = createMockRes();

    await getUserByPhone(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns null user when no user found for phone', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const req = createMockReq({ params: { phone: '5491122334455' } });
    const res = createMockRes();

    await getUserByPhone(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, user: null });
  });

  it('returns user data when found', async () => {
    const mockUser = {
      id: 'u1',
      email: 'user@test.com',
      twoFactorPhone: '+5491122334455',
      role: 'user',
      level: 1,
      status: 'active',
      referralCode: 'REF-001',
    };
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    const req = createMockReq({ params: { phone: '5491122334455' } });
    const res = createMockRes();

    await getUserByPhone(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        user: expect.objectContaining({ id: 'u1', role: 'user' }),
      })
    );
  });
});

describe('BotController - getWalletInfo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null wallet when no wallet exists for userId', async () => {
    (Wallet.findOne as jest.Mock).mockResolvedValue(null);
    (WithdrawalRequest.findAll as jest.Mock).mockResolvedValue([]);
    (Commission.sum as jest.Mock).mockResolvedValue(null);

    const req = createMockReq({ params: { userId: 'u1' } });
    const res = createMockRes();

    await getWalletInfo(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, wallet: null });
  });

  it('returns wallet with balance and pending withdrawals', async () => {
    (Wallet.findOne as jest.Mock).mockResolvedValue({ balance: 250, currency: 'USD' });
    (WithdrawalRequest.findAll as jest.Mock).mockResolvedValue([
      { requestedAmount: 50 },
      { requestedAmount: 30 },
    ]);
    (Commission.sum as jest.Mock).mockResolvedValue(800);

    const req = createMockReq({ params: { userId: 'u1' } });
    const res = createMockRes();

    await getWalletInfo(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      wallet: {
        balance: 250,
        pendingWithdrawals: 80,
        totalEarned: 800,
        currency: 'USD',
      },
    });
  });
});

describe('BotController - getNetworkSummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null network when user not found', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const req = createMockReq({ params: { userId: 'nonexistent' } });
    const res = createMockRes();

    await getNetworkSummary(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, network: null });
  });

  it('returns network summary with counts', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({ id: 'u1', level: 3 });
    (User.count as jest.Mock)
      .mockResolvedValueOnce(10) // totalReferrals
      .mockResolvedValueOnce(4) // leftLeg
      .mockResolvedValueOnce(6) // rightLeg
      .mockResolvedValueOnce(7); // activeReferrals

    const req = createMockReq({ params: { userId: 'u1' } });
    const res = createMockRes();

    await getNetworkSummary(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      network: {
        totalReferrals: 10,
        activeReferrals: 7,
        leftLeg: 4,
        rightLeg: 6,
        level: 3,
      },
    });
  });
});

describe('BotController - getRecentCommissions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns commission list for userId', async () => {
    const mockCommissions = [
      {
        amount: 100,
        type: 'direct',
        description: 'Direct referral',
        status: 'paid',
        currency: 'USD',
        createdAt: new Date('2026-01-01'),
      },
    ];
    (Commission.findAll as jest.Mock).mockResolvedValue(mockCommissions);

    const req = createMockReq({ params: { userId: 'u1' }, query: {} });
    const res = createMockRes();

    await getRecentCommissions(req, res);

    expect(Commission.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' }, limit: 5 })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        commissions: expect.arrayContaining([
          expect.objectContaining({ amount: 100, type: 'direct' }),
        ]),
      })
    );
  });

  it('caps limit at 10', async () => {
    (Commission.findAll as jest.Mock).mockResolvedValue([]);

    const req = createMockReq({ params: { userId: 'u1' }, query: { limit: '99' } });
    const res = createMockRes();

    await getRecentCommissions(req, res);

    expect(Commission.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });
});

describe('BotController - getBotReservations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns reservations for userId', async () => {
    const mockReservations = [
      {
        id: 'r1',
        type: 'property',
        status: 'confirmed',
        propertyId: 'prop-1',
        checkIn: new Date('2026-06-01'),
        checkOut: new Date('2026-06-07'),
        tourPackageId: null,
        tourDate: null,
        groupSize: 2,
        totalPrice: 500,
        currency: 'USD',
        paymentStatus: 'paid',
        createdAt: new Date('2026-01-01'),
      },
    ];
    (Reservation.findAll as jest.Mock).mockResolvedValue(mockReservations);

    const req = createMockReq({ params: { userId: 'u1' }, query: {} });
    const res = createMockRes();

    await getBotReservations(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 1,
        reservations: expect.arrayContaining([
          expect.objectContaining({ id: 'r1', type: 'property' }),
        ]),
      })
    );
  });

  it('applies status and type filters when provided', async () => {
    (Reservation.findAll as jest.Mock).mockResolvedValue([]);

    const req = createMockReq({
      params: { userId: 'u1' },
      query: { status: 'confirmed', type: 'tour' },
    });
    const res = createMockRes();

    await getBotReservations(req, res);

    const callArgs = (Reservation.findAll as jest.Mock).mock.calls[0][0];
    expect(callArgs.where).toMatchObject({ userId: 'u1', status: 'confirmed', type: 'tour' });
  });
});

describe('BotController - getBotHealth', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns health status with ok when DB queries succeed', async () => {
    (User.count as jest.Mock).mockResolvedValue(42);
    (Reservation.count as jest.Mock).mockResolvedValue(5);

    const req = createMockReq({});
    const res = createMockRes();

    await getBotHealth(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'ok',
          service: 'nexo-bot-backend',
          db: expect.objectContaining({ status: 'ok', activeUsers: 42 }),
        }),
      })
    );
  });

  it('returns degraded status when DB query fails', async () => {
    (User.count as jest.Mock).mockRejectedValue(new Error('DB down'));

    const req = createMockReq({});
    const res = createMockRes();

    await getBotHealth(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'degraded',
          db: expect.objectContaining({ status: 'error' }),
        }),
      })
    );
  });

  it('includes uptimeSeconds and config flags', async () => {
    (User.count as jest.Mock).mockResolvedValue(0);
    (Reservation.count as jest.Mock).mockResolvedValue(0);

    const req = createMockReq({});
    const res = createMockRes();

    await getBotHealth(req, res);

    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.data).toHaveProperty('uptimeSeconds');
    expect(payload.data.config).toHaveProperty('openai');
    expect(payload.data.config).toHaveProperty('botSecret');
    expect(payload.data.config).toHaveProperty('n8n');
  });
});
