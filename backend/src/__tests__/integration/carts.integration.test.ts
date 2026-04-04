/**
 * @fileoverview Cart Integration Tests
 * @description Full integration test suite for cart API endpoints — CRUD operations,
 *              recovery token flow, admin abandoned cart listing, and edge cases.
 *
 *              Suite completa de tests de integración para endpoints API de carrito — operaciones CRUD,
 *              flujo de token de recuperación, listado admin de carritos abandonados, y casos límite.
 *
 * @module __tests__/integration/carts
 * @requires supertest
 * @requires fixtures
 */

import { testAgent } from '../setup';
import { createTestUser, createAdminUser, getAuthHeaders } from '../fixtures';
import { Cart, CartItem, CartRecoveryToken, Product, User } from '../../models';
import { CART_STATUS, CART_RECOVERY_TOKEN_STATUS } from '../../types';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Helper: Create a test product for cart operations
 * Crear un producto de test para operaciones de carrito
 */
async function createTestProduct(
  overrides: Partial<{ name: string; price: number; platform: string }> = {}
): Promise<Product> {
  return Product.create({
    name: overrides.name || `Test Product ${Date.now()}`,
    platform: (overrides.platform as any) || 'netflix',
    price: overrides.price ?? 29.99,
    currency: 'USD',
    durationDays: 30,
    isActive: true,
  } as any);
}

