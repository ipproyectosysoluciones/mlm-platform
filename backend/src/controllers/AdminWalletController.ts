/**
 * @fileoverview AdminWalletController — Admin endpoints for withdrawal management
 * @description Handles approve, reject, and list operations for withdrawal requests
 *
 * @module controllers/AdminWalletController
 */

import { Response } from 'express';
import { walletService } from '../services/WalletService.js';
import type { ApiResponse } from '../types/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * List withdrawal requests with pagination and filters
 */
export async function listWithdrawals(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as string | undefined;
    const gateway = req.query.gateway as string | undefined;
    const search = req.query.search as string | undefined;

    const { rows, count } = await walletService.listWithdrawals({
      page,
      limit,
      status,
      gateway,
      search,
    });

    const data = rows.map((w) => ({
      id: w.id,
      userId: w.userId,
      requestedAmount: Number(w.requestedAmount),
      feeAmount: Number(w.feeAmount),
      netAmount: Number(w.netAmount),
      status: w.status,
      destination: w.destination,
      rejectionReason: w.rejectionReason,
      approvalComment: w.approvalComment,
      processedAt: w.processedAt,
      createdAt: w.createdAt,
      user: (w as any).user,
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
    res.status(500).json({
      success: false,
      error: { code: 'LIST_WITHDRAWALS_ERROR', message: errorMessage },
    });
  }
}

/**
 * Approve a withdrawal request
 */
export async function approveWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;
    const { approvalComment } = req.body;

    const withdrawal = await walletService.approveWithdrawal(id, adminId);

    const response: ApiResponse<{
      id: string;
      status: string;
      approvedBy: string;
      approvedAt: Date;
    }> = {
      success: true,
      data: {
        id: withdrawal.id,
        status: withdrawal.status,
        approvedBy: adminId,
        approvedAt: (withdrawal as any).approvedAt,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'INVALID_TRANSITION') {
      res.status(409).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Withdrawal cannot be approved in current status',
        },
      });
      return;
    }
    if (errorMessage === 'Withdrawal request not found') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Withdrawal request not found' },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'APPROVE_ERROR', message: errorMessage },
    });
  }
}

/**
 * Reject a withdrawal request
 */
export async function rejectWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      res.status(400).json({
        success: false,
        error: { code: 'REJECTION_REASON_REQUIRED', message: 'Rejection reason is required' },
      });
      return;
    }

    const withdrawal = await walletService.rejectWithdrawal(id, adminId, rejectionReason);

    const response: ApiResponse<{
      id: string;
      status: string;
      rejectedBy: string;
      rejectionReason: string;
    }> = {
      success: true,
      data: {
        id: withdrawal.id,
        status: withdrawal.status,
        rejectedBy: adminId,
        rejectionReason: withdrawal.rejectionReason || rejectionReason,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage === 'INVALID_TRANSITION') {
      res.status(409).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: 'Withdrawal cannot be rejected in current status',
        },
      });
      return;
    }
    if (errorMessage === 'Withdrawal request not found') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Withdrawal request not found' },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'REJECT_ERROR', message: errorMessage },
    });
  }
}
