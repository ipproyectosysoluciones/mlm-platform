/**
 * @fileoverview CartController - Endpoints for cart management and abandoned cart recovery
 * @description Handles cart CRUD, recovery token validation, cart restoration, and admin stats.
 *              Gestiona CRUD de carrito, validación de tokens de recuperación, restauración y stats admin.
 * @module controllers/CartController
 * @author MLM Development Team
 */
import { Response } from 'express';
import { cartService } from '../services/CartService.js';
import type { ApiResponse } from '../types/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

// ============================================
// USER CART ROUTES (authenticated)
// Rutas de carrito del usuario (autenticadas)
// ============================================

/**
 * Get the current user's active cart (creates one if none exists)
 * Obtener el carrito activo del usuario (crea uno si no existe)
 *
 * @route GET /api/v1/carts/me
 * @param req - Authenticated request / Request autenticada
 * @param res - Response with cart data / Respuesta con datos del carrito
 */
export async function getMyCart(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;

  try {
    const cart = await cartService.getCart(userId);

    const response: ApiResponse<typeof cart> = {
      success: true,
      data: cart,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'CART_GET_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Add an item to the user's cart
 * Agregar un item al carrito del usuario
 *
 * @route POST /api/v1/carts/me/items
 * @param req - Body: productId, quantity / Body: productId, quantity
 * @param res - Response with updated cart / Respuesta con carrito actualizado
 */
export async function addItemToCart(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { productId, quantity } = req.body;

  try {
    const cart = await cartService.addItem(userId, productId, quantity);

    const response: ApiResponse<typeof cart> = {
      success: true,
      data: cart,
    };

    res.status(201).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let statusCode = 400;
    let errorCode = 'CART_ADD_ITEM_ERROR';

    if (errorMessage.includes('not found')) {
      statusCode = 404;
      errorCode = 'PRODUCT_NOT_FOUND';
    }

    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };
    res.status(statusCode).json(response);
  }
}

/**
 * Remove an item from the user's cart
 * Eliminar un item del carrito del usuario
 *
 * @route DELETE /api/v1/carts/me/items/:cartItemId
 * @param req - Params: cartItemId / Params: cartItemId
 * @param res - Response with updated cart / Respuesta con carrito actualizado
 */
export async function removeItemFromCart(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { cartItemId } = req.params;

  try {
    const cart = await cartService.removeItem(userId, cartItemId);

    const response: ApiResponse<typeof cart> = {
      success: true,
      data: cart,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let statusCode = 400;
    let errorCode = 'CART_REMOVE_ITEM_ERROR';

    if (errorMessage.includes('not found')) {
      statusCode = 404;
      errorCode = errorMessage.includes('Cart') ? 'CART_NOT_FOUND' : 'CART_ITEM_NOT_FOUND';
    }

    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };
    res.status(statusCode).json(response);
  }
}

/**
 * Update quantity of a cart item
 * Actualizar cantidad de un item del carrito
 *
 * @route PATCH /api/v1/carts/me/items/:cartItemId
 * @param req - Params: cartItemId, Body: quantity / Params: cartItemId, Body: quantity
 * @param res - Response with updated cart / Respuesta con carrito actualizado
 */
export async function updateCartItemQuantity(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user!.id;
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  try {
    const cart = await cartService.updateQuantity(userId, cartItemId, quantity);

    const response: ApiResponse<typeof cart> = {
      success: true,
      data: cart,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let statusCode = 400;
    let errorCode = 'CART_UPDATE_QUANTITY_ERROR';

    if (errorMessage.includes('not found')) {
      statusCode = 404;
      errorCode = errorMessage.includes('Cart') ? 'CART_NOT_FOUND' : 'CART_ITEM_NOT_FOUND';
    }

    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };
    res.status(statusCode).json(response);
  }
}

// ============================================
// RECOVERY ROUTES (public — token-based auth)
// Rutas de recuperación (públicas — auth basada en token)
// ============================================

/**
 * Get cart data by recovery token (preview before recovery)
 * Obtener datos del carrito por token de recuperación (preview antes de recuperar)
 *
 * @route GET /api/v1/carts/recover/:token
 * @param req - Params: token (plaintext UUID)
 * @param res - Response with cart data or error
 */
export async function getCartByRecoveryToken(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { token } = req.params;

  try {
    const cart = await cartService.getCartByRecoveryToken(token);

    if (!cart) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'RECOVERY_TOKEN_INVALID',
          message: 'Invalid or expired recovery token',
        },
      };
      res.status(400).json(response);
      return;
    }

    const response: ApiResponse<typeof cart> = {
      success: true,
      data: cart,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'RECOVERY_GET_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Complete cart recovery (mark token as used, restore cart)
 * Completar recuperación del carrito (marcar token como usado, restaurar carrito)
 *
 * @route POST /api/v1/carts/recover/:token
 * @param req - Params: token (plaintext UUID)
 * @param res - Response with recovered cart
 */
export async function recoverCartByToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { token } = req.params;

  try {
    const cart = await cartService.recoverCart(token);

    const response: ApiResponse<typeof cart> = {
      success: true,
      data: cart,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let statusCode = 400;
    let errorCode = 'RECOVERY_ERROR';

    if (errorMessage.includes('already used')) {
      statusCode = 410;
      errorCode = 'RECOVERY_TOKEN_USED';
    } else if (errorMessage.includes('expired')) {
      statusCode = 400;
      errorCode = 'RECOVERY_TOKEN_EXPIRED';
    } else if (errorMessage.includes('not found')) {
      statusCode = 404;
      errorCode = 'CART_NOT_FOUND';
    } else if (errorMessage.includes('Invalid')) {
      statusCode = 400;
      errorCode = 'RECOVERY_TOKEN_INVALID';
    }

    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    };
    res.status(statusCode).json(response);
  }
}

// ============================================
// ADMIN ROUTES (authenticated + admin role)
// Rutas admin (autenticadas + rol admin)
// ============================================

/**
 * List abandoned carts with stats (admin only)
 * Listar carritos abandonados con estadísticas (solo admin)
 *
 * @route GET /api/v1/carts/abandoned
 * @param req - Query: limit, offset, days / Query: limit, offset, days
 * @param res - Response with abandoned carts, pagination, and stats
 */
export async function listAbandonedCarts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const offset = parseInt(req.query.offset as string, 10) || 0;
  const days = parseInt(req.query.days as string, 10) || 30;

  try {
    const result = await cartService.listAbandoned(limit, offset, days);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'ABANDONED_CARTS_LIST_ERROR',
        message: errorMessage,
      },
    };
    res.status(500).json(response);
  }
}
