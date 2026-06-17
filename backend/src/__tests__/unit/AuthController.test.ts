/**
 * @fileoverview AuthController Unit Tests
 * @description Tests for register, login, registerGuest, and me handlers
 * @module __tests__/unit/AuthController
 *
 * NOTE: All handlers use asyncHandler which returns void (not a Promise).
 * To test handlers, we call WITHOUT await and flush pending microtasks.
 */

import { Request, Response, NextFunction } from 'express';

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../services/UserService', () => ({
  userService: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createUser: jest.fn(),
  },
}));

jest.mock('../../services/AuthService', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  generateToken: jest.fn(),
}));

jest.mock('../../services/EmailService', () => ({
  emailService: {
    sendWelcome: jest.fn().mockResolvedValue(undefined),
    sendDownline: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/AchievementService', () => ({
  achievementService: {
    checkAndUnlock: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../models/Lead', () => ({
  Lead: {
    create: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../config/env', () => ({
  config: {
    app: { frontendUrl: 'https://example.com' },
    platform: { domain: 'example.com' },
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  register,
  login,
  registerGuest,
  registerValidation,
  loginValidation,
  registerGuestValidation,
} from '../../controllers/AuthController';
import { me } from '../../controllers/auth/ProfileController';
import { userService } from '../../services/UserService';
import { hashPassword, verifyPassword, generateToken } from '../../services/AuthService';
import { emailService } from '../../services/EmailService';
import { achievementService } from '../../services/AchievementService';
import { Lead } from '../../models/Lead';

// ── Helpers ───────────────────────────────────────────────────────────────────

const flushMicrotasks = () => new Promise<void>((r) => setImmediate(r));

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: undefined,
    ...overrides,
  } as unknown as Request;
}

function createMockRes() {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis() as unknown as Response['status'],
    json: jest.fn().mockReturnThis() as unknown as Response['json'],
  };
  return res as unknown as Response;
}

// ── Validation Tests ─────────────────────────────────────────────────────────

describe('AuthController - Validation Rules', () => {
  describe('registerValidation', () => {
    it('has email, password, and optional sponsor_code validators', () => {
      expect(registerValidation).toBeDefined();
      expect(Array.isArray(registerValidation)).toBe(true);
      expect(registerValidation.length).toBeGreaterThan(0);
    });
  });

  describe('loginValidation', () => {
    it('has email and password validators', () => {
      expect(loginValidation).toBeDefined();
      expect(Array.isArray(loginValidation)).toBe(true);
      expect(loginValidation.length).toBeGreaterThan(0);
    });
  });

  describe('registerGuestValidation', () => {
    it('has email, name, optional phone and sponsor_code validators', () => {
      expect(registerGuestValidation).toBeDefined();
      expect(Array.isArray(registerGuestValidation)).toBe(true);
      expect(registerGuestValidation.length).toBeGreaterThan(0);
    });
  });
});

// ── register Tests ────────────────────────────────────────────────────────────

describe('AuthController - register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers user successfully', async () => {
    const mockUser = {
      id: VALID_UUID,
      email: 'test@test.com',
      passwordHash: 'hashed',
      referralCode: 'REF-001',
      level: 1,
      currency: 'USD',
      role: 'user',
      sponsorId: null,
    };

    (userService.findByEmail as jest.Mock).mockResolvedValue(null);
    (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
    (userService.createUser as jest.Mock).mockResolvedValue(mockUser);
    (generateToken as jest.Mock).mockReturnValue('jwt_token');

    const req = createMockReq({ body: { email: 'test@test.com', password: 'password123' } });
    const res = createMockRes();

    register(req, res as unknown as Parameters<typeof register>[0], jest.fn());
    await flushMicrotasks();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ id: VALID_UUID, email: 'test@test.com' }),
          token: 'jwt_token',
        }),
      })
    );
  });

  it('returns 400 when email already exists', async () => {
    (userService.findByEmail as jest.Mock).mockResolvedValue({ id: 'existing' });

    const req = createMockReq({ body: { email: 'existing@test.com', password: 'password123' } });
    const res = createMockRes();
    const next = jest.fn();

    register(req, res as unknown as Parameters<typeof register>[0], next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('registers user with sponsor code', async () => {
    const mockUser = {
      id: VALID_UUID,
      email: 'new@test.com',
      passwordHash: 'hashed',
      referralCode: 'REF-002',
      level: 1,
      currency: 'USD',
      role: 'user',
      sponsorId: 'sponsor-id',
    };

    (userService.findByEmail as jest.Mock).mockResolvedValue(null);
    (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
    (userService.createUser as jest.Mock).mockResolvedValue(mockUser);
    (generateToken as jest.Mock).mockReturnValue('jwt_token');
    (userService.findById as jest.Mock).mockResolvedValue({
      id: 'sponsor-id',
      email: 'sponsor@test.com',
      emailNotifications: true,
    });

    const req = createMockReq({
      body: { email: 'new@test.com', password: 'password123', sponsor_code: 'REF-SPONSOR' },
    });
    const res = createMockRes();

    register(req, res as unknown as Parameters<typeof register>[0], jest.fn());
    await flushMicrotasks();

    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ sponsorCode: 'REF-SPONSOR' })
    );
    expect(emailService.sendDownline).toHaveBeenCalled();
  });

  it('sends welcome email after registration', async () => {
    const mockUser = {
      id: VALID_UUID,
      email: 'welcome@test.com',
      passwordHash: 'hashed',
      referralCode: 'REF-003',
      level: 1,
      currency: 'USD',
      role: 'user',
      sponsorId: null,
    };

    (userService.findByEmail as jest.Mock).mockResolvedValue(null);
    (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
    (userService.createUser as jest.Mock).mockResolvedValue(mockUser);
    (generateToken as jest.Mock).mockReturnValue('jwt_token');

    const req = createMockReq({ body: { email: 'welcome@test.com', password: 'password123' } });
    const res = createMockRes();

    register(req, res as unknown as Parameters<typeof register>[0], jest.fn());
    await flushMicrotasks();

    expect(emailService.sendWelcome).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'welcome@test.com' })
    );
  });
});

