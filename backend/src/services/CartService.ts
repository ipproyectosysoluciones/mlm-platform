/**
 * @fileoverview CartService - Business logic for shopping cart and abandoned cart recovery
 * @description Handles cart CRUD, abandonment detection, token-based recovery with bcrypt hashing,
 *              and cleanup of expired carts (GDPR-compliant soft + hard delete)
 *              Gestiona CRUD de carrito, detección de abandono, recuperación con tokens bcrypt,
 *              y limpieza de carritos expirados (borrado suave + duro compatible con GDPR)
 * @module services/CartService
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // EN: Get or create a user's cart
 * const cart = await cartService.getCart(userId);
 *
 * // ES: Obtener o crear carrito del usuario
 * const cart = await cartService.getCart(userId);
 *
 * @example
 * // EN: Detect abandoned carts (>1000 min inactive)
 * const abandoned = await cartService.findAbandoned(1000);
 *
 * // ES: Detectar carritos abandonados (>1000 min inactivos)
 * const abandoned = await cartService.findAbandoned(1000);
 */
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Cart, CartItem, CartRecoveryToken, Product, User } from '../models';
import { CART_STATUS, CART_RECOVERY_TOKEN_STATUS } from '../types';
import type { CartStatus } from '../types';

/**
 * Default abandonment threshold in minutes (≈16.6 hours)
 * Umbral de abandono por defecto en minutos
 */
const DEFAULT_ABANDON_THRESHOLD_MINUTES = 1000;

/**
 * Default recovery token expiry in days
 * Expiración por defecto del token de recuperación en días
 */
const DEFAULT_TOKEN_EXPIRY_DAYS = 7;

/**
 * Bcrypt cost factor for token hashing
 * Factor de costo bcrypt para hasheo de tokens
 */
const BCRYPT_COST = 12;

export class CartService {
  // ============================================
  // CART CRUD — Task 21-3
  // ============================================

