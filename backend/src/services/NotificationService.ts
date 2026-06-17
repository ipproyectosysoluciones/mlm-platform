/**
 * @fileoverview Notification Service - Email and scheduling management
 * @description Coordinates notification sending including weekly digest cron job
 * @module services/NotificationService
 *
 * @example
 * // Start the weekly digest cron job
 * notificationService.startWeeklyDigest();
 *
 * // Stop the weekly digest cron job
 * notificationService.stopWeeklyDigest();
 */
import cron from 'node-cron';
import { User, Commission } from '../models';
import { emailService } from './EmailService';
import { logger } from '../utils/logger';

/**
 * Weekly digest cron schedule - Every Sunday at 9:00 AM UTC
 * Programa de cron para resumen semanal - Cada domingo a las 9:00 AM UTC
 */
const WEEKLY_DIGEST_CRON = '0 9 * * 0';

export class NotificationService {
  private weeklyDigestJob: cron.ScheduledTask | null = null;

  /**
   * Get commission stats for a user
   * Obtener estadísticas de comisiones para un usuario
   */
  private async getUserCommissionStats(userId: string): Promise<{
    weeklyEarnings: number;
    totalEarnings: number;
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // This week's commissions
    const weeklyCommissions = await Commission.findAll({
      where: {
        userId,
        createdAt: { $gte: weekAgo },
        status: 'paid',
      },
    });

    // Total commissions
    const totalCommissions = await Commission.findAll({
      where: {
        userId,
        status: 'paid',
      },
    });

    const weeklyEarnings = weeklyCommissions.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalEarnings = totalCommissions.reduce((sum, c) => sum + Number(c.amount), 0);

    return { weeklyEarnings, totalEarnings };
  }

  /**
   * Send weekly digest to all users with weeklyDigest enabled
   * Enviar resumen semanal a todos los usuarios con weeklyDigest habilitado
   */
  async sendWeeklyDigestEmails(): Promise<void> {
    logger.info({ service: 'NotificationService' }, 'Starting weekly digest job');

    try {
      // Get all users with weekly digest enabled
      const users = await User.findAll({
        where: {
          weeklyDigest: true,
          status: 'active',
        },
      });

      logger.info(
        { service: 'NotificationService', userCount: users.length },
        'Sending weekly digest to users'
      );

      let sentCount = 0;
      let failedCount = 0;

      for (const user of users) {
        try {
          // Skip if user disabled email notifications
          if (user.emailNotifications === false) {
            continue;
          }

          const { weeklyEarnings } = await this.getUserCommissionStats(user.id);

          const firstName = user.email.split('@')[0];

          await emailService.sendWeeklyDigest({
            email: user.email,
            firstName,
            newReferrals: 0, // TODO: Calculate actual count
            commissionsEarned: weeklyEarnings,
          });

          sentCount++;
        } catch (error) {
          logger.error(
            { err: error, service: 'NotificationService', email: user.email },
            'Failed to send weekly digest'
          );
          failedCount++;
        }
      }

      logger.info(
        { service: 'NotificationService', sentCount, failedCount },
        'Weekly digest job completed'
      );
    } catch (error) {
      logger.error({ err: error, service: 'NotificationService' }, 'Weekly digest job failed');
    }
  }

  /**
   * Start the weekly digest cron job
   * Iniciar el trabajo de cron para resumen semanal
   */
  startWeeklyDigest(): void {
    if (this.weeklyDigestJob) {
      logger.warn({ service: 'NotificationService' }, 'Weekly digest job already running');
      return;
    }

    logger.info(
      { service: 'NotificationService', cron: WEEKLY_DIGEST_CRON },
      'Starting weekly digest cron'
    );

    this.weeklyDigestJob = cron.schedule(WEEKLY_DIGEST_CRON, async () => {
      await this.sendWeeklyDigestEmails();
    });

    logger.info({ service: 'NotificationService' }, 'Weekly digest job started');
  }

  /**
   * Stop the weekly digest cron job
   * Detener el trabajo de cron para resumen semanal
   */
  stopWeeklyDigest(): void {
    if (this.weeklyDigestJob) {
      this.weeklyDigestJob.stop();
      this.weeklyDigestJob = null;
      logger.info({ service: 'NotificationService' }, 'Weekly digest job stopped');
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
