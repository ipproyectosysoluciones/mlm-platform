/**
 * @fileoverview Unit tests for OAuthMercadoPagoService (A9 / D7 / BE-6)
 * @description PKCE authorization URL build, code→token exchange, token refresh
 *              and encrypted token persistence for vendor accounts (CO-only).
 * @module __tests__/OAuthMercadoPagoService
 */

import { createHash } from 'crypto';

// ─── SDK mock (tracks instances) ─────────────────────────────────────────────
const mockConfigs: Array<{ accessToken: string }> = [];
const mockOAuthInstances: any[] = [];

jest.mock('mercadopago', () => {
  class MockMercadoPagoConfig {
    accessToken: string;
    constructor(opts: { accessToken: string }) {
      this.accessToken = opts.accessToken;
      mockConfigs.push(this);
    }
  }

  class MockOAuth {
    config: { accessToken: string };
    create: jest.Mock;
    refresh: jest.Mock;
    getAuthorizationURL: jest.Mock;
    constructor(config: { accessToken: string }) {
      this.config = config;
      this.create = jest.fn().mockResolvedValue({
        access_token: 'ACCESS_TOKEN',
        refresh_token: 'REFRESH_TOKEN',
        expires_in: 21600,
        user_id: '123456',
        token_type: 'Bearer',
        live_mode: false,
      });
      this.refresh = jest.fn().mockResolvedValue({
        access_token: 'NEW_ACCESS_TOKEN',
        refresh_token: 'NEW_REFRESH_TOKEN',
        expires_in: 21600,
        token_type: 'Bearer',
        live_mode: false,
      });
      this.getAuthorizationURL = jest
        .fn()
        .mockReturnValue('https://sandbox.mercadopago.com.co/authorization?legacy=1');
      mockOAuthInstances.push(this);
    }
  }

  return { MercadoPagoConfig: MockMercadoPagoConfig, OAuth: MockOAuth };
});

// ─── Env mock (mutable for guard tests) ──────────────────────────────────────
jest.mock('../config/env.js', () => ({
  config: {
    marketplace: {
      enabled: true,
      clientId: 'APP_ID-123',
      clientSecret: 'app-secret',
      redirectUri: 'https://api.nexoreal.xyz/api/v1/payment/mercadopago/oauth/callback',
      country: 'CO',
    },
    mercadopago: { accessToken: 'platform-token', webhookSecret: '' },
  },
}));

// ─── Model mock ──────────────────────────────────────────────────────────────
const mockFindOne = jest.fn();
const mockCreate = jest.fn();

jest.mock('../models/index.js', () => {
  class MockVendorAccount {
    static findOne = mockFindOne;
    static create = mockCreate;
    vendorId: string;
    codeVerifierEncrypted: string | null;
    status: string;
    country: string;
    accessTokenEncrypted: string | null;
    refreshTokenEncrypted: string | null;
    accessTokenExpiresAt: Date | null;
    update: jest.Mock;
    constructor(props: Record<string, unknown> = {}) {
      Object.assign(this, props);
      this.update = jest.fn().mockImplementation((vals: Record<string, unknown>) => {
        Object.assign(this, vals);
        return Promise.resolve(this);
      });
    }
  }
  return { VendorMercadoPagoAccount: MockVendorAccount };
});

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
  },
}));

jest.mock('../services/TwoFactorService.js', () => {
  class MockTwoFactorService {
    static encryptSecretForStorage(secret: string): string {
      return `enc:${secret}`;
    }
    static decryptSecretFromStorage(encrypted: string): string {
      return encrypted.replace(/^enc:/, '');
    }
  }
  return { TwoFactorService: MockTwoFactorService };
});

import { oauthMercadoPagoService } from '../services/OAuthMercadoPagoService.js';

const VENDOR_ID = '11111111-1111-4111-8111-111111111111';

