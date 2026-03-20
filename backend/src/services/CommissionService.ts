/**
 * CommissionService - Calcula y gestiona comisiones MLM
 * CommissionService - Calculates and manages MLM commissions
 *
 * Tasas de comisión configuradas en COMMISSION_RATES.
 * Commission rates configured in COMMISSION_RATES.
 */
import { sequelize } from '../config/database';
import { User, Commission, Purchase } from '../models';
import { COMMISSION_RATES } from '../types';

export class CommissionService {
  /**
   * Calcula comisiones por una compra
   * Calculates commissions for a purchase
   *
   * Crea comisión directa para el patrocinador y hasta 4 niveles de comisiones.
   * Creates direct commission for sponsor and up to 4 levels of commissions.
   */
  async calculateCommissions(purchaseId: string): Promise<Commission[]> {
    const purchase = await Purchase.findByPk(purchaseId);
    if (!purchase) throw new Error('Purchase not found');

    const buyer = await User.findByPk(purchase.userId);
    if (!buyer || !buyer.sponsorId) return [];

    const upline = await this.getUplineWithDepth(buyer.id);
    const createdCommissions: Commission[] = [];

    const sponsor = await User.findByPk(buyer.sponsorId);
    if (sponsor) {
      const directCommission = await Commission.create({
        userId: sponsor.id,
        fromUserId: buyer.id,
        purchaseId: purchase.id,
        type: 'direct',
        amount: Number(purchase.amount) * COMMISSION_RATES.direct,
        currency: purchase.currency,
        status: 'pending',
      });
      createdCommissions.push(directCommission);
    }

    const commissionTypeMap: Record<number, keyof typeof COMMISSION_RATES> = {
      1: 'level_1',
      2: 'level_2',
      3: 'level_3',
      4: 'level_4',
    };

    for (const ancestor of upline) {
      if (ancestor.depth > 4) break;
      if (ancestor.id === buyer.sponsorId) continue;

      const type = commissionTypeMap[ancestor.depth];
      if (!type) continue;

      const rate = COMMISSION_RATES[type];
      const amount = Number(purchase.amount) * rate;

      const commission = await Commission.create({
        userId: ancestor.id,
        fromUserId: buyer.id,
        purchaseId: purchase.id,
        type,
        amount,
        currency: purchase.currency,
        status: 'pending',
      });
      createdCommissions.push(commission);
    }

    return createdCommissions;
  }

  private async getUplineWithDepth(userId: string): Promise<Array<User & { depth: number }>> {
    const [results] = await sequelize.query(
      `SELECT u.*, uc.depth
       FROM user_closure uc
       JOIN users u ON uc.ancestor_id = u.id
       WHERE uc.descendant_id = :userId
         AND uc.depth > 0
       ORDER BY uc.depth ASC`,
      {
        replacements: { userId },
        type: 'SELECT',
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
}
