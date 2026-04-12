/**
 * @fileoverview GiftCardService Unit Tests
 * @description Tests for gift card creation, validation, redemption, listing, and details
 *              Pruebas para creación, validación, canje, listado y detalles de gift cards
 * @module __tests__/unit/GiftCardService
 */

// Mock logger (must come BEFORE imports that use it)
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }),
  },
}));

// Mock config/database
jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn((cb: (t: unknown) => Promise<unknown>) =>
      cb({
        LOCK: { UPDATE: 'UPDATE' },
      })
    ),
  },
}));

// Mock models
jest.mock('../../models', () => ({
  GiftCard: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  QrMapping: {
    create: jest.fn(),
  },
  GiftCardTransaction: {
    create: jest.fn(),
  },
  User: {},
}));

// Mock QRService
jest.mock('../../services/QRService', () => ({
  qrService: {
    generateGiftCardQR: jest.fn(),
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn().mockReturnValue('ABCDEFGHIJKLMNOP'),
    slice: jest.fn().mockReturnValue('ABCDEFGHIJ'),
  })),
}));

import { GiftCardService, giftCardService } from '../../services/GiftCardService';
import { GiftCard, QrMapping, GiftCardTransaction, User } from '../../models';
import { qrService } from '../../services/QRService';
import { sequelize } from '../../config/database';
import { GIFT_CARD_STATUS } from '../../types';

