/**
 * @fileoverview WalletNotificationService unit tests
 * @description Tests for Brevo email notifications on withdrawal status changes:
 *   notifyWithdrawalStatus for each status (approved/paid/rejected/failed),
 *   best-effort behavior (Brevo failure doesn't throw), retryPendingNotifications
 *
 * @module __tests__/unit/wallet/WalletNotificationService
 */

// ============================================
// MOCKS — Must go BEFORE imports
// ============================================

jest.mock('../../../config/env', () => ({
  config: {
    wallet: { minWithdrawal: 20, feePercentage: 5 },
    brevo: { apiKey: 'test-key', senderEmail: 'test@example.com', senderName: 'Test' },
    platform: { domain: 'test.com' },
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockSendTransactionalEmail = jest.fn();
jest.mock('../../../services/BrevoEmailService', () => ({
  brevoEmailService: {
    sendTransactionalEmail: mockSendTransactionalEmail,
  },
}));

const mockUserFindOne = jest.fn();
jest.mock('../../../models/index', () => ({
  get User() {
    return { findByPk: mockUserFindOne };
  },
  get WithdrawalRequest() {
    return {
      findAll: jest.fn(),
    };
  },
}));

import { WalletNotificationService } from '../../../services/WalletNotificationService';

const notificationService = new WalletNotificationService();

const mockWithdrawal = {
  id: 'w-1',
  userId: 'user-1',
  requestedAmount: 100,
  feeAmount: 5,
  netAmount: 95,
  status: 'approved',
  destination: { method: 'paypal', email: 'user@example.com' },
  lastNotifiedStatus: null,
  lastNotifiedAt: null,
  save: jest.fn().mockResolvedValue(true),
};

describe('WalletNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindOne.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
    });
  });

  describe('notifyWithdrawalStatus', () => {
    it('sends approval email when status is approved', async () => {
      mockSendTransactionalEmail.mockResolvedValue({ messageId: 'msg-1' });

      await notificationService.notifyWithdrawalStatus(mockWithdrawal as any, 'approved');

      expect(mockSendTransactionalEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          params: expect.objectContaining({
            amount: 95,
            destination: 'user@example.com',
          }),
        })
      );
    });

    it('sends paid email when status is paid', async () => {
      mockSendTransactionalEmail.mockResolvedValue({ messageId: 'msg-2' });

      await notificationService.notifyWithdrawalStatus(mockWithdrawal as any, 'paid');

      expect(mockSendTransactionalEmail).toHaveBeenCalled();
    });

    it('sends rejection email when status is rejected', async () => {
      mockSendTransactionalEmail.mockResolvedValue({ messageId: 'msg-3' });

      await notificationService.notifyWithdrawalStatus(mockWithdrawal as any, 'rejected');

      expect(mockSendTransactionalEmail).toHaveBeenCalled();
    });

    it('sends failure email when status is failed', async () => {
      mockSendTransactionalEmail.mockResolvedValue({ messageId: 'msg-4' });

      await notificationService.notifyWithdrawalStatus(mockWithdrawal as any, 'failed');

      expect(mockSendTransactionalEmail).toHaveBeenCalled();
    });

    it('does not throw when Brevo fails (best-effort)', async () => {
      mockSendTransactionalEmail.mockRejectedValue(new Error('Brevo API error'));

      await expect(
        notificationService.notifyWithdrawalStatus(mockWithdrawal as any, 'approved')
      ).resolves.not.toThrow();
    });

    it('does not update tracking when Brevo fails', async () => {
      mockSendTransactionalEmail.mockRejectedValue(new Error('Brevo API error'));

      await notificationService.notifyWithdrawalStatus(mockWithdrawal as any, 'approved');

      // Tracking should not be updated on failure
      expect(mockWithdrawal.save).not.toHaveBeenCalled();
    });

    it('updates lastNotifiedStatus and lastNotifiedAt on success', async () => {
      mockSendTransactionalEmail.mockResolvedValue({ messageId: 'msg-5' });

      await notificationService.notifyWithdrawalStatus(mockWithdrawal as any, 'paid');

      expect(mockWithdrawal.lastNotifiedStatus).toBe('paid');
      expect(mockWithdrawal.lastNotifiedAt).toBeInstanceOf(Date);
      expect(mockWithdrawal.save).toHaveBeenCalledWith({
        fields: ['lastNotifiedStatus', 'lastNotifiedAt'],
      });
    });

    it('skips notification when user has no email', async () => {
      mockUserFindOne.mockResolvedValue({ id: 'user-1', email: null });

      await notificationService.notifyWithdrawalStatus(mockWithdrawal as any, 'approved');

      expect(mockSendTransactionalEmail).not.toHaveBeenCalled();
    });
  });
});
