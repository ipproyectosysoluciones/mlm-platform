/**
 * @fileoverview CommissionService - MLM commission calculation and management
 * @description Calculates and manages commissions for unilevel MLM structure including
 *              direct commissions and up to N config-driven levels of upline commissions.
 *              Calcula y gestiona comisiones para estructura MLM unilevel incluyendo
 *              comisiones directas y hasta N niveles configurables de comisiones de upline.
 * @module services/CommissionService
 * @author MLM Development Team
 *
 * @example
 * // English: Calculate commissions for a purchase
 * const commissions = await commissionService.calculateCommissions(purchaseId);
 *
 * // English: Get user's commission history
 * const { rows, count } = await commissionService.getUserCommissions(userId, { page: 1, limit: 20 });
 *
 * // Español: Calcular comisiones por una compra
 * const commissions = await commissionService.calculateCommissions(purchaseId);
 *
 * // Español: Obtener historial de comisiones del usuario
 * const { rows, count } = await commissionService.getUserCommissions(userId, { page: 1, limit: 20 });
 */
import { sequelize } from '../config/database';
import { User, Commission, Purchase, CommissionConfig } from '../models';
import { COMMISSION_RATES, generateLevelKey } from '../types';
import type { BusinessType } from '../types/index.js';
import { walletService } from './WalletService';
import { emailService } from './EmailService';
import { logger } from '../utils/logger';
import { config } from '../config/env';

export class CommissionService {
  /**
   * Get commission rate for a business type and level
   * Falls back to static rates if no config exists
   */
  private async getCommissionRate(businessType: string, level: string): Promise<number> {
    const configRecord = await CommissionConfig.findOne({
      where: {
        businessType: businessType as BusinessType,
        level,
        isActive: true,
      },
    });

    if (configRecord) {
      return Number(configRecord.percentage);
    }

    // Fallback to static rates if no config found
    return COMMISSION_RATES[level] || 0;
  }

  /**
   * Get max configured depth for a business type.
   * Returns the count of active CommissionConfig rows (excluding 'direct').
   * Falls back to the number of level_N keys in COMMISSION_RATES.
   */
  private async getMaxConfiguredDepth(businessType: string): Promise<number> {
    try {
      const count = await CommissionConfig.count({
        where: {
          businessType: businessType as BusinessType,
          isActive: true,
        },
      });
      // count includes 'direct', so max depth = count - 1 (levels 1..N)
      // But if no configs exist, fallback to static rates
      if (count > 0) {
        return count - 1; // e.g. 10 configs (direct + 9 levels) → max depth 9
      }
    } catch {
      // CommissionConfig.count not available in test mocks — fall through
    }

    // Fallback: count level_N keys in COMMISSION_RATES
    const levelKeys = Object.keys(COMMISSION_RATES).filter((k) => k.startsWith('level_'));
    return levelKeys.length; // 9 (level_1 through level_9)
  }

  /**
   * Calcula comisiones por una compra — modelo unilevel N niveles
   * Calculates commissions for a purchase — N-level unilevel model
   *
   * Crea comisión directa para el patrocinador y hasta N niveles de comisiones.
   * Creates direct commission for sponsor and up to N levels of commissions.
   */
  async calculateCommissions(purchaseId: string): Promise<Commission[]> {
    const purchase = await Purchase.findByPk(purchaseId);
    if (!purchase) throw new Error('Purchase not found');

    const buyer = await User.findByPk(purchase.userId);
    if (!buyer || !buyer.sponsorId) return [];

    const upline = await this.getUplineWithDepth(buyer.id);
    const createdCommissions: Commission[] = [];

    // Get business type from purchase (defaults to 'producto')
    const businessType = purchase.businessType || 'producto';

    // Get max configured depth (config-driven, not hardcoded)
    const maxDepth = await this.getMaxConfiguredDepth(businessType);

    // Calculate direct commission for sponsor
    const sponsor = await User.findByPk(buyer.sponsorId);
    if (sponsor) {
      const rate = await this.getCommissionRate(businessType, 'direct');
      const directCommission = await Commission.create({
        userId: sponsor.id,
        fromUserId: buyer.id,
        purchaseId: purchase.id,
        type: 'direct',
        model: 'unilevel',
        amount: Number(purchase.amount) * rate,
        currency: purchase.currency,
        status: 'pending',
      });
      createdCommissions.push(directCommission);

      // Send commission email notification / Enviar notificación de comisión por email
      const firstName = sponsor.email.split('@')[0];
      emailService
        .sendCommission({
          email: sponsor.email,
          firstName,
          amount: Number(directCommission.amount),
          currency: purchase.currency,
        })
        .catch((err) =>
          logger.error({ service: 'CommissionService', err }, 'Commission email failed')
        );
    }

    // Upline loop: sponsor (depth=1) already got 'direct' above, so we skip it.
    // Use a level counter starting at 1 for the first non-sponsor ancestor → level_1, level_2, ...
    // Break when counter exceeds maxDepth (config count - 1 = number of level_N configs).
    // Loop upline: el sponsor (depth=1) ya recibió 'direct' arriba, se skipea.
    // Usa un contador de nivel empezando en 1 para el primer ancestro no-sponsor → level_1, level_2, ...
    // Corta cuando el contador excede maxDepth (configs - 1 = cantidad de configs level_N).
    let levelCounter = 1;
    for (const ancestor of upline) {
      if (levelCounter > maxDepth) break;
      if (ancestor.id === buyer.sponsorId) continue;

      const type = generateLevelKey(levelCounter);
      levelCounter++;

      const rate = await this.getCommissionRate(businessType, type);
      const amount = Number(purchase.amount) * rate;

      const commission = await Commission.create({
        userId: ancestor.id,
        fromUserId: buyer.id,
        purchaseId: purchase.id,
        type,
        model: 'unilevel',
        amount,
        currency: purchase.currency,
        status: 'pending',
      });
      createdCommissions.push(commission);
    }

    return createdCommissions;
  }

