/**
 * @fileoverview QRService Unit Tests (Gift Card extension)
 * @description Tests for gift card QR generation and short code resolution
 *              Pruebas para generación QR de gift cards y resolución de códigos cortos
 * @module __tests__/unit/QRService
 */

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-data'),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-png')),
  toFile: jest.fn().mockResolvedValue(undefined),
}));

// Mock models
jest.mock('../../models', () => ({
  QrMapping: {
    findOne: jest.fn(),
  },
  GiftCard: {},
}));

// Mock config/env
jest.mock('../../config/env', () => ({
  config: {
    app: {
      frontendUrl: 'https://app.test.com',
    },
  },
}));

import QRCode from 'qrcode';
import { QRService, qrService } from '../../services/QRService';
import { QrMapping } from '../../models';

describe('QRService — Gift Card Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // generateGiftCardQR
  // ============================================

  describe('generateGiftCardQR()', () => {
    it('should generate a QR data URL for a gift card short code', async () => {
      const result = await qrService.generateGiftCardQR('abc123xyz');

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://app.test.com/q/abc123xyz',
        expect.objectContaining({
          errorCorrectionLevel: 'H',
          type: 'image/png',
          margin: 2,
          width: 300,
        })
      );
      expect(result).toBe('data:image/png;base64,mock-qr-data');
    });
  });

  // ============================================
  // resolveShortCode
  // ============================================

  describe('resolveShortCode()', () => {
    it('should resolve a valid short code to its gift card ID and increment scan count', async () => {
      const mockMapping = {
        shortCode: 'abc123xyz',
        giftCardId: 'gc-uuid-1',
        scanCount: 3,
        lastScannedAt: null,
        update: jest.fn().mockResolvedValue(undefined),
      };

      (QrMapping.findOne as jest.Mock).mockResolvedValue(mockMapping);

      const result = await qrService.resolveShortCode('abc123xyz');

      expect(QrMapping.findOne).toHaveBeenCalledWith({
        where: { shortCode: 'abc123xyz' },
      });
      expect(mockMapping.update).toHaveBeenCalledWith({
        scanCount: 4,
        lastScannedAt: expect.any(Date),
      });
      expect(result).toBe('gc-uuid-1');
    });

    it('should return null if short code is not found', async () => {
      (QrMapping.findOne as jest.Mock).mockResolvedValue(null);

      const result = await qrService.resolveShortCode('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // Singleton export
  // ============================================

  describe('singleton export', () => {
    it('should export a singleton instance of QRService', () => {
      expect(qrService).toBeInstanceOf(QRService);
    });
  });
});
