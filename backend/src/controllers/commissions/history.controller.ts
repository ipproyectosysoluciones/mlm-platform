/**
 * @fileoverview Commission History Controller - Commission retrieval endpoints
 * @description Handles commission history and listing
 * @module controllers/commissions/history
 */
import { Response } from 'express';
import { CommissionService } from '../../services/CommissionService';
import type { ApiResponse } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

const commissionService = new CommissionService();

interface CommissionResponse {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  fromUser: { id: string; email: string } | null;
  createdAt: Date;
}

/**
 * Get user commissions with pagination
 */
export async function getCommissions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const type = req.query.type as string | undefined;
  const status = req.query.status as string | undefined;

  const { rows, count } = await commissionService.getUserCommissions(userId, {
    page,
    limit,
    type,
    status,
  });

  const data: CommissionResponse[] = rows.map((c) => ({
    id: c.id,
    type: c.type,
    amount: Number(c.amount),
    currency: c.currency,
    status: c.status,
    fromUser: c.fromUser
      ? {
          id: (c.fromUser as { id: string }).id,
          email: (c.fromUser as { email: string }).email,
        }
      : null,
    createdAt: c.createdAt,
  }));

  const response: ApiResponse<CommissionResponse[]> = {
    success: true,
    data,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };

  res.json(response);
}

/**
 * Get commission statistics
 */
export async function getCommissionStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  const stats = await commissionService.getCommissionStats(userId);

  const response: ApiResponse<{
    totalEarned: number;
    pending: number;
    byType: Record<string, number>;
  }> = {
    success: true,
    data: {
      totalEarned: stats.totalEarned,
      pending: stats.pending,
      byType: stats.byType,
    },
  };

  res.json(response);
}
