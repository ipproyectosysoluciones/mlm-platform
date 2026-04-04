/**
 * @fileoverview Category Integration Tests
 * @description Full integration test suite for category API endpoints — CRUD operations,
 *              tree structure, breadcrumb, and hierarchical validation.
 * @module __tests__/integration/categories
 */

import { testAgent } from '../setup';
import { createTestUser, createAdminUser, getAuthHeaders } from '../fixtures';
import { Category, Product, User } from '../../models';

describe('Category Integration Tests', () => {
  let regularUser: User;
  let regularHeaders: Record<string, string>;
  let adminUser: User;
  let adminHeaders: Record<string, string>;

  beforeEach(async () => {
    adminUser = await createAdminUser();
    adminHeaders = getAuthHeaders(adminUser);
    regularUser = await createTestUser();
    regularHeaders = getAuthHeaders(regularUser);
  });

  // ============================================================
  // GET /api/categories — Public category listing
  // ============================================================
  describe('GET /api/categories (Public)', () => {
    it('should return empty array when no categories exist', async () => {
      const res = await testAgent.get('/api/categories').expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return categories tree structure', async () => {
      // Create root category
      await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products',
        isActive: true,
        sortOrder: 0,
      });

      const res = await testAgent.get('/api/categories').expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should allow unauthenticated access', async () => {
      const res = await testAgent.get('/api/categories').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================================
  // GET /api/categories/tree — Get category tree
  // ============================================================
  describe('GET /api/categories/tree', () => {
    it('should return hierarchical category tree', async () => {
      // Create root
      const root = await Category.create({
        name: 'Electronics',
        slug: 'electronics',
        isActive: true,
        sortOrder: 0,
      });

      // Create child
      await Category.create({
        name: 'Phones',
        slug: 'phones',
        parentId: root.id,
        isActive: true,
        sortOrder: 0,
      });

      const res = await testAgent.get('/api/categories/tree').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].children).toHaveLength(1);
    });
  });

  // ============================================================
  // GET /api/categories/:id — Get category by ID
  // ============================================================
  describe('GET /api/categories/:id', () => {
    it('should return category with children', async () => {
      const root = await Category.create({
        name: 'Electronics',
        slug: 'electronics-test',
        isActive: true,
        sortOrder: 0,
      });

      await Category.create({
        name: 'Phones',
        slug: 'phones-test',
        parentId: root.id,
        isActive: true,
        sortOrder: 0,
      });

      const res = await testAgent.get(`/api/categories/${root.id}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(root.id);
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await testAgent.get(`/api/categories/${fakeId}`).expect(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // GET /api/categories/:id/breadcrumb — Get breadcrumb
  // ============================================================
  describe('GET /api/categories/:id/breadcrumb', () => {
    it('should return breadcrumb path from root to category', async () => {
      const root = await Category.create({
        name: 'Root',
        slug: 'root-cat',
        isActive: true,
        sortOrder: 0,
      });

      const child = await Category.create({
        name: 'Child',
        slug: 'child-cat',
        parentId: root.id,
        isActive: true,
        sortOrder: 0,
      });

      const res = await testAgent.get(`/api/categories/${child.id}/breadcrumb`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toBe('Root');
      expect(res.body.data[1].name).toBe('Child');
    });

    it('should return single item for root category', async () => {
      const root = await Category.create({
        name: 'RootOnly',
        slug: 'root-only',
        isActive: true,
        sortOrder: 0,
      });

      const res = await testAgent.get(`/api/categories/${root.id}/breadcrumb`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ============================================================
  // POST /api/admin/categories — Create category (admin)
  // ============================================================
  describe('POST /api/admin/categories (Admin)', () => {
    it('should create root category (201)', async () => {
      const res = await testAgent
        .post('/api/admin/categories')
        .set(adminHeaders)
        .send({
          name: 'New Category',
          slug: 'new-category',
          description: 'A new category',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Category');
    });

    it('should create child category (201)', async () => {
      const parent = await Category.create({
        name: 'Parent',
        slug: 'parent-cat',
        isActive: true,
      });

      const res = await testAgent
        .post('/api/admin/categories')
        .set(adminHeaders)
        .send({
          name: 'Child Category',
          slug: 'child-cat',
          parentId: parent.id,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.parentId).toBe(parent.id);
    });

    it('should reject if parent not found (400)', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await testAgent
        .post('/api/admin/categories')
        .set(adminHeaders)
        .send({
          name: 'Bad Child',
          slug: 'bad-child',
          parentId: fakeId,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject non-admin user (403)', async () => {
      const res = await testAgent
        .post('/api/admin/categories')
        .set(regularHeaders)
        .send({
          name: 'Test',
          slug: 'test-cat',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated request (401)', async () => {
      const res = await testAgent
        .post('/api/admin/categories')
        .send({
          name: 'Test',
          slug: 'test-cat',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // PUT /api/admin/categories/:id — Update category (admin)
  // ============================================================
  describe('PUT /api/admin/categories/:id (Admin)', () => {
    it('should update category (200)', async () => {
      const category = await Category.create({
        name: 'Old Name',
        slug: 'old-name-cat',
        isActive: true,
      });

      const res = await testAgent
        .put(`/api/admin/categories/${category.id}`)
        .set(adminHeaders)
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Name');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await testAgent
        .put(`/api/admin/categories/${fakeId}`)
        .set(adminHeaders)
        .send({ name: 'Test' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // DELETE /api/admin/categories/:id — Delete category (admin)
  // ============================================================
  describe('DELETE /api/admin/categories/:id (Admin)', () => {
    it('should soft delete category (200)', async () => {
      const category = await Category.create({
        name: 'To Delete',
        slug: 'to-delete-cat',
        isActive: true,
      });

      const res = await testAgent
        .delete(`/api/admin/categories/${category.id}`)
        .set(adminHeaders)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify it's deactivated
      const updated = await Category.findByPk(category.id);
      expect(updated?.isActive).toBe(false);
    });

    it('should reject if category has products (400)', async () => {
      const category = await Category.create({
        name: 'Has Products',
        slug: 'has-products-cat',
        isActive: true,
      });

      // Create a product in this category
      await Product.create({
        name: 'Test Product',
        platform: 'netflix',
        price: 10,
        currency: 'USD',
        durationDays: 30,
        isActive: true,
        categoryId: category.id,
      });

      const res = await testAgent
        .delete(`/api/admin/categories/${category.id}`)
        .set(adminHeaders)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CATEGORY_HAS_PRODUCTS');
    });

    it('should reject if category has children (400)', async () => {
      const parent = await Category.create({
        name: 'Parent',
        slug: 'parent-has-children',
        isActive: true,
      });

      await Category.create({
        name: 'Child',
        slug: 'child-has-children',
        parentId: parent.id,
        isActive: true,
      });

      const res = await testAgent
        .delete(`/api/admin/categories/${parent.id}`)
        .set(adminHeaders)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CATEGORY_HAS_CHILDREN');
    });
  });

  // ============================================================
  // Verify deleted category returns 404
  // ============================================================
  describe('Deleted category visibility', () => {
    it('should return 404 for deleted category', async () => {
      const category = await Category.create({
        name: 'Will Be Deleted',
        slug: 'will-be-deleted',
        isActive: true,
      });

      // Soft delete
      await category.update({ isActive: false });

      const res = await testAgent.get(`/api/categories/${category.id}`).expect(404);
      expect(res.body.success).toBe(false);
    });
  });
});
