/**
 * @fileoverview Products and Orders Integration Tests
 * @description Tests for products and orders endpoints
 *
 * @module __tests__/integration/products-orders
 * @requires supertest
 * @requires fixtures
 */

import { testAgent } from '../setup';
import { createTestUser, getAuthHeaders } from '../fixtures';
import { Product, Order } from '../../models';

describe('Products and Orders Integration Tests', () => {
  // Seed data for tests
  let testProduct: Product;
  let testUser: any;

  beforeEach(async () => {
    // Create a test product
    testProduct = await Product.create({
      name: 'Netflix Premium',
      description: 'Premium streaming subscription',
      platform: 'netflix',
      price: 15.99,
      currency: 'USD',
      durationDays: 30,
      isActive: true,
    });

    // Create test user
    testUser = await createTestUser();
  });

  describe('GET /api/products', () => {
    it('should return 200 with active products list', async () => {
      let res: any;
      try {
        res = await testAgent.get('/api/products');
      } catch (e: any) {
        console.error('Request error:', e.message);
        throw e;
      }

      console.log('GET /api/products response status:', res?.status);
      console.log('GET /api/products response body:', JSON.stringify(res?.body));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);

      // Verify the test product is in the list
      const foundProduct = res.body.data.find((p: any) => p.id === testProduct.id);
      expect(foundProduct).toBeDefined();
      expect(foundProduct.name).toBe('Netflix Premium');
      expect(foundProduct.isActive).toBe(true);
    });

    it('should only return active products', async () => {
      // Create an inactive product
      await Product.create({
        name: 'Inactive Product',
        description: 'This product is inactive',
        platform: 'spotify',
        price: 9.99,
        currency: 'USD',
        durationDays: 30,
        isActive: false,
      });

      const res = await testAgent.get('/api/products');

      console.log('GET /api/products (active only) response:', res.status, res.body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify inactive product is not in the list
      const inactiveProduct = res.body.data.find((p: any) => p.name === 'Inactive Product');
      expect(inactiveProduct).toBeUndefined();
    });

    it('should support pagination', async () => {
      // Create more products
      for (let i = 0; i < 5; i++) {
        await Product.create({
          name: `Product ${i}`,
          description: `Test product ${i}`,
          platform: 'netflix',
          price: 10 + i,
          currency: 'USD',
          durationDays: 30,
          isActive: true,
        });
      }

      const res = await testAgent.get('/api/products?page=1&limit=3');

      console.log('GET /api/products (pagination) response:', res.status, res.body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.limit).toBe(3);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return 200 for valid UUID', async () => {
      const res = await testAgent.get(`/api/products/${testProduct.id}`);

      console.log('GET /api/products/:id response:', res.status, res.body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(testProduct.id);
      expect(res.body.data.name).toBe('Netflix Premium');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await testAgent.get(`/api/products/${fakeId}`);

      console.log('GET /api/products/:id (not found) response:', res.status, res.body);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await testAgent.get('/api/products/invalid-id');

      console.log('GET /api/products/:id (invalid UUID) response:', res.status, res.body);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/orders', () => {
    it('should create order with valid JWT and return status completed', async () => {
      const headers = getAuthHeaders(testUser);

      const res = await testAgent
        .post('/api/orders')
        .set(headers)
        .send({
          items: [
            {
              productId: testProduct.id,
              quantity: 1,
            },
          ],
          paymentMethod: 'simulated',
        });

      console.log('POST /api/orders response:', res.status, res.body);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.userId).toBe(testUser.id);
      expect(res.body.data.productId).toBe(testProduct.id);
    });

    it('should return 401 without JWT', async () => {
      const res = await testAgent.post('/api/orders').send({
        items: [
          {
            productId: testProduct.id,
            quantity: 1,
          },
        ],
        paymentMethod: 'simulated',
      });

      console.log('POST /api/orders (no auth) response:', res.status, res.body);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 with invalid productId', async () => {
      const headers = getAuthHeaders(testUser);
      const invalidProductId = '00000000-0000-0000-0000-000000000000';

      const res = await testAgent
        .post('/api/orders')
        .set(headers)
        .send({
          items: [
            {
              productId: invalidProductId,
              quantity: 1,
            },
          ],
          paymentMethod: 'simulated',
        });

      console.log('POST /api/orders (invalid product) response:', res.status, res.body);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 with missing required fields', async () => {
      const headers = getAuthHeaders(testUser);

      const res = await testAgent.post('/api/orders').set(headers).send({
        items: [],
      });

      console.log('POST /api/orders (missing fields) response:', res.status, res.body);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/orders', () => {
    it('should return only current user orders', async () => {
      const headers = getAuthHeaders(testUser);

      // Create an order for the test user
      await Order.create({
        userId: testUser.id,
        productId: testProduct.id,
        totalAmount: testProduct.price,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'simulated',
        orderNumber: `ORD-TEST-${Date.now()}`,
      });

      // Create another user with their own order
      const otherUser = await createTestUser({ email: 'other@test.mlm' });
      await Order.create({
        userId: otherUser.id,
        productId: testProduct.id,
        totalAmount: testProduct.price,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'simulated',
        orderNumber: `ORD-TEST-${Date.now()}`,
      });

      const res = await testAgent.get('/api/orders').set(headers);

      console.log('GET /api/orders response:', res.status, res.body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);

      // Verify only testUser's orders are returned
      for (const order of res.body.data) {
        expect(order.userId).toBe(testUser.id);
      }
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 401 without JWT', async () => {
      const res = await testAgent.get('/api/orders');

      console.log('GET /api/orders (no auth) response:', res.status, res.body);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order for owner', async () => {
      const headers = getAuthHeaders(testUser);

      // Create an order for the test user
      const order = await Order.create({
        userId: testUser.id,
        productId: testProduct.id,
        totalAmount: testProduct.price,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'simulated',
        orderNumber: `ORD-TEST-${Date.now()}`,
      });

      const res = await testAgent.get(`/api/orders/${order.id}`).set(headers);

      console.log('GET /api/orders/:id (owner) response:', res.status, res.body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(order.id);
      expect(res.body.data.userId).toBe(testUser.id);
    });

    it('should return 403 for wrong user', async () => {
      // Create an order for testUser
      const order = await Order.create({
        userId: testUser.id,
        productId: testProduct.id,
        totalAmount: testProduct.price,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'simulated',
        orderNumber: `ORD-TEST-${Date.now()}`,
      });

      // Create another user and try to access the order
      const otherUser = await createTestUser({ email: 'other2@test.mlm' });
      const otherHeaders = getAuthHeaders(otherUser);

      const res = await testAgent.get(`/api/orders/${order.id}`).set(otherHeaders);

      console.log('GET /api/orders/:id (wrong user) response:', res.status, res.body);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent order', async () => {
      const headers = getAuthHeaders(testUser);
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await testAgent.get(`/api/orders/${fakeId}`).set(headers);

      console.log('GET /api/orders/:id (not found) response:', res.status, res.body);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should return 401 without JWT', async () => {
      const order = await Order.create({
        userId: testUser.id,
        productId: testProduct.id,
        totalAmount: testProduct.price,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'simulated',
        orderNumber: `ORD-TEST-${Date.now()}`,
      });

      const res = await testAgent.get(`/api/orders/${order.id}`);

      console.log('GET /api/orders/:id (no auth) response:', res.status, res.body);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
