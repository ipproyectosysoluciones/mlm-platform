/**
 * @fileoverview TwoFactorService - TOTP 2FA utilities
 * @description TOTP secret generation, code verification, and recovery codes
 *             Generación de secrets TOTP, verificación de códigos y códigos de recuperación
 * @module services/TwoFactorService
 */

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

export interface TwoFactorVerifyResult {
  valid: boolean;
  attemptsRemaining?: number;
  lockedUntil?: Date;
}

// ============================================
// CONSTANTS
// ============================================

const SALT_ROUNDS = 12;
const RECOVERY_CODE_COUNT = 8;
const ENCRYPTION_KEY = process.env.TWO_FACTOR_SECRET_KEY || crypto.randomBytes(32).toString('hex');

// ============================================
// ENCRYPTION UTILITIES
// ============================================

/**
 * Encrypt a secret using AES-256-GCM
 * @param {string} plaintext - Secret to encrypt
 * @returns {string} Encrypted secret (base64)
 */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a secret encrypted with AES-256-GCM
 * @param {string} encryptedData - Encrypted secret
 * @returns {string} Decrypted secret
 */
export function decryptSecret(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================
// TOTP SERVICE
// ============================================

export class TwoFactorService {
  /**
   * Generate a new TOTP secret for a user
   * @param {string} userEmail - User's email for label
   * @param {string} issuer - App name for QR code
   * @returns {Promise<TwoFactorSetup>} Setup data including QR code
   */
  static async generateSecret(
    userEmail: string,
    issuer: string = 'MLM Platform'
  ): Promise<TwoFactorSetup> {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `${issuer} (${userEmail})`,
      issuer: issuer,
      length: 20,
    });

    // Generate QR code for authenticator apps
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Generate recovery codes
    const recoveryCodes = this.generateRecoveryCodes();

    return {
      secret: secret.base32 || '',
      otpauthUrl: secret.otpauth_url || '',
      qrCodeUrl,
      recoveryCodes,
    };
  }

  /**
   * Verify a TOTP code against a secret
   * @param {string} code - 6-digit code from authenticator app
   * @param {string} encryptedSecret - Encrypted TOTP secret
   * @returns {TwoFactorVerifyResult} Verification result
   */
  static verifyCode(code: string, encryptedSecret: string): TwoFactorVerifyResult {
    try {
      // Decrypt the secret
      const secret = decryptSecret(encryptedSecret);

      // Verify the code
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: code,
        window: 1, // Allow 1 step tolerance (30 seconds before/after)
      });

      return {
        valid: verified,
      };
    } catch {
      // If decryption fails, code is invalid
      return {
        valid: false,
      };
    }
  }

  /**
   * Generate recovery codes
   * @param {number} count - Number of codes to generate
   * @returns {string[]} Array of recovery codes
   */
  static generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate a random 10-character code
      const code = crypto.randomBytes(5).toString('hex').toUpperCase();
      // Format: XXXX-XXXX
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }

    return codes;
  }

  /**
   * Hash recovery codes for storage
   * @param {string[]} codes - Plain recovery codes
   * @returns {Promise<string>} JSON string of hashed codes
   */
  static async hashRecoveryCodes(codes: string[]): Promise<string> {
    const hashedCodes = await Promise.all(
      codes.map(async (code) => {
        const hash = await bcrypt.hash(code, SALT_ROUNDS);
        return hash;
      })
    );

    return JSON.stringify(hashedCodes);
  }

  /**
   * Verify a recovery code against stored hashes
   * @param {string} code - Recovery code to verify
   * @param {string} hashedCodesJson - JSON string of hashed codes
   * @returns {Promise<{valid: boolean, remainingCodes: string[]}>} Result with remaining codes
   */
  static async verifyRecoveryCode(
    code: string,
    hashedCodesJson: string
  ): Promise<{ valid: boolean; remainingCodes: string[] }> {
    try {
      const hashedCodes: string[] = JSON.parse(hashedCodesJson);
      const normalizedCode = code.toUpperCase().trim();

      for (let i = 0; i < hashedCodes.length; i++) {
        const isMatch = await bcrypt.compare(normalizedCode, hashedCodes[i]);

        if (isMatch) {
          // Remove used code
          hashedCodes.splice(i, 1);

          return {
            valid: true,
            remainingCodes: hashedCodes,
          };
        }
      }

      return {
        valid: false,
        remainingCodes: hashedCodes,
      };
    } catch {
      return {
        valid: false,
        remainingCodes: [],
      };
    }
  }

  /**
   * Encrypt a TOTP secret for storage
   * @param {string} secret - Plain TOTP secret
   * @returns {string} Encrypted secret
   */
  static encryptSecretForStorage(secret: string): string {
    return encryptSecret(secret);
  }

  /**
   * Decrypt a stored TOTP secret
   * @param {string} encryptedSecret - Encrypted secret from storage
   * @returns {string} Decrypted secret
   */
  static decryptSecretFromStorage(encryptedSecret: string): string {
    return decryptSecret(encryptedSecret);
  }
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default TwoFactorService;
