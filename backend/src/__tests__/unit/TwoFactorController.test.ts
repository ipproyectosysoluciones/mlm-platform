/**
 * @fileoverview TwoFactorController Unit Tests
 * @description Tests for 2FA sub-controllers: Setup, Verification, Status, Disable
 * @module __tests__/unit/TwoFactorController
 *
 * NOTE: All sub-controllers use asyncHandler which returns void (not a Promise).
 * To test errors forwarded via next(), we call the handler WITHOUT await and then
 * flush pending microtasks with: await new Promise(r => setImmediate(r))
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('../../services/TwoFactorService', () => ({
  TwoFactorService: {
    generateSecret: jest.fn(),
    verifyCode: jest.fn(),
    encryptSecretForStorage: jest.fn(),
    generateRecoveryCodes: jest.fn(),
    hashRecoveryCodes: jest.fn(),
    verifyRecoveryCode: jest.fn(),
  },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { setup2FA, getPendingSetups } from '../../controllers/twofactor/TwoFactorSetupController';
import {
  verifySetup,
  verify2FA,
} from '../../controllers/twofactor/TwoFactorVerificationController';
import { get2FAStatus } from '../../controllers/twofactor/TwoFactorStatusController';
import { disable2FA } from '../../controllers/twofactor/TwoFactorDisableController';
import { User } from '../../models';
import { TwoFactorService } from '../../services/TwoFactorService';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Flush pending microtasks — needed when testing asyncHandler-wrapped functions */
const flushMicrotasks = () => new Promise((r) => setImmediate(r));

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

// ── TwoFactorSetupController ──────────────────────────────────────────────────

describe('TwoFactorSetupController - setup2FA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPendingSetups().clear();
  });

  it('calls next with UNAUTHORIZED when user is missing', async () => {
    const req = createMockReq({ user: undefined });
    const res = createMockRes();
    const next = jest.fn();

    setup2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: 'UNAUTHORIZED' })
    );
  });

  it('calls next with USER_NOT_FOUND when user does not exist in DB', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    setup2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: 'USER_NOT_FOUND' })
    );
  });

  it('calls next with TWO_FA_ALREADY_ENABLED when 2FA is active', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({ id: 'user-uuid', twoFactorEnabled: true });

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    setup2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'TWO_FA_ALREADY_ENABLED' })
    );
  });

  it('returns QR code and secret on success', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({ id: 'user-uuid', twoFactorEnabled: false });
    (TwoFactorService.generateSecret as jest.Mock).mockResolvedValue({
      secret: 'BASE32SECRET',
      qrCodeUrl: 'data:image/png;base64,abc',
    });

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    setup2FA(req, res, next);
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          qrCodeUrl: 'data:image/png;base64,abc',
          secret: 'BASE32SECRET',
        }),
      })
    );
  });
});

// ── TwoFactorVerificationController - verifySetup ─────────────────────────────

describe('TwoFactorVerificationController - verifySetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPendingSetups().clear();
  });

  it('calls next with UNAUTHORIZED when user is missing', async () => {
    const req = createMockReq({ user: undefined });
    const res = createMockRes();
    const next = jest.fn();

    verifySetup(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with VALIDATION_ERROR when code is missing', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();
    const next = jest.fn();

    verifySetup(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' })
    );
  });

  it('calls next with TWO_FA_SETUP_NOT_FOUND when no pending setup exists', async () => {
    const req = createMockReq({ body: { code: '123456' } });
    const res = createMockRes();
    const next = jest.fn();

    verifySetup(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'TWO_FA_SETUP_NOT_FOUND' })
    );
  });

  it('calls next with TWO_FA_SETUP_EXPIRED when setup is expired', async () => {
    getPendingSetups().set('user-uuid', {
      secret: 'SEC',
      expiresAt: new Date(Date.now() - 1000),
    });

    const req = createMockReq({ body: { code: '123456' } });
    const res = createMockRes();
    const next = jest.fn();

    verifySetup(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'TWO_FA_SETUP_EXPIRED' })
    );
  });

  it('calls next with TWO_FA_INVALID_CODE when code is wrong', async () => {
    getPendingSetups().set('user-uuid', {
      secret: 'SECRET',
      expiresAt: new Date(Date.now() + 600_000),
    });
    (TwoFactorService.encryptSecretForStorage as jest.Mock).mockReturnValue('encrypted-secret');
    (TwoFactorService.verifyCode as jest.Mock).mockReturnValue({ valid: false });

    const req = createMockReq({ body: { code: '000000' } });
    const res = createMockRes();
    const next = jest.fn();

    verifySetup(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'TWO_FA_INVALID_CODE' })
    );
  });

  it('enables 2FA and returns recovery codes on valid code', async () => {
    getPendingSetups().set('user-uuid', {
      secret: 'SECRET',
      expiresAt: new Date(Date.now() + 600_000),
    });
    (TwoFactorService.encryptSecretForStorage as jest.Mock).mockReturnValue('encrypted-secret');
    (TwoFactorService.verifyCode as jest.Mock).mockReturnValue({ valid: true });
    (TwoFactorService.generateRecoveryCodes as jest.Mock).mockReturnValue(['CODE-1', 'CODE-2']);
    (TwoFactorService.hashRecoveryCodes as jest.Mock).mockResolvedValue(['HASH-1', 'HASH-2']);
    (User.update as jest.Mock).mockResolvedValue([1]);

    const req = createMockReq({ body: { code: '123456' } });
    const res = createMockRes();
    const next = jest.fn();

    verifySetup(req, res, next);
    await flushMicrotasks();

    expect(User.update).toHaveBeenCalledWith(
      expect.objectContaining({ twoFactorEnabled: true }),
      expect.any(Object)
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ recoveryCodes: ['CODE-1', 'CODE-2'] }),
      })
    );
  });
});

