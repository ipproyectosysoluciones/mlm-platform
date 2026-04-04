/**
 * @fileoverview Inventory Integration Tests
 * @description Full integration test suite for inventory API endpoints — reserve, release,
 *              adjust, and movement tracking.
 *
 *              Suite completa de tests de integración para endpoints API de inventario — reservar,
 *              liberar, ajustar y seguimiento de movimientos.
 *
 * @module __tests__/integration/inventory
 * @requires supertest
 * @requires fixtures
 */

import { testAgent } from '../setup';
import { createTestUser, createAdminUser, getAuthHeaders } from '../fixtures';
import { Product, InventoryMovement, User } from '../../models';

describe('Inventory Integration Tests', () => {
  let regularUser: User;
  let regularHeaders: Record<string, string>;
  let adminUser: User;
  let adminHeaders: Record<string, string>;
  let testProduct: Product;

  /**
   * Helper: Create a test product with stock for inventory tests
   */
  async function createProductWithStock(stock: number = 10): Promise<Product> {
    return Product.create({
      name: `Test Product ${Date.now()}`,
      platform: 'netflix' as any,
      price: 29.99,
      currency: 'USD',
      durationDays: 30,
      isActive: true,
      stock,
      type: 'physical' as any,
    } as any);
  }

  beforeEach(async () => {
    // Create users
    adminUser = await createAdminUser();
    adminHeaders = getAuthHeaders(adminUser);
    regularUser = await createTestUser();
    regularHeaders = getAuthHeaders(regularUser);

    // Create test product with initial stock
    testProduct = await createProductWithStock(10);
  });

  afterEach(async () => {
    await InventoryMovement.destroy({ where: {} });
    await Product.destroy({ where: {} });
  });

  // ============================================================
  // 1. POST /api/admin/products/:id/inventory/reserve — Reserve stock
  // ============================================================
  describe('POST /api/admin/products/:id/inventory/reserve (Reserve Stock)', () => {
    it('should reserve stock successfully when sufficient stock available', async () => {
      const res = await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/reserve`)
        .set(adminHeaders)
        .send({ quantity: 3, referenceId: testProduct.id })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.stock).toBe(7); // 10 - 3 = 7
    });

    it('should reject non-admin user with 403', async () => {
      const res = await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/reserve`)
        .set(regularHeaders)
        .send({ quantity: 3, referenceId: testProduct.id })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/reserve`)
        .send({ quantity: 3, referenceId: testProduct.id })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject when insufficient stock available', async () => {
      const res = await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/reserve`)
        .set(adminHeaders)
        .send({ quantity: 15, referenceId: testProduct.id }) // More than available (10)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    });
  });

  // ============================================================
  // 2. POST /api/admin/products/:id/inventory/release — Release stock
  // ============================================================
  describe('POST /api/admin/products/:id/inventory/release (Release Stock)', () => {
    it('should release reserved stock successfully', async () => {
      // First reserve some stock
      await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/reserve`)
        .set(adminHeaders)
        .send({ quantity: 5, referenceId: testProduct.id })
        .expect(200);

      // Then release it
      const res = await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/release`)
        .set(adminHeaders)
        .send({ quantity: 5, referenceId: testProduct.id })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.stock).toBe(10); // Back to original
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/release`)
        .send({ quantity: 3, referenceId: testProduct.id })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // 3. POST /api/admin/products/:id/inventory/adjust — Adjust stock
  // ============================================================
  describe('POST /api/admin/products/:id/inventory/adjust (Adjust Stock)', () => {
    it('should adjust stock with valid reason', async () => {
      const res = await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/adjust`)
        .set(adminHeaders)
        .send({ quantity: 5, reason: 'Inventory count correction' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.stock).toBe(15); // 10 + 5 = 15
    });

    it('should reject negative result with 400', async () => {
      const res = await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/adjust`)
        .set(adminHeaders)
        .send({ quantity: -15, reason: 'Inventory count correction' }) // 10 + (-15) = -5
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STOCK_ADJUSTMENT');
    });
  });

  // ============================================================
  // 4. GET /api/admin/products/:id/inventory — Get inventory movements
  // ============================================================
  describe('GET /api/admin/products/:id/inventory/movements (Get Movements)', () => {
    it('should return inventory movements for admin', async () => {
      // Create some movements first
      await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/adjust`)
        .set(adminHeaders)
        .send({ quantity: 5, reason: 'Initial stock' })
        .expect(200);

      await testAgent
        .post(`/api/admin/products/${testProduct.id}/inventory/reserve`)
        .set(adminHeaders)
        .send({ quantity: 2, referenceId: testProduct.id })
        .expect(200);

      const res = await testAgent
        .get(`/api/admin/products/${testProduct.id}/inventory/movements`)
        .set(adminHeaders)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeTruthy();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
