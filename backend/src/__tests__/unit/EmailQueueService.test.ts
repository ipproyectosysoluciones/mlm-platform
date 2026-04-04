/**
 * @fileoverview EmailQueueService Unit Tests
 * @description Tests for email queue processing: happy path, retries, exponential backoff,
 *              max retries, campaign stats update, and event logging.
 *              Pruebas para procesamiento de cola de emails: flujo exitoso, reintentos,
 *              backoff exponencial, máximo de reintentos, actualización de stats de campaña y logging de eventos.
 * @module __tests__/unit/EmailQueueService
 */

// ============================================
// MOCKS — Deben ir ANTES de los imports
// ============================================

const mockSendEmail = jest.fn();
jest.mock('../../services/BrevoEmailService', () => ({
  brevoEmailService: {
    sendEmail: mockSendEmail,
  },
}));

const mockEmailQueueFindAll = jest.fn();
const mockEmailQueueCount = jest.fn();
const mockEmailCampaignIncrement = jest.fn();
const mockEmailCampaignUpdate = jest.fn();
const mockEmailCampaignFindByPk = jest.fn();
const mockEmailCampaignLogCreate = jest.fn();

jest.mock('../../models', () => ({
  EmailQueue: {
    findAll: mockEmailQueueFindAll,
    count: mockEmailQueueCount,
  },
  EmailCampaign: {
    increment: mockEmailCampaignIncrement,
    update: mockEmailCampaignUpdate,
    findByPk: mockEmailCampaignFindByPk,
  },
  EmailCampaignLog: {
    create: mockEmailCampaignLogCreate,
  },
}));

import { EmailQueueService, emailQueueService } from '../../services/EmailQueueService';
import { EMAIL_QUEUE_STATUS } from '../../types';

// ============================================
// TEST HELPERS — Helpers de Test
// ============================================

function createMockQueueItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'queue-1',
    campaignId: 'camp-1',
    campaignRecipientId: 'recip-1',
    userId: 'user-1',
    emailAddress: 'user@example.com',
    subjectLine: 'Test Subject',
    htmlContent: '<p>Test</p>',
    status: 'pending',
    retryCount: 0,
    nextRetryAt: null,
    lastError: null,
    brevoMessageId: null,
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('EmailQueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no remaining emails after batch (campaign completes)
    mockEmailQueueCount.mockResolvedValue(0);
    // Default: campaign is in 'sending' status
    mockEmailCampaignFindByPk.mockResolvedValue({
      id: 'camp-1',
      status: 'sending',
      sentCount: 10,
      failedCount: 0,
      update: jest.fn().mockResolvedValue(undefined),
    });
  });

  describe('processPendingEmails()', () => {
    it('should return empty stats when no pending emails', async () => {
      mockEmailQueueFindAll.mockResolvedValue([]);

      const result = await emailQueueService.processPendingEmails();

      expect(result).toEqual({ processed: 0, sent: 0, deferred: 0, failed: 0 });
    });

    it('should send email successfully and update stats', async () => {
      const item = createMockQueueItem();
      mockEmailQueueFindAll.mockResolvedValue([item]);
      mockSendEmail.mockResolvedValue({ messageId: 'brevo-msg-123' });

      const result = await emailQueueService.processPendingEmails();

      expect(result.sent).toBe(1);
      expect(result.processed).toBe(1);
      expect(item.update).toHaveBeenCalledWith({ status: EMAIL_QUEUE_STATUS.PROCESSING });
      expect(item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EMAIL_QUEUE_STATUS.SENT,
          brevoMessageId: 'brevo-msg-123',
        })
      );
      expect(mockEmailCampaignIncrement).toHaveBeenCalledWith('sentCount', {
        where: { id: 'camp-1' },
      });
      expect(mockEmailCampaignLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'sent' })
      );
    });

    it('should defer email on retryable failure with exponential backoff', async () => {
      const item = createMockQueueItem({ retryCount: 1 });
      mockEmailQueueFindAll.mockResolvedValue([item]);
      mockSendEmail.mockRejectedValue(new Error('Brevo timeout'));
      // Prevent campaign completion since there are deferred emails
      mockEmailQueueCount
        .mockResolvedValueOnce(1) // deferredCount query
        .mockResolvedValueOnce(1); // remaining count (not complete)

      const result = await emailQueueService.processPendingEmails();

      expect(result.deferred).toBe(1);
      // retryCount was 1, now 2 → backoff = 2^(2-1) = 2 seconds
      expect(item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EMAIL_QUEUE_STATUS.DEFERRED,
          retryCount: 2,
        })
      );
      expect(mockEmailCampaignLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'deferred',
          details: expect.objectContaining({ backoffSeconds: 2 }),
        })
      );
    });

    it('should mark as failed after max retries (5)', async () => {
      const item = createMockQueueItem({ retryCount: 4 }); // next will be 5 = MAX
      mockEmailQueueFindAll.mockResolvedValue([item]);
      mockSendEmail.mockRejectedValue(new Error('Permanent failure'));

      const result = await emailQueueService.processPendingEmails();

      expect(result.failed).toBe(1);
      expect(item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EMAIL_QUEUE_STATUS.FAILED,
          retryCount: 5,
          lastError: 'Permanent failure',
        })
      );
      expect(mockEmailCampaignIncrement).toHaveBeenCalledWith('failedCount', {
        where: { id: 'camp-1' },
      });
      expect(mockEmailCampaignLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'failed',
          details: expect.objectContaining({ permanent: true }),
        })
      );
    });

    it('should update campaign deferred counts after batch', async () => {
      const item = createMockQueueItem();
      mockEmailQueueFindAll.mockResolvedValue([item]);
      mockSendEmail.mockResolvedValue({ messageId: 'msg-1' });
      mockEmailQueueCount
        .mockResolvedValueOnce(3) // deferred count for campaign
        .mockResolvedValueOnce(0); // remaining count (complete)

      await emailQueueService.processPendingEmails();

      expect(mockEmailCampaignUpdate).toHaveBeenCalledWith(
        { deferredCount: 3 },
        { where: { id: 'camp-1' } }
      );
    });

    it('should mark campaign as completed when all emails processed', async () => {
      const item = createMockQueueItem();
      mockEmailQueueFindAll.mockResolvedValue([item]);
      mockSendEmail.mockResolvedValue({ messageId: 'msg-1' });
      mockEmailQueueCount
        .mockResolvedValueOnce(0) // deferredCount
        .mockResolvedValueOnce(0); // remaining count → 0 means complete

      const mockCampaign = {
        id: 'camp-1',
        status: 'sending',
        sentCount: 10,
        failedCount: 0,
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockEmailCampaignFindByPk.mockResolvedValue(mockCampaign);

      await emailQueueService.processPendingEmails();

      expect(mockCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });

    it('should process multiple emails in a batch', async () => {
      const items = [
        createMockQueueItem({ id: 'q-1' }),
        createMockQueueItem({ id: 'q-2', campaignRecipientId: 'recip-2' }),
        createMockQueueItem({ id: 'q-3', campaignRecipientId: 'recip-3' }),
      ];
      mockEmailQueueFindAll.mockResolvedValue(items);
      mockSendEmail
        .mockResolvedValueOnce({ messageId: 'msg-1' })
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ messageId: 'msg-3' });
      // Prevent campaign completion
      mockEmailQueueCount.mockResolvedValue(1);

      const result = await emailQueueService.processPendingEmails();

      expect(result.processed).toBe(3);
      expect(result.sent).toBe(2);
      expect(result.deferred).toBe(1);
    });
  });

  describe('singleton export', () => {
    it('should export a singleton instance', () => {
      expect(emailQueueService).toBeInstanceOf(EmailQueueService);
    });
  });
});
