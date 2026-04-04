/**
 * @fileoverview BrevoEmailService Unit Tests
 * @description Tests for REST API success, REST timeout, REST 5xx, SMTP fallback,
 *              circuit breaker activation, and error logging behavior.
 *              Pruebas para éxito REST API, timeout REST, 5xx REST, fallback SMTP,
 *              activación del circuit breaker y comportamiento de logging de errores.
 * @module __tests__/unit/BrevoEmailService
 */

// ============================================
// MOCKS — Deben ir ANTES de los imports
// ============================================

// Mock config/env
jest.mock('../../config/env', () => ({
  config: {
    brevo: {
      apiKey: 'test-api-key',
      smtpUser: 'test-smtp-user',
      smtpPass: 'test-smtp-pass',
      senderEmail: 'noreply@test.com',
      senderName: 'Test Platform',
      smtpHost: 'smtp-relay.brevo.com',
      smtpPort: 587,
    },
  },
}));

// Mock nodemailer
const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { BrevoEmailService, brevoEmailService } from '../../services/BrevoEmailService';
import nodemailer from 'nodemailer';

// ============================================
// TEST HELPERS
// ============================================

const defaultParams = {
  to: 'user@example.com',
  subject: 'Test Subject',
  htmlContent: '<p>Test content</p>',
};

function createFetchResponse(status: number, body: Record<string, unknown> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : `Error ${status}`,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

describe('BrevoEmailService', () => {
  let service: BrevoEmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    // Create fresh instance to reset circuit breaker
    service = new BrevoEmailService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================
  // TEST 1: REST API Success
  // ============================================

  describe('REST API success', () => {
    it('should send email via REST API and return messageId', async () => {
      mockFetch.mockResolvedValue(createFetchResponse(200, { messageId: 'brevo-msg-123' }));

      const result = await service.sendEmail(defaultParams);

      expect(result.messageId).toBe('brevo-msg-123');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'api-key': 'test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
      // SMTP should NOT be called
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should reset circuit breaker failures on REST success', async () => {
      // Set up some failures first
      mockFetch
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce(createFetchResponse(200, { messageId: 'success-id' }));

      mockSendMail.mockResolvedValue({ messageId: 'smtp-fallback' });

      await service.sendEmail(defaultParams); // fail → SMTP
      await service.sendEmail(defaultParams); // fail → SMTP
      await service.sendEmail(defaultParams); // success → reset

      const state = service.getCircuitBreakerState();
      expect(state.failures).toBe(0);
      expect(state.fallbackToSMTP).toBe(false);
    });
  });

  // ============================================
  // TEST 2: REST API Timeout (>5s)
  // ============================================

  describe('REST API timeout', () => {
    it('should fallback to SMTP on REST timeout (abort) and increment circuit breaker', async () => {
      // Simulate AbortError (timeout)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      mockSendMail.mockResolvedValue({ messageId: 'smtp-timeout-fallback' });

      const result = await service.sendEmail(defaultParams);

      expect(result.messageId).toBe('smtp-timeout-fallback');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const state = service.getCircuitBreakerState();
      expect(state.failures).toBe(1);
    });
  });

  // ============================================
  // TEST 3: REST API 5xx Error
  // ============================================

  describe('REST API 5xx error', () => {
    it('should fallback to SMTP on 5xx response and increment circuit breaker', async () => {
      mockFetch.mockResolvedValue(createFetchResponse(503));
      mockSendMail.mockResolvedValue({ messageId: 'smtp-5xx-fallback' });

      const result = await service.sendEmail(defaultParams);

      expect(result.messageId).toBe('smtp-5xx-fallback');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const state = service.getCircuitBreakerState();
      expect(state.failures).toBe(1);
    });
  });

  // ============================================
  // TEST 4: SMTP Fallback
  // ============================================

  describe('SMTP fallback', () => {
    it('should send via SMTP when REST fails and verify SMTP params', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      mockSendMail.mockResolvedValue({ messageId: 'smtp-msg-456' });

      const result = await service.sendEmail(defaultParams);

      expect(result.messageId).toBe('smtp-msg-456');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Test Platform" <noreply@test.com>',
          to: 'user@example.com',
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        })
      );
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp-relay.brevo.com',
          port: 587,
          auth: expect.objectContaining({
            user: 'test-smtp-user',
            pass: 'test-smtp-pass',
          }),
        })
      );
    });
  });

  // ============================================
  // TEST 5: Circuit Breaker (10 consecutive failures)
  // ============================================

  describe('circuit breaker', () => {
    it('should switch to SMTP permanently after 10 consecutive REST failures', async () => {
      mockFetch.mockRejectedValue(new Error('REST down'));
      mockSendMail.mockResolvedValue({ messageId: 'smtp-permanent' });

      // Trigger 10 failures
      for (let i = 0; i < 10; i++) {
        await service.sendEmail(defaultParams);
      }

      const stateAfterTrip = service.getCircuitBreakerState();
      expect(stateAfterTrip.failures).toBe(10);
      expect(stateAfterTrip.fallbackToSMTP).toBe(true);

      // Now fetch should NOT be called — goes directly to SMTP
      mockFetch.mockClear();
      mockSendMail.mockClear();

      await service.sendEmail(defaultParams);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('should re-enable REST API after resetCircuitBreaker()', async () => {
      // Trip the breaker
      mockFetch.mockRejectedValue(new Error('REST down'));
      mockSendMail.mockResolvedValue({ messageId: 'smtp' });

      for (let i = 0; i < 10; i++) {
        await service.sendEmail(defaultParams);
      }

      expect(service.getCircuitBreakerState().fallbackToSMTP).toBe(true);

      // Reset
      service.resetCircuitBreaker();

      expect(service.getCircuitBreakerState().failures).toBe(0);
      expect(service.getCircuitBreakerState().fallbackToSMTP).toBe(false);

      // Now REST should be tried again
      mockFetch.mockResolvedValue(createFetchResponse(200, { messageId: 'back-online' }));
      const result = await service.sendEmail(defaultParams);

      expect(result.messageId).toBe('back-online');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // ============================================
  // TEST 6: Error logging
  // ============================================

  describe('error logging', () => {
    it('should log REST failures and SMTP fallback attempts', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));
      mockSendMail.mockResolvedValue({ messageId: 'smtp-logged' });

      await service.sendEmail(defaultParams);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[BrevoEmailService] REST API failed:')
        // Not checking exact message — just that error was logged
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[BrevoEmailService] Falling back to SMTP')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[BrevoEmailService] Circuit breaker:')
      );
    });

    it('should throw if both REST and SMTP fail', async () => {
      mockFetch.mockRejectedValue(new Error('REST down'));
      mockSendMail.mockRejectedValue(new Error('SMTP also down'));

      await expect(service.sendEmail(defaultParams)).rejects.toThrow('SMTP also down');
    });
  });

  // ============================================
  // TEST 7: Singleton export
  // ============================================

  describe('singleton export', () => {
    it('should export a singleton instance', () => {
      expect(brevoEmailService).toBeInstanceOf(BrevoEmailService);
    });
  });
});
