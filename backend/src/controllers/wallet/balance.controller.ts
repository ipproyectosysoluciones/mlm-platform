/**
 * @fileoverview Wallet Balance Controller - Balance and wallet management endpoints
 * @description Handles wallet balance operations
 * @module controllers/wallet/balance
 */
import { Response } from 'express';
import { walletService } from '../../services/WalletService';
import { getCryptoPrices as fetchCryptoPrices } from '../../services/CryptoPriceService';
import type { ApiResponse } from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

/**
 * Get wallet balance for authenticated user
 */
export async function getBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
  const authUserId = req.user!.id;
  const paramUserId = req.params.userId;

  // If userId is provided in the URL, check ownership
  if (paramUserId && paramUserId !== authUserId) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this wallet',
      },
    };
    res.status(403).json(response);
    return;
  }

  try {
    const wallet = await walletService.getWallet(authUserId);

    if (!wallet) {
      // If userId was explicitly provided in URL, return 404 (don't auto-create)
      if (paramUserId) {
        const response: ApiResponse<never> = {
          success: false,
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'Wallet not found',
          },
        };
        res.status(404).json(response);
        return;
      }

      const newWallet = await walletService.createWallet(authUserId);

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
          lastUpdated: newWallet.updatedAt
            ? newWallet.updatedAt.toISOString()
            : new Date().toISOString(),
        },
      };

      res.json(response);
      return;
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
        lastUpdated: wallet.updatedAt ? wallet.updatedAt.toISOString() : new Date().toISOString(),
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
 * Get current cryptocurrency prices
 */
export async function getCryptoPrices(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const prices = await fetchCryptoPrices();

    const response: ApiResponse<{
      bitcoin: { usd: number; usd_24h_change?: number };
      ethereum: { usd: number; usd_24h_change?: number };
      tether: { usd: number; usd_24h_change?: number };
      lastUpdated: string;
    }> = {
      success: true,
      data: {
        bitcoin: {
          usd: prices.bitcoin.usd,
          usd_24h_change: prices.bitcoin.usd_24h_change,
        },
        ethereum: {
          usd: prices.ethereum.usd,
          usd_24h_change: prices.ethereum.usd_24h_change,
        },
        tether: {
          usd: prices.tether.usd,
          usd_24h_change: prices.tether.usd_24h_change,
        },
        lastUpdated: prices.lastUpdated.toISOString(),
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'CRYPTO_PRICES_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}
