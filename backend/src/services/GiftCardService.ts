/**
 * @fileoverview GiftCardService - Business logic for digital gift card operations
 * @description Handles gift card creation, validation, redemption with pessimistic locking, listing, and details
 *              Gestiona creación, validación, canje con bloqueo pesimista, listado y detalles de gift cards
 * @module services/GiftCardService
 * @author MLM Development Team
 *
 * @example
 * // English: Create a new gift card
 * const card = await giftCardService.createGiftCard(100, 'admin-uuid');
 *
 * // Español: Crear una nueva gift card
 * const card = await giftCardService.createGiftCard(100, 'admin-uuid');
 *
 * @example
 * // English: Redeem a gift card
 * const result = await giftCardService.redeemGiftCard('card-uuid', 'user-uuid');
 *
 * // Español: Canjear una gift card
 * const result = await giftCardService.redeemGiftCard('card-uuid', 'user-uuid');
 */
import crypto from 'crypto';
import { sequelize } from '../config/database';
import { GiftCard, QrMapping, GiftCardTransaction, User } from '../models';
import { qrService } from './QRService';
import {
  GIFT_CARD_STATUS,
  GIFT_CARD_TRANSACTION_TYPE,
  GIFT_CARD_TRANSACTION_STATUS,
} from '../types';
import type { GiftCardValidationResult } from '../types';

/**
 * Default expiration in days
 * Expiración por defecto en días
 */
const DEFAULT_EXPIRY_DAYS = 30;

/**
 * Generate a URL-safe short code (10 chars)
 * Genera un código corto URL-safe (10 caracteres)
 */
function generateShortCode(): string {
  return crypto.randomBytes(8).toString('base64url').slice(0, 10);
}

/**
 * Generate a human-readable gift card code
 * Genera un código de gift card legible
 */
