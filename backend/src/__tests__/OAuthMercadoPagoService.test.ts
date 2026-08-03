/**
 * @fileoverview Unit tests for OAuthMercadoPagoService (A9 / D7 / BE-6)
 * @description PKCE authorization URL with vendor eligibility + state TTL,
 *              idempotent code→token exchange, refresh with invalid_grant
 *              handling, status and disconnect (OAUTH-1..5).
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

// ─── Model mocks ─────────────────────────────────────────────────────────────
const mockVendorFindByPk = jest.fn();
const mockAccountFindOne = jest.fn();
const mockAccountCreate = jest.fn();

jest.mock('../models/index.js', () => {
  class MockVendor {
    static findByPk = mockVendorFindByPk;
    id: string;
    status: string;
    constructor(props: Record<string, unknown> = {}) {
      Object.assign(this, props);
    }
  }

  class MockVendorAccount {
    static findOne = mockAccountFindOne;
    static create = mockAccountCreate;
    vendorId: string;
    mpUserId: string | null;
    codeVerifierEncrypted: string | null;
    stateExpiresAt: Date | null;
    status: string;
    country: string;
    accessTokenEncrypted: string | null;
    refreshTokenEncrypted: string | null;
    accessTokenExpiresAt: Date | null;
    lastConnectedAt: Date | null;
    update: jest.Mock;
    constructor(props: Record<string, unknown> = {}) {
      Object.assign(this, props);
      this.update = jest.fn().mockImplementation((vals: Record<string, unknown>) => {
        Object.assign(this, vals);
        return Promise.resolve(this);
      });
    }
  }
  return { Vendor: MockVendor, VendorMercadoPagoAccount: MockVendorAccount };
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

import {
  oauthMercadoPagoService,
  OAUTH_STATE_TTL_MS,
} from '../services/OAuthMercadoPagoService.js';

const VENDOR_ID = '11111111-1111-4111-8111-111111111111';
const VERIFIER = 'v'.repeat(43); // deterministic 43-char verifier

const accountProps = (overrides: Record<string, unknown> = {}) => ({
  vendorId: VENDOR_ID,
  mpUserId: null,
  codeVerifierEncrypted: `enc:${VERIFIER}`,
  stateExpiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
  status: 'processing',
  country: 'CO',
  accessTokenEncrypted: null,
  refreshTokenEncrypted: null,
  accessTokenExpiresAt: null,
  lastConnectedAt: null,
  ...overrides,
});

describe('OAuthMercadoPagoService (A9 / D7 / BE-6)', () => {
  beforeEach(() => {
    // NOTE: tracking arrays are cumulative — the platform OAuth instance is
    // created once at module import (index 0) and must never be wiped.
    mockVendorFindByPk.mockReset();
    mockAccountFindOne.mockReset();
    mockAccountCreate.mockReset();
    jest.clearAllMocks();
  });

  const approveVendor = () =>
    mockVendorFindByPk.mockResolvedValueOnce(
      new (jest.requireMock('../models/index.js').Vendor)({ id: VENDOR_ID, status: 'approved' })
    );

  describe('buildAuthorizationUrl (OAUTH-1)', () => {
    it('returns a PKCE authorization URL for MercadoPago CO', async () => {
      approveVendor();
      mockAccountFindOne.mockResolvedValueOnce(null);

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

    it('persists an encrypted code_verifier with status processing and state TTL', async () => {
      approveVendor();
      mockAccountFindOne.mockResolvedValueOnce(null);

      await oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID);

      expect(mockAccountCreate).toHaveBeenCalledTimes(1);
      const created = mockAccountCreate.mock.calls[0][0];
      expect(created.vendorId).toBe(VENDOR_ID);
      expect(created.status).toBe('processing');
      expect(created.country).toBe('CO');
      expect(created.codeVerifierEncrypted).toMatch(/^enc:/);
      expect(created.stateExpiresAt).toBeInstanceOf(Date);
      // TTL ≤ 15 min
      const ttl = created.stateExpiresAt.getTime() - Date.now();
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(OAUTH_STATE_TTL_MS);
    });

    it('uses S256 challenge = base64url(sha256(verifier)) and 43-char verifier', async () => {
      approveVendor();
      mockAccountFindOne.mockResolvedValueOnce(null);

      const { url } = await oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID);

      const storedVerifier = mockAccountCreate.mock.calls[0][0].codeVerifierEncrypted.replace(
        'enc:',
        ''
      );
      expect(storedVerifier).toHaveLength(43);
      const expectedChallenge = createHash('sha256').update(storedVerifier).digest('base64url');
      expect(expectedChallenge).toHaveLength(43);
      expect(new URL(url).searchParams.get('code_challenge')).toBe(expectedChallenge);
    });

    it('updates the existing account instead of creating a new one', async () => {
      approveVendor();
      const existing = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({ status: 'connected' })
      );
      mockAccountFindOne.mockResolvedValueOnce(existing);

      await oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID);

      expect(mockAccountCreate).not.toHaveBeenCalled();
      expect(existing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processing',
          codeVerifierEncrypted: expect.stringMatching(/^enc:/),
          stateExpiresAt: expect.any(Date),
        })
      );
    });

    it('rejects non-approved vendors (403)', async () => {
      mockVendorFindByPk.mockResolvedValueOnce(
        new (jest.requireMock('../models/index.js').Vendor)({ id: VENDOR_ID, status: 'pending' })
      );
      await expect(oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID)).rejects.toThrow(
        /not approved/i
      );
      expect(mockAccountCreate).not.toHaveBeenCalled();
    });

    it('rejects unsupported countries (400 MARKETPLACE_COUNTRY_UNSUPPORTED)', async () => {
      approveVendor();
      const envMock = jest.requireMock('../config/env.js');
      envMock.config.marketplace.country = 'MX';
      try {
        await expect(oauthMercadoPagoService.buildAuthorizationUrl(VENDOR_ID)).rejects.toThrow(
          /MARKETPLACE_COUNTRY_UNSUPPORTED/
        );
      } finally {
        envMock.config.marketplace.country = 'CO';
      }
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
  });

  describe('exchangeCodeForToken (OAUTH-2)', () => {
    const state = Buffer.from(VENDOR_ID).toString('base64url');

    it('exchanges the code with client credentials and redirect_uri', async () => {
      mockAccountFindOne.mockResolvedValueOnce(
        new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(accountProps())
      );

      const result = await oauthMercadoPagoService.exchangeCodeForToken({
        code: 'auth-code',
        state,
        vendorId: VENDOR_ID,
      });

      expect(result.alreadyConnected).toBe(false);
      expect(mockOAuthInstances[0].create).toHaveBeenCalledWith({
        body: {
          client_secret: 'app-secret',
          client_id: 'APP_ID-123',
          code: 'auth-code',
          redirect_uri: 'https://api.nexoreal.xyz/api/v1/payment/mercadopago/oauth/callback',
        },
      });
    });

    it('persists tokens encrypted, marks connected and consumes the state', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps()
      );
      mockAccountFindOne.mockResolvedValueOnce(account);

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
          stateExpiresAt: null,
          mpUserId: '123456',
        })
      );
      const updateArgs = account.update.mock.calls[0][0];
      expect(updateArgs.accessTokenExpiresAt).toBeInstanceOf(Date);
      expect(account.status).toBe('connected');
      expect(result.account).toBe(account);
    });

    it('is idempotent: repeated callback does not rewrite tokens', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({
          status: 'connected',
          accessTokenEncrypted: 'enc:EXISTING',
          codeVerifierEncrypted: null,
          stateExpiresAt: null,
        })
      );
      mockAccountFindOne.mockResolvedValueOnce(account);

      const result = await oauthMercadoPagoService.exchangeCodeForToken({
        code: 'auth-code-2',
        state,
        vendorId: VENDOR_ID,
      });

      expect(result.alreadyConnected).toBe(true);
      expect(result.token).toBeNull();
      expect(mockOAuthInstances[0].create).not.toHaveBeenCalled();
      expect(account.update).not.toHaveBeenCalled();
      expect(account.accessTokenEncrypted).toBe('enc:EXISTING');
    });

    it('rejects an expired state', async () => {
      mockAccountFindOne.mockResolvedValueOnce(
        new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
          accountProps({ stateExpiresAt: new Date(Date.now() - 60_000) })
        )
      );
      await expect(
        oauthMercadoPagoService.exchangeCodeForToken({
          code: 'auth-code',
          state,
          vendorId: VENDOR_ID,
        })
      ).rejects.toThrow(/expired/i);
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
      mockAccountFindOne.mockResolvedValueOnce(null);
      await expect(
        oauthMercadoPagoService.exchangeCodeForToken({
          code: 'auth-code',
          state,
          vendorId: VENDOR_ID,
        })
      ).rejects.toThrow(/not found/i);
    });

    it('throws when the OAuth flow was never initiated (no verifier stored)', async () => {
      mockAccountFindOne.mockResolvedValueOnce(
        new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
          accountProps({ codeVerifierEncrypted: null, stateExpiresAt: null, status: 'connected' })
        )
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

  describe('refreshAccessToken (OAUTH-3)', () => {
    it('refreshes with the stored refresh token and persists new tokens', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({ status: 'connected', refreshTokenEncrypted: 'enc:REFRESH_TOKEN' })
      );

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

    it('marks the account expired and throws CONNECT_MP_REQUIRED on invalid_grant', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({ status: 'connected', refreshTokenEncrypted: 'enc:REFRESH_TOKEN' })
      );
      mockOAuthInstances[0].refresh.mockRejectedValueOnce(new Error('invalid_grant'));

      await expect(oauthMercadoPagoService.refreshAccessToken(account as never)).rejects.toThrow(
        /CONNECT_MP_REQUIRED/
      );

      expect(mockOAuthInstances[0].refresh).toHaveBeenCalledTimes(1); // invalid_grant: no retry
      expect(account.status).toBe('expired');
      expect(account.update).toHaveBeenCalledWith({ status: 'expired' });
    });

    it('retries with backoff on transient errors and recovers (OAUTH-3 fallo transitorio)', async () => {
      jest.useFakeTimers({ advanceTimers: true });
      try {
        const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
          accountProps({ status: 'connected', refreshTokenEncrypted: 'enc:REFRESH_TOKEN' })
        );
        mockOAuthInstances[0].refresh
          .mockRejectedValueOnce(new Error('network timeout'))
          .mockRejectedValueOnce(new Error('ECONNRESET'))
          .mockResolvedValueOnce({
            access_token: 'RECOVERED_ACCESS_TOKEN',
            refresh_token: 'RECOVERED_REFRESH_TOKEN',
            expires_in: 21600,
            token_type: 'Bearer',
            live_mode: false,
          });

        const result = await oauthMercadoPagoService.refreshAccessToken(account as never);

        expect(mockOAuthInstances[0].refresh).toHaveBeenCalledTimes(3);
        expect(account.status).toBe('connected');
        expect(account.accessTokenEncrypted).toBe('enc:RECOVERED_ACCESS_TOKEN');
        expect(result.account).toBe(account);
      } finally {
        jest.useRealTimers();
      }
    });

    it('exhausts retries on persistent transient errors and keeps status connected', async () => {
      jest.useFakeTimers({ advanceTimers: true });
      try {
        const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
          accountProps({ status: 'connected', refreshTokenEncrypted: 'enc:REFRESH_TOKEN' })
        );
        mockOAuthInstances[0].refresh
          .mockRejectedValueOnce(new Error('network timeout'))
          .mockRejectedValueOnce(new Error('network timeout'))
          .mockRejectedValueOnce(new Error('network timeout')); // 3 attempts, all transient

        await expect(oauthMercadoPagoService.refreshAccessToken(account as never)).rejects.toThrow(
          /network timeout/
        );

        expect(mockOAuthInstances[0].refresh).toHaveBeenCalledTimes(3);
        expect(account.status).toBe('connected');
        expect(account.update).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('throws when no refresh token is stored', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({ status: 'connected', refreshTokenEncrypted: null })
      );
      await expect(oauthMercadoPagoService.refreshAccessToken(account as never)).rejects.toThrow(
        /refresh token/i
      );
    });
  });

  describe('ensureValidToken (OAUTH-3 lazy refresh)', () => {
    const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600 * 1000);

    it('returns the account unchanged when the token is valid (no refresh)', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({
          status: 'connected',
          accessTokenEncrypted: 'enc:AT',
          refreshTokenEncrypted: 'enc:RT',
          accessTokenExpiresAt: hoursFromNow(2),
        })
      );

      const result = await oauthMercadoPagoService.ensureValidToken(account as never);

      expect(result).toBe(account);
      expect(mockOAuthInstances[0].refresh).not.toHaveBeenCalled();
    });

    it('refreshes when the token expires within the 5-minute margin', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({
          status: 'connected',
          accessTokenEncrypted: 'enc:AT',
          refreshTokenEncrypted: 'enc:RT',
          accessTokenExpiresAt: new Date(Date.now() + 4 * 60 * 1000), // 4 min left
        })
      );

      const result = await oauthMercadoPagoService.ensureValidToken(account as never);

      expect(mockOAuthInstances[0].refresh).toHaveBeenCalled();
      expect(result.status).toBe('connected');
      expect(account.accessTokenEncrypted).toBe('enc:NEW_ACCESS_TOKEN');
    });

    it('refreshes when the token has no expiry stored', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({
          status: 'connected',
          accessTokenEncrypted: 'enc:AT',
          refreshTokenEncrypted: 'enc:RT',
          accessTokenExpiresAt: null,
        })
      );

      await oauthMercadoPagoService.ensureValidToken(account as never);

      expect(mockOAuthInstances[0].refresh).toHaveBeenCalled();
    });

    it('throws CONNECT_MP_REQUIRED when no access token is stored', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({ status: 'connected', accessTokenEncrypted: null })
      );

      await expect(oauthMercadoPagoService.ensureValidToken(account as never)).rejects.toThrow(
        /CONNECT_MP_REQUIRED/
      );
      expect(mockOAuthInstances[0].refresh).not.toHaveBeenCalled();
    });

    it('marks the account expired and throws CONNECT_MP_REQUIRED on invalid_grant refresh', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({
          status: 'connected',
          accessTokenEncrypted: 'enc:AT',
          refreshTokenEncrypted: 'enc:RT',
          accessTokenExpiresAt: new Date(Date.now() - 1000), // already expired
        })
      );
      mockOAuthInstances[0].refresh.mockRejectedValueOnce(new Error('invalid_grant'));

      await expect(oauthMercadoPagoService.ensureValidToken(account as never)).rejects.toThrow(
        /CONNECT_MP_REQUIRED/
      );
      expect(account.status).toBe('expired');
    });
  });

  describe('getConnectionStatus (OAUTH-4)', () => {
    it('returns never when no account row exists', async () => {
      mockAccountFindOne.mockResolvedValueOnce(null);
      await expect(oauthMercadoPagoService.getConnectionStatus(VENDOR_ID)).resolves.toBe('never');
    });

    it('returns the account status when a row exists', async () => {
      mockAccountFindOne.mockResolvedValueOnce(
        new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
          accountProps({ status: 'connected' })
        )
      );
      await expect(oauthMercadoPagoService.getConnectionStatus(VENDOR_ID)).resolves.toBe(
        'connected'
      );
    });
  });

  describe('disconnect (OAUTH-5)', () => {
    it('discards tokens and marks the account disconnected', async () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({
          status: 'connected',
          accessTokenEncrypted: 'enc:AT',
          refreshTokenEncrypted: 'enc:RT',
        })
      );
      mockAccountFindOne.mockResolvedValueOnce(account);

      await oauthMercadoPagoService.disconnect(VENDOR_ID);

      expect(account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          accessTokenEncrypted: null,
          refreshTokenEncrypted: null,
          status: 'disconnected',
        })
      );
    });

    it('is a no-op when no account exists', async () => {
      mockAccountFindOne.mockResolvedValueOnce(null);
      await expect(oauthMercadoPagoService.disconnect(VENDOR_ID)).resolves.toBeUndefined();
    });
  });

  describe('getAuthorizedClient', () => {
    it('returns a MercadoPagoConfig with the decrypted access token', () => {
      const account = new (jest.requireMock('../models/index.js').VendorMercadoPagoAccount)(
        accountProps({ accessTokenEncrypted: 'enc:VENDOR_ACCESS' })
      );

      const client = oauthMercadoPagoService.getAuthorizedClient(account as never);

      expect(client).toBeDefined();
      const created = mockConfigs[mockConfigs.length - 1];
      expect(created.accessToken).toBe('VENDOR_ACCESS');
    });
  });
});
