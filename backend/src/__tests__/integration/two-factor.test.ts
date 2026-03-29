/**
 * @fileoverview Two-Factor Authentication Integration Tests
 * @description Tests for 2FA API endpoints: status, setup, verify, disable
 *             Pruebas para endpoints API de 2FA: estado, configuración, verificación, deshabilitar
 * @module __tests__/integration/two-factor
 * @requires supertest
 * @requires fixtures
 */

import { testAgent } from '../setup';
import { createTestUser, getAuthHeaders } from '../fixtures';
import * as speakeasy from 'speakeasy';
import { TwoFactorService } from '../../services/TwoFactorService';

describe('Two-Factor Authentication Integration Tests', () => {
  describe('GET /api/auth/2fa/status', () => {
    it('should return 401 without token', async () => {
      const res = await testAgent.get('/api/auth/2fa/status').expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return 2FA status when authenticated', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.get('/api/auth/2fa/status').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('enabled');
      expect(res.body.data).toHaveProperty('enabledAt');
      expect(res.body.data).toHaveProperty('method');
      expect(res.body.data.enabled).toBe(false);
      expect(res.body.data.method).toBe('totp');
    });

    it('should return enabled status for user with 2FA enabled', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Generate and enable 2FA for user
      const setup = await TwoFactorService.generateSecret(user.email);
      const encryptedSecret = TwoFactorService.encryptSecretForStorage(setup.secret);
      const recoveryCodes = TwoFactorService.generateRecoveryCodes();
      const hashedCodes = await TwoFactorService.hashRecoveryCodes(recoveryCodes);

      await user.update({
        twoFactorEnabled: true,
        twoFactorSecretEncrypted: encryptedSecret,
        twoFactorRecoveryCodesHash: hashedCodes,
        twoFactorEnabledAt: new Date(),
      });

      const res = await testAgent.get('/api/auth/2fa/status').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.enabled).toBe(true);
      expect(res.body.data.enabledAt).not.toBeNull();
    });
  });

  describe('POST /api/auth/2fa/setup', () => {
    it('should return 401 without token', async () => {
      const res = await testAgent.post('/api/auth/2fa/setup').expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should generate QR code for user without 2FA', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent.post('/api/auth/2fa/setup').set(headers).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('qrCodeUrl');
      expect(res.body.data).toHaveProperty('secret');
      expect(res.body.data).toHaveProperty('expiresIn');
      expect(res.body.data.qrCodeUrl).toContain('data:image');
    });

    it('should return error if 2FA already enabled', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Enable 2FA first
      const setup = await TwoFactorService.generateSecret(user.email);
      const encryptedSecret = TwoFactorService.encryptSecretForStorage(setup.secret);
      const recoveryCodes = TwoFactorService.generateRecoveryCodes();
      const hashedCodes = await TwoFactorService.hashRecoveryCodes(recoveryCodes);

      await user.update({
        twoFactorEnabled: true,
        twoFactorSecretEncrypted: encryptedSecret,
        twoFactorRecoveryCodesHash: hashedCodes,
        twoFactorEnabledAt: new Date(),
      });

      const res = await testAgent.post('/api/auth/2fa/setup').set(headers).expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TWO_FA_ALREADY_ENABLED');
    });
  });

  describe('POST /api/auth/2fa/verify-setup', () => {
    it('should return 401 without token', async () => {
      const res = await testAgent
        .post('/api/auth/2fa/verify-setup')
        .send({ code: '123456' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return error without pending setup', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/auth/2fa/verify-setup')
        .set(headers)
        .send({ code: '123456' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TWO_FA_SETUP_NOT_FOUND');
    });

    it('should enable 2FA with valid code', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // First, initiate setup and capture the returned secret
      const setupRes = await testAgent.post('/api/auth/2fa/setup').set(headers).expect(200);

      const { secret } = setupRes.body.data;

      // Generate a valid code using the SAME secret returned from setup
      const validCode = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      const res = await testAgent
        .post('/api/auth/2fa/verify-setup')
        .set(headers)
        .send({ code: validCode })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('recoveryCodes');
      expect(res.body.data.recoveryCodes).toHaveLength(8);
      expect(res.body.data.message).toContain('enabled successfully');

      // Verify 2FA is now enabled
      await user.reload();
      expect(user.twoFactorEnabled).toBe(true);
      expect(user.twoFactorSecretEncrypted).not.toBeNull();
    });

    it('should reject invalid code during setup', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Initiate setup
      await testAgent.post('/api/auth/2fa/setup').set(headers);

      // Try with invalid code
      const res = await testAgent
        .post('/api/auth/2fa/verify-setup')
        .set(headers)
        .send({ code: '000000' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TWO_FA_INVALID_CODE');

      // Verify 2FA is still disabled
      await user.reload();
      expect(user.twoFactorEnabled).toBe(false);
    });
  });

  describe('POST /api/auth/2fa/disable', () => {
    it('should return 401 without token', async () => {
      const res = await testAgent
        .post('/api/auth/2fa/disable')
        .send({ code: '123456' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return error when 2FA not enabled', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/auth/2fa/disable')
        .set(headers)
        .send({ code: '123456' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TWO_FA_NOT_ENABLED');
    });

    it('should disable 2FA with valid TOTP code', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Enable 2FA first
      const setup = await TwoFactorService.generateSecret(user.email);
      const encryptedSecret = TwoFactorService.encryptSecretForStorage(setup.secret);
      const recoveryCodes = TwoFactorService.generateRecoveryCodes();
      const hashedCodes = await TwoFactorService.hashRecoveryCodes(recoveryCodes);

      await user.update({
        twoFactorEnabled: true,
        twoFactorSecretEncrypted: encryptedSecret,
        twoFactorRecoveryCodesHash: hashedCodes,
        twoFactorEnabledAt: new Date(),
      });

      // Generate valid TOTP code
      const validCode = speakeasy.totp({
        secret: setup.secret,
        encoding: 'base32',
      });

      const res = await testAgent
        .post('/api/auth/2fa/disable')
        .set(headers)
        .send({ code: validCode })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('disabled');

      // Verify 2FA is now disabled
      await user.reload();
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.twoFactorSecretEncrypted).toBeNull();
    });

    it('should disable 2FA with valid recovery code', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Enable 2FA first
      const setup = await TwoFactorService.generateSecret(user.email);
      const encryptedSecret = TwoFactorService.encryptSecretForStorage(setup.secret);
      const recoveryCodes = TwoFactorService.generateRecoveryCodes();
      const hashedCodes = await TwoFactorService.hashRecoveryCodes(recoveryCodes);

      await user.update({
        twoFactorEnabled: true,
        twoFactorSecretEncrypted: encryptedSecret,
        twoFactorRecoveryCodesHash: hashedCodes,
        twoFactorEnabledAt: new Date(),
      });

      // Use a recovery code
      const recoveryCode = recoveryCodes[0];

      const res = await testAgent
        .post('/api/auth/2fa/disable')
        .set(headers)
        .send({ code: recoveryCode })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('recovery code');

      // Verify 2FA is now disabled
      await user.reload();
      expect(user.twoFactorEnabled).toBe(false);
    });

    it('should reject invalid code when disabling', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Enable 2FA first
      const setup = await TwoFactorService.generateSecret(user.email);
      const encryptedSecret = TwoFactorService.encryptSecretForStorage(setup.secret);
      const recoveryCodes = TwoFactorService.generateRecoveryCodes();
      const hashedCodes = await TwoFactorService.hashRecoveryCodes(recoveryCodes);

      await user.update({
        twoFactorEnabled: true,
        twoFactorSecretEncrypted: encryptedSecret,
        twoFactorRecoveryCodesHash: hashedCodes,
        twoFactorEnabledAt: new Date(),
      });

      const res = await testAgent
        .post('/api/auth/2fa/disable')
        .set(headers)
        .send({ code: '000000' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TWO_FA_INVALID_CODE');

      // Verify 2FA is still enabled
      await user.reload();
      expect(user.twoFactorEnabled).toBe(true);
    });
  });

  describe('POST /api/auth/2fa/verify', () => {
    it('should return 401 without token', async () => {
      const res = await testAgent.post('/api/auth/2fa/verify').send({ code: '123456' }).expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should return error when 2FA not enabled', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      const res = await testAgent
        .post('/api/auth/2fa/verify')
        .set(headers)
        .send({ code: '123456' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TWO_FA_NOT_ENABLED');
    });

    it('should verify valid TOTP code', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Enable 2FA first
      const setup = await TwoFactorService.generateSecret(user.email);
      const encryptedSecret = TwoFactorService.encryptSecretForStorage(setup.secret);
      const recoveryCodes = TwoFactorService.generateRecoveryCodes();
      const hashedCodes = await TwoFactorService.hashRecoveryCodes(recoveryCodes);

      await user.update({
        twoFactorEnabled: true,
        twoFactorSecretEncrypted: encryptedSecret,
        twoFactorRecoveryCodesHash: hashedCodes,
        twoFactorEnabledAt: new Date(),
      });

      // Generate valid TOTP code
      const validCode = speakeasy.totp({
        secret: setup.secret,
        encoding: 'base32',
      });

      const res = await testAgent
        .post('/api/auth/2fa/verify')
        .set(headers)
        .send({ code: validCode })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.verified).toBe(true);
    });

    it('should reject invalid TOTP code', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Enable 2FA first
      const setup = await TwoFactorService.generateSecret(user.email);
      const encryptedSecret = TwoFactorService.encryptSecretForStorage(setup.secret);
      const recoveryCodes = TwoFactorService.generateRecoveryCodes();
      const hashedCodes = await TwoFactorService.hashRecoveryCodes(recoveryCodes);

      await user.update({
        twoFactorEnabled: true,
        twoFactorSecretEncrypted: encryptedSecret,
        twoFactorRecoveryCodesHash: hashedCodes,
        twoFactorEnabledAt: new Date(),
      });

      const res = await testAgent
        .post('/api/auth/2fa/verify')
        .set(headers)
        .send({ code: '000000' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TWO_FA_INVALID_CODE');
    });

    it('should reject recovery code in verify endpoint', async () => {
      const user = await createTestUser();
      const headers = await getAuthHeaders(user);

      // Enable 2FA first
      const setup = await TwoFactorService.generateSecret(user.email);
      const encryptedSecret = TwoFactorService.encryptSecretForStorage(setup.secret);
      const recoveryCodes = TwoFactorService.generateRecoveryCodes();
      const hashedCodes = await TwoFactorService.hashRecoveryCodes(recoveryCodes);

      await user.update({
        twoFactorEnabled: true,
        twoFactorSecretEncrypted: encryptedSecret,
        twoFactorRecoveryCodesHash: hashedCodes,
        twoFactorEnabledAt: new Date(),
      });

      // Recovery codes are not 6-digit numeric, so they should be rejected
      // Note: verify2FA only accepts TOTP codes, not recovery codes
      // Recovery codes are only valid for /api/auth/2fa/disable endpoint
      const recoveryCode = recoveryCodes[0];

      // Recovery codes fail the isNumeric() validation
      const res = await testAgent
        .post('/api/auth/2fa/verify')
        .set(headers)
        .send({ code: recoveryCode })
        .expect(400);

      expect(res.body.success).toBe(false);
      // The error should be a validation error since recovery codes aren't numeric
      expect(['VALIDATION_ERROR', 'TWO_FA_INVALID_CODE']).toContain(res.body.error.code);
    });
  });
});
