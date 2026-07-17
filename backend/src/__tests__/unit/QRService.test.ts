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

// Mock logger to verify error logging
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import QRCode from 'qrcode';
import { QRService, qrService } from '../../services/QRService';
import { QrMapping } from '../../models';
import { logger } from '../../utils/logger';

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

  // ============================================
  // Error handling — verify try/catch logging
  // ============================================

  describe('error handling', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('generateQRDataUrl — logs error and rethrows when QRCode.toDataURL fails', async () => {
      const error = new Error('QR generation failed');
      (QRCode.toDataURL as jest.Mock).mockRejectedValueOnce(error);

      await expect(qrService.generateQRDataUrl('MLM-ABCD-1234')).rejects.toThrow(
        'QR generation failed'
      );

      expect(logger.error).toHaveBeenCalledWith(
        { service: 'QRService', method: 'generateQRDataUrl', error },
        'Operation failed'
      );
    });

    it('generateQRBuffer — logs error and rethrows when QRCode.toBuffer fails', async () => {
      const error = new Error('QR buffer failed');
      (QRCode.toBuffer as jest.Mock).mockRejectedValueOnce(error);

      await expect(qrService.generateQRBuffer('MLM-ABCD-1234')).rejects.toThrow('QR buffer failed');

      expect(logger.error).toHaveBeenCalledWith(
        { service: 'QRService', method: 'generateQRBuffer', error },
        'Operation failed'
      );
    });

    it('generateQRFile — logs error and rethrows when QRCode.toFile fails', async () => {
      const error = new Error('QR file write failed');
      (QRCode.toFile as jest.Mock).mockRejectedValueOnce(error);

      await expect(qrService.generateQRFile('MLM-ABCD-1234', '/tmp/qr.png')).rejects.toThrow(
        'QR file write failed'
      );

      expect(logger.error).toHaveBeenCalledWith(
        { service: 'QRService', method: 'generateQRFile', error },
        'Operation failed'
      );
    });

    it('generateGiftCardQR — logs error and rethrows when QRCode.toDataURL fails', async () => {
      const error = new Error('Gift card QR failed');
      (QRCode.toDataURL as jest.Mock).mockRejectedValueOnce(error);

      await expect(qrService.generateGiftCardQR('abc123xyz')).rejects.toThrow(
        'Gift card QR failed'
      );

      expect(logger.error).toHaveBeenCalledWith(
        { service: 'QRService', method: 'generateGiftCardQR', error },
        'Operation failed'
      );
    });

    it('resolveShortCode — logs error and rethrows when QrMapping.findOne fails', async () => {
      const error = new Error('Database query failed');
      (QrMapping.findOne as jest.Mock).mockRejectedValueOnce(error);

      await expect(qrService.resolveShortCode('abc123xyz')).rejects.toThrow(
        'Database query failed'
      );

      expect(logger.error).toHaveBeenCalledWith(
        { service: 'QRService', method: 'resolveShortCode', error },
        'Operation failed'
      );
    });
  });
});
