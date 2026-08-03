/**
 * @fileoverview OAuth MercadoPago Service
 * @description OAuth flow for vendor MercadoPago accounts: PKCE authorization
 *              URL, code→token exchange and refresh, with encrypted storage of
 *              tokens via TwoFactorService (D7 / BE-6).
 *              Flujo OAuth para cuentas MercadoPago de vendedores.
 * @module services/OAuthMercadoPagoService
 */

import { createHash, randomBytes } from 'crypto';
import { MercadoPagoConfig, OAuth } from 'mercadopago';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { VendorMercadoPagoAccount } from '../models/index.js';
import { TwoFactorService } from './TwoFactorService.js';

/**
 * Country → authorization base URL
 * País → URL base de autorización
 */
const AUTH_BASE_URLS: Record<string, string> = {
  CO: 'https://auth.mercadopago.com.co',
  MX: 'https://auth.mercadopago.com.mx',
  AR: 'https://auth.mercadopago.com.ar',
  CL: 'https://auth.mercadopago.com.cl',
  ES: 'https://auth.mercadopago.com.es',
};

/** OAuth token response shape (SDK OAuthResponse) */
export interface OAuthTokenResult {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  user_id?: string;
  token_type?: string;
  live_mode?: boolean;
  scope?: string;
  public_key?: string;
}

/**
 * Generate a PKCE code verifier (43 random chars, base64url).
 * Generar un code verifier PKCE (43 caracteres aleatorios, base64url).
 */
function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url'); // 43 chars, no padding
}

/**
 * S256 code challenge = base64url(sha256(codeVerifier))
 */
