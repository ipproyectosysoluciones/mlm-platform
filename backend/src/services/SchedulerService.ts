/**
 * @fileoverview SchedulerService - Daily payout job for withdrawal processing
 * @description Uses node-cron to run daily payout processing at midnight UTC
 *              Utiliza node-cron para ejecutar procesamiento de pagos diarios a medianoche UTC
 * @module services/SchedulerService
 * @author MLM Development Team
 *
 * @example
 * // English: Start the scheduler
 * schedulerService.start();
 *
 * // English: Stop the scheduler
 * schedulerService.stop();
 *
 * @example
 * // Español: Iniciar el scheduler
 * schedulerService.start();
 *
 * // Español: Detener el scheduler
 * schedulerService.stop();
 */
import cron from 'node-cron';
import { walletService } from './WalletService';
import { notificationService } from './NotificationService';
import { config } from '../config/env';

export class SchedulerService {
  private job: unknown | null = null;
  private isRunning: boolean = false;

  /**
   * Start the daily payout scheduler
   * Iniciar el scheduler de pagos diarios
   *
   * @note This method should be called when the application starts
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️  Scheduler already running');
      return;
    }

    // Daily payout job at midnight UTC
    this.job = cron.schedule(config.wallet.cronTime, async () => {
      console.log('📋 Running daily payout job...');
      try {
        const processed = await walletService.processDailyPayouts();
        console.log(`✅ Processed ${processed.length} withdrawal requests`);
      } catch (error) {
        console.error('❌ Error processing daily payouts:', error);
      }
    });

    // Start weekly digest notification job
    notificationService.startWeeklyDigest();

    console.log('📋 Scheduler initialized');
    console.log(`   Daily payout: ${config.wallet.cronTime}`);
    console.log(`   Weekly digest: Every Sunday at 9:00 AM UTC`);

    this.isRunning = true;
  }

  /**
   * Stop the scheduler
   * Detener el scheduler
   */
  stop(): void {
    if (this.job) {
      (this.job as cron.ScheduledTask).stop();
      this.job = null;
    }
    // Stop weekly digest job
    notificationService.stopWeeklyDigest();
    this.isRunning = false;
    console.log('🛑 Scheduler stopped');
  }

  /**
   * Manually trigger daily payout processing (for testing)
   * Ejecutar manualmente el procesamiento de pagos (para testing)
   *
   * @returns Number of processed withdrawals / Número de retiros procesados
   */
  async triggerPayout(): Promise<number> {
    console.log('📋 Manually triggered daily payout processing...');
    try {
      const processed = await walletService.processDailyPayouts();
      console.log(`✅ Processed ${processed.length} withdrawal requests`);
      return processed.length;
    } catch (error) {
      console.error('❌ Error processing daily payouts:', error);
      throw error;
    }
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
}

// Export singleton instance
export const schedulerService = new SchedulerService();
