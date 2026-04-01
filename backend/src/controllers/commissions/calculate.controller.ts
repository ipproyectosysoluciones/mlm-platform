/**
 * @fileoverview Commission Calculate Controller - Commission calculation and purchase endpoints
 * @description Handles commission calculation and purchase recording
 * @module controllers/commissions/calculate
 */
import { Response } from 'express';
import { CommissionService } from '../../services/CommissionService';
import { Purchase } from '../../models';
import type { ApiResponse } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

const commissionService = new CommissionService();

/**
 * Create a purchase and distribute commissions
 */
export async function createPurchase(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { amount, currency, description } = req.body;

  const purchase = await Purchase.create({
    userId,
    businessType: 'producto' as const,
    amount,
    currency: currency || 'USD',
    description,
    status: 'completed',
  });

  try {
    await commissionService.calculateCommissions(purchase.id);
  } catch (error) {
    console.error('Error calculating commissions:', error);
  }

  const response: ApiResponse<{
    id: string;
    amount: number;
    currency: string;
    description: string | null;
    status: string;
    createdAt: Date;
  }> = {
    success: true,
    data: {
      id: purchase.id,
      amount: Number(purchase.amount),
      currency: purchase.currency,
      description: purchase.description,
      status: purchase.status,
      createdAt: purchase.createdAt,
    },
  };

  res.status(201).json(response);
}
