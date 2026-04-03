/**
 * @fileoverview Leaderboard Service - API client for leaderboard endpoints
 * @description Methods to fetch top sellers, top referrers, and current user rank
 * @module services/leaderboardService
 */

import api from './api';

/** Period options for leaderboard queries */
export type Period = 'weekly' | 'monthly' | 'all-time';

/** A single seller entry in the leaderboard */
export interface SellerEntry {
  rank: number;
  userId: string;
  name: string;
  username: string;
  profileImage?: string;
  totalSales: number;
  period: Period;
}

/** A single referrer entry in the leaderboard */
export interface ReferrerEntry {
  rank: number;
  userId: string;
  name: string;
  username: string;
  profileImage?: string;
  referralCount: number;
  period: Period;
}

/** Current user's rank information */
export interface MyRankResponse {
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

/**
 * @namespace leaderboardService
 * @description Leaderboard API methods — Bearer token handled by api.ts interceptors
 */
export const leaderboardService = {
  /**
   * Get top sellers for a given period
   * @param {Period} period - Time period filter
   * @param {number} [limit=10] - Max entries to return
   * @returns {Promise<SellerEntry[]>} Ranked list of top sellers
   */
  getTopSellers: async (period: Period, limit = 10): Promise<SellerEntry[]> => {
    const response = await api.get<{ success: boolean; data: SellerEntry[] }>(
      '/leaderboard/sellers',
      { params: { period, limit } }
    );
    return response.data.data || [];
  },

  /**
   * Get top referrers for a given period
   * @param {Period} period - Time period filter
   * @param {number} [limit=10] - Max entries to return
   * @returns {Promise<ReferrerEntry[]>} Ranked list of top referrers
   */
  getTopReferrers: async (period: Period, limit = 10): Promise<ReferrerEntry[]> => {
    const response = await api.get<{ success: boolean; data: ReferrerEntry[] }>(
      '/leaderboard/referrers',
      { params: { period, limit } }
    );
    return response.data.data || [];
  },

  /**
   * Get current user's rank in sellers and referrers leaderboards
   * @param {Period} period - Time period filter
   * @returns {Promise<MyRankResponse>} Current user rank data
   */
  getMyRank: async (period: Period): Promise<MyRankResponse> => {
    const response = await api.get<{ success: boolean; data: MyRankResponse }>('/leaderboard/me', {
      params: { period },
    });
    return response.data.data!;
  },
};

export default leaderboardService;