// ── TwoFactorVerificationController - verify2FA ───────────────────────────────

describe('TwoFactorVerificationController - verify2FA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next with UNAUTHORIZED when user is missing', async () => {
    const req = createMockReq({ user: undefined });
    const res = createMockRes();
    const next = jest.fn();

    verify2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with VALIDATION_ERROR when code is missing', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();
    const next = jest.fn();

    verify2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' })
    );
  });

  it('calls next with USER_NOT_FOUND when user does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const req = createMockReq({ body: { code: '123456' } });
    const res = createMockRes();
    const next = jest.fn();

    verify2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: 'USER_NOT_FOUND' })
    );
  });

  it('calls next with TWO_FA_NOT_ENABLED when 2FA is not enabled', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 'user-uuid',
      twoFactorEnabled: false,
      twoFactorSecretEncrypted: null,
      twoFactorLockedUntil: null,
    });

    const req = createMockReq({ body: { code: '123456' } });
    const res = createMockRes();
    const next = jest.fn();

    verify2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'TWO_FA_NOT_ENABLED' })
    );
  });

  it('calls next with TWO_FA_LOCKED when account is locked', async () => {
    const futureDate = new Date(Date.now() + 900_000);
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 'user-uuid',
      twoFactorEnabled: true,
      twoFactorSecretEncrypted: 'enc-secret',
      twoFactorLockedUntil: futureDate,
    });

    const req = createMockReq({ body: { code: '123456' } });
    const res = createMockRes();
    const next = jest.fn();

    verify2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 429, code: 'TWO_FA_LOCKED' })
    );
  });

  it('returns verified:true on valid code', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 'user-uuid',
      twoFactorEnabled: true,
      twoFactorSecretEncrypted: 'enc-secret',
      twoFactorLockedUntil: null,
      twoFactorFailedAttempts: 0,
    });
    (TwoFactorService.verifyCode as jest.Mock).mockReturnValue({ valid: true });
    (User.update as jest.Mock).mockResolvedValue([1]);

    const req = createMockReq({ body: { code: '123456' } });
    const res = createMockRes();
    const next = jest.fn();

    verify2FA(req, res, next);
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { verified: true },
      })
    );
  });
});

// ── TwoFactorStatusController ─────────────────────────────────────────────────

describe('TwoFactorStatusController - get2FAStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next with UNAUTHORIZED when user is missing', async () => {
    const req = createMockReq({ user: undefined });
    const res = createMockRes();
    const next = jest.fn();

    get2FAStatus(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with USER_NOT_FOUND when user does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    get2FAStatus(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('returns 2FA status data when user has 2FA enabled', async () => {
    const enabledAt = new Date();
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 'user-uuid',
      twoFactorEnabled: true,
      twoFactorEnabledAt: enabledAt,
    });

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    get2FAStatus(req, res, next);
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          enabled: true,
          enabledAt,
          method: 'totp',
        }),
      })
    );
  });

  it('returns enabled:false for user without 2FA', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 'user-uuid',
      twoFactorEnabled: false,
      twoFactorEnabledAt: null,
    });

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    get2FAStatus(req, res, next);
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ enabled: false, enabledAt: null }),
      })
    );
  });
});

// ── TwoFactorDisableController ────────────────────────────────────────────────

describe('TwoFactorDisableController - disable2FA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next with UNAUTHORIZED when user is missing', async () => {
    const req = createMockReq({ user: undefined });
    const res = createMockRes();
    const next = jest.fn();

    disable2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with VALIDATION_ERROR when code is missing', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();
    const next = jest.fn();

    disable2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' })
    );
  });

  it('calls next with USER_NOT_FOUND when user does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const req = createMockReq({ body: { code: '123456' } });
    const res = createMockRes();
    const next = jest.fn();

    disable2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('calls next with TWO_FA_NOT_ENABLED when 2FA is not enabled', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 'user-uuid',
      twoFactorEnabled: false,
      twoFactorSecretEncrypted: null,
    });

    const req = createMockReq({ body: { code: '123456' } });
    const res = createMockRes();
    const next = jest.fn();

    disable2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'TWO_FA_NOT_ENABLED' })
    );
  });

  it('disables 2FA with valid TOTP code', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 'user-uuid',
      twoFactorEnabled: true,
      twoFactorSecretEncrypted: 'enc-secret',
      twoFactorRecoveryCodesHash: null,
    });
    (TwoFactorService.verifyCode as jest.Mock).mockReturnValue({ valid: true });
    (User.update as jest.Mock).mockResolvedValue([1]);

    const req = createMockReq({ body: { code: '123456' } });
    const res = createMockRes();
    const next = jest.fn();

    disable2FA(req, res, next);
    await flushMicrotasks();

    expect(User.update).toHaveBeenCalledWith(
      expect.objectContaining({ twoFactorEnabled: false }),
      expect.any(Object)
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('calls next with TWO_FA_INVALID_CODE when both TOTP and recovery code fail', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({
      id: 'user-uuid',
      twoFactorEnabled: true,
      twoFactorSecretEncrypted: 'enc-secret',
      twoFactorRecoveryCodesHash: JSON.stringify(['HASH1']),
    });
    (TwoFactorService.verifyCode as jest.Mock).mockReturnValue({ valid: false });
    (TwoFactorService.verifyRecoveryCode as jest.Mock).mockResolvedValue({ valid: false });

    const req = createMockReq({ body: { code: 'badcode' } });
    const res = createMockRes();
    const next = jest.fn();

    disable2FA(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'TWO_FA_INVALID_CODE' })
    );
  });
});
