/**
 * @fileoverview SchedulerService - Daily payout job & abandoned cart detection
 * @description Uses node-cron to run daily payout processing at midnight UTC and
 *              abandoned cart detection every 15 minutes for recovery email dispatch
 *              Utiliza node-cron para ejecutar procesamiento de pagos diarios a medianoche UTC
 *              y detección de carritos abandonados cada 15 minutos para envío de emails de recuperación
 * @module services/SchedulerService
 * @author MLM Development Team
 *
 * @example
 * // English: Start the scheduler (includes abandoned cart job)
 * schedulerService.start();
 *
 * // English: Manually trigger abandoned cart detection
 * await schedulerService.triggerAbandonedCartJob();
 *
 * @example
 * // Español: Iniciar el scheduler (incluye job de carritos abandonados)
 * schedulerService.start();
 *
 * // Español: Ejecutar manualmente detección de carritos abandonados
 * await schedulerService.triggerAbandonedCartJob();
 */
import cron from 'node-cron';
import { walletService } from './WalletService';
import { notificationService } from './NotificationService';
import { cartRecoveryEmailService } from './CartRecoveryEmailService';
import { cartService } from './CartService';
import { emailQueueService } from './EmailQueueService';
import { emailCampaignService } from './EmailCampaignService';
import { EmailCampaign } from '../models';
import { Op } from 'sequelize';
import { EMAIL_CAMPAIGN_STATUS } from '../types';
import { config } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Abandoned cart detection cron: every 15 minutes
 * Cron de detección de carritos abandonados: cada 15 minutos
 */
const ABANDONED_CART_CRON = '*/15 * * * *';

/**
 * Email campaign scheduler cron: every 1 minute
 * Cron del scheduler de campañas de email: cada 1 minuto
 */
const EMAIL_CAMPAIGN_CRON = '* * * * *';

/**
 * Email queue processor cron: every 1 minute
 * Cron del procesador de cola de email: cada 1 minuto
 */
const EMAIL_QUEUE_CRON = '* * * * *';

export class SchedulerService {
  private job: unknown | null = null;
  private abandonedCartJob: unknown | null = null;
  private emailCampaignJob: unknown | null = null;
  private emailQueueJob: unknown | null = null;
  private isRunning: boolean = false;

  /**
   * Start the daily payout scheduler and abandoned cart detection
   * Iniciar el scheduler de pagos diarios y detección de carritos abandonados
   *
   * @note This method should be called when the application starts
   */
  start(): void {
    if (this.isRunning) {
      logger.warn({ service: 'SchedulerService' }, 'Scheduler already running');
      return;
    }

    // Daily payout job at midnight UTC (only if crypto wallet feature is enabled)
    // Job de pagos diarios a medianoche UTC (solo si la funcionalidad de crypto wallet está habilitada)
    this.job = cron.schedule(config.wallet.cronTime, async () => {
      if (!config.features.cryptoWallet) {
        logger.debug(
          { service: 'SchedulerService' },
          'Skipping daily payout — cryptoWallet feature disabled'
        );
        return;
      }
      logger.info({ service: 'SchedulerService' }, 'Running daily payout job');
      try {
        const processed = await walletService.processDailyPayouts();
        logger.info(
          { service: 'SchedulerService', count: processed.length },
          'Processed withdrawal requests'
        );
      } catch (error) {
        logger.error({ err: error, service: 'SchedulerService' }, 'Error processing daily payouts');
      }
    });

    // Abandoned cart detection job every 15 minutes
    this.abandonedCartJob = cron.schedule(ABANDONED_CART_CRON, async () => {
      logger.info({ service: 'SchedulerService' }, 'Running abandoned cart detection job');
      try {
        const result = await this.runAbandonedCartJob();
        logger.info(
          {
            service: 'SchedulerService',
            processed: result.processed,
            emailsSent: result.emailsSent,
            errors: result.errors,
          },
          'Abandoned cart job completed'
        );
      } catch (error) {
        logger.error(
          { err: error, service: 'SchedulerService' },
          'Error running abandoned cart job'
        );
      }
    });

    // Start weekly digest notification job
    notificationService.startWeeklyDigest();

    // Email campaign scheduler: check for scheduled campaigns every minute
    this.emailCampaignJob = cron.schedule(EMAIL_CAMPAIGN_CRON, async () => {
      try {
        await this.emailCampaignSchedulerJob();
      } catch (error) {
        logger.error(
          { err: error, service: 'SchedulerService' },
          'Error running email campaign scheduler job'
        );
      }
    });

    // Email queue processor: process pending emails every minute
    this.emailQueueJob = cron.schedule(EMAIL_QUEUE_CRON, async () => {
      try {
        await this.emailQueueProcessorJob();
      } catch (error) {
        logger.error(
          { err: error, service: 'SchedulerService' },
          'Error running email queue processor job'
        );
      }
    });

    logger.info(
      {
        service: 'SchedulerService',
        dailyPayout: config.wallet.cronTime,
        abandonedCart: ABANDONED_CART_CRON,
        emailCampaign: EMAIL_CAMPAIGN_CRON,
        emailQueue: EMAIL_QUEUE_CRON,
        weeklyDigest: 'Every Sunday at 9:00 AM UTC',
      },
      'Scheduler initialized'
    );

    this.isRunning = true;
  }