  private async getUplineWithDepth(userId: string): Promise<Array<User & { depth: number }>> {
    const results = await sequelize.query(
      `SELECT u.*, uc.depth
       FROM user_closure uc
       JOIN users u ON uc.ancestor_id = u.id
       WHERE uc.descendant_id = :userId
         AND uc.depth > 0
       ORDER BY uc.depth ASC`,
      {
        replacements: { userId },
        type: 'SELECT' as const,
      }
    );

    return results as Array<User & { depth: number }>;
  }

  /**
   * Obtiene comisiones de un usuario con paginación y filtros
   * Gets user commissions with pagination and filters
   */
  async getUserCommissions(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
    }
  ): Promise<{ rows: Commission[]; count: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (options?.type) where.type = options.type;
    if (options?.status) where.status = options.status;

    return Commission.findAndCountAll({
      where,
      include: [{ model: User, as: 'fromUser', attributes: ['id', 'email', 'referralCode'] }],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Obtiene estadísticas de comisiones: total ganado, pendiente y por tipo
   * Gets commission stats: total earned, pending, and by type
   */
  async getCommissionStats(userId: string): Promise<{
    totalEarned: number;
    pending: number;
    byType: Record<string, number>;
  }> {
    const commissions = await Commission.findAll({
      where: { userId },
    });

    let totalEarned = 0;
    let pending = 0;
    const byType: Record<string, number> = {};

    for (const commission of commissions) {
      if (commission.status === 'paid' || commission.status === 'approved') {
        totalEarned += Number(commission.amount);
      }
      if (commission.status === 'pending') {
        pending += Number(commission.amount);
      }

      byType[commission.type] = (byType[commission.type] || 0) + Number(commission.amount);
    }

    return { totalEarned, pending, byType };
  }

  /**
   * Approve a commission and credit it to the user's wallet
   * Aprobar una comisión y acreditarla a la wallet del usuario
   *
   * @param commissionId - Commission ID to approve / ID de comisión a aprobar
   * @returns Updated commission / Comisión actualizada
   *
   * @example
   * // English: Approve and credit a commission
   * const commission = await commissionService.approveCommission(commissionId);
   *
   * // Español: Aprobar y acreditar una comisión
   * const commission = await commissionService.approveCommission(commissionId);
   */
  async approveCommission(commissionId: string): Promise<Commission> {
    const commission = await Commission.findByPk(commissionId);
    if (!commission) {
      throw new Error('Commission not found');
    }

    if (commission.status !== 'pending') {
      throw new Error('Only pending commissions can be approved');
    }

    // Update commission status
    commission.status = 'approved';
    await commission.save();

    // Credit to wallet only if crypto wallet feature is enabled
    // Acreditar a wallet solo si la funcionalidad de crypto wallet está habilitada
    if (config.features.cryptoWallet) {
      await walletService.creditCommission(
        commission.userId,
        Number(commission.amount),
        commission.currency,
        commission.id,
        `${commission.type} commission from referral`
      );
    }

    return commission;
  }

  /**
   * Approve multiple commissions and credit to wallets
   * Aprobar múltiples comisiones y acreditar a wallets
   *
   * @param commissionIds - Array of commission IDs / Array de IDs de comisiones
   * @returns Array of approved commissions / Array de comisiones aprobadas
   */
  async bulkApproveCommissions(commissionIds: string[]): Promise<Commission[]> {
    const approved: Commission[] = [];

    for (const id of commissionIds) {
      try {
        const commission = await this.approveCommission(id);
        approved.push(commission);
      } catch (error) {
        logger.error(
          { service: 'CommissionService', err: error, commissionId: id },
          'Error approving commission'
        );
      }
    }

    return approved;
  }

  /**
   * Calculate vendor commission (3-way split)
   * Calcular comisión del vendedor (división 3 vías)
   *
   * For vendor products:
   * - vendorAmount = price × vendor.commissionRate (e.g., $100 × 0.70 = $70.00)
   * - platformFee = price - vendorAmount ($100 - $70 = $30.00)
   * - mlmCommissions = platformFee × mlmRate[level] (from MLM tree)
   * - platformNet = platformFee - sum(mlmCommissions) ($30 - upline commissions)
   *
   * For platform products (vendorId === null):
   * - Works as before — full amount through MLM rates, no vendor split
   *
   * @param price - Product price
   * @param vendorId - Vendor UUID (null for platform products)
   * @param buyerId - Buyer UUID (to find upline)
   * @param businessType - Business type for commission config
   * @returns Commission split result
   */
  async calculateVendorCommission(
    price: number,
    vendorId: string | null,
    buyerId: string,
    businessType: string = 'producto'
  ): Promise<{
    vendorAmount: number;
    platformFee: number;
    mlmCommissions: Array<{ userId: string; level: string; amount: number }>;
    platformNet: number;
  }> {
    // Platform product (no vendor split)
    if (!vendorId) {
      // Use existing commission logic - full amount goes through MLM
      const upline = await this.getUplineWithDepth(buyerId);
      const mlmCommissions: Array<{ userId: string; level: string; amount: number }> = [];

      const maxDepth = await this.getMaxConfiguredDepth(businessType);

      for (const ancestor of upline) {
        if (ancestor.depth > maxDepth) break;

        const type = generateLevelKey(ancestor.depth);

        const rate = await this.getCommissionRate(businessType, type);
        const amount = this.roundDecimal(price * rate, 2);
        mlmCommissions.push({ userId: ancestor.id, level: type, amount });
      }

      const totalMlm = mlmCommissions.reduce((sum, c) => sum + c.amount, 0);

      return {
        vendorAmount: 0,
        platformFee: price,
        mlmCommissions,
        platformNet: this.roundDecimal(price - totalMlm, 2),
      };
    }

    // Vendor product - calculate 3-way split
    const { Vendor } = await import('../models');
    const vendor = await Vendor.findByPk(vendorId);

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    if (vendor.status !== 'approved') {
      throw new Error('Vendor is not approved');
    }

    const commissionRate = Number(vendor.commissionRate);

    // Calculate vendor amount (e.g., $100 × 0.70 = $70.00)
    const vendorAmount = this.roundDecimal(price * commissionRate, 2);

    // Platform fee is what remains after vendor cut
    const platformFee = this.roundDecimal(price - vendorAmount, 2);

    // Calculate MLM commissions from platform fee
    const buyer = await User.findByPk(buyerId);
    if (!buyer || !buyer.sponsorId) {
      // No upline - all platform fee is platform net
      return {
        vendorAmount,
        platformFee,
        mlmCommissions: [],
        platformNet: platformFee,
      };
    }

    const upline = await this.getUplineWithDepth(buyerId);
    const mlmCommissions: Array<{ userId: string; level: string; amount: number }> = [];

    const maxDepth = await this.getMaxConfiguredDepth(businessType);

    let levelCounter = 1;
    for (const ancestor of upline) {
      if (levelCounter > maxDepth) break;
      if (ancestor.id === buyer.sponsorId) continue; // Skip direct sponsor (handled separately)

      // Sponsor skipped → use counter so first non-sponsor ancestor gets level_1
      const type = generateLevelKey(levelCounter);
      levelCounter++;

      const rate = await this.getCommissionRate(businessType, type);
      // MLM commission is calculated from platform fee, not full price
      const amount = this.roundDecimal(platformFee * rate, 2);
      mlmCommissions.push({ userId: ancestor.id, level: type, amount });
    }

    const totalMlm = mlmCommissions.reduce((sum, c) => sum + c.amount, 0);
    const platformNet = this.roundDecimal(platformFee - totalMlm, 2);

    // Verify: vendorAmount + platformNet + sum(mlm) === price
    const verification = this.roundDecimal(vendorAmount + platformNet + totalMlm, 2);
    if (verification !== this.roundDecimal(price, 2)) {
      logger.warn(
        { service: 'CommissionService', verification, expected: this.roundDecimal(price, 2) },
        'Commission math verification failed'
      );
    }

    return {
      vendorAmount,
      platformFee,
      mlmCommissions,
      platformNet,
    };
  }

  /**
   * Round decimal using HALF_UP mode
   * Redondear decimal usando modo HALF_UP
   */
  private roundDecimal(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  /**
   * Create MLM commissions from vendor commission split
   * Crear comisiones MLM desde la división de comisión del vendedor
   *
   * @param mlmCommissions - Array of MLM commission objects
   * @param purchaseId - Purchase ID
   * @param buyerId - Buyer UUID
   * @param totalAmount - Total order amount for currency reference
   */
  async createMlmCommissionsFromSplit(
    mlmCommissions: Array<{ userId: string; level: string; amount: number }>,
    purchaseId: string,
    buyerId: string,
    _totalAmount: number
  ): Promise<Commission[]> {
    const createdCommissions: Commission[] = [];
    const buyer = await User.findByPk(buyerId);

    for (const commission of mlmCommissions) {
      const comm = await Commission.create({
        userId: commission.userId,
        fromUserId: buyerId,
        purchaseId,
        type: commission.level,
        model: 'unilevel',
        amount: commission.amount,
        currency: buyer?.currency || 'USD',
        status: 'pending',
      });
      createdCommissions.push(comm);
    }

    return createdCommissions;
  }
}
