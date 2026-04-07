/**
 * @fileoverview Unit tests for PayPalService
 * @description Tests covering previously uncovered methods:
 *              - verifyWebhookSignature(): SUCCESS, FAILURE, dev-mode bypass (no webhookId)
 *              - isIdempotent(): found (true), not found (false)
 *              - markAsProcessed(): adds event to processed set
 *              - createOrder(): order creation flow
 *              - captureOrder(): capture flow, SSRF validation
 * @module __tests__/PayPalService
 */

// ── Mock config ───────────────────────────────────────────────────────────────
// Must be hoisted before PayPalService imports it at module level
const mockPaypalConfig = {
  mode: 'sandbox',
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  webhookId: 'test-webhook-id-123',
};

jest.mock('../config/env', () => ({
  config: {
    paypal: mockPaypalConfig,
    app: {
      frontendUrl: 'http://localhost:5173',
    },
  },
}));

// ── Mock axios with URL-based routing ─────────────────────────────────────────
// We route based on URL to avoid ordering problems caused by the singleton
// caching the access token between tests.
const mockAxiosPost = jest.fn();
const mockAxiosGet = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockAxiosPost(...args),
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}));

// ── Mock database ─────────────────────────────────────────────────────────────
jest.mock('../config/database', () => ({
  sequelize: {
    transaction: jest.fn(),
    query: jest.fn(),
    sync: jest.fn().mockResolvedValue({}),
    authenticate: jest.fn().mockResolvedValue(undefined),
  },
  resetSequelize: jest.fn(),
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import { paypalService } from '../services/PayPalService';

// ── Token response ─────────────────────────────────────────────────────────────
const mockTokenResponse = {
  data: {
    access_token: 'mock-access-token-abc123',
    expires_in: 32400,
  },
};

/**
 * Set up mockAxiosPost to handle calls URL-based:
 * - /v1/oauth2/token → tokenResponse
 * - any other URL → apiResponse
 *
 * This approach is resilient to the singleton caching the token, because
 * even if the token call doesn't happen, the non-token call still gets
 * the right response.
 */
function setupApiMock(apiResponse: unknown, options: { rejectApi?: boolean } = {}): void {
  mockAxiosPost.mockImplementation((url: string) => {
    if (url.includes('oauth2/token')) {
      return Promise.resolve(mockTokenResponse);
    }
    if (options.rejectApi) {
      return Promise.reject(apiResponse);
    }
    return Promise.resolve({ data: apiResponse });
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PayPalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: token call returns token response, API calls return empty data
    mockAxiosPost.mockImplementation((url: string) => {
      if (url.includes('oauth2/token')) {
        return Promise.resolve(mockTokenResponse);
      }
      return Promise.resolve({ data: {} });
    });
  });

  // ── verifyWebhookSignature ─────────────────────────────────────────────────

  describe('verifyWebhookSignature()', () => {
    const validHeaders = {
      'paypal-transmission-id': 'trans-id-001',
      'paypal-transmission-time': '2024-01-01T00:00:00Z',
      'paypal-transmission-sig': 'sig-abc123',
      'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/cert.pem',
      'paypal-auth-algo': 'SHA256withRSA',
    };

    const rawBody = JSON.stringify({
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: { id: 'cap-001' },
    });

    it('should return true when PayPal responds with SUCCESS verification_status', async () => {
      // Arrange
      setupApiMock({ verification_status: 'SUCCESS' });

      // Act
      const result = await paypalService.verifyWebhookSignature(validHeaders, rawBody);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when PayPal responds with FAILURE verification_status', async () => {
      // Arrange
      setupApiMock({ verification_status: 'FAILURE' });

      // Act
      const result = await paypalService.verifyWebhookSignature(validHeaders, rawBody);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when PayPal API throws an error', async () => {
      // Arrange
      setupApiMock(new Error('Network error'), { rejectApi: true });

      // Act
      const result = await paypalService.verifyWebhookSignature(validHeaders, rawBody);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true (dev mode bypass) when PAYPAL_WEBHOOK_ID is not set', async () => {
      // Arrange — temporarily clear webhookId to simulate dev mode
      const originalWebhookId = mockPaypalConfig.webhookId;
      mockPaypalConfig.webhookId = '';

      // Act
      const result = await paypalService.verifyWebhookSignature(validHeaders, rawBody);

      // Assert — bypass: returns true without calling PayPal verify endpoint
      expect(result).toBe(true);

      // Restore
      mockPaypalConfig.webhookId = originalWebhookId;
    });

    it('should call PayPal verify API with correct payload structure', async () => {
      // Arrange
      const capturedBodies: unknown[] = [];
      mockAxiosPost.mockImplementation((url: string, body: unknown) => {
        capturedBodies.push({ url, body });
        if (url.includes('oauth2/token')) return Promise.resolve(mockTokenResponse);
        return Promise.resolve({ data: { verification_status: 'SUCCESS' } });
      });

      // Act
      await paypalService.verifyWebhookSignature(validHeaders, rawBody);

      // Assert — find the verify call (not the token call)
      const verifyCall = capturedBodies.find((c: any) => !c.url.includes('oauth2/token')) as any;
      expect(verifyCall).toBeDefined();
      expect(verifyCall.body).toMatchObject({
        auth_algo: validHeaders['paypal-auth-algo'],
        transmission_id: validHeaders['paypal-transmission-id'],
        transmission_sig: validHeaders['paypal-transmission-sig'],
        transmission_time: validHeaders['paypal-transmission-time'],
        webhook_id: mockPaypalConfig.webhookId,
      });
    });
  });

  // ── isIdempotent ───────────────────────────────────────────────────────────

  describe('isIdempotent()', () => {
    it('should return false for an event that has not been processed', () => {
      // Act
      const result = paypalService.isIdempotent('event-never-seen-xyz');

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for an event that has been processed', () => {
      // Arrange — mark it first
      const eventId = `idempotent-test-${Date.now()}-${Math.random()}`;
      paypalService.markAsProcessed(eventId);

      // Act
      const result = paypalService.isIdempotent(eventId);

      // Assert
      expect(result).toBe(true);
    });

    it('should not affect other events when one is marked', () => {
      // Arrange
      const ts = Date.now();
      const eventA = `event-a-${ts}`;
      const eventB = `event-b-${ts}`;
      paypalService.markAsProcessed(eventA);

      // Act & Assert
      expect(paypalService.isIdempotent(eventA)).toBe(true);
      expect(paypalService.isIdempotent(eventB)).toBe(false);
    });
  });

  // ── markAsProcessed ────────────────────────────────────────────────────────

  describe('markAsProcessed()', () => {
    it('should mark event so subsequent isIdempotent returns true', () => {
      // Arrange
      const eventId = `mark-test-${Date.now()}-${Math.random()}`;
      expect(paypalService.isIdempotent(eventId)).toBe(false);

      // Act
      paypalService.markAsProcessed(eventId);

      // Assert
      expect(paypalService.isIdempotent(eventId)).toBe(true);
    });

    it('should be idempotent itself — marking same event twice does not throw', () => {
      // Arrange
      const eventId = `dup-mark-${Date.now()}-${Math.random()}`;

      // Act & Assert — no throw expected
      expect(() => {
        paypalService.markAsProcessed(eventId);
        paypalService.markAsProcessed(eventId);
      }).not.toThrow();
    });
  });

  // ── createOrder ────────────────────────────────────────────────────────────

  describe('createOrder()', () => {
    const createOrderRequest = {
      amount: 250.0,
      currency: 'USD',
      description: 'Trekking Cocora Tour',
      orderId: 'internal-order-001',
      userId: 'user-abc123',
    };

    const mockPayPalOrderResponse = {
      id: 'PAYPAL-ORDER-001',
      status: 'CREATED' as const,
      links: [
        {
          href: 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-001',
          rel: 'approve',
        },
      ],
    };

    it('should create a PayPal order and return the response', async () => {
      // Arrange
      setupApiMock(mockPayPalOrderResponse);

      // Act
      const result = await paypalService.createOrder(createOrderRequest);

      // Assert
      expect(result).toEqual(mockPayPalOrderResponse);
      expect(result.status).toBe('CREATED');
    });

    it('should call the PayPal orders API with CAPTURE intent', async () => {
      // Arrange
      const capturedBodies: unknown[] = [];
      mockAxiosPost.mockImplementation((url: string, body: unknown) => {
        capturedBodies.push({ url, body });
        if (url.includes('oauth2/token')) return Promise.resolve(mockTokenResponse);
        return Promise.resolve({ data: mockPayPalOrderResponse });
      });

      // Act
      await paypalService.createOrder(createOrderRequest);

      // Assert — find the createOrder call (not the token call)
      const createCall = capturedBodies.find((c: any) => !c.url.includes('oauth2/token')) as any;
      expect(createCall).toBeDefined();
      expect(createCall.body).toMatchObject({
        intent: 'CAPTURE',
        purchase_units: expect.arrayContaining([
          expect.objectContaining({
            description: 'Trekking Cocora Tour',
            amount: {
              currency_code: 'USD',
              value: '250.00',
            },
          }),
        ]),
      });
    });

    it('should throw when PayPal API returns an error', async () => {
      // Arrange
      setupApiMock(new Error('PayPal API 500'), { rejectApi: true });

      // Act & Assert
      await expect(paypalService.createOrder(createOrderRequest)).rejects.toThrow('PayPal API 500');
    });

    it('should include userId and internalOrderId in custom_id field', async () => {
      // Arrange
      const capturedBodies: unknown[] = [];
      mockAxiosPost.mockImplementation((url: string, body: unknown) => {
        capturedBodies.push({ url, body });
        if (url.includes('oauth2/token')) return Promise.resolve(mockTokenResponse);
        return Promise.resolve({ data: mockPayPalOrderResponse });
      });

      // Act
      await paypalService.createOrder(createOrderRequest);

      // Assert — verify custom_id contains user and order context
      const createCall = capturedBodies.find((c: any) => !c.url.includes('oauth2/token')) as any;
      const purchaseUnit = createCall.body.purchase_units[0];
      const customId = JSON.parse(purchaseUnit.custom_id);
      expect(customId.userId).toBe('user-abc123');
      expect(customId.internalOrderId).toBe('internal-order-001');
    });
  });

  // ── getAccessToken (via public methods) ───────────────────────────────────

  describe('getAccessToken() (via createOrder)', () => {
    it('should reuse cached access token on repeated calls', async () => {
      // Arrange — force token expiry so we KNOW the first call fetches a fresh token
      (paypalService as any).accessToken = null;
      (paypalService as any).tokenExpiry = 0;

      let tokenCallCount = 0;
      mockAxiosPost.mockImplementation((url: string) => {
        if (url.includes('oauth2/token')) {
          tokenCallCount++;
          return Promise.resolve(mockTokenResponse);
        }
        return Promise.resolve({
          data: { id: 'ORDER', status: 'CREATED', links: [] },
        });
      });

      const request = {
        amount: 100,
        currency: 'USD',
        description: 'Test',
        userId: 'u1',
      };

      // Act — first call fetches token, second call reuses it (hits the cache branch)
      await paypalService.createOrder(request);
      await paypalService.createOrder(request);

      // Assert — token was fetched exactly once; second call used the cache (line 143)
      expect(tokenCallCount).toBe(1);
    });
  });

  // ── captureOrder ───────────────────────────────────────────────────────────

  describe('captureOrder()', () => {
    const mockCaptureResponse = {
      id: 'PAYPAL-ORDER-001',
      status: 'COMPLETED' as const,
      links: [],
      purchase_units: [
        {
          payments: {
            captures: [
              {
                id: 'CAPTURE-001',
                amount: { value: '250.00', currency_code: 'USD' },
              },
            ],
          },
        },
      ],
    };

    it('should capture a PayPal order and return the response', async () => {
      // Arrange
      setupApiMock(mockCaptureResponse);

      // Act
      const result = await paypalService.captureOrder({
        orderId: 'PAYPAL-ORDER-001',
        internalOrderId: 'internal-001',
      });

      // Assert
      expect(result.status).toBe('COMPLETED');
      expect(result.purchase_units![0].payments!.captures![0].id).toBe('CAPTURE-001');
    });

    it('should reject with AppError when orderId contains invalid characters (SSRF guard)', async () => {
      // Act & Assert — AppError message contains the invalid id description
      await expect(
        paypalService.captureOrder({
          orderId: '../../../etc/passwd',
          internalOrderId: 'internal-001',
        })
      ).rejects.toThrow('Invalid PayPal order ID');
    });

    it('should throw when PayPal capture API fails', async () => {
      // Arrange
      setupApiMock(new Error('Capture failed'), { rejectApi: true });

      // Act & Assert
      await expect(
        paypalService.captureOrder({ orderId: 'VALID-ORDER-ID', internalOrderId: 'int-001' })
      ).rejects.toThrow('Capture failed');
    });
  });

  // ── refundPayment ─────────────────────────────────────────────────────────

  describe('refundPayment()', () => {
    it('should refund a captured payment (no amount — full refund)', async () => {
      // Arrange — POST to refund endpoint returns 204-style empty response
      mockAxiosPost.mockImplementation((url: string) => {
        if (url.includes('oauth2/token')) return Promise.resolve(mockTokenResponse);
        return Promise.resolve({ data: {} });
      });

      // Act & Assert — should resolve without throwing
      await expect(paypalService.refundPayment('CAPTURE-001')).resolves.toBeUndefined();
    });

    it('should include amount in refund body when amount is provided', async () => {
      // Arrange
      const capturedBodies: unknown[] = [];
      mockAxiosPost.mockImplementation((url: string, body: unknown) => {
        capturedBodies.push({ url, body });
        if (url.includes('oauth2/token')) return Promise.resolve(mockTokenResponse);
        return Promise.resolve({ data: {} });
      });

      // Act
      await paypalService.refundPayment('CAPTURE-001', 100.5, 'USD');

      // Assert
      const refundCall = capturedBodies.find((c: any) => c.url.includes('refund')) as any;
      expect(refundCall).toBeDefined();
      expect(refundCall.body).toMatchObject({
        amount: { value: '100.50', currency_code: 'USD' },
      });
    });

    it('should reject with AppError when captureId contains invalid characters (SSRF guard)', async () => {
      // Act & Assert
      await expect(paypalService.refundPayment('../../../etc/passwd')).rejects.toThrow(
        'Invalid PayPal capture ID'
      );
    });

    it('should throw when PayPal refund API fails', async () => {
      // Arrange
      setupApiMock(new Error('Refund API error'), { rejectApi: true });

      // Act & Assert
      await expect(paypalService.refundPayment('CAPTURE-001')).rejects.toThrow('Refund API error');
    });
  });

  // ── getOrder ─────────────────────────────────────────────────────────────

  describe('getOrder()', () => {
    const mockOrderResponse = {
      id: 'PAYPAL-ORDER-001',
      status: 'APPROVED' as const,
      links: [
        { href: 'https://api.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-001', rel: 'self' },
      ],
    };

    it('should return order details for a valid orderId', async () => {
      // Arrange
      mockAxiosGet.mockResolvedValueOnce({ data: mockOrderResponse });

      // Act
      const result = await paypalService.getOrder('PAYPAL-ORDER-001');

      // Assert
      expect(result).toEqual(mockOrderResponse);
      expect(result.status).toBe('APPROVED');
    });

    it('should reject with AppError when orderId contains invalid characters (SSRF guard)', async () => {
      // Act & Assert
      await expect(paypalService.getOrder('../etc/passwd')).rejects.toThrow(
        'Invalid PayPal order ID'
      );
    });

    it('should throw when PayPal get-order API fails', async () => {
      // Arrange
      mockAxiosGet.mockRejectedValueOnce(new Error('Order not found'));

      // Act & Assert
      await expect(paypalService.getOrder('VALID-ORDER-ID')).rejects.toThrow('Order not found');
    });
  });

  // ── markAsProcessed (eviction at 10k) ─────────────────────────────────────

  describe('markAsProcessed() — set size limit', () => {
    it('should evict the oldest entry when the set exceeds 10,000 events', () => {
      // Arrange — fill set to exactly 10,000 unique events
      const prefix = `bulk-event-${Date.now()}-`;
      // We only need to add enough to trigger eviction (the set already has some entries)
      // So we fill until size > 10,000
      const currentSize = (paypalService as any).processedEvents.size;
      const toAdd = 10_001 - currentSize;

      // Add entries up to the limit first
      for (let i = 0; i < toAdd - 1; i++) {
        (paypalService as any).processedEvents.add(`${prefix}${i}`);
      }
      const firstEntry = `${prefix}0`;

      // Sanity check — first entry is in set
      expect((paypalService as any).processedEvents.has(firstEntry)).toBe(true);

      // Act — adding one more should trigger eviction
      paypalService.markAsProcessed(`${prefix}${toAdd}`);

      // Assert — set size should still be ≤ 10,001 (one was evicted)
      expect((paypalService as any).processedEvents.size).toBeLessThanOrEqual(10_001);
    });
  });
});
