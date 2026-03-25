/**
 * @fileoverview SMS Service - Brevo API implementation
 * @description Service for sending transactional SMS via Brevo API
 * @module services/SMSService
 */
import axios from 'axios';
import { config } from '../config/env';

/**
 * SMSService - Brevo SMS delivery
 * Servicio de SMS - Envío de SMS via Brevo API
 */
export class SMSService {
  /**
   * Send verification code via SMS
   * Envía código de verificación vía SMS
   * @param phone - Phone number in E.164 format (+1234567890)
   * @returns Promise<{ success: boolean; error?: string }>
   */
  async sendVerificationCode(phone: string): Promise<{ success: boolean; error?: string }> {
    if (!config.brevoApiKey) {
      return { success: false, error: 'Brevo API key not configured' };
    }

    // Validate E.164 format: + followed by country code and number (max 15 digits)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phone)) {
      return {
        success: false,
        error: 'Invalid phone number format. Use E.164 format (+1234567890)',
      };
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const message = `Tu código de verificación es: ${code}`;

    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/sms/send',
        {
          recipient: phone, // E.164 format required
          sender: config.brevoSmsSender, // Can be alphanumeric (max 11 chars) or numeric
          content: message,
        },
        {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            'api-key': config.brevoApiKey,
          },
        }
      );

      // SMS sent successfully - code would be stored for verification elsewhere
      // (storage logic would be in NotificationService or AuthController)
      return { success: true };
    } catch (error: any) {
      console.error('SMS send failed (Brevo API):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Unknown error sending SMS',
      };
    }
  }

  /**
   * Verify code (logic remains the same regardless of provider)
   * Verifica código (la lógica es la misma independientemente del proveedor)
   * @param submittedCode - Code submitted by user
   * @param storedCode - Code that was sent and stored
   * @param storedExpiry - Expiration date of the stored code
   * @returns { valid: boolean; error?: string }
   */
  verifyCode(
    submittedCode: string,
    storedCode: string,
    storedExpiry: Date
  ): { valid: boolean; error?: string } {
    const now = new Date();

    if (now > storedExpiry) {
      return { valid: false, error: 'Code expired' };
    }

    if (storedCode !== submittedCode) {
      return { valid: false, error: 'Invalid code' };
    }

    return { valid: true };
  }
}

export const smsService = new SMSService();
