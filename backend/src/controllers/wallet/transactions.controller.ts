/**
 * @fileoverview Transactions Controller - Transaction history endpoints
 * @description Handles wallet transaction history
 * @module controllers/wallet/transactions
 */
import { Response } from 'express';
import { walletService } from '../../services/WalletService';
import type { ApiResponse } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Get wallet transactions for authenticated user
 */
export async function getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const type = req.query.type as string | undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  try {
    const { rows, count } = await walletService.getTransactions(userId, {
      page,
      limit,
      type,
      startDate,
      endDate,
    });

    const data = rows.map((t) => ({
      id: t.id,
      walletId: t.walletId,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency,
      referenceId: t.referenceId,
      description: t.description,
      exchangeRate: t.exchangeRate,
      createdAt: t.createdAt,
    }));

    const response: ApiResponse<typeof data> & {
      pagination?: { total: number; page: number; limit: number; totalPages: number };
    } = {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'TRANSACTIONS_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}