function generateCodeChallenge(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

class OAuthMercadoPagoService {
  private oauth: OAuth;

  constructor() {
    // The OAuth client does not use the access token, but the SDK requires a config.
    // El cliente OAuth no usa el access token, pero el SDK exige una config.
    this.oauth = new OAuth(new MercadoPagoConfig({ accessToken: '' }));
  }

  /** Guard: marketplace enabled + CO-only / Validar marketplace habilitado y solo CO */
  private assertMarketplaceEnabled(): void {
    if (!config.marketplace.enabled) {
      throw new Error('Marketplace is disabled');
    }
    if (config.marketplace.country !== 'CO') {
      throw new Error(`OAuth MercadoPago only supported for CO, got ${config.marketplace.country}`);
    }
  }

  /**
   * Build the MercadoPago authorization URL with PKCE for a vendor.
   * Construir la URL de autorización de MercadoPago con PKCE para un vendedor.
   *
   * @param vendorId - Vendor id (embedded in state) / Id del vendedor
   * @returns { url, state }
   */
  async buildAuthorizationUrl(vendorId: string): Promise<{ url: string; state: string }> {
    this.assertMarketplaceEnabled();

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = Buffer.from(vendorId).toString('base64url');

    const { clientId, redirectUri, country } = config.marketplace;
    const baseUrl = AUTH_BASE_URLS[country] ?? AUTH_BASE_URLS.CO;

    const url = `${baseUrl}/authorization?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&code_challenge=${encodeURIComponent(
      codeChallenge
    )}&code_challenge_method=S256&state=${encodeURIComponent(state)}`;

    const encryptedVerifier = TwoFactorService.encryptSecretForStorage(codeVerifier);

    const existing = await VendorMercadoPagoAccount.findOne({ where: { vendorId } });
    if (existing) {
      await existing.update({
        codeVerifierEncrypted: encryptedVerifier,
        status: 'processing',
        country,
      });
    } else {
      await VendorMercadoPagoAccount.create({
        vendorId,
        codeVerifierEncrypted: encryptedVerifier,
        status: 'processing',
        country,
      });
    }

    return { url, state };
  }

  /**
   * Exchange the authorization code for tokens and store them encrypted.
   * Intercambiar el código de autorización por tokens y guardarlos cifrados.
   *
   * @param params - { code, state, vendorId }
   * @returns { account, token }
   */
  async exchangeCodeForToken(params: {
    code: string;
    state?: string;
    vendorId?: string;
  }): Promise<{ account: VendorMercadoPagoAccount; token: OAuthTokenResult }> {
    this.assertMarketplaceEnabled();

    const { code, state } = params;
    if (!state) {
      throw new Error('OAuth state is required');
    }

    let vendorId: string;
    try {
      vendorId = Buffer.from(state, 'base64url').toString('utf8');
    } catch {
      throw new Error('Invalid OAuth state');
    }
    if (params.vendorId && params.vendorId !== vendorId) {
      throw new Error('OAuth state does not match the vendor');
    }

    const account = await VendorMercadoPagoAccount.findOne({ where: { vendorId } });
    if (!account) {
      throw new Error('Vendor MercadoPago account not found');
    }
    if (!account.codeVerifierEncrypted) {
      throw new Error('OAuth flow was not initiated for this vendor');
    }

    const { clientId, clientSecret, redirectUri } = config.marketplace;
    const token = (await this.oauth.create({
      body: {
        client_secret: clientSecret,
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
      },
    })) as unknown as OAuthTokenResult;

    const accessTokenExpiresAt = new Date(Date.now() + token.expires_in * 1000);

    await account.update({
      mpUserId: token.user_id ?? account.mpUserId,
      accessTokenEncrypted: TwoFactorService.encryptSecretForStorage(token.access_token),
      refreshTokenEncrypted: token.refresh_token
        ? TwoFactorService.encryptSecretForStorage(token.refresh_token)
        : account.refreshTokenEncrypted,
      accessTokenExpiresAt,
      codeVerifierEncrypted: null,
      status: 'connected',
      lastConnectedAt: new Date(),
    });

    return { account, token };
  }

  /**
   * Refresh the access token of a vendor account.
   * Renovar el access token de la cuenta de un vendedor.
   *
   * @param vendorAccount - Account with a stored refresh token
   * @returns { account, token }
   */
  async refreshAccessToken(
    vendorAccount: VendorMercadoPagoAccount
  ): Promise<{ account: VendorMercadoPagoAccount; token: OAuthTokenResult }> {
    if (!vendorAccount.refreshTokenEncrypted) {
      throw new Error('Vendor MercadoPago account has no refresh token');
    }

    const refreshToken = TwoFactorService.decryptSecretFromStorage(
      vendorAccount.refreshTokenEncrypted
    );
    const { clientId, clientSecret } = config.marketplace;

    const token = (await this.oauth.refresh({
      body: {
        client_secret: clientSecret,
        client_id: clientId,
        refresh_token: refreshToken,
      },
    })) as unknown as OAuthTokenResult;

    const accessTokenExpiresAt = new Date(Date.now() + token.expires_in * 1000);

    await vendorAccount.update({
      accessTokenEncrypted: TwoFactorService.encryptSecretForStorage(token.access_token),
      refreshTokenEncrypted: token.refresh_token
        ? TwoFactorService.encryptSecretForStorage(token.refresh_token)
        : vendorAccount.refreshTokenEncrypted,
      accessTokenExpiresAt,
      status: 'connected',
    });

    return { account: vendorAccount, token };
  }

  /**
   * Build a MercadoPagoConfig authorized with the vendor access token.
   * Construir un MercadoPagoConfig autorizado con el access token del vendedor.
   *
   * @param vendorAccount - Account with a stored access token
   */
  getAuthorizedClient(vendorAccount: VendorMercadoPagoAccount): MercadoPagoConfig {
    if (!vendorAccount.accessTokenEncrypted) {
      throw new Error('Vendor MercadoPago account has no access token');
    }
    const accessToken = TwoFactorService.decryptSecretFromStorage(
      vendorAccount.accessTokenEncrypted
    );
    return new MercadoPagoConfig({ accessToken });
  }
}

export const oauthMercadoPagoService = new OAuthMercadoPagoService();

export default oauthMercadoPagoService;
