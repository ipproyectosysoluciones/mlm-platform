/**
 * @fileoverview Category Routes - Category CRUD and tree operations
 * @description Defines API routes for category management.
 *             Public routes for reading, admin routes for write operations.
 * @module routes/category.routes
 * @author MLM Development Team
 *
 * @example
 * // English: GET /api/categories/tree - Get category tree
 * const response = await fetch('/api/categories/tree');
 *
 * // Español: GET /api/categories/tree - Obtener árbol de categorías
 * const response = await fetch('/api/categories/tree');
 */
import { Router, Router as ExpressRouter } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getCategoryTree,
  getCategoryBreadcrumb,
  getCategoryById,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryAdmin,
  listCategoriesAdmin,
} from '../controllers/CategoryController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: ExpressRouter = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     summary: Get category tree / Obtener árbol de categorías
 *     description: >
 *       EN: Get hierarchical category tree structure with parent-child relationships.
 *       ES: Obtener estructura jerárquica de árbol de categorías con relaciones padre-hijo.
 *     tags: [categories]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive categories / Incluir categorías inactivas
 *     responses:
 *       200:
 *         description: Category tree structure / Estructura de árbol de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryTree'
 */
router.get('/tree', asyncHandler(getCategoryTree));

/**
 * @swagger
 * /categories/{id}/breadcrumb:
 *   get:
 *     summary: Get category breadcrumb / Obtener migaja de categoría
 *     description: >
 *       EN: Get path from root to category. Useful for navigation UI.
 *       ES: Obtener camino desde raíz hasta categoría. Útil para UI de navegación.
 *     tags: [categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID / ID de categoría
 *     responses:
 *       200:
 *         description: Breadcrumb path returned / Camino de migajas retornado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Category not found / Categoría no encontrada
 */
router.get('/:id/breadcrumb', asyncHandler(getCategoryBreadcrumb));

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID / Obtener categoría por ID
 *     description: >
 *       EN: Get category with children. Returns category details and subcategories.
 *       ES: Obtener categoría con hijos. Retorna detalles y subcategorías.
 *     tags: [categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID / ID de categoría
 *     responses:
 *       200:
 *         description: Category details returned / Detalles de categoría retornados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Category not found / Categoría no encontrada
 */
router.get('/:id', asyncHandler(getCategoryById));

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List all categories / Listar todas las categorías
 *     description: >
 *       EN: Get flat list of categories with optional filters. Public endpoint.
 *       ES: Obtener lista plana de categorías con filtros opcionales. Endpoint público.
 *     tags: [categories]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive categories / Incluir categorías inactivas
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parent category / Filtrar por categoría padre
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status / Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Category list returned / Lista de categorías retornada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.get('/', asyncHandler(listCategories));

// ============================================
// ADMIN ROUTES
// ============================================

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: List all categories (admin) / Listar todas las categorías (admin)
 *     description: >
 *       EN: Get flat list of categories with full details. Supports filtering by parentId
 *              and includeInactive. Admin only.
 *       ES: Obtener lista plana de categorías con todos los detalles. Soporta filtros
 *              por parentId e includeInactive. Solo admin.
 *     tags: [admin, categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive categories / Incluir categorías inactivas
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parent category / Filtrar por categoría padre
 *     responses:
 *       200:
 *         description: Category list returned successfully / Lista de categorías retornada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized / No autenticado
 *       403:
 *         description: Forbidden - Admin role required / Prohibido - Rol admin requerido
 */
router.get('/', asyncHandler(listCategoriesAdmin));

/**
 * @swagger
 * /admin/categories/{id}:
 *   get:
 *     summary: Get category by ID (admin) / Obtener categoría por ID (admin)
 *     description: >
 *       EN: Get category with parent and children. Returns full category details.
 *       ES: Obtener categoría con padre e hijos. Retorna detalles completos.
 *     tags: [admin, categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID / ID de categoría
 *     responses:
 *       200:
 *         description: Category details returned / Detalles de categoría retornados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized / No autenticado
 *       403:
 *         description: Forbidden - Admin role required / Prohibido - Rol admin requerido
 *       404:
 *         description: Category not found / Categoría no encontrada
 */
router.get('/:id', asyncHandler(getCategoryAdmin));

/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Create a new category / Crear nueva categoría
 *     description: >
 *       EN: Create a new category with optional parent. Validates unique slug.
 *       ES: Crear nueva categoría con padre opcional. Valida slug único.
 *     tags: [admin, categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Category name / Nombre de categoría
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 description: URL-friendly slug / Slug URL-amigable
 *               description:
 *                 type: string
 *                 description: Category description / Descripción de categoría
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent category ID / ID de categoría padre
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Active status / Estado activo
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *                 description: Display order / Orden de visualización
 *     responses:
 *       201:
 *         description: Category created successfully / Categoría creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error / Error de validación
 *       401:
 *         description: Unauthorized / No autenticado
 *       403:
 *         description: Forbidden - Admin role required / Prohibido - Rol admin requerido
 *       409:
 *         description: Category slug already exists / El slug de categoría ya existe
 */
router.post('/', asyncHandler(createCategory));

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     summary: Update a category / Actualizar categoría
 *     description: >
 *       EN: Update category details. All fields optional - only provided fields are updated.
 *       ES: Actualizar detalles de categoría. Todos los campos opcionales.
 *     tags: [admin, categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID / ID de categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Category name / Nombre de categoría
 *               slug:
 *                 type: string
 *                 pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
 *                 description: URL-friendly slug / Slug URL-amigable
 *               description:
 *                 type: string
 *                 description: Category description / Descripción de categoría
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent category ID / ID de categoría padre
 *               isActive:
 *                 type: boolean
 *                 description: Active status / Estado activo
 *               sortOrder:
 *                 type: integer
 *                 description: Display order / Orden de visualización
 *     responses:
 *       200:
 *         description: Category updated successfully / Categoría actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error / Error de validación
 *       401:
 *         description: Unauthorized / No autenticado
 *       403:
 *         description: Forbidden - Admin role required / Prohibido - Rol admin requerido
 *       404:
 *         description: Category not found / Categoría no encontrada
 */
router.put('/:id', asyncHandler(updateCategory));

/**
 * @swagger
 * /admin/categories/{id}:
 *   delete:
 *     summary: Delete a category / Eliminar categoría
 *     description: >
 *       EN: Soft delete a category (sets isActive to false). Fails if category has
 *              products or child categories.
 *       ES: Eliminación suave de categoría (pone isActive en false). Falla si tiene
 *              productos o categorías hijos.
 *     tags: [admin, categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID / ID de categoría
 *     responses:
 *       200:
 *         description: Category deleted successfully / Categoría eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Cannot delete - has products or children / No se puede eliminar - tiene productos o hijos
 *       401:
 *         description: Unauthorized / No autenticado
 *       403:
 *         description: Forbidden - Admin role required / Prohibido - Rol admin requerido
 *       404:
 *         description: Category not found / Categoría no encontrada
 */
router.delete('/:id', asyncHandler(deleteCategory));

export default router;
