/**
 * @fileoverview SchedulerService Email Campaign Jobs Unit Tests
 * @description Tests for email campaign scheduler job, email queue processor job,
 *              idempotency, and error recovery behavior.
 *              Pruebas para job del scheduler de campañas, job del procesador de cola,
 *              idempotencia y comportamiento de recuperación de errores.
 * @module __tests__/unit/SchedulerService.email
 */

// ============================================
// MOCKS — Deben ir ANTES de los imports
// ============================================

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({ stop: jest.fn() })),
}));

// Mock WalletService
jest.mock('../../services/WalletService', () => ({
  walletService: { processDailyPayouts: jest.fn().mockResolvedValue([]) },
}));

// Mock NotificationService
jest.mock('../../services/NotificationService', () => ({
  notificationService: {
    startWeeklyDigest: jest.fn(),
    stopWeeklyDigest: jest.fn(),
  },
}));

// Mock CartRecoveryEmailService
jest.mock('../../services/CartRecoveryEmailService', () => ({
  cartRecoveryEmailService: { sendRecoveryEmail: jest.fn() },
}));

// Mock CartService
jest.mock('../../services/CartService', () => ({
  cartService: {
    findAbandoned: jest.fn().mockResolvedValue([]),
    markAbandoned: jest.fn(),
    createRecoveryToken: jest.fn(),
  },
}));

// Mock config
jest.mock('../../config/env', () => ({
  config: {
    wallet: { cronTime: '0 0 * * *' },
    brevo: { apiKey: 'test' },
  },
}));

// Mock EmailQueueService
const mockProcessPendingEmails = jest.fn();
jest.mock('../../services/EmailQueueService', () => ({
  emailQueueService: {
    processPendingEmails: mockProcessPendingEmails,
  },
}));

// Mock EmailCampaignService
const mockSendCampaign = jest.fn();
jest.mock('../../services/EmailCampaignService', () => ({
  emailCampaignService: {
    sendCampaign: mockSendCampaign,
  },
}));

// Mock EmailCampaign model
const mockFindAll = jest.fn();
jest.mock('../../models', () => ({
  EmailCampaign: {
    findAll: mockFindAll,
  },
}));

import { SchedulerService, schedulerService } from '../../services/SchedulerService';

// ============================================
// TESTS
// ============================================

describe('SchedulerService — Email Campaign Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Task 22-7: emailCampaignSchedulerJob
  // ============================================

  describe('emailCampaignSchedulerJob()', () => {
    it('should return 0 when no scheduled campaigns exist', async () => {
      mockFindAll.mockResolvedValue([]);

      const result = await schedulerService.emailCampaignSchedulerJob();

      expect(result).toBe(0);
      expect(mockSendCampaign).not.toHaveBeenCalled();
    });

    it('should trigger sendCampaign for each scheduled campaign', async () => {
      const campaigns = [
        { id: 'camp-1', name: 'Newsletter Q1' },
        { id: 'camp-2', name: 'Promo' },
      ];
      mockFindAll.mockResolvedValue(campaigns);
      mockSendCampaign.mockResolvedValue(undefined);

      const result = await schedulerService.emailCampaignSchedulerJob();

      expect(result).toBe(2);
      expect(mockSendCampaign).toHaveBeenCalledWith('camp-1');
      expect(mockSendCampaign).toHaveBeenCalledWith('camp-2');
    });

    it('should continue with remaining campaigns if one fails (graceful degradation)', async () => {
      const campaigns = [
        { id: 'camp-fail', name: 'Failing' },
        { id: 'camp-ok', name: 'Working' },
      ];
      mockFindAll.mockResolvedValue(campaigns);
      mockSendCampaign
        .mockRejectedValueOnce(new Error('Send failed'))
        .mockResolvedValueOnce(undefined);

      const result = await schedulerService.emailCampaignSchedulerJob();

      expect(result).toBe(1); // Only 1 succeeded
      expect(mockSendCampaign).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================
  // Task 22-7: emailQueueProcessorJob
  // ============================================

  describe('emailQueueProcessorJob()', () => {
    it('should delegate to EmailQueueService.processPendingEmails()', async () => {
      const expectedStats = { processed: 5, sent: 3, deferred: 1, failed: 1 };
      mockProcessPendingEmails.mockResolvedValue(expectedStats);

      const result = await schedulerService.emailQueueProcessorJob();

      expect(result).toEqual(expectedStats);
      expect(mockProcessPendingEmails).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from EmailQueueService', async () => {
      mockProcessPendingEmails.mockRejectedValue(new Error('Queue processing failed'));

      await expect(schedulerService.emailQueueProcessorJob()).rejects.toThrow(
        'Queue processing failed'
      );
    });
  });
});
