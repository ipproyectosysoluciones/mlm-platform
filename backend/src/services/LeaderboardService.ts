/**
 * @fileoverview LeaderboardService - Leaderboard rankings for sellers and referrers
 * @description Computes top sellers (by completed order revenue) and top referrers
 *             (by direct referral count) with in-memory caching and TTL invalidation.
 *             Calcula los mejores vendedores y referidores con caché en memoria.
 * @module services/LeaderboardService
 * @author MLM Development Team
 */
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';

// ============================================
// TYPES
// ============================================

export type Period = 'weekly' | 'monthly' | 'all-time';

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface SellerEntry {
  rank: number;
  userId: string;
  name: string;
  username: string;
  profileImage: string | null;
  totalSales: number;
  period: Period;
}

export interface ReferrerEntry {
  rank: number;
  userId: string;
  name: string;
  username: string;
  profileImage: string | null;
  referralCount: number;
  period: Period;
}

export interface UserRankInfo {
  sellers: {
    rank: number | null;
    totalSales: number;
  };
  referrers: {
    rank: number | null;
    referralCount: number;
  };
  period: Period;
}

// ============================================
// SERVICE
// ============================================

export class LeaderboardService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  readonly TTL = 300_000; // 5 minutes in ms

  // ------------------------------------------
  // Private helpers
  // ------------------------------------------

  /**
   * Get the period start date for SQL filtering.
   * - weekly  → rolling 7 days (NOW() - INTERVAL 7 DAY)
   * - monthly → first day of current month at 00:00:00
   * - all-time → null (no filter)
   */
  private getPeriodFilter(period: Period): Date | null {
    const now = new Date();
    if (period === 'weekly') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (period === 'monthly') {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return null; // all-time
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.TTL,
    });
  }

  /**
   * Invalidate cache entries.
   * @param category - 'sellers' | 'referrers' — if omitted, clears all leaderboard keys.
   */
  invalidateCache(category?: 'sellers' | 'referrers'): void {
    if (!category) {
      // Clear all leaderboard keys
      for (const key of this.cache.keys()) {
        if (key.startsWith('leaderboard:')) {
          this.cache.delete(key);
        }
      }
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(`leaderboard:${category}:`)) {
        this.cache.delete(key);
      }
    }
  }

  // ------------------------------------------
  // Public API
  // ------------------------------------------

  /**
   * Get top sellers by total completed order amount.
   * Only counts orders with status='completed' and payment_method IN
   * ('manual', 'simulated', 'paypal', 'mercadopago').
   *
   * @param period - 'weekly' | 'monthly' | 'all-time'
   * @param limit  - Max entries to return (default: 10)
   */
  async getTopSellers(period: Period, limit = 10): Promise<SellerEntry[]> {
    const cacheKey = `leaderboard:sellers:${period}`;
    const cached = this.getCached<SellerEntry[]>(cacheKey);
    if (cached) return cached;

    const startDate = this.getPeriodFilter(period);

    const dateClause = startDate ? `AND o.created_at >= :startDate` : '';

    const sql = `
      SELECT
        u.id          AS userId,
        u.email       AS name,
        u.referral_code AS username,
        NULL          AS profileImage,
        SUM(o.total_amount) AS totalSales
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      WHERE o.status = 'completed'
        AND o.payment_method IN ('manual', 'simulated', 'paypal', 'mercadopago')
        ${dateClause}
      GROUP BY u.id, u.email, u.referral_code
      ORDER BY totalSales DESC
      LIMIT :limit
    `;

    const rows = await sequelize.query<{
      userId: string;
      name: string;
      username: string;
      profileImage: string | null;
      totalSales: string | number;
    }>(sql, {
      replacements: {
        ...(startDate ? { startDate: startDate.toISOString() } : {}),
        limit,
      },
      type: QueryTypes.SELECT,
    });

    const result: SellerEntry[] = rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      name: row.name,
      username: row.username,
      profileImage: row.profileImage,
      totalSales: Number(row.totalSales),
      period,
    }));

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get top referrers by direct referral count (users WHERE sponsor_id = userId).
   *
   * @param period - 'weekly' | 'monthly' | 'all-time'
   * @param limit  - Max entries to return (default: 10)
   */
  async getTopReferrers(period: Period, limit = 10): Promise<ReferrerEntry[]> {
    const cacheKey = `leaderboard:referrers:${period}`;
    const cached = this.getCached<ReferrerEntry[]>(cacheKey);
    if (cached) return cached;

    const startDate = this.getPeriodFilter(period);

    const dateClause = startDate ? `AND referred.created_at >= :startDate` : '';

    const sql = `
      SELECT
        sponsor.id           AS userId,
        sponsor.email        AS name,
        sponsor.referral_code AS username,
        NULL                 AS profileImage,
        COUNT(referred.id)   AS referralCount
      FROM users sponsor
      INNER JOIN users referred ON referred.sponsor_id = sponsor.id
      WHERE 1=1
        ${dateClause}
      GROUP BY sponsor.id, sponsor.email, sponsor.referral_code
      ORDER BY referralCount DESC
      LIMIT :limit
    `;

    const rows = await sequelize.query<{
      userId: string;
      name: string;
      username: string;
      profileImage: string | null;
      referralCount: string | number;
    }>(sql, {
      replacements: {
        ...(startDate ? { startDate: startDate.toISOString() } : {}),
        limit,
      },
      type: QueryTypes.SELECT,
    });

    const result: ReferrerEntry[] = rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      name: row.name,
      username: row.username,
      profileImage: row.profileImage,
      referralCount: Number(row.referralCount),
      period,
    }));

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get the rank of a specific user in both sellers and referrers leaderboards.
   * Fetches top 100 for ranking purposes; if user is not in top 100, rank = null.
   *
   * @param userId   - UUID of the user
   * @param category - 'sellers' | 'referrers' (used as hint, returns both)
   * @param period   - Period string
   */
  async getMyRank(
    userId: string,
    category: 'sellers' | 'referrers',
    period: Period
  ): Promise<UserRankInfo> {
    const [sellers, referrers] = await Promise.all([
      this.getTopSellers(period, 100),
      this.getTopReferrers(period, 100),
    ]);

    const sellerEntry = sellers.find((e) => e.userId === userId);
    const referrerEntry = referrers.find((e) => e.userId === userId);

    return {
      sellers: {
        rank: sellerEntry ? sellerEntry.rank : null,
        totalSales: sellerEntry ? sellerEntry.totalSales : 0,
      },
      referrers: {
        rank: referrerEntry ? referrerEntry.rank : null,
        referralCount: referrerEntry ? referrerEntry.referralCount : 0,
      },
      period,
    };
  }
}

// Singleton export
export const leaderboardService = new LeaderboardService();