describe('OAuthMercadoPagoService (A9 / D7 / BE-6)', () => {
  beforeEach(() => {
    // NOTE: tracking arrays are cumulative — the platform OAuth instance and
    // its client are created once at module import (index 0) and must never
    // be wiped from the arrays.
    mockFindOne.mockReset();
    mockCreate.mockReset();
    jest.clearAllMocks();
  });

  describe('buildAuthorizationUrl', () => {
    it('returns a PKCE authorization URL for MercadoPago CO', async () => {
      mockFindOne.mockResolvedValueOnce(null);

      const { url, state } = await oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID);

      expect(url.startsWith('https://auth.mercadopago.com.co/authorization')).toBe(true);
      const params = new URL(url).searchParams;
      expect(params.get('client_id')).toBe('APP_ID-123');
      expect(params.get('redirect_uri')).toBe(
        'https://api.nexoreal.xyz/api/v1/payment/mercadopago/oauth/callback'
      );
      expect(params.get('response_type')).toBe('code');
      expect(params.get('code_challenge_method')).toBe('S256');
      expect(params.get('code_challenge')).toHaveLength(43);
      expect(state).toBe(Buffer.from(VENDOR_ID).toString('base64url'));
      expect(params.get('state')).toBe(state);
    });

    it('persists an encrypted code_verifier with status processing', async () => {
      mockFindOne.mockResolvedValueOnce(null);

      await oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const created = mockCreate.mock.calls[0][0];
      expect(created.vendorId).toBe(VENDOR_ID);
      expect(created.status).toBe('processing');
      expect(created.country).toBe('CO');
      expect(created.codeVerifierEncrypted).toMatch(/^enc:/);
    });

    it('uses S256 challenge = base64url(sha256(verifier)) and 43-char verifier', async () => {
      mockFindOne.mockResolvedValueOnce(null);

      const { url } = await oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID);

      const storedVerifier = mockCreate.mock.calls[0][0].codeVerifierEncrypted.replace('enc:', '');
      expect(storedVerifier).toHaveLength(43);
      const expectedChallenge = createHash('sha256').update(storedVerifier).digest('base64url');
      expect(expectedChallenge).toHaveLength(43);
      expect(new URL(url).searchParams.get('code_challenge')).toBe(expectedChallenge);
    });

    it('updates the existing account instead of creating a new one', async () => {
      const existing = {
        vendorId: VENDOR_ID,
        status: 'connected',
        country: 'CO',
        codeVerifierEncrypted: 'enc:old',
        update: jest.fn().mockImplementation(function (this: any, vals: any) {
          Object.assign(this, vals);
          return Promise.resolve(this);
        }),
      };
      mockFindOne.mockResolvedValueOnce(existing);

      await oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID);

      expect(mockCreate).not.toHaveBeenCalled();
      expect(existing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processing',
          codeVerifierEncrypted: expect.stringMatching(/^enc:/),
        })
      );
    });

    it('rejects when the marketplace is disabled', async () => {
      const envMock = jest.requireMock('../config/env.js');
      envMock.config.marketplace.enabled = false;
      try {
        await expect(oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID)).rejects.toThrow(
          /disabled/i
        );
      } finally {
        envMock.config.marketplace.enabled = true;
      }
    });

    it('rejects when the configured country is not CO', async () => {
      const envMock = jest.requireMock('../config/env.js');
      envMock.config.marketplace.country = 'MX';
      try {
        await expect(oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID)).rejects.toThrow(
          /CO/i
        );
      } finally {
        envMock.config.marketplace.country = 'CO';
      }
    });
  });

  describe('exchangeCodeForToken', () => {
    const state = Buffer.from(VENDOR_ID).toString('base64url');

    it('exchanges the code with client credentials and redirect_uri', async () => {
      mockFindOne.mockResolvedValueOnce(
        new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)({
          vendorId: VENDOR_ID,
          status: 'processing',
          codeVerifierEncrypted: 'enc:verifier-43-chars-xxxxxxxxxxxxxxxxxxxxxxxx',
        })
      );

      await oauthMercadoPagoService.exchangeCodeForToken({
        code: 'auth-code',
        state,
        vendorId: VENDOR_ID,
      });

      expect(mockOAuthInstances[0].create).toHaveBeenCalledWith({
        body: {
          client_secret: 'app-secret',
          client_id: 'APP_ID-123',
          code: 'auth-code',
          redirect_uri: 'https://api.nexoreal.xyz/api/v1/payment/mercadopago/oauth/callback',
        },
      });
    });

    it('persists tokens encrypted and marks the account connected', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)({
        vendorId: VENDOR_ID,
        status: 'processing',
        codeVerifierEncrypted: 'enc:verifier-43-chars-xxxxxxxxxxxxxxxxxxxxxxxx',
      });
      mockFindOne.mockResolvedValueOnce(account);

      const result = await oauthMercadoPagoService.exchangeCodeForToken({
        code: 'auth-code',
        state,
        vendorId: VENDOR_ID,
      });

      expect(account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          accessTokenEncrypted: 'enc:ACCESS_TOKEN',
          refreshTokenEncrypted: 'enc:REFRESH_TOKEN',
          status: 'connected',
          codeVerifierEncrypted: null,
        })
      );
      const updateArgs = account.update.mock.calls[0][0];
      expect(updateArgs.accessTokenExpiresAt).toBeInstanceOf(Date);
      expect(account.status).toBe('connected');
      expect(result.account).toBe(account);
    });

    it('throws when the state does not decode to the given vendorId', async () => {
      await expect(
        oauthMercadoPagoService.exchangeCodeForToken({
          code: 'auth-code',
          state,
          vendorId: '99999999-9999-4999-8999-999999999999',
        })
      ).rejects.toThrow(/state/i);
    });

    it('throws when no account is found for the vendor', async () => {
      mockFindOne.mockResolvedValueOnce(null);
      await expect(
        oauthMercadoPagoService.exchangeCodeForToken({
          code: 'auth-code',
          state,
          vendorId: VENDOR_ID,
        })
      ).rejects.toThrow(/not found/i);
    });

    it('throws when the OAuth flow was never initiated (no verifier stored)', async () => {
      mockFindOne.mockResolvedValueOnce(
        new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)({
          vendorId: VENDOR_ID,
          status: 'connected',
          codeVerifierEncrypted: null,
        })
      );
      await expect(
        oauthMercadoPagoService.exchangeCodeForToken({
          code: 'auth-code',
          state,
          vendorId: VENDOR_ID,
        })
      ).rejects.toThrow(/initiated|verifier/i);
    });
  });

  describe('refreshAccessToken', () => {
    it('refreshes with the stored refresh token and persists new tokens', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)({
        vendorId: VENDOR_ID,
        status: 'connected',
        refreshTokenEncrypted: 'enc:REFRESH_TOKEN',
      });

      const result = await oauthMercadoPagoService.refreshAccessToken(account as never);

      expect(mockOAuthInstances[0].refresh).toHaveBeenCalledWith({
        body: {
          client_secret: 'app-secret',
          client_id: 'APP_ID-123',
          refresh_token: 'REFRESH_TOKEN',
        },
      });
      expect(account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          accessTokenEncrypted: 'enc:NEW_ACCESS_TOKEN',
          refreshTokenEncrypted: 'enc:NEW_REFRESH_TOKEN',
        })
      );
      expect(result.account).toBe(account);
    });

    it('throws when no refresh token is stored', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)({
        vendorId: VENDOR_ID,
        status: 'connected',
        refreshTokenEncrypted: null,
      });
      await expect(oauthMercadoPagoService.refreshAccessToken(account as never)).rejects.toThrow(
        /refresh token/i
      );
    });
  });

  describe('getAuthorizedClient', () => {
    it('returns a MercadoPagoConfig with the decrypted access token', () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)({
        accessTokenEncrypted: 'enc:VENDOR_ACCESS',
      });

      const client = oauthMercadoPagoService.getAuthorizedClient(account as never);

      expect(client).toBeDefined();
      const created = mockConfigs[mockConfigs.length - 1];
      expect(created.accessToken).toBe('VENDOR_ACCESS');
    });
  });
});
