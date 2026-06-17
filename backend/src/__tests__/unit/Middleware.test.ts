/**
 * @fileoverview Middleware Unit Tests
 * @description Tests for error, validate, cache, and contract middleware
 * @module __tests__/unit/Middleware
 */

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
jest.mock('../../utils/logger', () => ({ logger: mockLogger }));

const mockGetCache = jest.fn();
const mockSetCache = jest.fn();
const mockDeleteCache = jest.fn();
jest.mock('../../config/redis', () => ({
  getCache: mockGetCache,
  setCache: mockSetCache,
  deleteCache: mockDeleteCache,
  CACHE_KEYS: { PRODUCTS: 'products' },
  CACHE_TTL: { short: 60, medium: 300, long: 3600 },
}));

const mockHasAccepted = jest.fn();
const mockGetPending = jest.fn();
jest.mock('../../services/ContractService', () => ({
  ContractService: jest.fn().mockImplementation(() => ({
    hasAcceptedRequiredContracts: mockHasAccepted,
    getPendingContracts: mockGetPending,
  })),
}));

const mockValidationResult = jest.fn();
jest.mock('express-validator', () => ({
  validationResult: mockValidationResult,
  ValidationChain: jest.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { errorHandler, notFoundHandler, AppError } from '../../middleware/error.middleware';
import { validate } from '../../middleware/validate.middleware';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache.middleware';
import { requireContractAccepted } from '../../middleware/contract.middleware';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    method: 'GET',
    path: '/test',
    body: {},
    params: {},
    query: {},
    user: { id: 'user-123', role: 'admin' },
    ...overrides,
  } as any;
}

function makeRes() {
  const mockRes: any = {
    _status: 200,
    _json: null,
    _headers: {},
    status: function (code: number) {
      this._status = code;
      return this;
    },
    json: function (data: any) {
      this._json = data;
      return this;
    },
    setHeader: function (key: string, val: string) {
      this._headers[key] = val;
      return this;
    },
  };
  return mockRes;
}

// ── AppError Tests ────────────────────────────────────────────────────────────

describe('AppError', () => {
  it('creates AppError with all properties', () => {
    const error = new AppError(400, 'BAD_REQUEST', 'Invalid input', { field: ['required'] });

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: ['required'] });
    expect(error.name).toBe('AppError');
  });

  it('creates AppError without details', () => {
    const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.details).toBeUndefined();
  });
});

// ── errorHandler Tests ────────────────────────────────────────────────────────

describe('errorHandler', () => {
  beforeEach(() => {
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
  });

  it('handles AppError with custom status and code', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', 'Invalid data', { email: ['invalid'] });
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: { email: ['invalid'] } },
    });
  });

  it('handles SequelizeValidationError', () => {
    const err = new Error('Validation error') as any;
    err.name = 'SequelizeValidationError';
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('handles SequelizeUniqueConstraintError', () => {
    const err = new Error('Duplicate entry') as any;
    err.name = 'SequelizeUniqueConstraintError';
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res._status).toBe(409);
    expect(res._json).toMatchObject({
      success: false,
      error: { code: 'DUPLICATE_ERROR', message: 'Resource already exists' },
    });
  });

  it('handles unknown error as 500 SERVER_ERROR', () => {
    const err = new Error('Something went wrong');
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res._status).toBe(500);
    expect(res._json).toMatchObject({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
    });
  });

  it('logs error for 500+ status codes', () => {
    const err = new Error('Server error');
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
      expect.any(String)
    );
  });

  it('logs warn for 4xx status codes', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Not found');
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
      expect.any(String)
    );
  });
});

// ── notFoundHandler Tests ─────────────────────────────────────────────────────

describe('notFoundHandler', () => {
  it('returns 404 with method and path', () => {
    const req = makeReq({ method: 'POST', path: '/api/unknown' });
    const res = makeRes();

    notFoundHandler(req, res);

    expect(res._status).toBe(404);
    expect(res._json).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route POST /api/unknown not found' },
    });
  });
});

// ── validate Middleware Tests ─────────────────────────────────────────────────

describe('validate middleware', () => {
  beforeEach(() => {
    mockValidationResult.mockReset();
  });

  it('calls next() when validation passes', async () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true });

    const mockValidation = { run: jest.fn().mockResolvedValue(undefined) };
    const middleware = validate([mockValidation as any]);
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 400 with formatted errors when validation fails', async () => {
    const mockError = { path: 'email', msg: 'Invalid email format', type: 'field' };
    mockValidationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [mockError],
    });

    const mockValidation = { run: jest.fn().mockResolvedValue(undefined) };
    const middleware = validate([mockValidation as any]);
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { email: ['Invalid email format'] },
      },
    });
  });

  it('handles multiple validation errors', async () => {
    const errors = [
      { path: 'email', msg: 'Invalid email', type: 'field' },
      { path: 'password', msg: 'Too short', type: 'field' },
    ];
    mockValidationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });

    const mockValidation = { run: jest.fn().mockResolvedValue(undefined) };
    const middleware = validate([mockValidation as any]);
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({
        details: { email: ['Invalid email'], password: ['Too short'] },
      }),
    });
  });
});