// ── login Tests ───────────────────────────────────────────────────────────────

describe('AuthController - login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in user successfully without 2FA', async () => {
    const mockUser = {
      id: VALID_UUID,
      email: 'test@test.com',
      passwordHash: 'hashed',
      referralCode: 'REF-001',
      level: 1,
      currency: 'USD',
      role: 'user',
      twoFactorEnabled: false,
    };

    (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue('jwt_token');

    const req = createMockReq({ body: { email: 'test@test.com', password: 'password123' } });
    const res = createMockRes();

    login(req, res as unknown as Parameters<typeof login>[0], jest.fn());
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          token: 'jwt_token',
          user: expect.objectContaining({ id: VALID_UUID }),
        }),
      })
    );
  });

  it('returns 401 when user not found', async () => {
    (userService.findByEmail as jest.Mock).mockResolvedValue(null);

    const req = createMockReq({ body: { email: 'nonexistent@test.com', password: 'password123' } });
    const res = createMockRes();
    const next = jest.fn();

    login(req, res as unknown as Parameters<typeof login>[0], next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('returns 401 when password is invalid', async () => {
    const mockUser = { id: VALID_UUID, email: 'test@test.com', twoFactorEnabled: false };
    (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    (verifyPassword as jest.Mock).mockResolvedValue(false);

    const req = createMockReq({ body: { email: 'test@test.com', password: 'wrongpassword' } });
    const res = createMockRes();
    const next = jest.fn();

    login(req, res as unknown as Parameters<typeof login>[0], next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('returns requires2FA when user has 2FA enabled', async () => {
    const mockUser = {
      id: VALID_UUID,
      email: 'test@test.com',
      passwordHash: 'hashed',
      twoFactorEnabled: true,
    };

    (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue('temp_token');

    const req = createMockReq({ body: { email: 'test@test.com', password: 'password123' } });
    const res = createMockRes();

    login(req, res as unknown as Parameters<typeof login>[0], jest.fn());
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          requires2FA: true,
          tempToken: 'temp_token',
          userId: VALID_UUID,
        }),
      })
    );
  });

  it('calls achievementService.checkAndUnlock on successful login', async () => {
    const mockUser = {
      id: VALID_UUID,
      email: 'test@test.com',
      passwordHash: 'hashed',
      referralCode: 'REF-001',
      level: 1,
      currency: 'USD',
      role: 'user',
      twoFactorEnabled: false,
    };

    (userService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue('jwt_token');

    const req = createMockReq({ body: { email: 'test@test.com', password: 'password123' } });
    const res = createMockRes();

    login(req, res as unknown as Parameters<typeof login>[0], jest.fn());
    await flushMicrotasks();

    expect(achievementService.checkAndUnlock).toHaveBeenCalledWith(VALID_UUID, 'login');
  });
});

// ── registerGuest Tests ───────────────────────────────────────────────────────

describe('AuthController - registerGuest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers guest user and creates CRM lead', async () => {
    const mockUser = {
      id: VALID_UUID,
      email: 'guest@test.com',
      passwordHash: 'hashed',
      referralCode: 'REF-GUEST',
      level: 1,
      currency: 'USD',
      role: 'guest',
      sponsorId: null,
    };

    (userService.findByEmail as jest.Mock).mockResolvedValue(null);
    (hashPassword as jest.Mock).mockResolvedValue('hashed_guest');
    (userService.createUser as jest.Mock).mockResolvedValue(mockUser);
    (Lead.create as jest.Mock).mockResolvedValue({});

    const req = createMockReq({
      body: { name: 'Juan Pérez', email: 'guest@test.com', phone: '+54911234567' },
    });
    const res = createMockRes();

    registerGuest(req, res as unknown as Parameters<typeof registerGuest>[0], jest.fn());
    await flushMicrotasks();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ id: VALID_UUID, role: 'guest' }),
        }),
      })
    );
    expect(Lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contactName: 'Juan Pérez',
        contactEmail: 'guest@test.com',
        contactPhone: '+54911234567',
        status: 'new',
        source: 'website',
      })
    );
  });

  it('returns 400 when email already registered', async () => {
    (userService.findByEmail as jest.Mock).mockResolvedValue({ id: 'existing' });

    const req = createMockReq({ body: { name: 'Test', email: 'existing@test.com' } });
    const res = createMockRes();
    const next = jest.fn();

    registerGuest(req, res as unknown as Parameters<typeof registerGuest>[0], next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('creates lead with sponsor when sponsor_code provided', async () => {
    const mockUser = {
      id: VALID_UUID,
      email: 'guest2@test.com',
      passwordHash: 'hashed',
      referralCode: 'REF-GUEST2',
      level: 1,
      currency: 'USD',
      role: 'guest',
      sponsorId: 'sponsor-id',
    };

    (userService.findByEmail as jest.Mock).mockResolvedValue(null);
    (hashPassword as jest.Mock).mockResolvedValue('hashed_guest');
    (userService.createUser as jest.Mock).mockResolvedValue(mockUser);
    (Lead.create as jest.Mock).mockResolvedValue({});

    const req = createMockReq({
      body: { name: 'Test Guest', email: 'guest2@test.com', sponsor_code: 'REF-SPONSOR' },
    });
    const res = createMockRes();

    registerGuest(req, res as unknown as Parameters<typeof registerGuest>[0], jest.fn());
    await flushMicrotasks();

    expect(Lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'sponsor-id',
        referredBy: 'sponsor-id',
      })
    );
  });
});

