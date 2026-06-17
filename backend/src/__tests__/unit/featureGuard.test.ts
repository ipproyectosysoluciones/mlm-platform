/**
 * @fileoverview featureGuard middleware unit tests
 * @description Tests for the feature guard middleware that returns 503 when a feature is disabled
 *              Tests del middleware de feature guard que retorna 503 cuando una funcionalidad está deshabilitada
 *
 * @module __tests__/unit/featureGuard
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

const mockConfig = {
  features: {
    cryptoWallet: false,
  },
};

jest.mock('../../config/env', () => ({
  config: mockConfig,
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { featureGuard } from '../../middleware/featureGuard';
import type { Request, Response, NextFunction } from 'express';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMockReqRes() {
  const req = {} as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next: NextFunction = jest.fn();
  return { req, res, next };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('featureGuard middleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when feature is DISABLED', () => {
    beforeEach(() => {
      mockConfig.features.cryptoWallet = false;
    });

    it('should return 503 with FEATURE_DISABLED error code', () => {
      const { req, res, next } = createMockReqRes();
      const middleware = featureGuard('cryptoWallet');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'The cryptoWallet feature is temporarily disabled',
        },
      });
    });

    it('should NOT call next()', () => {
      const { req, res, next } = createMockReqRes();
      const middleware = featureGuard('cryptoWallet');

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when feature is ENABLED', () => {
    beforeEach(() => {
      mockConfig.features.cryptoWallet = true;
    });

    it('should call next() to continue the request', () => {
      const { req, res, next } = createMockReqRes();
      const middleware = featureGuard('cryptoWallet');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should NOT return any response', () => {
      const { req, res, next } = createMockReqRes();
      const middleware = featureGuard('cryptoWallet');

      middleware(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('returns a reusable middleware function', () => {
    it('should return a function that can be used as Express middleware', () => {
      const middleware = featureGuard('cryptoWallet');

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // (req, res, next) — arity of 3
    });
  });
});
