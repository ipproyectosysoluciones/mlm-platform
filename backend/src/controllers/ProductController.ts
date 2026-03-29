/**
 * @fileoverview ProductController - Product API endpoints for streaming subscriptions
 * @description Handles product listing, filtering, and retrieval for e-commerce.
 *             Gestión de endpoints de productos para suscripciones de streaming.
 * @module controllers/ProductController
 * @author MLM Development Team
 *
 * @example
 * // English: GET /api/products - List all products
 * const response = await fetch('/api/products?page=1&limit=20');
 *
 * // Español: GET /api/products - Listar todos los productos
 * const response = await fetch('/api/products?page=1&limit=20');
 */
import { Response } from 'express';
import { productService } from '../services/ProductService';
import type { ApiResponse, ProductAttributes } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

/**
 * Get list of products with pagination and optional platform filtering
 * Obtener lista de productos con paginación y filtro opcional por plataforma
 *
 * @route GET /api/products
 * @access Public (no authentication required)
 * @param {AuthenticatedRequest} req - Express request with query params
 * @param {Response} res - Express response
 * @returns {ApiResponse} Paginated product list
 *
 * @swagger
 * /products:
 *   get:
 *     summary: Listar productos / List products
 *     description: Obtiene lista de productos con paginación opcional. No requiere autenticación.
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
 *       500:
 *         description: Error del servidor / Server error
 */
export async function getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const platform = req.query.platform as string | undefined;
    let validatedPlatform: ProductAttributes['platform'] | undefined;
    if (platform) {
      const allowedPlatforms = [
        'netflix',
        'disney_plus',
        'spotify',
        'hbo_max',
        'amazon_prime',
        'youtube_premium',
        'apple_tv',
        'other',
      ];
      if (allowedPlatforms.includes(platform)) {
        validatedPlatform = platform as ProductAttributes['platform'];
      } else {
        // invalid platform, treat as undefined
        validatedPlatform = undefined;
      }
    }

    const result = await productService.getProductList({
      page,
      limit,
      platform: validatedPlatform,
      isActive: true, // Only return active products
    });

    const response: ApiResponse<ProductAttributes[]> = {
      success: true,
      data: result.rows.map((p) => ({
        id: p.id,
        name: p.name,
        platform: p.platform,
        description: p.description,
        price: Number(p.price),
        currency: p.currency,
        durationDays: p.durationDays,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        total: result.count,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    const appError =
      error instanceof AppError
        ? error
        : new AppError(500, 'INTERNAL_ERROR', 'Failed to fetch products');
    res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
      },
    });
  }
}

/**
 * Get single product by ID
 * Obtener producto individual por ID
 *
 * @route GET /api/products/:id
 * @access Public (no authentication required)
 * @param {AuthenticatedRequest} req - Express request with product ID param
 * @param {Response} res - Express response
 * @returns {ApiResponse} Single product details
 *
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
 *       404:
 *         description: Producto no encontrado / Product not found
 *       400:
 *         description: ID inválido / Invalid ID format
 */
export async function getProductById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Validate UUID format - accept any valid UUID including all-zeros
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid product ID format',
          details: {
            id: ['Product ID must be a valid UUID'],
          },
        },
      });
      return;
    }

    const product = await productService.findById(id);

    const response: ApiResponse<ProductAttributes> = {
      success: true,
      data: {
        id: product.id,
        name: product.name,
        platform: product.platform,
        description: product.description,
        price: Number(product.price),
        currency: product.currency,
        durationDays: product.durationDays,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    };

    res.json(response);
  } catch (error) {
    if (error instanceof AppError && error.code === 'PRODUCT_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
        },
      });
      return;
    }

    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch product',
      },
    });
  }
}