// ── cacheMiddleware Tests ──────────────────────────────────────────────────────

describe('cacheMiddleware', () => {
  beforeEach(() => {
    mockGetCache.mockReset();
    mockSetCache.mockReset();
  });

  it('calls next() when cache is disabled', async () => {
    const middleware = cacheMiddleware({ key: 'test', enabled: false });
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(mockGetCache).not.toHaveBeenCalled();
  });

  it('returns cached data with X-Cache HIT header', async () => {
    const cachedData = { success: true, data: [{ id: '1' }] };
    mockGetCache.mockResolvedValue(JSON.stringify(cachedData));

    const middleware = cacheMiddleware({ key: 'products', ttl: 300 });
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res._headers['X-Cache']).toBe('HIT');
    expect(res._json).toEqual(cachedData);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets X-Cache MISS and calls next() when no cache', async () => {
    mockGetCache.mockResolvedValue(null);

    const middleware = cacheMiddleware({ key: 'products' });
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res._headers['X-Cache']).toBe('MISS');
    expect(next).toHaveBeenCalled();
  });

  it('uses dynamic key from function', async () => {
    mockGetCache.mockResolvedValue(null);

    const middleware = cacheMiddleware({
      key: (req: any) => `products:${req.query.page}`,
      ttl: 60,
    });
    const req = makeReq({ query: { page: '2' } });
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(mockGetCache).toHaveBeenCalledWith('products:2');
    expect(next).toHaveBeenCalled();
  });

  it('continues to next on cache error', async () => {
    mockGetCache.mockRejectedValue(new Error('Redis error'));

    const middleware = cacheMiddleware({ key: 'products' });
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ── invalidateCache Tests ─────────────────────────────────────────────────────

describe('invalidateCache', () => {
  beforeEach(() => mockDeleteCache.mockReset());

  it('deletes single cache key', async () => {
    mockDeleteCache.mockResolvedValue(undefined);

    await invalidateCache('products');

    expect(mockDeleteCache).toHaveBeenCalledWith('products');
  });

  it('deletes multiple cache keys', async () => {
    mockDeleteCache.mockResolvedValue(undefined);

    await invalidateCache(['products', 'users', 'orders']);

    expect(mockDeleteCache).toHaveBeenCalledTimes(3);
    expect(mockDeleteCache).toHaveBeenCalledWith('products');
    expect(mockDeleteCache).toHaveBeenCalledWith('users');
    expect(mockDeleteCache).toHaveBeenCalledWith('orders');
  });
});

// ── requireContractAccepted Tests ─────────────────────────────────────────────

describe('requireContractAccepted middleware', () => {
  beforeEach(() => {
    mockHasAccepted.mockReset();
    mockGetPending.mockReset();
  });

  it('returns 401 when user is not authenticated', async () => {
    const middleware = requireContractAccepted(['AFFILIATE_AGREEMENT']);
    const req = makeReq({ user: null });
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res._status).toBe(401);
    expect(res._json).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when user has accepted required contracts', async () => {
    mockHasAccepted.mockResolvedValue(true);

    const middleware = requireContractAccepted(['AFFILIATE_AGREEMENT']);
    const req = makeReq({ user: { id: 'user-123', role: 'admin' } });
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(mockHasAccepted).toHaveBeenCalledWith('user-123', ['AFFILIATE_AGREEMENT']);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when user has not accepted required contracts', async () => {
    mockHasAccepted.mockResolvedValue(false);
    mockGetPending.mockResolvedValue([
      { type: 'AFFILIATE_AGREEMENT', title: 'Affiliate Agreement', version: '1.0' },
      { type: 'COMPENSATION_PLAN', title: 'Compensation Plan', version: '2.0' },
    ]);

    const middleware = requireContractAccepted(['AFFILIATE_AGREEMENT', 'COMPENSATION_PLAN']);
    const req = makeReq({ user: { id: 'user-123', role: 'admin' } });
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res._status).toBe(403);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({
        code: 'CONTRACT_REQUIRED',
        pending: expect.arrayContaining([expect.objectContaining({ type: 'AFFILIATE_AGREEMENT' })]),
      }),
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 on service error', async () => {
    mockHasAccepted.mockRejectedValue(new Error('DB error'));

    const middleware = requireContractAccepted(['AFFILIATE_AGREEMENT']);
    const req = makeReq({ user: { id: 'user-123', role: 'admin' } });
    const res = makeRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res._status).toBe(500);
    expect(res._json).toMatchObject({
      success: false,
      error: { code: 'INTERNAL_ERROR' },
    });
  });
});