describe('GiftCardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // createGiftCard
  // ============================================

  describe('createGiftCard()', () => {
    it('should create a gift card with QR code and QR mapping inside a transaction', async () => {
      const mockGiftCard = {
        id: 'gc-uuid-1',
        code: 'GC-AAAA-BBBB-CCCC',
        qrCodeData: 'data:image/png;base64,mock',
        balance: 100,
        status: 'active',
        isActive: true,
        createdByUserId: 'admin-uuid',
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      (qrService.generateGiftCardQR as jest.Mock).mockResolvedValue('data:image/png;base64,mock');
      (GiftCard.create as jest.Mock).mockResolvedValue(mockGiftCard);
      (QrMapping.create as jest.Mock).mockResolvedValue({ id: 'qr-uuid-1' });

      const result = await giftCardService.createGiftCard(100, 'admin-uuid');

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(qrService.generateGiftCardQR).toHaveBeenCalled();
      expect(GiftCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 100,
          status: GIFT_CARD_STATUS.ACTIVE,
          isActive: true,
          createdByUserId: 'admin-uuid',
        }),
        expect.objectContaining({ transaction: expect.anything() })
      );
      expect(QrMapping.create).toHaveBeenCalledWith(
        expect.objectContaining({
          giftCardId: 'gc-uuid-1',
        }),
        expect.objectContaining({ transaction: expect.anything() })
      );
      expect(result).toEqual(mockGiftCard);
    });

    it('should throw if amount is <= 0', async () => {
      await expect(giftCardService.createGiftCard(0, 'admin-uuid')).rejects.toThrow(
        'Gift card amount must be greater than 0'
      );
      await expect(giftCardService.createGiftCard(-10, 'admin-uuid')).rejects.toThrow(
        'Gift card amount must be greater than 0'
      );
    });

    it('should continue with null QR data if QR generation fails', async () => {
      const mockGiftCard = {
        id: 'gc-uuid-2',
        code: 'GC-XXXX-YYYY-ZZZZ',
        qrCodeData: null,
        balance: 50,
        status: 'active',
        isActive: true,
        createdByUserId: 'admin-uuid',
        expiresAt: new Date(),
      };

      (qrService.generateGiftCardQR as jest.Mock).mockRejectedValue(
        new Error('QR generation failed')
      );
      (GiftCard.create as jest.Mock).mockResolvedValue(mockGiftCard);
      (QrMapping.create as jest.Mock).mockResolvedValue({ id: 'qr-uuid-2' });

      const result = await giftCardService.createGiftCard(50, 'admin-uuid');

      expect(result).toEqual(mockGiftCard);
      expect(GiftCard.create).toHaveBeenCalledWith(
        expect.objectContaining({ qrCodeData: null }),
        expect.anything()
      );
    });

    it('should use custom expiresInDays when provided', async () => {
      const mockGiftCard = {
        id: 'gc-uuid-3',
        code: 'GC-1111-2222-3333',
        qrCodeData: 'data:image/png;base64,test',
        balance: 200,
        status: 'active',
        isActive: true,
        createdByUserId: 'admin-uuid',
        expiresAt: new Date(),
      };

      (qrService.generateGiftCardQR as jest.Mock).mockResolvedValue('data:image/png;base64,test');
      (GiftCard.create as jest.Mock).mockResolvedValue(mockGiftCard);
      (QrMapping.create as jest.Mock).mockResolvedValue({ id: 'qr-uuid-3' });

      await giftCardService.createGiftCard(200, 'admin-uuid', 60);

      const createCall = (GiftCard.create as jest.Mock).mock.calls[0][0];
      const expiresAt = new Date(createCall.expiresAt);
      const now = new Date();
      // Should be approximately 60 days from now (allow a minute of tolerance)
      const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(59);
      expect(diffDays).toBeLessThan(61);
    });
  });

  // ============================================
  // validateGiftCard
  // ============================================

  describe('validateGiftCard()', () => {
    it('should return isValid: false with reason NOT_FOUND if card does not exist', async () => {
      (GiftCard.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await giftCardService.validateGiftCard('nonexistent-uuid');

      expect(result).toEqual({ isValid: false, reason: 'NOT_FOUND' });
    });

    it('should return isValid: false with reason INACTIVE if card is not active', async () => {
      (GiftCard.findByPk as jest.Mock).mockResolvedValue({
        id: 'gc-uuid',
        isActive: false,
        status: 'active',
        expiresAt: new Date(Date.now() + 86400000),
        redeemedAt: null,
      });

      const result = await giftCardService.validateGiftCard('gc-uuid');

      expect(result).toEqual({ isValid: false, reason: 'INACTIVE' });
    });

    it('should return isValid: false with reason ALREADY_REDEEMED if card is redeemed', async () => {
      (GiftCard.findByPk as jest.Mock).mockResolvedValue({
        id: 'gc-uuid',
        isActive: true,
        status: GIFT_CARD_STATUS.REDEEMED,
        expiresAt: new Date(Date.now() + 86400000),
        redeemedAt: new Date(),
      });

      const result = await giftCardService.validateGiftCard('gc-uuid');

      expect(result).toEqual({ isValid: false, reason: 'ALREADY_REDEEMED' });
    });

    it('should return isValid: false with reason EXPIRED if card is expired', async () => {
      (GiftCard.findByPk as jest.Mock).mockResolvedValue({
        id: 'gc-uuid',
        isActive: true,
        status: GIFT_CARD_STATUS.ACTIVE,
        expiresAt: new Date(Date.now() - 86400000), // expired yesterday
        redeemedAt: null,
      });

      const result = await giftCardService.validateGiftCard('gc-uuid');

      expect(result).toEqual({ isValid: false, reason: 'EXPIRED' });
    });

    it('should return isValid: true with card data for a valid card', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 30);
      const mockCard = {
        id: 'gc-uuid',
        code: 'GC-AAAA-BBBB-CCCC',
        qrCodeData: 'data:image/png;base64,qr',
        balance: 100,
        status: GIFT_CARD_STATUS.ACTIVE,
        isActive: true,
        createdByUserId: 'admin-uuid',
        redeemedByUserId: null,
        expiresAt: futureDate,
        redeemedAt: null,
        deletedAt: null,
      };

      (GiftCard.findByPk as jest.Mock).mockResolvedValue(mockCard);

      const result = await giftCardService.validateGiftCard('gc-uuid');

      expect(result.isValid).toBe(true);
      expect(result.card).toBeDefined();
      expect(result.card!.id).toBe('gc-uuid');
      expect(result.card!.balance).toBe(100);
    });
  });

  // ============================================
  // redeemGiftCard
  // ============================================

  describe('redeemGiftCard()', () => {
    it('should redeem a valid gift card with pessimistic locking', async () => {
      const mockCard = {
        id: 'gc-uuid',
        code: 'GC-AAAA-BBBB-CCCC',
        balance: 100,
        status: GIFT_CARD_STATUS.ACTIVE,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000 * 30),
        redeemedAt: null,
        update: jest.fn().mockResolvedValue(undefined),
      };

      const mockTransaction = {
        id: 'tx-uuid',
        giftCardId: 'gc-uuid',
        amountRedeemed: 100,
        transactionType: 'redemption',
        status: 'completed',
        createdAt: new Date(),
      };

      (GiftCard.findByPk as jest.Mock).mockResolvedValue(mockCard);
      (GiftCardTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await giftCardService.redeemGiftCard('gc-uuid', 'user-uuid', 'order-uuid');

      expect(GiftCard.findByPk).toHaveBeenCalledWith('gc-uuid', {
        lock: 'UPDATE',
        transaction: expect.anything(),
      });
      expect(mockCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: GIFT_CARD_STATUS.REDEEMED,
          isActive: false,
          redeemedByUserId: 'user-uuid',
        }),
        expect.objectContaining({ transaction: expect.anything() })
      );
      expect(GiftCardTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          giftCardId: 'gc-uuid',
          orderId: 'order-uuid',
          redeemedByUserId: 'user-uuid',
          amountRedeemed: 100,
        }),
        expect.objectContaining({ transaction: expect.anything() })
      );
      expect(result).toEqual(mockTransaction);
    });

    it('should throw "Gift card not found" if card does not exist', async () => {
      (GiftCard.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(giftCardService.redeemGiftCard('nonexistent', 'user-uuid')).rejects.toThrow(
        'Gift card not found'
      );
    });

    it('should throw "Gift card is inactive" if card is not active', async () => {
      (GiftCard.findByPk as jest.Mock).mockResolvedValue({
        id: 'gc-uuid',
        isActive: false,
        status: GIFT_CARD_STATUS.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
        redeemedAt: null,
      });

      await expect(giftCardService.redeemGiftCard('gc-uuid', 'user-uuid')).rejects.toThrow(
        'Gift card is inactive'
      );
    });

    it('should throw "Gift card already redeemed" if card was already redeemed', async () => {
      (GiftCard.findByPk as jest.Mock).mockResolvedValue({
        id: 'gc-uuid',
        isActive: true,
        status: GIFT_CARD_STATUS.REDEEMED,
        expiresAt: new Date(Date.now() + 86400000),
        redeemedAt: new Date(),
      });

      await expect(giftCardService.redeemGiftCard('gc-uuid', 'user-uuid')).rejects.toThrow(
        'Gift card already redeemed'
      );
    });

    it('should mark card as expired and throw "Gift card has expired" for expired cards (lazy check)', async () => {
      const mockCard = {
        id: 'gc-uuid',
        isActive: true,
        status: GIFT_CARD_STATUS.ACTIVE,
        expiresAt: new Date(Date.now() - 86400000), // expired yesterday
        redeemedAt: null,
        update: jest.fn().mockResolvedValue(undefined),
      };

      (GiftCard.findByPk as jest.Mock).mockResolvedValue(mockCard);

      await expect(giftCardService.redeemGiftCard('gc-uuid', 'user-uuid')).rejects.toThrow(
        'Gift card has expired'
      );

      // Should have marked the card as expired (D23-003)
      expect(mockCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: GIFT_CARD_STATUS.EXPIRED,
          isActive: false,
        }),
        expect.objectContaining({ transaction: expect.anything() })
      );
    });
  });

  // ============================================
  // listGiftCards
  // ============================================

  describe('listGiftCards()', () => {
    it('should return paginated gift cards with default options', async () => {
      const mockResult = {
        rows: [
          { id: 'gc-1', code: 'GC-1111', balance: 100 },
          { id: 'gc-2', code: 'GC-2222', balance: 50 },
        ],
        count: 2,
      };

      (GiftCard.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await giftCardService.listGiftCards();

      expect(GiftCard.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          limit: 20,
          offset: 0,
          order: [['created_at', 'DESC']],
          include: expect.arrayContaining([
            expect.objectContaining({ model: User, as: 'createdByUser' }),
            expect.objectContaining({ model: User, as: 'redeemedByUser' }),
          ]),
        })
      );
      expect(result.rows).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should apply filters and custom pagination', async () => {
      const mockResult = { rows: [], count: 0 };
      (GiftCard.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await giftCardService.listGiftCards({
        page: 2,
        limit: 10,
        status: 'active',
        createdByUserId: 'admin-uuid',
      });

      expect(GiftCard.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active', createdByUserId: 'admin-uuid' },
          limit: 10,
          offset: 10, // (page 2 - 1) * 10
        })
      );
    });
  });

  // ============================================
  // getGiftCardDetails
  // ============================================

  describe('getGiftCardDetails()', () => {
    it('should return gift card with all associations', async () => {
      const mockCard = {
        id: 'gc-uuid',
        code: 'GC-AAAA-BBBB-CCCC',
        balance: 100,
        status: 'active',
      };

      (GiftCard.findByPk as jest.Mock).mockResolvedValue(mockCard);

      const result = await giftCardService.getGiftCardDetails('gc-uuid');

      expect(GiftCard.findByPk).toHaveBeenCalledWith('gc-uuid', {
        include: expect.arrayContaining([
          expect.objectContaining({ model: User, as: 'createdByUser' }),
          expect.objectContaining({ model: User, as: 'redeemedByUser' }),
          expect.objectContaining({ model: QrMapping }),
          expect.objectContaining({ model: GiftCardTransaction }),
        ]),
      });
      expect(result).toEqual(mockCard);
    });

    it('should return null if gift card does not exist', async () => {
      (GiftCard.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await giftCardService.getGiftCardDetails('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // Singleton export
  // ============================================

  describe('singleton export', () => {
    it('should export a singleton instance of GiftCardService', () => {
      expect(giftCardService).toBeInstanceOf(GiftCardService);
    });
  });
});
