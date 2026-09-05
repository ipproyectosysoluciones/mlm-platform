/**
 * @fileoverview WalletNotificationService — Brevo email notifications for wallet events
 * @description Best-effort email notifications on withdrawal status changes.
 *   Does NOT throw on Brevo failure — state is already persisted.
 *   Retry sweep finds withdrawals where lastNotifiedStatus ≠ current status.
 *
 * @module services/WalletNotificationService
 */

import { User, WithdrawalRequest } from '../models/index.js';
import { brevoEmailService } from './BrevoEmailService.js';
import { logger } from '../utils/logger.js';
import type { WithdrawalStatus } from '../types/index.js';

/** Template IDs for each withdrawal status (Brevo transactional templates) */
const TEMPLATE_MAP: Record<string, string> = {
  approved: 'withdrawal-approved',
  paid: 'withdrawal-paid',
  rejected: 'withdrawal-rejected',
  failed: 'withdrawal-failed',
};

export class WalletNotificationService {
  /**
   * Send notification for a withdrawal status change
   * Enviar notificación por cambio de estado de retiro
   *
   * Best-effort: catches errors, logs warning, does NOT throw.
   * State is already persisted before this is called.
   */
  async notifyWithdrawalStatus(
    withdrawal: WithdrawalRequest,
    newStatus: WithdrawalStatus
  ): Promise<void> {
    const user = await User.findByPk(withdrawal.userId);
    if (!user?.email) {
      logger.warn(
        { service: 'WalletNotificationService', withdrawalId: withdrawal.id },
        'User has no email — skipping notification'
      );
      return;
    }

    const templateId = TEMPLATE_MAP[newStatus];
    if (!templateId) {
      logger.warn(
        { service: 'WalletNotificationService', status: newStatus },
        'No template for status — skipping'
      );
      return;
    }

    try {
      await brevoEmailService.sendTransactionalEmail({
        to: user.email,
        templateId,
        params: {
          amount: Number(withdrawal.netAmount),
          destination: withdrawal.destination?.email || 'N/A',
          status: newStatus,
          userName: (user as any).name || 'User',
        },
      });

      // Track successful notification
      withdrawal.lastNotifiedStatus = newStatus;
      withdrawal.lastNotifiedAt = new Date();
      await withdrawal.save({ fields: ['lastNotifiedStatus', 'lastNotifiedAt'] });

      logger.info(
        { service: 'WalletNotificationService', withdrawalId: withdrawal.id, status: newStatus },
        'Notification sent successfully'
      );
    } catch (err) {
      // Best-effort: log but don't throw — state already persisted
      logger.warn(
        {
          service: 'WalletNotificationService',
          withdrawalId: withdrawal.id,
          error: err instanceof Error ? err.message : String(err),
        },
        'Brevo notification failed — will retry in next sweep'
      );
    }
  }

  /**
   * Retry pending notifications — find withdrawals where lastNotifiedStatus ≠ status
   * Reintentar notificaciones pendientes
   *
   * Called by SchedulerService sweep (every 30 min)
   */
  async retryPendingNotifications(): Promise<void> {
    const pending = await WithdrawalRequest.findAll({
      where: {
        status: { ['in' as any]: ['approved', 'paid', 'rejected', 'failed'] },
      },
    });

    for (const w of pending) {
      if (w.lastNotifiedStatus !== w.status) {
        await this.notifyWithdrawalStatus(w, w.status);
      }
    }
  }
}

export const walletNotificationService = new WalletNotificationService();
