/**
 * @fileoverview MercadoPago OAuth Controller
 * @description Endpoints for the vendor MercadoPago OAuth flow: authorize,
 *              callback, refresh, status and disconnect (OAUTH-1..5 / A8).
 *              Endpoints del flujo OAuth MercadoPago del vendedor.
 * @module controllers/MercadoPagoOAuthController
 */

import type { Response } from 'express';
import { oauthMercadoPagoService } from '../services/OAuthMercadoPagoService.js';
import { VendorMercadoPagoAccount } from '../models/index.js';
import { ResponseUtil } from '../utils/response.util.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

/**
 * Map a service error to an HTTP response.
 * Mapear un error del servicio a una respuesta HTTP.
 */
function handleOAuthError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Internal error';

  if (/not approved/i.test(message)) {
    res.status(403).json(ResponseUtil.error('VENDOR_NOT_APPROVED', 'Vendor is not approved', 403));
    return;
  }
  if (/MARKETPLACE_COUNTRY_UNSUPPORTED/.test(message)) {
    res
      .status(400)
      .json(
        ResponseUtil.error('MARKETPLACE_COUNTRY_UNSUPPORTED', 'MercadoPago only supports CO', 400)
      );
    return;
  }
  if (/disabled/i.test(message)) {
    res
      .status(503)
      .json(ResponseUtil.error('MARKETPLACE_DISABLED', 'Marketplace is disabled', 503));
    return;
  }
  if (/CONNECT_MP_REQUIRED/.test(message)) {
    res
      .status(409)
      .json(ResponseUtil.error('CONNECT_MP_REQUIRED', 'Vendor must reconnect MercadoPago', 409));
    return;
  }
  if (/state has expired/i.test(message)) {
    res.status(400).json(ResponseUtil.error('OAUTH_STATE_EXPIRED', 'OAuth state has expired', 400));
    return;
  }
  if (/not found/i.test(message)) {
    res
      .status(404)
      .json(
        ResponseUtil.error(
          'VENDOR_MP_ACCOUNT_NOT_FOUND',
          'Vendor MercadoPago account not found',
          404
        )
      );
    return;
  }

  logger.error({ controller: 'MercadoPagoOAuthController', error }, 'OAuth operation failed');
  res.status(500).json(ResponseUtil.error('INTERNAL_ERROR', 'Internal error', 500));
}

export class MercadoPagoOAuthController {
  /**
   * GET /mercadopago/oauth/authorize — start the OAuth flow (OAUTH-1)
   */
  static authorize = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const vendorId = req.user!.id;
      const { url, state } = await oauthMercadoPagoService.buildAuthorizationUrl(vendorId);
      res.json(ResponseUtil.success({ url, state }));
    } catch (error) {
      handleOAuthError(res, error);
    }
  });

  /**
   * POST /mercadopago/oauth/callback — exchange code for tokens (OAUTH-2)
   */
  static callback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const code = typeof req.body?.code === 'string' ? req.body.code : req.query?.code;
      const state = typeof req.body?.state === 'string' ? req.body.state : req.query?.state;

      if (!code || !state) {
        res
          .status(400)
          .json(ResponseUtil.error('MISSING_OAUTH_PARAMS', 'code and state are required', 400));
        return;
      }

      const { account, token, alreadyConnected } =
        await oauthMercadoPagoService.exchangeCodeForToken({
          code: String(code),
          state: String(state),
        });

      res.json(
        ResponseUtil.success({
          status: account.status,
          alreadyConnected,
          mpUserId: account.mpUserId ?? token?.user_id ?? null,
          expiresAt: account.accessTokenExpiresAt,
        })
      );
    } catch (error) {
      handleOAuthError(res, error);
    }
  });

  /**
   * POST /mercadopago/oauth/refresh — refresh tokens (OAUTH-3)
   */
  static refresh = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const vendorId = req.user!.id;
      const account = await VendorMercadoPagoAccount.findOne({ where: { vendorId } });
      if (!account) {
        res
          .status(404)
          .json(
            ResponseUtil.error(
              'VENDOR_MP_ACCOUNT_NOT_FOUND',
              'Vendor MercadoPago account not found',
              404
            )
          );
        return;
      }
      const result = await oauthMercadoPagoService.refreshAccessToken(account);
      res.json(
        ResponseUtil.success({
          status: result.account.status,
          expiresAt: result.account.accessTokenExpiresAt,
        })
      );
    } catch (error) {
      handleOAuthError(res, error);
    }
  });

  /**
   * GET /mercadopago/oauth/status — connection status (OAUTH-4)
   */
  static status = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const vendorId = req.user!.id;
      const account = await VendorMercadoPagoAccount.findOne({ where: { vendorId } });

      if (!account) {
        res.json(ResponseUtil.success({ status: 'never' }));
        return;
      }

      res.json(
        ResponseUtil.success({
          status: account.status,
          mpUserId: account.mpUserId,
          country: account.country,
          connectedAt: account.lastConnectedAt,
          expiresAt: account.accessTokenExpiresAt,
        })
      );
    } catch (error) {
      handleOAuthError(res, error);
    }
  });

  /**
   * POST /mercadopago/oauth/disconnect — disconnect the account (OAUTH-5)
   */
  static disconnect = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const vendorId = req.user!.id;
      await oauthMercadoPagoService.disconnect(vendorId);
      res.json(ResponseUtil.success({ status: 'disconnected' }));
    } catch (error) {
      handleOAuthError(res, error);
    }
  });
}

export default MercadoPagoOAuthController;