  /**
   * Stop the scheduler
   * Detener el scheduler
   */
  stop(): void {
    if (this.job) {
      (this.job as { stop(): void }).stop();
      this.job = null;
    }
    if (this.abandonedCartJob) {
      (this.abandonedCartJob as { stop(): void }).stop();
      this.abandonedCartJob = null;
    }
    if (this.emailCampaignJob) {
      (this.emailCampaignJob as { stop(): void }).stop();
      this.emailCampaignJob = null;
    }
    if (this.emailQueueJob) {
      (this.emailQueueJob as { stop(): void }).stop();
      this.emailQueueJob = null;
    }
    // Stop weekly digest job
    notificationService.stopWeeklyDigest();
    this.isRunning = false;
    logger.info({ service: 'SchedulerService' }, 'Scheduler stopped');
  }

  /**
   * Manually trigger daily payout processing (for testing)
   * Ejecutar manualmente el procesamiento de pagos (para testing)
   *
   * @returns Number of processed withdrawals / Número de retiros procesados
   */
  async triggerPayout(): Promise<number> {
    // Guard: skip if crypto wallet feature is disabled
    // Guardia: omitir si la funcionalidad de crypto wallet está deshabilitada
    if (!config.features.cryptoWallet) {
      logger.info(
        { service: 'SchedulerService' },
        'Skipping manual payout — cryptoWallet feature disabled'
      );
      return 0;
    }
    logger.info({ service: 'SchedulerService' }, 'Manually triggered daily payout processing');
    try {
      const processed = await walletService.processDailyPayouts();
      logger.info(
        { service: 'SchedulerService', count: processed.length },
        'Processed withdrawal requests'
      );
      return processed.length;
    } catch (error) {
      logger.error({ err: error, service: 'SchedulerService' }, 'Error processing daily payouts');
      throw error;
    }
  }