  /**
   * Get or create the user's active cart
   * Obtener o crear el carrito activo del usuario
   *
   * @param userId - User UUID / UUID del usuario
   * @returns Cart with items / Carrito con items
   */
  async getCart(userId: string): Promise<Cart> {
    let cart = await Cart.findOne({
      where: {
        userId,
        status: CART_STATUS.ACTIVE,
        deletedAt: null,
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'platform', 'isActive'],
            },
          ],
        },
      ],
    });

    if (!cart) {
      cart = await Cart.create({
        userId,
        status: CART_STATUS.ACTIVE,
        lastActivityAt: new Date(),
        totalAmount: 0,
        itemCount: 0,
        metadata: {},
      });
      // Reload with includes
      cart = (await Cart.findByPk(cart.id, {
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price', 'platform', 'isActive'],
              },
            ],
          },
        ],
      })) as Cart;
    }

    return cart;
  }

  /**
   * Add an item to the user's cart (creates cart if needed)
   * Agregar un item al carrito del usuario (crea carrito si es necesario)
   *
   * @param userId - User UUID / UUID del usuario
   * @param productId - Product UUID / UUID del producto
   * @param quantity - Quantity to add / Cantidad a agregar
   * @returns Updated cart / Carrito actualizado
   */
  async addItem(userId: string, productId: string, quantity: number): Promise<Cart> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      const error = new Error('Product not found');
      (error as any).statusCode = 404;
      throw error;
    }

    return await sequelize.transaction(async (t) => {
      // Get or create active cart
      let cart = await Cart.findOne({
        where: { userId, status: CART_STATUS.ACTIVE, deletedAt: null },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!cart) {
        cart = await Cart.create(
          {
            userId,
            status: CART_STATUS.ACTIVE,
            lastActivityAt: new Date(),
            totalAmount: 0,
            itemCount: 0,
            metadata: {},
          },
          { transaction: t }
        );
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * quantity;

      // Check if product already in cart — update quantity if so
      const existingItem = await CartItem.findOne({
        where: { cartId: cart.id, productId },
        transaction: t,
      });

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const newSubtotal = unitPrice * newQuantity;
        await existingItem.update(
          { quantity: newQuantity, subtotal: newSubtotal },
          { transaction: t }
        );
      } else {
        await CartItem.create(
          {
            cartId: cart.id,
            productId,
            quantity,
            unitPrice,
            subtotal,
            addedAt: new Date(),
            metadata: {},
          },
          { transaction: t }
        );
      }

      // Recalculate totals
      await this.recalculateCartTotals(cart.id, t);

      // Update last activity
      await cart.update({ lastActivityAt: new Date() }, { transaction: t });

      // Reload with associations
      return (await Cart.findByPk(cart.id, {
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price', 'platform', 'isActive'],
              },
            ],
          },
        ],
        transaction: t,
      })) as Cart;
    });
  }

  /**
   * Remove an item from the user's cart
   * Eliminar un item del carrito del usuario
   *
   * @param userId - User UUID / UUID del usuario
   * @param cartItemId - Cart item UUID / UUID del item del carrito
   * @returns Updated cart / Carrito actualizado
   */
  async removeItem(userId: string, cartItemId: string): Promise<Cart> {
    return await sequelize.transaction(async (t) => {
      const cart = await Cart.findOne({
        where: { userId, status: CART_STATUS.ACTIVE, deletedAt: null },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!cart) {
        const error = new Error('Cart not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const item = await CartItem.findOne({
        where: { id: cartItemId, cartId: cart.id },
        transaction: t,
      });

      if (!item) {
        const error = new Error('Cart item not found');
        (error as any).statusCode = 404;
        throw error;
      }

      await item.destroy({ transaction: t });

      // Recalculate totals
      await this.recalculateCartTotals(cart.id, t);
      await cart.update({ lastActivityAt: new Date() }, { transaction: t });

      return (await Cart.findByPk(cart.id, {
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price', 'platform', 'isActive'],
              },
            ],
          },
        ],
        transaction: t,
      })) as Cart;
    });
  }

  /**
   * Update item quantity in the user's cart
   * Actualizar cantidad de un item en el carrito del usuario
   *
   * @param userId - User UUID / UUID del usuario
   * @param cartItemId - Cart item UUID / UUID del item
   * @param newQuantity - New quantity / Nueva cantidad
   * @returns Updated cart / Carrito actualizado
   */
  async updateQuantity(userId: string, cartItemId: string, newQuantity: number): Promise<Cart> {
    if (newQuantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    return await sequelize.transaction(async (t) => {
      const cart = await Cart.findOne({
        where: { userId, status: CART_STATUS.ACTIVE, deletedAt: null },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!cart) {
        const error = new Error('Cart not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const item = await CartItem.findOne({
        where: { id: cartItemId, cartId: cart.id },
        transaction: t,
      });

      if (!item) {
        const error = new Error('Cart item not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const newSubtotal = Number(item.unitPrice) * newQuantity;
      await item.update({ quantity: newQuantity, subtotal: newSubtotal }, { transaction: t });

      await this.recalculateCartTotals(cart.id, t);
      await cart.update({ lastActivityAt: new Date() }, { transaction: t });

      return (await Cart.findByPk(cart.id, {
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price', 'platform', 'isActive'],
              },
            ],
          },
        ],
        transaction: t,
      })) as Cart;
    });
  }

  /**
   * Clear all items from the user's cart
   * Vaciar todos los items del carrito del usuario
   *
   * @param userId - User UUID / UUID del usuario
   */
  async clearCart(userId: string): Promise<void> {
    await sequelize.transaction(async (t) => {
      const cart = await Cart.findOne({
        where: { userId, status: CART_STATUS.ACTIVE, deletedAt: null },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!cart) {
        return; // Nothing to clear
      }

      await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });
      await cart.update(
        {
          totalAmount: 0,
          itemCount: 0,
          lastActivityAt: new Date(),
        },
        { transaction: t }
      );
    });
  }

  // ============================================
  // ABANDONMENT & RECOVERY — Task 21-4
  // ============================================

  /**
   * Find abandoned carts (inactive beyond threshold)
   * Buscar carritos abandonados (inactivos más allá del umbral)
   *
   * @param thresholdMinutes - Minutes of inactivity / Minutos de inactividad
   * @returns List of abandoned carts / Lista de carritos abandonados
   */
  async findAbandoned(
    thresholdMinutes: number = DEFAULT_ABANDON_THRESHOLD_MINUTES
  ): Promise<Cart[]> {
    const threshold = new Date();
    threshold.setMinutes(threshold.getMinutes() - thresholdMinutes);

    return Cart.findAll({
      where: {
        status: CART_STATUS.ACTIVE,
        lastActivityAt: { [Op.lt]: threshold },
        deletedAt: null,
      },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'platform'],
            },
          ],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email'],
        },
      ],
    });
  }

  /**
   * Mark a cart as abandoned
   * Marcar un carrito como abandonado
   *
   * @param cartId - Cart UUID / UUID del carrito
   */
  async markAbandoned(cartId: string): Promise<void> {
    await Cart.update(
      {
        status: CART_STATUS.ABANDONED as CartStatus,
        abandonedAt: new Date(),
      },
      { where: { id: cartId, status: CART_STATUS.ACTIVE } }
    );
  }

  /**
   * Create a recovery token for an abandoned cart (bcrypt hashed, 7-day expiry)
   * Crear token de recuperación para carrito abandonado (hasheado con bcrypt, expiración 7 días)
   *
   * @param cartId - Cart UUID / UUID del carrito
   * @param expiresInDays - Token validity in days / Validez del token en días
   * @returns Token record + plaintext token (for immediate use only)
   *          Registro de token + token en texto plano (solo para uso inmediato)
   */
  async createRecoveryToken(
    cartId: string,
    expiresInDays: number = DEFAULT_TOKEN_EXPIRY_DAYS
  ): Promise<CartRecoveryToken & { tokenPlain: string }> {
    const cart = await Cart.findByPk(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const tokenPlain = uuidv4();
    const tokenHash = await bcrypt.hash(tokenPlain, BCRYPT_COST);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const token = await CartRecoveryToken.create({
      cartId,
      userId: cart.userId,
      tokenHash,
      status: CART_RECOVERY_TOKEN_STATUS.PENDING,
      expiresAt,
      metadata: {},
    });

    // Attach plain token (not persisted, for immediate use)
    return Object.assign(token, { tokenPlain });
  }

  /**
   * Validate a recovery token (bcrypt compare, expiry check, used check)
   * Validar un token de recuperación (comparación bcrypt, verificar expiración y uso)
   *
   * @param tokenPlain - Plaintext token from email link / Token en texto plano del link del email
   * @returns True if valid / True si es válido
   */
  async validateRecoveryToken(tokenPlain: string): Promise<boolean> {
    const tokens = await CartRecoveryToken.findAll({
      where: {
        status: CART_RECOVERY_TOKEN_STATUS.PENDING,
        expiresAt: { [Op.gt]: new Date() },
        usedAt: null,
      },
    });

    for (const token of tokens) {
      const matches = await bcrypt.compare(tokenPlain, token.tokenHash);
      if (matches) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get cart data by recovery token (for preview before checkout)
   * Obtener datos del carrito por token de recuperación (para preview antes del checkout)
   *
   * @param tokenPlain - Plaintext token / Token en texto plano
   * @returns Cart with items or null / Carrito con items o null
   */
  async getCartByRecoveryToken(tokenPlain: string): Promise<Cart | null> {
    const tokens = await CartRecoveryToken.findAll({
      where: {
        status: CART_RECOVERY_TOKEN_STATUS.PENDING,
        expiresAt: { [Op.gt]: new Date() },
        usedAt: null,
      },
    });

    for (const token of tokens) {
      const matches = await bcrypt.compare(tokenPlain, token.tokenHash);
      if (matches) {
        // Increment click count
        await token.update({
          clickCount: token.clickCount + 1,
          lastClickedAt: new Date(),
        });

        return Cart.findByPk(token.cartId, {
          include: [
            {
              model: CartItem,
              as: 'items',
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'name', 'price', 'platform', 'isActive'],
                },
              ],
            },
          ],
        });
      }
    }

    return null;
  }

  /**
   * Recover a cart using a one-time token (atomic: mark token used + cart recovered)
   * Recuperar un carrito usando token de un solo uso (atómico: marcar token usado + carrito recuperado)
   *
   * @param tokenPlain - Plaintext token / Token en texto plano
   * @returns Recovered cart / Carrito recuperado
   * @throws Token already used, expired, or invalid
   */
  async recoverCart(tokenPlain: string): Promise<Cart> {
    return await sequelize.transaction(async (t) => {
      const tokens = await CartRecoveryToken.findAll({
        where: {
          expiresAt: { [Op.gt]: new Date() },
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      let matchedToken: CartRecoveryToken | null = null;
      for (const token of tokens) {
        const matches = await bcrypt.compare(tokenPlain, token.tokenHash);
        if (matches) {
          matchedToken = token;
          break;
        }
      }

      if (!matchedToken) {
        const error = new Error('Invalid or expired recovery token');
        (error as any).statusCode = 400;
        throw error;
      }

      if (matchedToken.status === CART_RECOVERY_TOKEN_STATUS.USED || matchedToken.usedAt !== null) {
        const error = new Error('Token already used');
        (error as any).statusCode = 410;
        throw error;
      }

      // Mark token as used
      await matchedToken.update(
        {
          status: CART_RECOVERY_TOKEN_STATUS.USED,
          usedAt: new Date(),
        },
        { transaction: t }
      );

      // Mark cart as recovered
      const cart = await Cart.findByPk(matchedToken.cartId, { transaction: t });
      if (!cart) {
        throw new Error('Cart not found');
      }

      await cart.update(
        {
          status: CART_STATUS.RECOVERED as CartStatus,
          recoveredAt: new Date(),
          lastActivityAt: new Date(),
        },
        { transaction: t }
      );

      return (await Cart.findByPk(cart.id, {
        include: [
          {
            model: CartItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price', 'platform', 'isActive'],
              },
            ],
          },
        ],
        transaction: t,
      })) as Cart;
    });
  }

  /**
   * Cleanup expired carts (GDPR: soft delete 30 days, hard delete 7 more)
   * Limpieza de carritos expirados (GDPR: borrado suave 30 días, borrado duro 7 más)
   *
   * @param olderThanDays - Soft delete threshold in days / Umbral de borrado suave en días
   * @returns Number of carts cleaned up / Número de carritos limpiados
   */
  async cleanupExpiredCarts(olderThanDays: number = 30): Promise<number> {
    const softDeleteThreshold = new Date();
    softDeleteThreshold.setDate(softDeleteThreshold.getDate() - olderThanDays);

    const hardDeleteThreshold = new Date();
    hardDeleteThreshold.setDate(hardDeleteThreshold.getDate() - olderThanDays - 7);

    let totalCleaned = 0;

    await sequelize.transaction(async (t) => {
      // 1. Soft delete: Mark abandoned carts older than threshold as expired
      const [softDeleted] = await Cart.update(
        {
          status: CART_STATUS.EXPIRED as CartStatus,
          deletedAt: new Date(),
        },
        {
          where: {
            status: CART_STATUS.ABANDONED,
            abandonedAt: { [Op.lt]: softDeleteThreshold },
            deletedAt: null,
          },
          transaction: t,
        }
      );
      totalCleaned += softDeleted;

      // 2. Hard delete: Remove carts soft-deleted more than 7 days ago
      const cartsToDelete = await Cart.findAll({
        where: {
          deletedAt: { [Op.lt]: hardDeleteThreshold },
        },
        attributes: ['id'],
        transaction: t,
      });

      if (cartsToDelete.length > 0) {
        const cartIds = cartsToDelete.map((c) => c.id);

        // CASCADE should handle children, but be explicit for safety
        await CartRecoveryToken.destroy({ where: { cartId: cartIds }, transaction: t });
        await CartItem.destroy({ where: { cartId: cartIds }, transaction: t });
        await Cart.destroy({ where: { id: cartIds }, transaction: t });
        totalCleaned += cartsToDelete.length;
      }
    });

    return totalCleaned;
  }

  // ============================================
  // ADMIN — Task 21-5
  // ============================================

  /**
   * List abandoned carts with stats (admin view)
   * Listar carritos abandonados con estadísticas (vista admin)
   *
   * @param limit - Page size / Tamaño de página
   * @param offset - Page offset / Offset de página
   * @param days - Filter by days since abandonment / Filtrar por días desde abandono
   * @returns Abandoned carts with pagination and stats
   */
  async listAbandoned(
    limit: number = 50,
    offset: number = 0,
    days: number = 30
  ): Promise<{
    data: Cart[];
    pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    stats: {
      totalAbandoned: number;
      totalRecovered: number;
      recoveryRate: string;
      totalRecoveredAmount: string;
    };
  }> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const { count, rows } = await Cart.findAndCountAll({
      where: {
        status: { [Op.in]: [CART_STATUS.ABANDONED, CART_STATUS.RECOVERED] },
        abandonedAt: { [Op.gte]: sinceDate },
        deletedAt: null,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email'],
        },
        {
          model: CartItem,
          as: 'items',
        },
        {
          model: CartRecoveryToken,
          as: 'recoveryTokens',
          attributes: ['id', 'status', 'emailSentAt', 'expiresAt'],
        },
      ],
      limit,
      offset,
      order: [['abandonedAt', 'DESC']],
    });

    // Calculate stats
    const totalAbandoned = await Cart.count({
      where: {
        status: { [Op.in]: [CART_STATUS.ABANDONED, CART_STATUS.RECOVERED] },
        abandonedAt: { [Op.gte]: sinceDate },
        deletedAt: null,
      },
    });

    const totalRecovered = await Cart.count({
      where: {
        status: CART_STATUS.RECOVERED,
        abandonedAt: { [Op.gte]: sinceDate },
        deletedAt: null,
      },
    });

    const recoveredCarts = await Cart.findAll({
      where: {
        status: CART_STATUS.RECOVERED,
        abandonedAt: { [Op.gte]: sinceDate },
        deletedAt: null,
      },
      attributes: ['totalAmount'],
    });

    const totalRecoveredAmount = recoveredCarts.reduce((sum, c) => sum + Number(c.totalAmount), 0);

    const recoveryRate =
      totalAbandoned > 0 ? ((totalRecovered / totalAbandoned) * 100).toFixed(2) + '%' : '0%';

    return {
      data: rows,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count,
      },
      stats: {
        totalAbandoned,
        totalRecovered,
        recoveryRate,
        totalRecoveredAmount: `$${totalRecoveredAmount.toFixed(2)}`,
      },
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Recalculate cart totals from items
   * Recalcular totales del carrito desde los items
   */
  private async recalculateCartTotals(
    cartId: string,
    transaction?: import('sequelize').Transaction
  ): Promise<void> {
    const items = await CartItem.findAll({
      where: { cartId },
      transaction,
    });

    const totalAmount = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const itemCount = items.length;

    await Cart.update({ totalAmount, itemCount }, { where: { id: cartId }, transaction });
  }
}

// Export singleton instance
export const cartService = new CartService();