function generateGiftCardCode(): string {
  const prefix = 'GC';
  const random = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${random.slice(0, 4)}-${random.slice(4, 8)}-${random.slice(8, 12)}`;
}

export class GiftCardService {
  /**
   * Create a new gift card with QR code
   * Crear una nueva gift card con código QR
   *
   * @param amount - Gift card balance / Balance de la gift card
   * @param createdByUserId - Admin user ID who creates the card / ID del admin que crea la card
   * @param expiresInDays - Days until expiration (default 30) / Días hasta expiración (default 30)
   * @returns Created gift card with QR mapping / Gift card creada con mapeo QR
   */
  async createGiftCard(
    amount: number,
    createdByUserId: string,
    expiresInDays: number = DEFAULT_EXPIRY_DAYS
  ): Promise<GiftCard> {
    if (amount <= 0) {
      throw new Error('Gift card amount must be greater than 0');
    }

    const code = generateGiftCardCode();
    const shortCode = generateShortCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const result = await sequelize.transaction(async (t) => {
      // Generate QR code data URL
      let qrCodeData: string | null = null;
      try {
        qrCodeData = await qrService.generateGiftCardQR(shortCode);
      } catch {
        // QR generation failure — continue with null (placeholder)
        console.error('QR generation failed, continuing without QR code data');
      }

      // Create gift card
      const giftCard = await GiftCard.create(
        {
          code,
          qrCodeData,
          balance: amount,
          status: GIFT_CARD_STATUS.ACTIVE,
          isActive: true,
          createdByUserId,
          expiresAt,
        },
        { transaction: t }
      );

      // Create QR mapping (shortCode → giftCardId)
      await QrMapping.create(
        {
          shortCode,
          giftCardId: giftCard.id,
        },
        { transaction: t }
      );

      return giftCard;
    });

    return result;
  }

  /**
   * Validate a gift card by ID
   * Validar una gift card por ID
   *
   * @param giftCardId - Gift card UUID / UUID de gift card
   * @returns Validation result / Resultado de validación
   */
  async validateGiftCard(giftCardId: string): Promise<GiftCardValidationResult> {
    const giftCard = await GiftCard.findByPk(giftCardId);

    if (!giftCard) {
      return { isValid: false, reason: 'NOT_FOUND' };
    }

    if (!giftCard.isActive) {
      return { isValid: false, reason: 'INACTIVE' };
    }

    if (giftCard.status === GIFT_CARD_STATUS.REDEEMED || giftCard.redeemedAt !== null) {
      return { isValid: false, reason: 'ALREADY_REDEEMED' };
    }

    if (giftCard.expiresAt <= new Date()) {
      return { isValid: false, reason: 'EXPIRED' };
    }

    return {
      isValid: true,
      card: {
        id: giftCard.id,
        code: giftCard.code,
        qrCodeData: giftCard.qrCodeData,
        balance: Number(giftCard.balance),
        status: giftCard.status,
        isActive: giftCard.isActive,
        createdByUserId: giftCard.createdByUserId,
        redeemedByUserId: giftCard.redeemedByUserId,
        expiresAt: giftCard.expiresAt,
        redeemedAt: giftCard.redeemedAt,
        deletedAt: giftCard.deletedAt,
      },
    };
  }

  /**
   * Redeem a gift card with pessimistic locking (SELECT ... FOR UPDATE)
   * Canjear una gift card con bloqueo pesimista (SELECT ... FOR UPDATE)
   *
   * @param giftCardId - Gift card UUID / UUID de gift card
   * @param redeemedByUserId - User who redeems / Usuario que canjea
   * @param orderId - Optional order ID / ID de orden opcional
   * @returns Gift card transaction / Transacción de gift card
   */
  async redeemGiftCard(
    giftCardId: string,
    redeemedByUserId: string,
    orderId?: string
  ): Promise<GiftCardTransaction> {
    const result = await sequelize.transaction(async (t) => {
      // CRITICAL: Pessimistic lock — SELECT ... FOR UPDATE
      const giftCard = await GiftCard.findByPk(giftCardId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!giftCard) {
        throw new Error('Gift card not found');
      }

      if (!giftCard.isActive) {
        throw new Error('Gift card is inactive');
      }

      if (giftCard.status === GIFT_CARD_STATUS.REDEEMED || giftCard.redeemedAt !== null) {
        throw new Error('Gift card already redeemed');
      }

      // Lazy expiration check (D23-003)
      if (giftCard.expiresAt <= new Date()) {
        // Mark as expired
        await giftCard.update(
          {
            status: GIFT_CARD_STATUS.EXPIRED,
            isActive: false,
          },
          { transaction: t }
        );
        throw new Error('Gift card has expired');
      }

      const amountRedeemed = Number(giftCard.balance);

      // Mark gift card as redeemed (D23-002: all-or-nothing)
      await giftCard.update(
        {
          status: GIFT_CARD_STATUS.REDEEMED,
          isActive: false,
          redeemedByUserId,
          redeemedAt: new Date(),
        },
        { transaction: t }
      );

      // Create transaction log entry
      const transaction = await GiftCardTransaction.create(
        {
          giftCardId: giftCard.id,
          orderId: orderId || null,
          redeemedByUserId,
          amountRedeemed,
          transactionType: GIFT_CARD_TRANSACTION_TYPE.REDEMPTION,
          status: GIFT_CARD_TRANSACTION_STATUS.COMPLETED,
          metadata: {
            originalBalance: amountRedeemed,
            code: giftCard.code,
          },
        },
        { transaction: t }
      );

      return transaction;
    });

    return result;
  }

  /**
   * List gift cards with pagination and filters (admin)
   * Listar gift cards con paginación y filtros (admin)
   *
   * @param options - Filter and pagination options / Opciones de filtro y paginación
   * @returns Paginated gift cards / Gift cards paginadas
   */
  async listGiftCards(options?: {
    page?: number;
    limit?: number;
    status?: string;
    createdByUserId?: string;
  }): Promise<{ rows: GiftCard[]; count: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options?.status) where.status = options.status;
    if (options?.createdByUserId) where.createdByUserId = options.createdByUserId;

    return GiftCard.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'createdByUser', attributes: ['id', 'email'] },
        { model: User, as: 'redeemedByUser', attributes: ['id', 'email'] },
      ],
    });
  }

  /**
   * Get gift card details with QR mapping and transaction history
   * Obtener detalles de gift card con mapeo QR e historial de transacciones
   *
   * @param giftCardId - Gift card UUID / UUID de gift card
   * @returns Gift card with relations / Gift card con relaciones
   */
  async getGiftCardDetails(giftCardId: string): Promise<GiftCard | null> {
    return GiftCard.findByPk(giftCardId, {
      include: [
        { model: User, as: 'createdByUser', attributes: ['id', 'email'] },
        { model: User, as: 'redeemedByUser', attributes: ['id', 'email'] },
        { model: QrMapping },
        { model: GiftCardTransaction },
      ],
    });
  }
}

// Export singleton instance
export const giftCardService = new GiftCardService();
