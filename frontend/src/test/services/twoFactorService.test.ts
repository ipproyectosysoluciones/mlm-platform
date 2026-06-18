/**
 * @fileoverview twoFactorService unit tests
 * @description Tests that twoFactorService methods call the correct API endpoints
 *              using the global axios mock from setup.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { twoFactorService } from '../../services/twoFactorService';

// The global axios mock in setup.ts intercepts all HTTP calls
// api.post and api.get return { data: { success: true, data: null } }
import api from '../../services/api';

describe('twoFactorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // getStatus
  // ==========================================

  describe('getStatus', () => {
    it('calls GET /auth/2fa/status', async () => {
      const getSpy = vi.mocked(api.get);

      await twoFactorService.getStatus();

      expect(getSpy).toHaveBeenCalledWith('/auth/2fa/status');
    });

    it('returns data.data (extracts from wrapper)', async () => {
      // Global mock returns { data: { success: true, data: null } }
      // getStatus returns response.data.data!
      const result = await twoFactorService.getStatus();
      // null because the global mock's `data` field is null
      expect(result).toBeNull();
    });
  });

  // ==========================================
  // setup
  // ==========================================

  describe('setup', () => {
    it('calls POST /auth/2fa/setup', async () => {
      const postSpy = vi.mocked(api.post);

      await twoFactorService.setup();

      expect(postSpy).toHaveBeenCalledWith('/auth/2fa/setup');
    });

    it('returns setup response data', async () => {
      const result = await twoFactorService.setup();
      expect(result).toBeNull();
    });
  });

  // ==========================================
  // verifySetup
  // ==========================================

  describe('verifySetup', () => {
    it('calls POST /auth/2fa/verify-setup with code', async () => {
      const postSpy = vi.mocked(api.post);

      await twoFactorService.verifySetup('123456');

      expect(postSpy).toHaveBeenCalledWith('/auth/2fa/verify-setup', { code: '123456' });
    });

    it('returns verify-setup response data', async () => {
      const result = await twoFactorService.verifySetup('123456');
      expect(result).toBeNull();
    });
  });

  // ==========================================
  // verify (during settings)
  // ==========================================

  describe('verify', () => {
    it('calls POST /auth/2fa/verify with code', async () => {
      const postSpy = vi.mocked(api.post);

      await twoFactorService.verify('654321');

      expect(postSpy).toHaveBeenCalledWith('/auth/2fa/verify', { code: '654321' });
    });

    it('returns verification response data', async () => {
      const result = await twoFactorService.verify('654321');
      expect(result).toBeNull();
    });
  });

  // ==========================================
  // disable
  // ==========================================

  describe('disable', () => {
    it('calls POST /auth/2fa/disable with code', async () => {
      const postSpy = vi.mocked(api.post);

      await twoFactorService.disable('000000');

      expect(postSpy).toHaveBeenCalledWith('/auth/2fa/disable', { code: '000000' });
    });

    it('returns disable response data', async () => {
      const result = await twoFactorService.disable('000000');
      expect(result).toBeNull();
    });
  });

  // ==========================================
  // verifyLogin (with temp token)
  // ==========================================

  describe('verifyLogin', () => {
    it('calls POST /auth/2fa/verify with code and temp token header', async () => {
      const postSpy = vi.mocked(api.post);
      const tempToken = 'temp-jwt-token-abc';

      await twoFactorService.verifyLogin('111111', tempToken);

      expect(postSpy).toHaveBeenCalledWith(
        '/auth/2fa/verify',
        { code: '111111' },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
    });

    it('returns verify response data', async () => {
      const result = await twoFactorService.verifyLogin('111111', 'temp-token');
      expect(result).toBeNull();
    });
  });

  // ==========================================
  // getUserWithToken (temp token)
  // ==========================================

  describe('getUserWithToken', () => {
    it('calls GET /auth/me with temp token header', async () => {
      const getSpy = vi.mocked(api.get);
      const tempToken = 'temp-jwt-token-xyz';

      await twoFactorService.getUserWithToken(tempToken);

      expect(getSpy).toHaveBeenCalledWith('/auth/me', {
        headers: { Authorization: `Bearer ${tempToken}` },
      });
    });

    it('returns user data from response', async () => {
      const result = await twoFactorService.getUserWithToken('temp-token');
      expect(result).toBeNull();
    });
  });
});
