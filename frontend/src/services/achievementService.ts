/**
 * @fileoverview Achievement Service - API client for achievement endpoints
 * @description Methods to fetch all achievements, user's achievements, and summary
 * @module services/achievementService
 */

import api from './api';

/** Achievement tier levels */
export type AchievementTier = 'bronze' | 'silver' | 'gold';

/** Achievement status */
export type AchievementStatus = 'active' | 'coming_soon';

/** Condition types for achievements */
export type AchievementConditionType =
  | 'count_referrals'
  | 'sales_amount'
  | 'sales_count'
  | 'login_streak'
  | 'binary_balance';

/** Base achievement shape */
export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  tier: AchievementTier;
  status: AchievementStatus;
  conditionType: AchievementConditionType;
  conditionValue: number;
}

/** Achievement with user progress and unlock info */
export interface AchievementWithProgress extends Achievement {
  unlockedAt: string | null;
  progress: number; // 0-100 percentage
  currentValue: number; // e.g. 3 sales
  targetValue: number; // e.g. 10 sales
}

/** Summary of user's achievement progress */
export interface AchievementSummary {
  unlocked: number;
  total: number;
  totalPoints: number;
  recent: AchievementWithProgress[];
}

/**
 * @namespace achievementService
 * @description Achievement API methods — Bearer token handled by api.ts interceptors
 */
export const achievementService = {
  /**
   * Get all achievements (public list with current user's progress)
   * @returns {Promise<AchievementWithProgress[]>} All achievements with user progress
   */
  getAllAchievements: async (): Promise<AchievementWithProgress[]> => {
    const response = await api.get<{ success: boolean; data: AchievementWithProgress[] }>(
      '/achievements'
    );
    return response.data.data || [];
  },

  /**
   * Get only the current user's unlocked achievements
   * @returns {Promise<AchievementWithProgress[]>} User's unlocked achievements
   */
  getMyAchievements: async (): Promise<AchievementWithProgress[]> => {
    const response = await api.get<{ success: boolean; data: AchievementWithProgress[] }>(
      '/achievements/me'
    );
    return response.data.data || [];
  },

  /**
   * Get current user's achievement summary stats
   * @returns {Promise<AchievementSummary>} Summary with counts and recent unlocks
   */
  getMySummary: async (): Promise<AchievementSummary> => {
    const response = await api.get<{ success: boolean; data: AchievementSummary }>(
      '/achievements/me/summary'
    );
    return response.data.data!;
  },
};

export default achievementService;
