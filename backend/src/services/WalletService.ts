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
import { Wallet, WalletTransaction, WithdrawalRequest } from '../models';
import { config } from '../config/env';
import { WALLET_TRANSACTION_TYPE, WITHDRAWAL_STATUS } from '../types';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

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
   * const withdrawal = await walletService.createWithdrawal(userId, 50);
   */
  async createWithdrawal(userId: string, requestedAmount: number): Promise<WithdrawalRequest> {
    // Validate minimum amount
    if (requestedAmount < config.wallet.minWithdrawal) {
      throw new Error(`Minimum withdrawal amount is ${config.wallet.minWithdrawal} USD`);
    }

    // Validate sufficient balance
    const hasSufficient = await this.validateSufficientBalance(userId, requestedAmount);
    if (!hasSufficient) {
      throw new Error('Insufficient balance');
    }

    // Calculate fee
    const feeAmount = this.calculateFee(requestedAmount);
    const netAmount = requestedAmount - feeAmount;

    // Get or create wallet
    const wallet = await this.createWallet(userId);

    // Create withdrawal request
    const withdrawal = await WithdrawalRequest.create({
      userId,
      requestedAmount,
      feeAmount,
      netAmount,
      status: WITHDRAWAL_STATUS.PENDING,
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
    if (options?.type) where.type = options.type;
    if (options?.startDate || options?.endDate) {
      where.created_at = {};
      if (options?.startDate) {
        (where.created_at as Record<string, Date>)[Op.gte] = options.startDate;
      }
      if (options?.endDate) {
        (where.created_at as Record<string, Date>)[Op.lte] = options.endDate;
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
   * Process daily payouts - called by SchedulerService
   * Procesar pagos diarios - llamado por SchedulerService
   *
   * @returns Array of processed withdrawals / Array de retiros procesados
   */
  async processDailyPayouts(): Promise<WithdrawalRequest[]> {
    const pendingWithdrawals = await WithdrawalRequest.findAll({
      where: { status: WITHDRAWAL_STATUS.APPROVED },
    });

    const processed: WithdrawalRequest[] = [];

    for (const withdrawal of pendingWithdrawals) {
      try {
        // In a real implementation, this would call a payment processor
        // For MVP, we just mark as paid
        withdrawal.status = WITHDRAWAL_STATUS.PAID;
        withdrawal.processedAt = new Date();
        await withdrawal.save();
        processed.push(withdrawal);
      } catch (error) {
        logger.error(
          { service: 'WalletService', err: error, withdrawalId: withdrawal.id },
          'Error processing withdrawal'
        );
        withdrawal.status = WITHDRAWAL_STATUS.FAILED;
        await withdrawal.save();
      }
    }

    return processed;
  }
}

// Export singleton instance
export const walletService = new WalletService();
