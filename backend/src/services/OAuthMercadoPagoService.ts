/**
 * @fileoverview OAuth MercadoPago Service
 * @description OAuth flow for vendor MercadoPago accounts: PKCE authorization
 *              URL with state TTL, code→token exchange (idempotent), refresh
 *              with invalid_grant handling, connection status and disconnect.
 *              Tokens are persisted encrypted via TwoFactorService (D7 / BE-6).
 *              Flujo OAuth para cuentas MercadoPago de vendedores.
 * @module services/OAuthMercadoPagoService
 */

import { createHash, randomBytes } from 'crypto';
import { MercadoPagoConfig, OAuth } from 'mercadopago';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Vendor, VendorMercadoPagoAccount } from '../models/index.js';
import { TwoFactorService } from './TwoFactorService.js';

/** OAuth state TTL in ms (≤ 15 min per OAUTH-1) / TTL del state en ms */
export const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

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

/** Connection status exposed to the dashboard (OAUTH-4) */
export type ConnectionStatus = 'connected' | 'expired' | 'never' | 'processing' | 'disconnected';

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

/**
 * Detect an invalid_grant error from the SDK (refresh_token revoked/expired).
 * Detectar un error invalid_grant del SDK (refresh_token revocado/vencido).
 */
function isInvalidGrantError(error: unknown): boolean {
  const err = error as { message?: string; cause?: { message?: string } };
  return (
    /invalid_grant/i.test(err?.message ?? '') || /invalid_grant/i.test(err?.cause?.message ?? '')
  );
}

class OAuthMercadoPagoService {
  private oauth: OAuth;

  constructor() {
    // The OAuth client does not use the access token, but the SDK requires a config.
    // El cliente OAuth no usa el access token, pero el SDK exige una config.
    this.oauth = new OAuth(new MercadoPagoConfig({ accessToken: '' }));
  }

  /** Guard: marketplace enabled / Validar marketplace habilitado */
  private assertMarketplaceEnabled(): void {
    if (!config.marketplace.enabled) {
      throw new Error('Marketplace is disabled');
    }
  }

  /**
   * Load the vendor and validate it is approved and the country is CO (OAUTH-1).
   * Cargar el vendor y validar que esté aprobado y el país sea CO.
   */
  private async assertVendorEligible(vendorId: string): Promise<void> {
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor || vendor.status !== 'approved') {
      throw new Error('Vendor is not approved');
    }
    if (config.marketplace.country !== 'CO') {
      throw new Error('MARKETPLACE_COUNTRY_UNSUPPORTED');
    }
  }

  /**
   * Build the MercadoPago authorization URL with PKCE for an approved vendor (OAUTH-1).
   * Construir la URL de autorización de MercadoPago con PKCE para un vendor aprobado.
   *
   * @param vendorId - Vendor id (embedded in state) / Id del vendedor
   * @returns { url, state }
   */
  async buildAuthorizationUrl(vendorId: string): Promise<{ url: string; state: string }> {
    this.assertMarketplaceEnabled();
    await this.assertVendorEligible(vendorId);

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = Buffer.from(vendorId).toString('base64url');
    const stateExpiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS);

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
        stateExpiresAt,
        status: 'processing',
        country,
      });
    } else {
      await VendorMercadoPagoAccount.create({
        vendorId,
        codeVerifierEncrypted: encryptedVerifier,
        stateExpiresAt,
        status: 'processing',
        country,
      });
    }

    return { url, state };
  }

  /**
   * Exchange the authorization code for tokens and store them encrypted (OAUTH-2).
   * Intercambiar el código de autorización por tokens y guardarlos cifrados.
   * Idempotent: a repeated callback for an already-connected account returns
   * without rewriting tokens.
   *
   * @param params - { code, state, vendorId }
   * @returns { account, token, alreadyConnected }
   */
  async exchangeCodeForToken(params: { code: string; state?: string; vendorId?: string }): Promise<{
    account: VendorMercadoPagoAccount;
    token: OAuthTokenResult | null;
    alreadyConnected: boolean;
  }> {
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

    // Idempotency (OAUTH-2): already connected and state consumed → 200, no rewrite
    if (
      account.status === 'connected' &&
      account.accessTokenEncrypted &&
      !account.codeVerifierEncrypted &&
      !account.stateExpiresAt
    ) {
      return { account, token: null, alreadyConnected: true };
    }

    if (!account.codeVerifierEncrypted) {
      throw new Error('OAuth flow was not initiated for this vendor');
    }
    if (account.stateExpiresAt && account.stateExpiresAt.getTime() < Date.now()) {
      throw new Error('OAuth state has expired');
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
      stateExpiresAt: null,
      status: 'connected',
      lastConnectedAt: new Date(),
    });

    return { account, token, alreadyConnected: false };
  }

  /**
   * Refresh the access token of a vendor account (OAUTH-3).
   * Renovar el access token de la cuenta de un vendedor.
   * On invalid_grant → status 'expired' (reconnection required).
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

    let token: OAuthTokenResult;
    try {
      token = (await this.oauth.refresh({
        body: {
          client_secret: clientSecret,
          client_id: clientId,
          refresh_token: refreshToken,
        },
      })) as unknown as OAuthTokenResult;
    } catch (error) {
      if (isInvalidGrantError(error)) {
        await vendorAccount.update({ status: 'expired' });
        throw new Error('CONNECT_MP_REQUIRED: refresh token invalid, reconnection required');
      }
      throw error;
    }

    const accessTokenExpiresAt = new Date(Date.now() + token.expires_in * 1000);

    await vendorAccount.update({
      accessTokenEncrypted: TwoFactorService.encryptSecretForStorage(token.access_token),
      refreshTokenEncrypted: token.refresh_token
        ? TwoFactorService.encryptSecretForStorage(token.refresh_token)
        : vendorAccount.refreshTokenEncrypted,
      accessTokenExpiresAt,
      status: 'connected',
      lastConnectedAt: new Date(),
    });

    return { account: vendorAccount, token };
  }

  /**
   * Connection status for the dashboard (OAUTH-4).
   * Estado de conexión para el dashboard.
   *
   * @param vendorId - Vendor id
   * @returns ConnectionStatus
   */
  async getConnectionStatus(vendorId: string): Promise<ConnectionStatus> {
    const account = await VendorMercadoPagoAccount.findOne({ where: { vendorId } });
    if (!account) {
      return 'never';
    }
    return account.status;
  }

  /**
   * Disconnect a vendor account: discard tokens (OAUTH-5).
   * Desconectar la cuenta de un vendedor: descartar tokens.
   *
   * @param vendorId - Vendor id
   */
  async disconnect(vendorId: string): Promise<void> {
    const account = await VendorMercadoPagoAccount.findOne({ where: { vendorId } });
    if (!account) {
      return;
    }
    await account.update({
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      codeVerifierEncrypted: null,
      stateExpiresAt: null,
      accessTokenExpiresAt: null,
      status: 'disconnected',
    });
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