describe('Cart Integration Tests', () => {
  let regularUser: User;
  let regularHeaders: Record<string, string>;
  let adminUser: User;
  let adminHeaders: Record<string, string>;
  let testProduct: Product;

  beforeEach(async () => {
    // Create users
    adminUser = await createAdminUser();
    adminHeaders = getAuthHeaders(adminUser);
    regularUser = await createTestUser();
    regularHeaders = getAuthHeaders(regularUser);

    // Create test product
    testProduct = await createTestProduct({ name: 'Netflix Premium', price: 15.99 });
  });

  afterEach(async () => {
    await CartRecoveryToken.destroy({ where: {} });
    await CartItem.destroy({ where: {} });
    await Cart.destroy({ where: {} });
  });

  // ============================================================
  // 1. GET /api/carts/me — Get user's cart
  // ============================================================
  describe('GET /api/carts/me (Get My Cart)', () => {
    it('should create and return a new empty cart for user with no cart', async () => {
      const res = await testAgent.get('/api/carts/me').set(regularHeaders).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeTruthy();
      expect(res.body.data.status).toBe(CART_STATUS.ACTIVE);
      expect(Number(res.body.data.totalAmount)).toBe(0);
      expect(res.body.data.itemCount).toBe(0);
    });

    it('should return existing active cart with items', async () => {
      // Add item first
      await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 2 })
        .expect(201);

      // Now fetch cart
      const res = await testAgent.get('/api/carts/me').set(regularHeaders).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.itemCount).toBe(1);
      expect(Number(res.body.data.totalAmount)).toBeCloseTo(31.98, 2);
    });

    it('should reject unauthenticated request', async () => {
      await testAgent.get('/api/carts/me').expect(401);
    });
  });

  // ============================================================
  // 2. POST /api/carts/me/items — Add item to cart
  // ============================================================
  describe('POST /api/carts/me/items (Add Item)', () => {
    it('should add a product to cart and return updated cart', async () => {
      const res = await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 1 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.itemCount).toBe(1);
      expect(Number(res.body.data.totalAmount)).toBeCloseTo(15.99, 2);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].product.name).toBe('Netflix Premium');
    });

    it('should increment quantity when adding same product again', async () => {
      // Add 1
      await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 1 })
        .expect(201);

      // Add 2 more of same product
      const res = await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 2 })
        .expect(201);

      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].quantity).toBe(3);
      expect(Number(res.body.data.totalAmount)).toBeCloseTo(47.97, 2);
    });

    it('should reject adding non-existent product', async () => {
      const fakeId = uuidv4();
      const res = await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: fakeId, quantity: 1 })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should reject invalid quantity (0)', async () => {
      const res = await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 0 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing productId', async () => {
      const res = await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ quantity: 1 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // 3. DELETE /api/carts/me/items/:cartItemId — Remove item
  // ============================================================
  describe('DELETE /api/carts/me/items/:cartItemId (Remove Item)', () => {
    it('should remove an item from cart', async () => {
      // Add item first
      const addRes = await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 2 })
        .expect(201);

      const cartItemId = addRes.body.data.items[0].id;

      // Remove it
      const res = await testAgent
        .delete(`/api/carts/me/items/${cartItemId}`)
        .set(regularHeaders)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.itemCount).toBe(0);
      expect(Number(res.body.data.totalAmount)).toBe(0);
    });

    it('should return 404 for non-existent cart item', async () => {
      // Create a cart first
      await testAgent.get('/api/carts/me').set(regularHeaders).expect(200);

      const fakeId = uuidv4();
      const res = await testAgent
        .delete(`/api/carts/me/items/${fakeId}`)
        .set(regularHeaders)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // 4. PATCH /api/carts/me/items/:cartItemId — Update quantity
  // ============================================================
  describe('PATCH /api/carts/me/items/:cartItemId (Update Quantity)', () => {
    it('should update item quantity and recalculate totals', async () => {
      // Add item
      const addRes = await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 1 })
        .expect(201);

      const cartItemId = addRes.body.data.items[0].id;

      // Update to quantity 5
      const res = await testAgent
        .patch(`/api/carts/me/items/${cartItemId}`)
        .set(regularHeaders)
        .send({ quantity: 5 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].quantity).toBe(5);
      expect(Number(res.body.data.totalAmount)).toBeCloseTo(79.95, 2);
    });

    it('should reject quantity of 0', async () => {
      const addRes = await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 1 })
        .expect(201);

      const cartItemId = addRes.body.data.items[0].id;

      await testAgent
        .patch(`/api/carts/me/items/${cartItemId}`)
        .set(regularHeaders)
        .send({ quantity: 0 })
        .expect(400);
    });
  });

  // ============================================================
  // 5. GET /api/carts/recover/:token — Preview recovery cart
  // ============================================================
  describe('GET /api/carts/recover/:token (Recovery Preview)', () => {
    it('should return cart data for valid recovery token', async () => {
      // Create cart with items
      await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 2 })
        .expect(201);

      // Get the cart ID
      const cartRes = await testAgent.get('/api/carts/me').set(regularHeaders).expect(200);
      const cartId = cartRes.body.data.id;

      // Manually mark as abandoned and create recovery token via DB
      await Cart.update(
        { status: CART_STATUS.ABANDONED as any, abandonedAt: new Date() },
        { where: { id: cartId } }
      );

      const tokenPlain = uuidv4();
      const tokenHash = await bcrypt.hash(tokenPlain, 12);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await CartRecoveryToken.create({
        cartId,
        userId: regularUser.id,
        tokenHash,
        status: CART_RECOVERY_TOKEN_STATUS.PENDING as any,
        expiresAt,
        clickCount: 0,
        metadata: {},
      } as any);

      // Use recovery token to preview
      const res = await testAgent.get(`/api/carts/recover/${tokenPlain}`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(cartId);
      expect(res.body.data.items).toHaveLength(1);
    });

    it('should return 400 for invalid token', async () => {
      const fakeToken = uuidv4();
      const res = await testAgent.get(`/api/carts/recover/${fakeToken}`).expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RECOVERY_TOKEN_INVALID');
    });
  });

  // ============================================================
  // 6. POST /api/carts/recover/:token — Complete recovery
  // ============================================================
  describe('POST /api/carts/recover/:token (Complete Recovery)', () => {
    it('should recover cart and mark token as used', async () => {
      // Create cart with items
      await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 3 })
        .expect(201);

      const cartRes = await testAgent.get('/api/carts/me').set(regularHeaders).expect(200);
      const cartId = cartRes.body.data.id;

      // Abandon + create token
      await Cart.update(
        { status: CART_STATUS.ABANDONED as any, abandonedAt: new Date() },
        { where: { id: cartId } }
      );

      const tokenPlain = uuidv4();
      const tokenHash = await bcrypt.hash(tokenPlain, 12);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await CartRecoveryToken.create({
        cartId,
        userId: regularUser.id,
        tokenHash,
        status: CART_RECOVERY_TOKEN_STATUS.PENDING as any,
        expiresAt,
        clickCount: 0,
        metadata: {},
      } as any);

      // Recover
      const res = await testAgent.post(`/api/carts/recover/${tokenPlain}`).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(CART_STATUS.RECOVERED);
      expect(res.body.data.items).toHaveLength(1);

      // Verify token is used (replay prevention)
      const usedToken = await CartRecoveryToken.findOne({
        where: { cartId },
      });
      expect(usedToken!.status).toBe(CART_RECOVERY_TOKEN_STATUS.USED);
      expect(usedToken!.usedAt).not.toBeNull();
    });

    it('should return 410 when token already used (replay prevention)', async () => {
      // Setup cart + abandon + token
      await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 1 })
        .expect(201);

      const cartRes = await testAgent.get('/api/carts/me').set(regularHeaders).expect(200);
      const cartId = cartRes.body.data.id;

      await Cart.update(
        { status: CART_STATUS.ABANDONED as any, abandonedAt: new Date() },
        { where: { id: cartId } }
      );

      const tokenPlain = uuidv4();
      const tokenHash = await bcrypt.hash(tokenPlain, 12);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await CartRecoveryToken.create({
        cartId,
        userId: regularUser.id,
        tokenHash,
        status: CART_RECOVERY_TOKEN_STATUS.PENDING as any,
        expiresAt,
        clickCount: 0,
        metadata: {},
      } as any);

      // First recovery succeeds
      await testAgent.post(`/api/carts/recover/${tokenPlain}`).expect(200);

      // Second attempt should fail with 410 Gone
      const res = await testAgent.post(`/api/carts/recover/${tokenPlain}`).expect(410);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('RECOVERY_TOKEN_USED');
    });

    it('should return 400 for invalid recovery token', async () => {
      const fakeToken = uuidv4();
      const res = await testAgent.post(`/api/carts/recover/${fakeToken}`).expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // 7. GET /api/carts/abandoned — Admin list (admin only)
  // ============================================================
  describe('GET /api/carts/abandoned (Admin)', () => {
    it('should return abandoned carts with stats for admin', async () => {
      // Create a cart, add items, mark as abandoned
      await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 2 })
        .expect(201);

      const cartRes = await testAgent.get('/api/carts/me').set(regularHeaders).expect(200);
      const cartId = cartRes.body.data.id;

      await Cart.update(
        { status: CART_STATUS.ABANDONED as any, abandonedAt: new Date() },
        { where: { id: cartId } }
      );

      // Admin request
      const res = await testAgent.get('/api/carts/abandoned').set(adminHeaders).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.stats).toBeTruthy();
      expect(res.body.data.stats.totalAbandoned).toBe(1);
      expect(res.body.data.pagination).toBeTruthy();
    });

    it('should reject non-admin user', async () => {
      await testAgent.get('/api/carts/abandoned').set(regularHeaders).expect(403);
    });

    it('should reject unauthenticated request', async () => {
      await testAgent.get('/api/carts/abandoned').expect(401);
    });
  });

  // ============================================================
  // 8. Full lifecycle: add → abandon → recover → verify
  // ============================================================
  describe('Full Cart Lifecycle', () => {
    it('should handle full add → abandon → recover lifecycle', async () => {
      const product2 = await createTestProduct({ name: 'Spotify Premium', price: 9.99 });

      // 1. Add items to cart
      await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: testProduct.id, quantity: 2 })
        .expect(201);

      await testAgent
        .post('/api/carts/me/items')
        .set(regularHeaders)
        .send({ productId: product2.id, quantity: 1 })
        .expect(201);

      // 2. Verify cart state
      const cartRes = await testAgent.get('/api/carts/me').set(regularHeaders).expect(200);
      const cartId = cartRes.body.data.id;
      expect(cartRes.body.data.itemCount).toBe(2);
      expect(Number(cartRes.body.data.totalAmount)).toBeCloseTo(41.97, 2);

      // 3. Simulate abandonment (DB update like scheduler would do)
      await Cart.update(
        { status: CART_STATUS.ABANDONED as any, abandonedAt: new Date() },
        { where: { id: cartId } }
      );

      // 4. Create recovery token (like CartRecoveryEmailService would)
      const tokenPlain = uuidv4();
      const tokenHash = await bcrypt.hash(tokenPlain, 12);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await CartRecoveryToken.create({
        cartId,
        userId: regularUser.id,
        tokenHash,
        status: CART_RECOVERY_TOKEN_STATUS.PENDING as any,
        expiresAt,
        clickCount: 0,
        metadata: {},
      } as any);

      // 5. Preview recovery (public endpoint, no auth)
      const previewRes = await testAgent.get(`/api/carts/recover/${tokenPlain}`).expect(200);

      expect(previewRes.body.data.items).toHaveLength(2);

      // 6. Complete recovery
      const recoverRes = await testAgent.post(`/api/carts/recover/${tokenPlain}`).expect(200);

      expect(recoverRes.body.data.status).toBe(CART_STATUS.RECOVERED);
      expect(recoverRes.body.data.items).toHaveLength(2);
      expect(Number(recoverRes.body.data.totalAmount)).toBeCloseTo(41.97, 2);

      // 7. Token is now used — replay should fail
      const replayRes = await testAgent.post(`/api/carts/recover/${tokenPlain}`).expect(410);

      expect(replayRes.body.error.code).toBe('RECOVERY_TOKEN_USED');
    });
  });
});
