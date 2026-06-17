/**
 * @fileoverview PayPalService Unit Tests — SSRF Prevention
 * @description Tests for the SSRF security fix: validatePayPalId, buildPayPalUrl, and
 *              path traversal rejection in captureOrder, getOrder, refundPayment.
 *              Pruebas para la corrección de seguridad SSRF: validatePayPalId, buildPayPalUrl,
 *              y rechazo de path traversal en captureOrder, getOrder, refundPayment.
 * @module __tests__/unit/PayPalService
 */

// ============================================
// MOCKS — Must go BEFORE imports / Deben ir ANTES de los imports
// ============================================

jest.mock('../../config/env', () => ({
  config: {
    paypal: {
      mode: 'sandbox',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    },
    app: {
      frontendUrl: 'http://localhost:3000',
    },
  },
}));

jest.mock('axios');

jest.mock('../../models/WebhookEvent', () => ({
  WebhookEvent: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

import axios from 'axios';
import { AppError } from '../../middleware/error.middleware';

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Dynamic import to get the singleton after mocks are in place
let paypalService: InstanceType<typeof import('../../services/PayPalService').PayPalService>;

beforeAll(async () => {
  const mod = await import('../../services/PayPalService');
  paypalService = mod.paypalService as typeof paypalService;
});

describe('PayPalService — SSRF Prevention', () => {
  /** Helper: mock getAccessToken via OAuth endpoint */
  const mockAccessToken = () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'mock-token-123', expires_in: 3600 },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset cached token between tests by accessing private fields
    (paypalService as any).accessToken = null;
    (paypalService as any).tokenExpiry = 0;
  });

  // ============================================
  // validatePayPalId — tested indirectly via public methods
  // ============================================

  describe('validatePayPalId (indirect via public methods)', () => {
    it('should accept valid PayPal IDs like ABC123, ORDER-123_test', async () => {
      // Valid IDs should NOT throw — they pass through to the HTTP call
      mockAccessToken();
      mockedAxios.get.mockResolvedValueOnce({
        data: { id: 'ABC123', status: 'CREATED', links: [] },
      });

      const result = await paypalService.getOrder('ABC123');

      expect(result.id).toBe('ABC123');
      // Verify axios.get was called with a proper URL containing the ID
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('ABC123'),
        expect.any(Object)
      );
    });

    it('should throw AppError for path traversal IDs (../../../etc/passwd)', async () => {
      await expect(paypalService.getOrder('../../../etc/passwd')).rejects.toThrow(AppError);

      await expect(paypalService.getOrder('../../../etc/passwd')).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_PAYPAL_ID',
      });

      // No HTTP call should have been made
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should throw AppError for empty string, spaces, and special chars', async () => {
      // Empty string
      await expect(paypalService.getOrder('')).rejects.toThrow(AppError);

      // ID with spaces
      await expect(paypalService.getOrder('ORDER 123')).rejects.toThrow(AppError);

      // ID with special characters
      await expect(paypalService.getOrder('ORDER;DROP TABLE')).rejects.toThrow(AppError);

      // None should trigger HTTP calls
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // captureOrder — SSRF rejection
  // ============================================

  describe('captureOrder() — SSRF rejection', () => {
    it('should throw AppError when orderId contains path traversal', async () => {
      await expect(
        paypalService.captureOrder({
          orderId: '../../admin/reset',
          internalOrderId: 'internal-1',
        })
      ).rejects.toThrow(AppError);

      await expect(
        paypalService.captureOrder({
          orderId: '../evil',
          internalOrderId: 'internal-1',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_PAYPAL_ID',
      });

      // No HTTP calls — rejected before token fetch
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // getOrder — SSRF rejection
  // ============================================

  describe('getOrder() — SSRF rejection', () => {
    it('should throw AppError when orderId is malicious', async () => {
      await expect(paypalService.getOrder('..%2F..%2Fetc%2Fpasswd')).rejects.toThrow(AppError);

      await expect(paypalService.getOrder('id/../../admin')).rejects.toThrow(AppError);

      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // refundPayment — SSRF rejection
  // ============================================

  describe('refundPayment() — SSRF rejection', () => {
    it('should throw AppError when captureId is malicious', async () => {
      await expect(paypalService.refundPayment('../../../etc/shadow', 10.0, 'USD')).rejects.toThrow(
        AppError
      );

      await expect(paypalService.refundPayment('CAPTURE WITH SPACES')).rejects.toThrow(AppError);

      await expect(paypalService.refundPayment('')).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_PAYPAL_ID',
      });

      // No HTTP calls — rejected before token fetch
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });
});
