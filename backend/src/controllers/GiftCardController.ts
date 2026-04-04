/**
 * @fileoverview GiftCardController - Endpoints for gift card operations
 * @description Handles gift card creation, validation, redemption, listing, and details
 *              Gestiona creación, validación, canje, listado y detalles de gift cards
 * @module controllers/GiftCardController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { giftCardService } from '../services/GiftCardService';
import { qrService } from '../services/QRService';
import type { ApiResponse } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Create a new gift card (admin only)
 * Crear una nueva gift card (solo admin)
 *
 * @param req - Body: amount, expiresInDays (optional)
 * @param res - Response with created gift card
 */
export async function createGiftCard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { amount, expiresInDays } = req.body;

  try {
    const giftCard = await giftCardService.createGiftCard(amount, userId, expiresInDays);

    const response: ApiResponse<{
      id: string;
      code: string;
      balance: number;
      status: string;
      isActive: boolean;
      expiresAt: Date;
      qrCodeData: string | null;
      createdAt: Date;
    }> = {
      success: true,
      data: {
        id: giftCard.id,
        code: giftCard.code,
        balance: Number(giftCard.balance),
        status: giftCard.status,
        isActive: giftCard.isActive,
        expiresAt: giftCard.expiresAt,
        qrCodeData: giftCard.qrCodeData,
        createdAt: giftCard.createdAt,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'GIFT_CARD_CREATE_ERROR',
        message: errorMessage,
      },
    };
    res.status(400).json(response);
  }
}

/**
 * Validate a gift card by ID
 * Validar una gift card por ID
 *
 * @param req - Params: giftCardId
 * @param res - Response with validation result
 */
export async function validateGiftCard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { giftCardId } = req.params;

  try {
    const result = await giftCardService.validateGiftCard(giftCardId);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'GIFT_CARD_VALIDATE_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Redeem a gift card
 * Canjear una gift card
 *
 * @param req - Params: giftCardId, Body: orderId (optional)
 * @param res - Response with redemption transaction
 */
export async function redeemGiftCard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { giftCardId } = req.params;
  const { orderId } = req.body;

  try {
    const transaction = await giftCardService.redeemGiftCard(giftCardId, userId, orderId);

    const response: ApiResponse<{
      id: string;
      giftCardId: string;
      amountRedeemed: number;
      transactionType: string;
      status: string;
      createdAt: Date;
    }> = {
      success: true,
      data: {
        id: transaction.id,
        giftCardId: transaction.giftCardId,
        amountRedeemed: Number(transaction.amountRedeemed),
        transactionType: transaction.transactionType,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Determine status code based on error
    let statusCode = 400;
    let errorCode = 'GIFT_CARD_REDEEM_ERROR';

    if (errorMessage.includes('not found')) {
      statusCode = 404;
      errorCode = 'GIFT_CARD_NOT_FOUND';
    } else if (errorMessage.includes('already redeemed')) {
      statusCode = 409;
      errorCode = 'GIFT_CARD_ALREADY_REDEEMED';
    } else if (errorMessage.includes('expired')) {
      statusCode = 400;
      errorCode = 'GIFT_CARD_EXPIRED';
    } else if (errorMessage.includes('inactive')) {
      statusCode = 400;
      errorCode = 'GIFT_CARD_INACTIVE';
    }

    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };
    res.status(statusCode).json(response);
  }
}

/**
 * List all gift cards with pagination and filters (admin)
 * Listar todas las gift cards con paginación y filtros (admin)
 *
 * @param req - Query: page, limit, status
 * @param res - Response with paginated gift cards
 */
export async function listGiftCards(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const status = req.query.status as string | undefined;

  try {
    const { rows, count } = await giftCardService.listGiftCards({
      page,
      limit,
      status,
    });

    const data = rows.map((card) => ({
      id: card.id,
      code: card.code,
      balance: Number(card.balance),
      status: card.status,
      isActive: card.isActive,
      createdByUserId: card.createdByUserId,
      redeemedByUserId: card.redeemedByUserId,
      expiresAt: card.expiresAt,
      redeemedAt: card.redeemedAt,
      createdAt: card.createdAt,
    }));

    const response: ApiResponse<typeof data> = {
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
        code: 'GIFT_CARD_LIST_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Get gift card details with QR mapping and transaction history
 * Obtener detalles de gift card con mapeo QR e historial de transacciones
 *
 * @param req - Params: giftCardId
 * @param res - Response with gift card details
 */
export async function getGiftCardDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { giftCardId } = req.params;

  try {
    const giftCard = await giftCardService.getGiftCardDetails(giftCardId);

    if (!giftCard) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'GIFT_CARD_NOT_FOUND',
          message: 'Gift card not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<typeof giftCard> = {
      success: true,
      data: giftCard,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'GIFT_CARD_DETAILS_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Resolve a QR short code to gift card ID (public endpoint)
 * Resolver un código corto QR a ID de gift card (endpoint público)
 *
 * @param req - Params: shortCode
 * @param res - Response with gift card ID or redirect
 */
export async function resolveShortCode(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { shortCode } = req.params;

  try {
    const giftCardId = await qrService.resolveShortCode(shortCode);

    if (!giftCardId) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'SHORT_CODE_NOT_FOUND',
          message: 'Invalid or expired QR code',
        },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<{ giftCardId: string }> = {
      success: true,
      data: { giftCardId },
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'SHORT_CODE_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}
