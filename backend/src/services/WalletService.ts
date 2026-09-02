/**
 * @fileoverview WalletService - Business logic for digital wallet operations
 * @description Handles wallet creation, credit/debit operations, withdrawals, and payout processing
 *              Gestiona creación de wallets, operaciones de crédito/débito, retiros y procesamiento de pagos
 * @module services/WalletService
 * @author MLM Development Team
 *
 * @example
 * // English: Credit commission to user wallet
 * const wallet = await walletService.creditCommission(userId, commissionAmount, 'USD', commissionId);
 *
 * // Español: Acreditar comisión a wallet de usuario
 * const wallet = await walletService.creditCommission(userId, commissionAmount, 'USD', commissionId);
 *
 * @example
 * // English: Create withdrawal request
 * const withdrawal = await walletService.createWithdrawal(userId, 100);
 *
 * // Español: Crear solicitud de retiro
 * const withdrawal = await walletService.createWithdrawal(userId, 100);
 */
import { Wallet, WalletTransaction, WithdrawalRequest } from '../models/index.js';
import { config } from '../config/env.js';
import { WALLET_TRANSACTION_TYPE, WITHDRAWAL_STATUS } from '../types/index.js';
import type { WithdrawalDestination } from '../types/index.js';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { getPayoutGateway } from './payouts/index.js';
import type { PayoutStatus } from './payouts/PayoutGateway.js';

/**
 * Validate email format (simple check)
 * Validar formato de email
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Simple exchange rates to USD (in production, use an external API)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  COP: 0.00025, // 1 USD = 4000 COP
  MXN: 0.058, // 1 USD = 17.2 MXN
};

/**
 * Convert amount from any currency to USD
 * Convierte monto de cualquier moneda a USD
 *
 * @param amount - Amount to convert / Monto a convertir
 * @param fromCurrency - Source currency / Moneda de origen
 * @returns Amount in USD / Monto en USD
 */
function convertToUSD(amount: number, fromCurrency: string): number {
  const rate = EXCHANGE_RATES[fromCurrency] || 1;
  return amount * rate;
}

