import axios from 'axios';

const api = axios.create({
  baseURL: process.env.MLM_BACKEND_URL ?? 'http://backend:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'x-bot-secret': process.env.BOT_SECRET ?? '',
  },
  timeout: 10000,
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

export interface WalletBalance {
  balance: number;
  pendingWithdrawals: number;
  totalEarned: number;
  currency: string;
}

export interface NetworkSummary {
  totalReferrals: number;
  activeReferrals: number;
  leftLeg: number;
  rightLeg: number;
  level: number;
}

export interface Commission {
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

// ── Service methods ───────────────────────────────────────────────────────────

export const mlmApi = {
  /**
   * Get user profile by phone number
   */
  async getUserByPhone(phone: string): Promise<UserProfile | null> {
    try {
      const { data } = await api.get(`/bot/user-by-phone/${phone}`);
      return data.user ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Get wallet balance for a user
   */
  async getWalletBalance(userId: string): Promise<WalletBalance | null> {
    try {
      const { data } = await api.get(`/bot/wallet/${userId}`);
      return data.wallet ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Get network summary for a user
   */
  async getNetworkSummary(userId: string): Promise<NetworkSummary | null> {
    try {
      const { data } = await api.get(`/bot/network/${userId}`);
      return data.network ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Get recent commissions for a user (last 5)
   */
  async getRecentCommissions(userId: string): Promise<Commission[]> {
    try {
      const { data } = await api.get(`/bot/commissions/${userId}?limit=5`);
      return data.commissions ?? [];
    } catch {
      return [];
    }
  },
};
