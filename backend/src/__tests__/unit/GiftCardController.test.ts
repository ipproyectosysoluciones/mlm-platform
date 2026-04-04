/**
 * @fileoverview GiftCardController Unit Tests
 * @description Tests for gift card controller endpoint handlers
 *              Pruebas para funciones del controlador de gift cards
 * @module __tests__/unit/GiftCardController
 */

// Mock GiftCardService
jest.mock('../../services/GiftCardService', () => ({
  giftCardService: {
    createGiftCard: jest.fn(),
    validateGiftCard: jest.fn(),
    redeemGiftCard: jest.fn(),
    listGiftCards: jest.fn(),
    getGiftCardDetails: jest.fn(),
  },
}));

// Mock QRService
jest.mock('../../services/QRService', () => ({
  qrService: {
    resolveShortCode: jest.fn(),
  },
}));

import {
  createGiftCard,
  validateGiftCard,
  redeemGiftCard,
  listGiftCards,
  getGiftCardDetails,
  resolveShortCode,
} from '../../controllers/GiftCardController';
import { giftCardService } from '../../services/GiftCardService';
import { qrService } from '../../services/QRService';

// Helper to create mock req/res
function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: 'user-uuid', email: 'test@test.com', role: 'admin', referralCode: 'REF-1234' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('GiftCardController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // createGiftCard
  // ============================================

  describe('createGiftCard()', () => {
    it('should create a gift card and return 201 with data', async () => {
      const mockCard = {
        id: 'gc-uuid',
        code: 'GC-AAAA-BBBB-CCCC',
        balance: 100,
        status: 'active',
        isActive: true,
        expiresAt: new Date('2026-05-01'),
        qrCodeData: 'data:image/png;base64,qr',
        createdAt: new Date('2026-04-01'),
      };

      (giftCardService.createGiftCard as jest.Mock).mockResolvedValue(mockCard);

      const req = createMockReq({ body: { amount: 100, expiresInDays: 30 } });
      const res = createMockRes();

      await createGiftCard(req, res);

      expect(giftCardService.createGiftCard).toHaveBeenCalledWith(100, 'user-uuid', 30);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 'gc-uuid',
            code: 'GC-AAAA-BBBB-CCCC',
            balance: 100,
          }),
        })
      );
    });

    it('should return 400 on creation error', async () => {
      (giftCardService.createGiftCard as jest.Mock).mockRejectedValue(
        new Error('Gift card amount must be greater than 0')
      );

      const req = createMockReq({ body: { amount: 0 } });
      const res = createMockRes();

      await createGiftCard(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'GIFT_CARD_CREATE_ERROR',
            message: 'Gift card amount must be greater than 0',
          }),
        })
      );
    });
  });

  // ============================================
  // validateGiftCard
  // ============================================

  describe('validateGiftCard()', () => {
    it('should return validation result with success', async () => {
      const mockResult = { isValid: true, card: { id: 'gc-uuid', balance: 100 } };
      (giftCardService.validateGiftCard as jest.Mock).mockResolvedValue(mockResult);

      const req = createMockReq({ params: { giftCardId: 'gc-uuid' } });
      const res = createMockRes();

      await validateGiftCard(req, res);

      expect(giftCardService.validateGiftCard).toHaveBeenCalledWith('gc-uuid');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockResult,
        })
      );
    });

    it('should return 500 on validation error', async () => {
      (giftCardService.validateGiftCard as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const req = createMockReq({ params: { giftCardId: 'gc-uuid' } });
      const res = createMockRes();

      await validateGiftCard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'GIFT_CARD_VALIDATE_ERROR',
          }),
        })
      );
    });
  });

  // ============================================
  // redeemGiftCard
  // ============================================

  describe('redeemGiftCard()', () => {
    it('should redeem a gift card and return transaction data', async () => {
      const mockTx = {
        id: 'tx-uuid',
        giftCardId: 'gc-uuid',
        amountRedeemed: 100,
        transactionType: 'redemption',
        status: 'completed',
        createdAt: new Date('2026-04-03'),
      };

      (giftCardService.redeemGiftCard as jest.Mock).mockResolvedValue(mockTx);

      const req = createMockReq({
        params: { giftCardId: 'gc-uuid' },
        body: { orderId: 'order-uuid' },
      });
      const res = createMockRes();

      await redeemGiftCard(req, res);

      expect(giftCardService.redeemGiftCard).toHaveBeenCalledWith(
        'gc-uuid',
        'user-uuid',
        'order-uuid'
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 'tx-uuid',
            amountRedeemed: 100,
          }),
        })
      );
    });

    it('should return 404 when gift card is not found', async () => {
      (giftCardService.redeemGiftCard as jest.Mock).mockRejectedValue(
        new Error('Gift card not found')
      );

      const req = createMockReq({ params: { giftCardId: 'nonexistent' } });
      const res = createMockRes();

      await redeemGiftCard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'GIFT_CARD_NOT_FOUND',
          }),
        })
      );
    });

    it('should return 409 when gift card is already redeemed', async () => {
      (giftCardService.redeemGiftCard as jest.Mock).mockRejectedValue(
        new Error('Gift card already redeemed')
      );

      const req = createMockReq({ params: { giftCardId: 'gc-uuid' } });
      const res = createMockRes();

      await redeemGiftCard(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'GIFT_CARD_ALREADY_REDEEMED',
          }),
        })
      );
    });

    it('should return 400 when gift card is expired', async () => {
      (giftCardService.redeemGiftCard as jest.Mock).mockRejectedValue(
        new Error('Gift card has expired')
      );

      const req = createMockReq({ params: { giftCardId: 'gc-uuid' } });
      const res = createMockRes();

      await redeemGiftCard(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'GIFT_CARD_EXPIRED',
          }),
        })
      );
    });
  });

  // ============================================
  // listGiftCards
  // ============================================

  describe('listGiftCards()', () => {
    it('should return paginated gift cards list', async () => {
      const mockCards = {
        rows: [
          {
            id: 'gc-1',
            code: 'GC-1111',
            balance: 100,
            status: 'active',
            isActive: true,
            createdByUserId: 'admin-uuid',
            redeemedByUserId: null,
            expiresAt: new Date(),
            redeemedAt: null,
            createdAt: new Date(),
          },
        ],
        count: 1,
      };

      (giftCardService.listGiftCards as jest.Mock).mockResolvedValue(mockCards);

      const req = createMockReq({
        query: { page: '2', limit: '10', status: 'active' },
      });
      const res = createMockRes();

      await listGiftCards(req, res);

      expect(giftCardService.listGiftCards).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        status: 'active',
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.objectContaining({ id: 'gc-1' })]),
          pagination: expect.objectContaining({
            total: 1,
            page: 2,
            limit: 10,
            totalPages: 1,
          }),
        })
      );
    });

    it('should return 500 on list error', async () => {
      (giftCardService.listGiftCards as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = createMockReq({ query: {} });
      const res = createMockRes();

      await listGiftCards(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'GIFT_CARD_LIST_ERROR',
          }),
        })
      );
    });
  });

  // ============================================
  // getGiftCardDetails
  // ============================================

  describe('getGiftCardDetails()', () => {
    it('should return gift card details with associations', async () => {
      const mockCard = {
        id: 'gc-uuid',
        code: 'GC-AAAA-BBBB-CCCC',
        balance: 100,
        status: 'active',
      };

      (giftCardService.getGiftCardDetails as jest.Mock).mockResolvedValue(mockCard);

      const req = createMockReq({ params: { giftCardId: 'gc-uuid' } });
      const res = createMockRes();

      await getGiftCardDetails(req, res);

      expect(giftCardService.getGiftCardDetails).toHaveBeenCalledWith('gc-uuid');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockCard,
        })
      );
    });

    it('should return 404 when gift card is not found', async () => {
      (giftCardService.getGiftCardDetails as jest.Mock).mockResolvedValue(null);

      const req = createMockReq({ params: { giftCardId: 'nonexistent' } });
      const res = createMockRes();

      await getGiftCardDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'GIFT_CARD_NOT_FOUND',
            message: 'Gift card not found',
          }),
        })
      );
    });

    it('should return 500 on details error', async () => {
      (giftCardService.getGiftCardDetails as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const req = createMockReq({ params: { giftCardId: 'gc-uuid' } });
      const res = createMockRes();

      await getGiftCardDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'GIFT_CARD_DETAILS_ERROR',
          }),
        })
      );
    });
  });

  // ============================================
  // resolveShortCode
  // ============================================

  describe('resolveShortCode()', () => {
    it('should resolve short code and return gift card ID', async () => {
      (qrService.resolveShortCode as jest.Mock).mockResolvedValue('gc-uuid');

      const req = createMockReq({ params: { shortCode: 'abc123xyz' } });
      const res = createMockRes();

      await resolveShortCode(req, res);

      expect(qrService.resolveShortCode).toHaveBeenCalledWith('abc123xyz');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { giftCardId: 'gc-uuid' },
        })
      );
    });

    it('should return 404 when short code is not found', async () => {
      (qrService.resolveShortCode as jest.Mock).mockResolvedValue(null);

      const req = createMockReq({ params: { shortCode: 'nonexistent' } });
      const res = createMockRes();

      await resolveShortCode(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'SHORT_CODE_NOT_FOUND',
            message: 'Invalid or expired QR code',
          }),
        })
      );
    });

    it('should return 500 on resolve error', async () => {
      (qrService.resolveShortCode as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = createMockReq({ params: { shortCode: 'abc123xyz' } });
      const res = createMockRes();

      await resolveShortCode(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'SHORT_CODE_ERROR',
          }),
        })
      );
    });
  });
});
