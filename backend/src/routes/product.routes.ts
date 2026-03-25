/**
 * @fileoverview ProductRoutes - Product route definitions and validation
 * @description Defines API routes for products with express-validator validation.
 *             Define las rutas de API para productos con validación de express-validator.
 * @module routes/product.routes
 * @author MLM Development Team
 *
 * @example
 * // English: GET /api/products - List all products
 * router.get('/', getProducts);
 *
 * // Español: GET /api/products - Listar todos los productos
 * router.get('/', getProducts);
 */
import { Router, Router as ExpressRouter } from 'express';
import { getProducts, getProductById } from '../controllers/ProductController';
import { asyncHandler } from '../middleware/asyncHandler';
import { body, param, query } from 'express-validator';

const router: ExpressRouter = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar productos / List products
 *     description: Obtiene lista de productos con paginación y filtro opcional. No requiere autenticación.
 *     tags: [products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página / Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Límite por página / Items per page
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [subscription, streaming, one-time]
 *         description: Filtrar por tipo de producto / Filter by product type
 *     responses:
 *       200:
 *         description: Lista de productos / Product list
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
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Error del servidor / Server error
 */
router.get(
  '/',
  [
    // Validate page query parameter
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    // Validate limit query parameter
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    // Validate platform query parameter
    query('platform')
      .optional()
      .isIn(['subscription', 'streaming', 'one-time'])
      .withMessage('Platform must be one of: subscription, streaming, one-time'),
  ],
  asyncHandler(getProducts)
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener producto por ID / Get product by ID
 *     description: Retorna los detalles de un producto específico. No requiere autenticación.
 *     tags: [products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del producto / Product ID
 *     responses:
 *       200:
 *         description: Detalles del producto / Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: ID inválido / Invalid ID format
 *       404:
 *         description: Producto no encontrado / Product not found
 */
router.get(
  '/:id',
  [
    // Validate UUID format for product ID
    param('id').isUUID('4').withMessage('Product ID must be a valid UUID'),
  ],
  asyncHandler(getProductById)
);

export default router;