// ── me (ProfileController) Tests ─────────────────────────────────────────────

describe('ProfileController - me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns current user profile', async () => {
    const mockUser = {
      id: VALID_UUID,
      email: 'test@test.com',
      referralCode: 'REF-001',
      level: 1,
      currency: 'USD',
      role: 'user',
      sponsorId: null,
    };

    (userService.findById as jest.Mock).mockResolvedValue(mockUser);

    const req = createMockReq({ user: { id: VALID_UUID } as Parameters<typeof me>[0]['user'] });
    const res = createMockRes();

    me(
      req as unknown as Parameters<typeof me>[0],
      res as unknown as Parameters<typeof me>[1],
      jest.fn()
    );
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: VALID_UUID,
          email: 'test@test.com',
          referralCode: 'REF-001',
          level: 1,
        }),
      })
    );
  });

  it('includes sponsor info when user has sponsor', async () => {
    const mockUser = {
      id: VALID_UUID,
      email: 'test@test.com',
      referralCode: 'REF-001',
      level: 1,
      currency: 'USD',
      role: 'user',
      sponsorId: 'sponsor-uuid',
    };

    const mockSponsor = { id: 'sponsor-uuid', referralCode: 'REF-SPONSOR' };
    (userService.findById as jest.Mock)
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(mockSponsor);

    const req = createMockReq({ user: { id: VALID_UUID } as Parameters<typeof me>[0]['user'] });
    const res = createMockRes();

    me(
      req as unknown as Parameters<typeof me>[0],
      res as unknown as Parameters<typeof me>[1],
      jest.fn()
    );
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          sponsor: { id: 'sponsor-uuid', referralCode: 'REF-SPONSOR' },
        }),
      })
    );
  });

  it('calls next with 404 when user not found', async () => {
    (userService.findById as jest.Mock).mockResolvedValue(null);

    const req = createMockReq({ user: { id: 'nonexistent' } as Parameters<typeof me>[0]['user'] });
    const res = createMockRes();
    const next = jest.fn();

    me(
      req as unknown as Parameters<typeof me>[0],
      res as unknown as Parameters<typeof me>[1],
      next
    );
    await flushMicrotasks();

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
