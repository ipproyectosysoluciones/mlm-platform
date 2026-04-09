/**
 * @fileoverview ProductReadController - Product retrieval operations
 * @description Controlador de lectura de productos
 *              Handles product listing and retrieval with extended filters
 * @module controllers/products/ProductReadController
 * @author MLM Development Team
 *
 * @example
 * // English: Import from sub-controller
 * import { getProducts, getProductById } from '../controllers/products';
 *
 * // Español: Importar desde sub-controlador
 * import { getProducts, getProductById } from '../controllers/products';
 */
import { Response, RequestHandler } from 'express';
import { productService } from '../../services/ProductService';
import type {
  ApiResponse,
  ProductAttributes,
  ProductType,
  GenericProductAttributes,
} from '../../types';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';
import type { Product } from '../../models/Product';

/**
 * UUID validation regex
 * Expresión regular para validación de UUID
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Allowed platforms for filtering
 * Plataformas permitidas para filtrado
 */
const ALLOWED_PLATFORMS = [
  'netflix',
  'disney_plus',
  'spotify',
  'hbo_max',
  'amazon_prime',
  'youtube_premium',
  'apple_tv',
  'other',
];

/**
 * Allowed product types for filtering
 * Tipos de productos permitidos para filtrado
 */
const ALLOWED_PRODUCT_TYPES: ProductType[] = ['physical', 'digital', 'subscription', 'service'];

/**
 * Transform product to API response format
 */
function transformProductResponse(product: Product): GenericProductAttributes {
  return {
    id: product.id,
    name: product.name,
    platform: product.platform,
    description: product.description,
    price: Number(product.price),
    currency: product.currency,
    durationDays: product.durationDays,
    isActive: product.isActive,
    // Extended generic product fields
    type: product.type || 'subscription',
    sku: product.sku || null,
    categoryId: product.categoryId || null,
    stock: product.stock || 0,
    isDigital: product.isDigital || false,
    maxQuantityPerUser: product.maxQuantityPerUser || null,
    metadata: product.metadata || null,
    images: product.images || [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/**
 * Get list of products with pagination and optional platform/type/category/search filtering
 * Obtener lista de productos con paginación y filtros opcionales
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
 *     description: Obtiene lista de productos con paginación opcional y filtros extendidos. No requiere autenticación.
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
 *           enum: [netflix, disney_plus, spotify, hbo_max, amazon_prime, youtube_premium, apple_tv, other]
 *         description: Filtrar por plataforma / Filter by platform
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [physical, digital, subscription, service]
 *         description: Filtrar por tipo de producto / Filter by product type
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por categoría / Filter by category
 *       - in: query
 *         name: minStock
 *         schema:
 *           type: integer
 *         description: Stock mínimo / Minimum stock
 *       - in: query
 *         name: maxStock
 *         schema:
 *           type: integer
 *         description: Stock máximo / Maximum stock
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o descripción / Search by name or description
 *     responses:
 *       200:
 *         description: Lista de productos / Product list
 *       500:
 *         description: Error del servidor / Server error
 */
export const getProducts: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const platform = req.query.platform as string | undefined;
    const type = req.query.type as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const minStock = req.query.minStock ? parseInt(req.query.minStock as string) : undefined;
    const maxStock = req.query.maxStock ? parseInt(req.query.maxStock as string) : undefined;
    const search = req.query.search as string | undefined;

    let validatedPlatform: ProductAttributes['platform'] | undefined;
    if (platform && ALLOWED_PLATFORMS.includes(platform)) {
      validatedPlatform = platform as ProductAttributes['platform'];
    }

    let validatedType: ProductType | undefined;
    if (type && ALLOWED_PRODUCT_TYPES.includes(type as ProductType)) {
      validatedType = type as ProductType;
    }

    const result = await productService.getProductList({
      page,
      limit,
      platform: validatedPlatform,
      type: validatedType,
      categoryId,
      minStock,
      maxStock,
      search,
      isActive: true,
    });

    const response: ApiResponse<GenericProductAttributes[]> = {
      success: true,
      data: result.rows.map((p) => transformProductResponse(p)),
      pagination: {
        total: result.count,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };

    res.json(response);
  }
);

/**
 * Get single product by ID with extended fields
 * Obtener producto individual por ID con campos extendidos
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
 *     description: Retorna los detalles de un producto específico con campos extendidos. No requiere autenticación.
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
export const getProductById: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
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

    const product = await productService.findByIdWithCategory(id);

    const response: ApiResponse<GenericProductAttributes> = {
      success: true,
      data: {
        ...transformProductResponse(product),
        category: product.category
          ? {
              id: product.category.id,
              parentId: product.category.parentId,
              name: product.category.name,
              slug: product.category.slug,
              description: product.category.description,
              isActive: product.category.isActive,
              sortOrder: product.category.sortOrder,
              createdAt: product.category.createdAt,
              updatedAt: product.category.updatedAt,
            }
          : null,
      },
    };

    res.json(response);
  }
);
