/**
 * @fileoverview WalletController - Endpoints for digital wallet operations
 * @description Handles wallet balance, transactions, and withdrawal requests
 *              Gestiona operaciones de wallet: balance, transacciones y solicitudes de retiro
 * @module controllers/WalletController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { walletService } from '../services/WalletService';
import type { ApiResponse } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Get wallet balance for authenticated user
 * Obtener balance de wallet para usuario autenticado
 *
 * @param req - Authenticated request
 * @param res - Response with wallet balance
 */
export async function getBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    const wallet = await walletService.getWallet(userId);

    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await walletService.createWallet(userId);

      const response: ApiResponse<{
        id: string;
        userId: string;
        balance: number;
        currency: string;
        lastUpdated: string;
      }> = {
        success: true,
        data: {
          id: newWallet.id,
          userId: newWallet.userId,
          balance: Number(newWallet.balance),
          currency: newWallet.currency,
          lastUpdated: newWallet.updatedAt.toISOString(),
        },
      };
      return res.json(response);
    }

    const response: ApiResponse<{
      id: string;
      userId: string;
      balance: number;
      currency: string;
      lastUpdated: string;
    }> = {
      success: true,
      data: {
        id: wallet.id,
        userId: wallet.userId,
        balance: Number(wallet.balance),
        currency: wallet.currency,
        lastUpdated: wallet.updatedAt.toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'WALLET_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Get wallet transactions for authenticated user
 * Obtener transacciones de wallet para usuario autenticado
 *
 * @param req - Query params: page, limit, type, startDate, endDate
 * @param res - Response with paginated transactions
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

/**
 * Create a withdrawal request
 * Crear solicitud de retiro
 *
 * @param req - Body: amount
 * @param res - Response with withdrawal request
 */
export async function createWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { amount } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INVALID_AMOUNT',
        message: 'Please provide a valid amount',
      },
    };
    return res.status(400).json(response);
  }

  try {
    const withdrawal = await walletService.createWithdrawal(userId, amount);

    const response: ApiResponse<{
      id: string;
      userId: string;
      requestedAmount: number;
      feeAmount: number;
      netAmount: number;
      status: string;
      rejectionReason: string | null;
      approvalComment: string | null;
      processedAt: Date | null;
      createdAt: Date;
    }> = {
      success: true,
      data: {
        id: withdrawal.id,
        userId: withdrawal.userId,
        requestedAmount: Number(withdrawal.requestedAmount),
        feeAmount: Number(withdrawal.feeAmount),
        netAmount: Number(withdrawal.netAmount),
        status: withdrawal.status,
        rejectionReason: withdrawal.rejectionReason,
        approvalComment: withdrawal.approvalComment,
        processedAt: withdrawal.processedAt,
        createdAt: withdrawal.createdAt,
      },
      message: `Withdrawal request created. Fee: $${withdrawal.feeAmount} USD`,
    };

    res.status(201).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'WITHDRAWAL_ERROR',
        message: errorMessage,
      },
    };
    res.status(400).json(response);
  }
}

/**
 * Get withdrawal request status
 * Obtener estado de solicitud de retiro
 *
 * @param req - Params: id (withdrawal ID)
 * @param res - Response with withdrawal request
 */
export async function getWithdrawalStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const withdrawal = await walletService.getWithdrawalRequest(id);

    if (!withdrawal) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Withdrawal request not found',
        },
      };
      return res.status(404).json(response);
    }

    // Check ownership
    if (withdrawal.userId !== userId) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not own this withdrawal request',
        },
      };
      return res.status(403).json(response);
    }

    const response: ApiResponse<{
      id: string;
      userId: string;
      requestedAmount: number;
      feeAmount: number;
      netAmount: number;
      status: string;
      rejectionReason: string | null;
      approvalComment: string | null;
      processedAt: Date | null;
      createdAt: Date;
    }> = {
      success: true,
      data: {
        id: withdrawal.id,
        userId: withdrawal.userId,
        requestedAmount: Number(withdrawal.requestedAmount),
        feeAmount: Number(withdrawal.feeAmount),
        netAmount: Number(withdrawal.netAmount),
        status: withdrawal.status,
        rejectionReason: withdrawal.rejectionReason,
        approvalComment: withdrawal.approvalComment,
        processedAt: withdrawal.processedAt,
        createdAt: withdrawal.createdAt,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'WITHDRAWAL_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Cancel a withdrawal request
 * Cancelar solicitud de retiro
 *
 * @param req - Params: id (withdrawal ID)
 * @param res - Response with updated withdrawal
 */
export async function cancelWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const withdrawal = await walletService.cancelWithdrawal(id, userId);

    const response: ApiResponse<{
      id: string;
      userId: string;
      requestedAmount: number;
      feeAmount: number;
      netAmount: number;
      status: string;
      rejectionReason: string | null;
      approvalComment: string | null;
      processedAt: Date | null;
      createdAt: Date;
    }> = {
      success: true,
      data: {
        id: withdrawal.id,
        userId: withdrawal.userId,
        requestedAmount: Number(withdrawal.requestedAmount),
        feeAmount: Number(withdrawal.feeAmount),
        netAmount: Number(withdrawal.netAmount),
        status: withdrawal.status,
        rejectionReason: withdrawal.rejectionReason,
        approvalComment: withdrawal.approvalComment,
        processedAt: withdrawal.processedAt,
        createdAt: withdrawal.createdAt,
      },
      message: 'Withdrawal request cancelled successfully',
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: errorMessage,
      },
    };
    res.status(400).json(response);
  }
}