  /**
   * Run abandoned cart detection and recovery email dispatch
   * Ejecutar detección de carritos abandonados y envío de emails de recuperación
   *
   * Idempotent: Re-running does NOT double-send emails.
   * Only processes carts with status='active' and lastActivityAt > 1000 min ago.
   * After marking as abandoned, creates recovery token and queues email.
   *
   * @returns Processing stats / Estadísticas de procesamiento
   */
  async runAbandonedCartJob(): Promise<{
    processed: number;
    emailsSent: number;
    errors: number;
  }> {
    const stats = { processed: 0, emailsSent: 0, errors: 0 };

    try {
      // 1. Find carts with status='active' and lastActivityAt > threshold
      //    (findAbandoned only returns status='active' carts, so re-running is idempotent)
      const abandonedCarts = await cartService.findAbandoned(1000);

      if (abandonedCarts.length === 0) {
        return stats;
      }

      logger.info(
        { service: 'AbandonedCartJob', count: abandonedCarts.length },
        'Found abandoned carts'
      );

      // 2. Process each cart individually (graceful degradation)
      for (const cart of abandonedCarts) {
        try {
          // Mark cart as abandoned FIRST (prevents re-processing on next cycle)
          await cartService.markAbandoned(cart.id);
          stats.processed++;

          // Generate recovery token
          const token = await cartService.createRecoveryToken(cart.id, 7);

          // Send recovery email (best-effort: if email fails, cart still abandoned)
          try {
            await cartRecoveryEmailService.sendRecoveryEmail(cart.id, token.tokenPlain);
            stats.emailsSent++;
          } catch (emailError) {
            logger.error(
              { err: emailError, service: 'AbandonedCartJob', cartId: cart.id },
              'Email failed for cart'
            );
            stats.errors++;
            // Cart already marked abandoned — email can be retried manually or on next cycle
            // if the cart is re-activated by user and abandoned again
          }
        } catch (cartError) {
          logger.error(
            { err: cartError, service: 'AbandonedCartJob', cartId: cart.id },
            'Error processing cart'
          );
          stats.errors++;
        }
      }
    } catch (error) {
      logger.error({ err: error, service: 'AbandonedCartJob' }, 'Fatal error');
      throw error;
    }

    return stats;
  }

  /**
   * Manually trigger abandoned cart detection (for testing)
   * Ejecutar manualmente detección de carritos abandonados (para testing)
   *
   * @returns Processing stats / Estadísticas de procesamiento
   */
  async triggerAbandonedCartJob(): Promise<{
    processed: number;
    emailsSent: number;
    errors: number;
  }> {
    logger.info({ service: 'SchedulerService' }, 'Manually triggered abandoned cart detection');
    return this.runAbandonedCartJob();
  }

  /**
   * Check if scheduler is running
   * Verificar si el scheduler está ejecutándose
   *
   * @returns True if running / True si está ejecutándose
   */
  getStatus(): boolean {
    return this.isRunning;
  }

  // ============================================
  // EMAIL CAMPAIGN JOBS — Jobs de Campañas de Email
  // ============================================

  /**
   * Email campaign scheduler job: find scheduled campaigns whose scheduledFor <= NOW and send them
   * Job de scheduler de campañas: encontrar campañas programadas cuyo scheduledFor <= AHORA y enviarlas
   *
   * Idempotent: sendCampaign uses SELECT FOR UPDATE locking, so re-running
   * will not double-process campaigns already in 'sending' status.
   *
   * @returns Number of campaigns triggered / Número de campañas disparadas
   */
  async emailCampaignSchedulerJob(): Promise<number> {
    const scheduledCampaigns = await EmailCampaign.findAll({
      where: {
        status: EMAIL_CAMPAIGN_STATUS.SCHEDULED,
        scheduledFor: { [Op.lte]: new Date() },
      },
    });

    if (scheduledCampaigns.length === 0) {
      return 0;
    }

    logger.info(
      { service: 'EmailCampaignScheduler', count: scheduledCampaigns.length },
      'Found scheduled campaigns to send'
    );

    let triggered = 0;
    for (const campaign of scheduledCampaigns) {
      try {
        await emailCampaignService.sendCampaign(campaign.id);
        triggered++;
        logger.info(
          {
            service: 'EmailCampaignScheduler',
            campaignId: campaign.id,
            campaignName: campaign.name,
          },
          'Triggered campaign'
        );
      } catch (error) {
        logger.error(
          { err: error, service: 'EmailCampaignScheduler', campaignId: campaign.id },
          'Error triggering campaign'
        );
        // Graceful degradation: continue with next campaign
      }
    }

    return triggered;
  }

  /**
   * Email queue processor job: delegate to EmailQueueService.processPendingEmails()
   * Job del procesador de cola de email: delegar a EmailQueueService.processPendingEmails()
   *
   * Idempotent: EmailQueueService marks items as 'processing' before sending,
   * preventing double-processing on concurrent runs.
   *
   * @returns Processing stats / Estadísticas de procesamiento
   */
  async emailQueueProcessorJob(): Promise<{
    processed: number;
    sent: number;
    deferred: number;
    failed: number;
  }> {
    return emailQueueService.processPendingEmails();
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
