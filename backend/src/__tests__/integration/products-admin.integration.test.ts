/**
 * @fileoverview Products Admin Integration Tests
 * @description Full integration test suite for admin product API endpoints — CRUD operations,
 *              filtering, pagination.
 *
 *              Suite completa de tests de integración para endpoints API de productos admin —
 *              operaciones CRUD, filtros, paginación.
 *
 * @module __tests__/integration/products-admin
 * @requires supertest
 * @requires fixtures
 */

import { testAgent } from '../setup';
import { createTestUser, createAdminUser, getAuthHeaders } from '../fixtures';
import { Product, Category, User } from '../../models';
import { v4 as uuidv4 } from 'uuid';

describe('Products Admin Integration Tests', () => {
  let regularUser: User;
  let regularHeaders: Record<string, string>;
  let adminUser: User;
  let adminHeaders: Record<string, string>;
  let testCategory: Category;

  /**
   * Helper: Create a test category
   */
  async function createTestCategory(): Promise<Category> {
    return Category.create({
      name: `Test Category ${Date.now()}`,
      slug: `test-category-${Date.now()}`,
      isActive: true,
      sortOrder: 0,
    } as any);
  }

  /**
   * Helper: Create a test product
   */
  async function createTestProduct(
    overrides: Partial<{ name: string; price: number }> = {}
  ): Promise<Product> {
    return Product.create({
      name: overrides.name || `Test Product ${Date.now()}`,
      platform: 'netflix' as any,
      price: overrides.price ?? 29.99,
      currency: 'USD',
      durationDays: 30,
      isActive: true,
      stock: 10,
      type: 'physical' as any,
    } as any);
  }

  beforeEach(async () => {
    // Create users
    adminUser = await createAdminUser();
    adminHeaders = getAuthHeaders(adminUser);
    regularUser = await createTestUser();
    regularHeaders = getAuthHeaders(regularUser);

    // Create test category
    testCategory = await createTestCategory();
  });

  afterEach(async () => {
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
  });

  // ============================================================
  // 1. POST /api/admin/products — Create product
  // ============================================================
  describe('POST /api/admin/products (Create Product)', () => {
    it('should create a new product successfully', async () => {
      const res = await testAgent
        .post('/api/admin/products')
        .set(adminHeaders)
        .send({
          name: 'New Test Product',
          platform: 'netflix',
          price: 19.99,
          currency: 'USD',
          durationDays: 30,
          type: 'subscription',
          isActive: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Test Product');
      expect(res.body.data.price).toBe('19.99');
    });

    it('should reject missing required fields with 400', async () => {
      const res = await testAgent
        .post('/api/admin/products')
        .set(adminHeaders)
        .send({
          name: 'Incomplete Product',
          // Missing platform, price, durationDays
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject non-admin user with 403', async () => {
      const res = await testAgent
        .post('/api/admin/products')
        .set(regularHeaders)
        .send({
          name: 'Test Product',
          platform: 'netflix',
          price: 19.99,
          currency: 'USD',
          durationDays: 30,
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // 2. GET /api/admin/products — List products (admin)
  // ============================================================
  describe('GET /api/admin/products (List Products)', () => {
    it('should return paginated list of products for admin', async () => {
      // Create a few products first
      await createTestProduct({ name: 'Product A', price: 10.0 });
      await createTestProduct({ name: 'Product B', price: 20.0 });
      await createTestProduct({ name: 'Product C', price: 30.0 });

      const res = await testAgent.get('/api/admin/products').set(adminHeaders).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(res.body.pagination).toBeTruthy();
    });

    it('should filter products by type', async () => {
      // Create products of different types
      await Product.create({
        name: 'Physical Product',
        platform: 'other' as any,
        price: 50.0,
        currency: 'USD',
        durationDays: 0,
        isActive: true,
        type: 'physical',
        stock: 10,
      } as any);

      await Product.create({
        name: 'Digital Product',
        platform: 'other' as any,
        price: 15.0,
        currency: 'USD',
        durationDays: 0,
        isActive: true,
        type: 'digital',
        stock: 0,
      } as any);

      const res = await testAgent
        .get('/api/admin/products?type=physical')
        .set(adminHeaders)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      // All returned should be physical
      for (const product of res.body.data) {
        expect(product.type).toBe('physical');
      }
    });

    it('should filter products by category', async () => {
      // Create product with category
      const productWithCategory = await createTestProduct();
      await Product.update(
        { categoryId: testCategory.id },
        { where: { id: productWithCategory.id } }
      );

      // Create product without category
      await createTestProduct();

      const res = await testAgent
        .get(`/api/admin/products?categoryId=${testCategory.id}`)
        .set(adminHeaders)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      // All returned should have the specified category
      for (const product of res.body.data) {
        expect(product.categoryId).toBe(testCategory.id);
      }
    });
  });

  // ============================================================
  // 3. PUT /api/admin/products/:id — Update product
  // ============================================================
  describe('PUT /api/admin/products/:id (Update Product)', () => {
    it('should update product successfully', async () => {
      const product = await createTestProduct({ name: 'Original Name', price: 10.0 });

      const res = await testAgent
        .put(`/api/admin/products/${product.id}`)
        .set(adminHeaders)
        .send({
          name: 'Updated Name',
          price: 25.0,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.price).toBe('25.00');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = uuidv4();
      const res = await testAgent
        .put(`/api/admin/products/${fakeId}`)
        .set(adminHeaders)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // 4. DELETE /api/admin/products/:id — Soft delete product
  // ============================================================
  describe('DELETE /api/admin/products/:id (Delete Product)', () => {
    it('should soft delete product successfully', async () => {
      const product = await createTestProduct();

      const res = await testAgent
        .delete(`/api/admin/products/${product.id}`)
        .set(adminHeaders)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify product is deactivated
      const updatedProduct = await Product.findByPk(product.id);
      expect(updatedProduct?.isActive).toBe(false);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = uuidv4();
      const res = await testAgent
        .delete(`/api/admin/products/${fakeId}`)
        .set(adminHeaders)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});
