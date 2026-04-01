/**
 * @fileoverview Withdrawals Controller - Withdrawal requests endpoints
 * @description Handles withdrawal requests and management
 * @module controllers/wallet/withdrawals
 */
import { Response } from 'express';
import { walletService } from '../../services/WalletService';
import type { ApiResponse } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Format withdrawal response
 */
function formatWithdrawalResponse(withdrawal: any): ApiResponse<{
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
}>['data'] {
  return {
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
  };
}

/**
 * Create a withdrawal request
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
    res.status(400).json(response);
    return;
  }

  try {
    const withdrawal = await walletService.createWithdrawal(userId, amount);

    const response: ApiResponse<ReturnType<typeof formatWithdrawalResponse>> = {
      success: true,
      data: formatWithdrawalResponse(withdrawal),
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
      res.status(404).json(response);
      return;
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
      res.status(403).json(response);
      return;
    }

    const response: ApiResponse<ReturnType<typeof formatWithdrawalResponse>> = {
      success: true,
      data: formatWithdrawalResponse(withdrawal),
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
 */
export async function cancelWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const withdrawal = await walletService.cancelWithdrawal(id, userId);

    const response: ApiResponse<ReturnType<typeof formatWithdrawalResponse>> = {
      success: true,
      data: formatWithdrawalResponse(withdrawal),
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