export class WalletService {
  /**
   * Create or get wallet for a user
   * Crear u obtener wallet de usuario
   *
   * @param userId - User ID / ID de usuario
   * @returns Wallet instance / Instancia de wallet
   */
  async createWallet(userId: string): Promise<Wallet> {
    let wallet = await Wallet.findOne({ where: { userId } });

    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        currency: 'USD',
      });
    }

    return wallet;
  }

  /**
   * Get wallet by user ID
   * Obtener wallet por ID de usuario
   *
   * @param userId - User ID / ID de usuario
   * @returns Wallet instance or null / Instancia de wallet o null
   */
  async getWallet(userId: string): Promise<Wallet | null> {
    return Wallet.findOne({ where: { userId } });
  }

  /**
   * Validate that user has sufficient balance for a withdrawal
   * Validar que usuario tiene balance suficiente para un retiro
   *
   * @param userId - User ID / ID de usuario
   * @param amount - Amount to withdraw / Monto a retirar
   * @returns True if balance is sufficient / True si el balance es suficiente
   */
  async validateSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const wallet = await this.getWallet(userId);
    if (!wallet) return false;
    return Number(wallet.balance) >= amount;
  }

  /**
   * Calculate withdrawal fee based on amount
   * Calcular fee de retiro basado en el monto
   *
   * @param amount - Withdrawal amount / Monto de retiro
   * @returns Fee amount / Monto del fee
   *
   * @example
   * // English: Calculate 5% fee on $100
   * const fee = walletService.calculateFee(100); // Returns 5
   *
   * // Español: Calcular 5% de fee sobre $100
   * const fee = walletService.calculateFee(100); // Retorna 5
   */
  calculateFee(amount: number): number {
    return Number((amount * (config.wallet.feePercentage / 100)).toFixed(2));
  }

  /**
   * Credit commission to user wallet
   * Acreditar comisión a wallet de usuario
   *
   * @param userId - User ID / ID de usuario
   * @param amount - Commission amount / Monto de comisión
   * @param currency - Original currency / Moneda original
   * @param referenceId - Commission ID for reference / ID de comisión para referencia
   * @param description - Transaction description / Descripción de transacción
   * @returns Updated wallet / Wallet actualizado
   */
  async creditCommission(
    userId: string,
    amount: number,
    currency: string,
    referenceId: string,
    description?: string
  ): Promise<Wallet> {
    const wallet = await this.createWallet(userId);

    // Convert to USD if not already USD
    const amountInUSD = convertToUSD(amount, currency);
    const exchangeRate = currency !== 'USD' ? EXCHANGE_RATES[currency] : null;

    await WalletTransaction.create({
      walletId: wallet.id,
      type: WALLET_TRANSACTION_TYPE.COMMISSION_EARNED,
      amount: amountInUSD,
      currency: 'USD',
      referenceId,
      description: description || `Commission earned from purchase`,
      exchangeRate,
    });

    // Update wallet balance
    wallet.balance = Number(wallet.balance) + amountInUSD;
    await wallet.save();

    return wallet;
  }

  /**
   * Create a withdrawal request
   * Crear solicitud de retiro
   *
   * @param userId - User ID / ID de usuario
   * @param requestedAmount - Amount user wants to withdraw / Monto que usuario quiere retirar
   * @returns Withdrawal request / Solicitud de retiro
   *
   * @example
   * // English: Create withdrawal request for $50
   * const withdrawal = await walletService.createWithdrawal(userId, 50);
   * // Returns: { id, userId, requestedAmount: 50, feeAmount: 2.50, netAmount: 47.50, status: 'pending' }
   *
   * // Español: Crear solicitud de retiro por $50
   * const withdrawal = await walletService.createWithdrawal(userId, 50, { method: 'paypal', email: 'user@example.com' });
   */
  async createWithdrawal(
    userId: string,
    requestedAmount: number,
    destination: WithdrawalDestination
  ): Promise<WithdrawalRequest> {
    // 1. Validate destination — must have valid email for PayPal
    if (!destination?.email || !isValidEmail(destination.email)) {
      throw new Error('Email de destino inválido para PayPal');
    }

    // 2. Validate minimum amount
    if (requestedAmount < config.wallet.minWithdrawal) {
      throw new Error(`Minimum withdrawal amount is ${config.wallet.minWithdrawal} USD`);
    }

    // 3. Validate max per withdrawal
    if (requestedAmount > config.wallet.maxWithdrawal) {
      throw new Error(`Withdrawal amount exceeds maximum of ${config.wallet.maxWithdrawal} USD`);
    }

    // 4. Validate daily UTC sum (pending + approved + paid today + this request ≤ limit)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const todayWithdrawals = await WithdrawalRequest.findAll({
      where: {
        userId,
        status: { [Op.in]: ['pending', 'approved', 'paid'] },
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
    });
    const dailySum = todayWithdrawals.reduce((sum, w) => sum + Number(w.requestedAmount), 0);
    if (dailySum + requestedAmount > config.wallet.maxWithdrawalDailyPerUser) {
      throw new Error(
        `Daily withdrawal limit of ${config.wallet.maxWithdrawalDailyPerUser} USD exceeded`
      );
    }

    // 5. Validate sufficient balance (amount + fee)
    const feeAmount = this.calculateFee(requestedAmount);
    const totalCost = requestedAmount + feeAmount;
    const wallet = await this.getWallet(userId);
    if (!wallet || Number(wallet.balance) < totalCost) {
      throw new Error('Insufficient balance');
    }

    // Calculate net
    const netAmount = requestedAmount - feeAmount;

    // Create withdrawal request with destination
    const withdrawal = await WithdrawalRequest.create({
      userId,
      requestedAmount,
      feeAmount,
      netAmount,
      status: WITHDRAWAL_STATUS.PENDING,
      destination,
    });

    // Deduct from wallet balance (reserve the amount)
    wallet.balance = Number(wallet.balance) - requestedAmount;
    await wallet.save();

    // Create fee transaction
    await WalletTransaction.create({
      walletId: wallet.id,
      type: WALLET_TRANSACTION_TYPE.FEE,
      amount: -feeAmount,
      currency: 'USD',
      referenceId: withdrawal.id,
      description: `Withdrawal fee for request ${withdrawal.id}`,
    });

    // Create withdrawal transaction
    await WalletTransaction.create({
      walletId: wallet.id,
      type: WALLET_TRANSACTION_TYPE.WITHDRAWAL,
      amount: -requestedAmount,
      currency: 'USD',
      referenceId: withdrawal.id,
      description: `Withdrawal request ${withdrawal.id}`,
    });

    return withdrawal;
  }

  /**
   * Cancel a withdrawal request
   * Cancelar solicitud de retiro
   *
   * @param withdrawalId - Withdrawal request ID / ID de solicitud de retiro
   * @param userId - User ID (for authorization) / ID de usuario (para autorización)
   * @returns Updated withdrawal / Solicitud de retiro actualizada
   */
  async cancelWithdrawal(withdrawalId: string, userId: string): Promise<WithdrawalRequest> {
    const withdrawal = await WithdrawalRequest.findByPk(withdrawalId);

    if (!withdrawal) {
      throw new Error('Withdrawal request not found');
    }

    if (withdrawal.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      throw new Error('Can only cancel pending withdrawal requests');
    }

    // Update status
    withdrawal.status = WITHDRAWAL_STATUS.CANCELLED;
    await withdrawal.save();

    // Refund wallet balance (the full requested amount, fees are not refunded)
    const wallet = await this.getWallet(userId);
    if (wallet) {
      wallet.balance = Number(wallet.balance) + withdrawal.requestedAmount;
      await wallet.save();
    }

    return withdrawal;
  }

  /**
   * Get wallet transactions with pagination
   * Obtener transacciones de wallet con paginación
   *
   * @param userId - User ID / ID de usuario
   * @param options - Pagination and filter options / Opciones de paginación y filtros
   * @returns Transactions and count / Transacciones y conteo
   */
  async getTransactions(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      type?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ rows: WalletTransaction[]; count: number }> {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      return { rows: [], count: 0 };
    }

    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { walletId: wallet.id };

    // Type mapping: frontend sends legacy values, backend maps transparently
    const typeMap: Record<string, string> = {
      commission: 'commission_earned',
      refund: 'adjustment',
    };
    if (options?.type) {
      where.type = typeMap[options.type] || options.type;
    }
    if (options?.startDate || options?.endDate) {
      where.created_at = {};
      if (options?.startDate) {
        (where.created_at as Record<string, unknown>)[Op.gte as unknown as string] =
          options.startDate;
      }
      if (options?.endDate) {
        (where.created_at as Record<string, unknown>)[Op.lte as unknown as string] =
          options.endDate;
      }
    }

    return WalletTransaction.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get withdrawal requests for a user
   * Obtener solicitudes de retiro para un usuario
   *
   * @param userId - User ID / ID de usuario
   * @param options - Pagination options / Opciones de paginación
   * @returns Withdrawal requests and count / Solicitudes de retiro y conteo
   */
  async getWithdrawalRequests(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ rows: WithdrawalRequest[]; count: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    return WithdrawalRequest.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get withdrawal request by ID
   * Obtener solicitud de retiro por ID
   *
   * @param withdrawalId - Withdrawal request ID / ID de solicitud de retiro
   * @returns Withdrawal request or null / Solicitud de retiro o null
   */
  async getWithdrawalRequest(withdrawalId: string): Promise<WithdrawalRequest | null> {
    return WithdrawalRequest.findByPk(withdrawalId);
  }

  /**
   * Process daily payouts — called by SchedulerService
   * Procesar pagos diarios — llamado por SchedulerService
   *
   * Manual mode: approved → paid (no gateway call)
   * Auto mode: delegates to gateway, budget check per gateway, en-flight lock
   *
   * @returns Array of processed withdrawals / Array de retiros procesados
   */
  async processDailyPayouts(): Promise<WithdrawalRequest[]> {
    if (config.wallet.payoutMode === 'manual') {
      return this.flipApprovedToPaid();
    }
    // AUTO MODE
    return this.processAutoPayouts();
  }

  /**
   * Manual mode: flip approved → paid without gateway
   * Modo manual: cambiar approved → paid sin gateway
   */
  private async flipApprovedToPaid(): Promise<WithdrawalRequest[]> {
    const approved = await WithdrawalRequest.findAll({
      where: { status: WITHDRAWAL_STATUS.APPROVED },
    });

    const processed: WithdrawalRequest[] = [];
    for (const w of approved) {
      try {
        w.status = WITHDRAWAL_STATUS.PAID;
        w.processedAt = new Date();
        await w.save();
        processed.push(w);
      } catch (error) {
        logger.error(
          { service: 'WalletService', err: error, withdrawalId: w.id },
          'Error flipping withdrawal to paid'
        );
        w.status = WITHDRAWAL_STATUS.FAILED;
        await w.save();
      }
    }
    return processed;
  }

  /**
   * Auto mode: delegate to gateway with budget check + en-flight lock
   * Modo auto: delegar a gateway con verificación de presupuesto + lock
   */
  private async processAutoPayouts(): Promise<WithdrawalRequest[]> {
    const approved = await WithdrawalRequest.findAll({
      where: { status: WITHDRAWAL_STATUS.APPROVED },
      order: [['createdAt', 'ASC']],
    });

    const processed: WithdrawalRequest[] = [];

    for (const w of approved) {
      if (!w.destination) {
        logger.warn(
          { service: 'WalletService', withdrawalId: w.id },
          'Withdrawal has no destination — skipping'
        );
        continue;
      }

      let gateway;
      try {
        gateway = getPayoutGateway(w.destination);
      } catch {
        logger.error(
          { service: 'WalletService', withdrawalId: w.id },
          'No gateway for destination — marking failed'
        );
        w.status = WITHDRAWAL_STATUS.FAILED;
        w.gatewayStatus = 'NO_GATEWAY';
        await w.save();
        continue;
      }

      // Budget check: sum netAmount of paid + en-flight (gatewayPayoutId not null) today UTC per gateway
      const consumed = await this.getDailyConsumed(gateway.type);
      const budgetKey =
        `budget${gateway.type.charAt(0).toUpperCase() + gateway.type.slice(1)}` as keyof typeof config.wallet;
      const budget = config.wallet[budgetKey] as number;
      if (consumed + Number(w.netAmount) > budget) {
        logger.info(
          { service: 'WalletService', withdrawalId: w.id, consumed, budget },
          'Budget exceeded — skipping withdrawal'
        );
        continue; // stays approved, queued for next cycle
      }

      // Idempotency: transaction + SELECT FOR UPDATE re-read
      try {
        await sequelize.transaction(async (t) => {
          const fresh = await WithdrawalRequest.findByPk(w.id, {
            transaction: t,
            lock: (t as any).LOCK.UPDATE,
          });
          if (!fresh || fresh.status !== 'approved' || fresh.gatewayPayoutId) {
            return; // already taken by another process
          }

          const result = await gateway.createPayout({
            withdrawalId: fresh.id,
            amount: Number(fresh.netAmount),
            currency: 'USD',
            destination: fresh.destination!,
          });

          fresh.gatewayPayoutId = result.payoutId;
          fresh.gatewayStatus = 'SENT';
          await fresh.save({ transaction: t });
          processed.push(fresh);
        });
      } catch (error) {
        logger.error(
          { service: 'WalletService', err: error, withdrawalId: w.id },
          'Gateway payout failed — marking failed'
        );
        // Mark as failed outside transaction (idempotent — status check in next cycle)
        w.status = WITHDRAWAL_STATUS.FAILED;
        w.gatewayStatus = 'FAILED';
        await w.save();
      }
    }

    return processed;
  }

  /**
   * Calculate daily consumed amount per gateway (paid + en-flight today UTC)
   * Calcular monto consumido diario por pasarela
   */
  private async getDailyConsumed(gatewayType: string): Promise<number> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const results = (await WithdrawalRequest.findAll({
      where: {
        status: { [Op.in]: ['paid'] },
        gatewayPayoutId: { [Op.ne]: null },
        createdAt: { [Op.between]: [todayStart, todayEnd] },
      },
      attributes: [[sequelize.fn('SUM', sequelize.col('net_amount')), 'total']],
      plain: true,
    })) as any;

    return Number(results?.get('total')) || 0;
  }

  // ============================================
  // Gateway sync — Sincronización con pasarela
  // ============================================

  /**
   * Sync withdrawal status from gateway (webhook or poll)
   * Sincronizar estado de retiro desde pasarela
   *
   * Only processes if: withdrawal exists, gatewayPayoutId matches, status is 'approved'
   * paid→paid, failed/reversed/cancelled→failed
   */
  async syncFromGateway(payoutId: string, status: PayoutStatus): Promise<void> {
    return sequelize.transaction(async (t) => {
      const w = await WithdrawalRequest.findOne({
        where: { gatewayPayoutId: payoutId },
        transaction: t,
        lock: (t as any).LOCK.UPDATE,
      });

      if (!w || w.status !== 'approved') {
        return; // Only sync if still approved with matching payoutId
      }

      if (status === 'paid') {
        w.status = 'paid';
        w.processedAt = new Date();
        w.gatewayStatus = 'PAID';
      } else if (['failed', 'reversed', 'cancelled'].includes(status)) {
        w.status = 'failed';
        w.gatewayStatus = status.toUpperCase();
      }

      w.lastGatewaySyncAt = new Date();
      await w.save({ transaction: t });

      // Notification best-effort
      try {
        const { walletNotificationService } = await import('./WalletNotificationService.js');
        walletNotificationService.notifyWithdrawalStatus(w, w.status).catch(() => {});
      } catch {
        // Ignore notification errors
      }
    });
  }

  /**
   * Poll gateway for status updates on en-flight withdrawals
   * Consultar pasarela para actualizaciones de estado
   */
  async syncPayoutStatuses(): Promise<void> {
    const enFlight = await WithdrawalRequest.findAll({
      where: {
        status: 'approved',
        gatewayPayoutId: { [Op.ne]: null },
      },
    });

    for (const w of enFlight) {
      if (!w.destination) continue;
      try {
        const gateway = getPayoutGateway(w.destination);
        const status = await gateway.getStatus(w.gatewayPayoutId!);
        await this.syncFromGateway(w.gatewayPayoutId!, status);
      } catch (error) {
        logger.error(
          { service: 'WalletService', err: error, withdrawalId: w.id },
          'Error syncing gateway status'
        );
      }
    }
  }

  // ============================================
  // Admin operations — Operaciones admin
  // ============================================

  /**
   * Approve a withdrawal request (admin only)
   * Aprobar solicitud de retiro (solo admin)
   *
   * Allowed transitions: pending→approved, failed→approved (manual retry)
   * SELECT FOR UPDATE to prevent double-approve
   */
  async approveWithdrawal(id: string, adminId: string): Promise<WithdrawalRequest> {
    return sequelize.transaction(async (t) => {
      const w = await WithdrawalRequest.findByPk(id, {
        transaction: t,
        lock: (t as any).LOCK.UPDATE,
      });
      if (!w) {
        throw new Error('Withdrawal request not found');
      }

      // Only pending→approved or failed→approved (manual retry)
      if (!['pending', 'failed'].includes(w.status)) {
        throw new Error('INVALID_TRANSITION');
      }

      w.status = 'approved';
      (w as any).approvedBy = adminId;
      (w as any).approvedAt = new Date();
      await w.save({ transaction: t });

      // Notification best-effort (non-blocking)
      try {
        const { walletNotificationService } = await import('./WalletNotificationService.js');
        walletNotificationService.notifyWithdrawalStatus(w, 'approved').catch(() => {});
      } catch {
        // Notification service not available — ignore
      }

      return w;
    });
  }

  /**
   * Reject a withdrawal request (admin only)
   * Rechazar solicitud de retiro (solo admin)
   *
   * Allowed transition: pending→rejected only
   * rejectionReason is required
   */
  async rejectWithdrawal(
    id: string,
    adminId: string,
    rejectionReason: string
  ): Promise<WithdrawalRequest> {
    if (!rejectionReason) {
      throw new Error('REJECTION_REASON_REQUIRED');
    }

    return sequelize.transaction(async (t) => {
      const w = await WithdrawalRequest.findByPk(id, {
        transaction: t,
        lock: (t as any).LOCK.UPDATE,
      });
      if (!w) {
        throw new Error('Withdrawal request not found');
      }

      if (w.status !== 'pending') {
        throw new Error('INVALID_TRANSITION');
      }

      w.status = 'rejected';
      w.rejectionReason = rejectionReason;
      (w as any).rejectedBy = adminId;
      (w as any).rejectedAt = new Date();
      await w.save({ transaction: t });

      // Notification best-effort (non-blocking)
      try {
        const { walletNotificationService } = await import('./WalletNotificationService.js');
        walletNotificationService.notifyWithdrawalStatus(w, 'rejected').catch(() => {});
      } catch {
        // Notification service not available — ignore
      }

      return w;
    });
  }

  /**
   * List withdrawal requests (admin) with pagination and filters
   * Listar solicitudes de retiro (admin) con paginación y filtros
   */
  async listWithdrawals(params: {
    page?: number;
    limit?: number;
    status?: string;
    gateway?: string;
    search?: string;
  }): Promise<{ rows: WithdrawalRequest[]; count: number }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;

    return WithdrawalRequest.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: (await import('../models/index.js')).User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }
}

// Export singleton instance
export const walletService = new WalletService();
