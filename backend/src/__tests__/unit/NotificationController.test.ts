/**
 * @fileoverview NotificationController Unit Tests
 * @description Tests for notification preferences and 2FA (SMS-based) handlers
 * @module __tests__/unit/NotificationController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../models/User', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../services/SMSService', () => ({
  smsService: {
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  getNotificationPreferences,
  updateNotificationPreferences,
  enable2FA,
  verify2FA,
  disable2FA,
} from '../../controllers/NotificationController';
import { User } from '../../models/User';
import { smsService } from '../../services/SMSService';

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

function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-uuid',
    email: 'test@test.com',
    emailNotifications: true,
    smsNotifications: false,
    twoFactorEnabled: false,
    twoFactorPhone: null,
    weeklyDigest: true,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NotificationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getNotificationPreferences ────────────────────────────────────────────

  describe('getNotificationPreferences', () => {
    it('returns 401 when user is not authenticated', async () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();

      await getNotificationPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 404 when user is not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = createMockReq();
      const res = createMockRes();

      await getNotificationPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns notification preferences on success', async () => {
      const mockUser = createMockUser({ twoFactorEnabled: true, twoFactorPhone: '+1234567890' });
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockReq();
      const res = createMockRes();

      await getNotificationPreferences(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            emailNotifications: true,
            twoFactorEnabled: true,
          }),
        })
      );
    });
  });

  // ── updateNotificationPreferences ─────────────────────────────────────────

  describe('updateNotificationPreferences', () => {
    it('returns 401 when user is not authenticated', async () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();

      await updateNotificationPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 404 when user is not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = createMockReq({ body: { emailNotifications: false } });
      const res = createMockRes();

      await updateNotificationPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updates preferences and returns saved data', async () => {
      const mockUser = createMockUser();
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockReq({
        body: { emailNotifications: false, smsNotifications: true, weeklyDigest: false },
      });
      const res = createMockRes();

      await updateNotificationPreferences(req, res);

      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('ignores non-boolean values for boolean fields', async () => {
      const mockUser = createMockUser();
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockReq({
        body: { emailNotifications: 'yes' }, // string, not boolean
      });
      const res = createMockRes();

      await updateNotificationPreferences(req, res);

      // Should still succeed but not change emailNotifications
      expect(mockUser.emailNotifications).toBe(true); // unchanged
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });
  });

  // ── enable2FA ─────────────────────────────────────────────────────────────

  describe('enable2FA', () => {
    it('returns 401 when user is not authenticated', async () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();

      await enable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when phone is missing', async () => {
      const req = createMockReq({ body: {} });
      const res = createMockRes();

      await enable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for invalid E.164 phone format', async () => {
      const req = createMockReq({ body: { phone: '1234567890' } }); // missing +
      const res = createMockRes();

      await enable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('returns 500 when SMS send fails', async () => {
      (smsService.sendVerificationCode as jest.Mock).mockResolvedValue({
        success: false,
        error: 'SMS provider error',
      });

      const req = createMockReq({ body: { phone: '+15551234567' } });
      const res = createMockRes();

      await enable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns masked phone on success', async () => {
      (smsService.sendVerificationCode as jest.Mock).mockResolvedValue({ success: true });

      const req = createMockReq({ body: { phone: '+15551234567' } });
      const res = createMockRes();

      await enable2FA(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          maskedPhone: expect.stringContaining('4567'), // last 4 digits visible
        })
      );
    });
  });

  // ── verify2FA ─────────────────────────────────────────────────────────────

  describe('verify2FA', () => {
    it('returns 401 when user is not authenticated', async () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();

      await verify2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when code or phone is missing', async () => {
      const req = createMockReq({ body: { code: '123456' } }); // missing phone
      const res = createMockRes();

      await verify2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when no stored code exists for the user+phone pair', async () => {
      // No enable2FA was called first → twoFactorCodes Map is empty for this pair
      const req = createMockReq({
        body: { code: '123456', phone: '+15559999999' },
      });
      const res = createMockRes();

      await verify2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // ── disable2FA ────────────────────────────────────────────────────────────

  describe('disable2FA', () => {
    it('returns 401 when user is not authenticated', async () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();

      await disable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 404 when user is not found', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      const req = createMockReq();
      const res = createMockRes();

      await disable2FA(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('disables 2FA and returns success', async () => {
      const mockUser = createMockUser({ twoFactorEnabled: true, twoFactorPhone: '+15551234567' });
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockReq();
      const res = createMockRes();

      await disable2FA(req, res);

      expect(mockUser.twoFactorEnabled).toBe(false);
      expect(mockUser.twoFactorPhone).toBeNull();
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
