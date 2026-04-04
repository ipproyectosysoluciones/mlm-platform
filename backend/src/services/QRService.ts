/**
 * @fileoverview QRService - QR code generation for referral links and gift cards
 * @description Generates QR codes for user referral links and gift card short URLs with customizable options.
 *              Genera códigos QR para enlaces de referido y URLs cortas de gift cards con opciones personalizables.
 * @module services/QRService
 * @author MLM Development Team
 */

import QRCode from 'qrcode';
import { config } from '../config/env';
import { QrMapping } from '../models';

/**
 * QR Code Service - Generates QR codes for referral links and gift cards
 * Servicio de Códigos QR - Genera códigos QR para enlaces de referido y gift cards
 */
export class QRService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.app.frontendUrl;
  }

  /**
   * Generate referral registration link
   * Generar enlace de registro por referido
   * @param {string} referralCode - User's unique referral code / Código de referido único del usuario
   * @returns {string} Full registration URL with referral parameter / URL completa de registro con parámetro de referido
   * @example
   * // English: Get registration link
   * const link = qrService.getReferralLink('MLM-ABCD-1234');
   * // Returns: 'https://app.example.com/register?ref=MLM-ABCD-1234'
   *
   * // Español: Obtener enlace de registro
   * const link = qrService.getReferralLink('MLM-ABCD-1234');
   */
  getReferralLink(referralCode: string): string {
    return `${this.baseUrl}/register?ref=${referralCode}`;
  }

  /**
   * Generate QR code as base64 Data URL
   * Generar código QR como URL de datos base64
   * @param {string} referralCode - User's referral code / Código de referido del usuario
   * @returns {Promise<string>} Base64 data URL (data:image/png;base64,...) / URL de datos base64
   * @example
   * // English: Generate QR for img src
   * const dataUrl = await qrService.generateQRDataUrl('MLM-ABCD-1234');
   * // Use in: <img src={dataUrl} alt="Referral QR" />
   *
   * // Español: Generar QR para src de img
   * const dataUrl = await qrService.generateQRDataUrl('MLM-ABCD-1234');
   */
  async generateQRDataUrl(referralCode: string): Promise<string> {
    const link = this.getReferralLink(referralCode);

    return QRCode.toDataURL(link, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  /**
   * Generate QR code as PNG Buffer
   * Generar código QR como Buffer PNG
   * @param {string} referralCode - User's referral code / Código de referido del usuario
   * @returns {Promise<Buffer>} PNG image buffer / Buffer de imagen PNG
   * @example
   * // English: Save to file or send as response
   * const buffer = await qrService.generateQRBuffer('MLM-ABCD-1234');
   * res.set('Content-Type', 'image/png');
   * res.send(buffer);
   *
   * // Español: Guardar en archivo o enviar como respuesta
   * const buffer = await qrService.generateQRBuffer('MLM-ABCD-1234');
   */
  async generateQRBuffer(referralCode: string): Promise<Buffer> {
    const link = this.getReferralLink(referralCode);

    return QRCode.toBuffer(link, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  /**
   * Generate QR code and save to file
   * Generar código QR y guardar en archivo
   * @param {string} referralCode - User's referral code / Código de referido del usuario
   * @param {string} filePath - Destination file path / Ruta del archivo de destino
   * @returns {Promise<void>} Resolves when file is written / Se resuelve cuando el archivo se escribe
   * @example
   * // English: Save QR to file
   * await qrService.generateQRFile('MLM-ABCD-1234', './qrcodes/user-qr.png');
   *
   * // Español: Guardar QR en archivo
   * await qrService.generateQRFile('MLM-ABCD-1234', './qrcodes/qr-usuario.png');
   */
  async generateQRFile(referralCode: string, filePath: string): Promise<void> {
    const link = this.getReferralLink(referralCode);

    await QRCode.toFile(filePath, link, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 300,
    });
  }

  // ============================================
  // Gift Card QR Methods — Métodos QR de Gift Card
  // ============================================

  /**
   * Generate QR code data URL for a gift card short code
   * Genera URL de datos QR para un código corto de gift card
   *
   * @param shortCode - Short code for the gift card / Código corto de la gift card
   * @returns Base64 data URL (data:image/png;base64,...) / URL de datos base64
   *
   * @example
   * // English: Generate gift card QR
   * const dataUrl = await qrService.generateGiftCardQR('abc123xyz');
   *
   * // Español: Generar QR de gift card
   * const dataUrl = await qrService.generateGiftCardQR('abc123xyz');
   */
  async generateGiftCardQR(shortCode: string): Promise<string> {
    const qrUrl = `${this.baseUrl}/q/${shortCode}`;

    return QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  /**
   * Resolve a short code to its gift card ID, incrementing scan count
   * Resuelve un código corto a su ID de gift card, incrementando contador de escaneos
   *
   * @param shortCode - The short code to resolve / El código corto a resolver
   * @returns Gift card ID or null if not found / ID de gift card o null si no se encontró
   *
   * @example
   * // English: Resolve short code
   * const giftCardId = await qrService.resolveShortCode('abc123xyz');
   *
   * // Español: Resolver código corto
   * const giftCardId = await qrService.resolveShortCode('abc123xyz');
   */
  async resolveShortCode(shortCode: string): Promise<string | null> {
    const mapping = await QrMapping.findOne({ where: { shortCode } });

    if (!mapping) {
      return null;
    }

    // Increment scan count and update last scanned timestamp
    await mapping.update({
      scanCount: mapping.scanCount + 1,
      lastScannedAt: new Date(),
    });

    return mapping.giftCardId;
  }
}

// Export singleton instance
export const qrService = new QRService();
