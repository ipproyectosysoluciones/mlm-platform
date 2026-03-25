/**
 * @fileoverview ProductService - Product management for streaming subscriptions
 * @description Handles product listing, filtering, and validation for e-commerce.
 *             Gestión de productos para suscripciones de streaming.
 * @module services/ProductService
 * @author MLM Development Team
 *
 * @example
 * // English: Get paginated products
 * const { rows, count } = await productService.getProductList({ page: 1, limit: 20 });
 *
 * // Español: Obtener productos paginados
 * const { rows, count } = await productService.getProductList({ page: 1, limit: 20 });
 */
import { Op } from 'sequelize';
import { Product } from '../models';
import { AppError } from '../middleware/error.middleware';
import type { ProductAttributes } from '../types';

export interface ProductListOptions {
  page?: number;
  limit?: number;
  platform?: string; // 'subscription', 'streaming', 'one-time'
  status?: 'active' | 'inactive';
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedProducts {
  rows: Product[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductService {
  /**
   * Get products with pagination and filtering
   * Obtener productos con paginación y filtros
   *
   * @param {ProductListOptions} options - Filter and pagination options
   * @returns {Promise<PaginatedProducts>} Paginated product list
   * @example
   * // English: Get active streaming products, page 1, 10 per page
   * const products = await productService.getProductList({
   *   page: 1,
   *   limit: 10,
   *   platform: 'streaming',
   *   status: 'active'
   * });
   *
   * // Español: Obtener productos de streaming activos, página 1, 10 por página
   * const products = await productService.getProductList({
   *   page: 1,
   *   limit: 10,
   *   platform: 'streaming',
   *   status: 'active'
   * });
   */
  async getProductList(options: ProductListOptions = {}): Promise<PaginatedProducts> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Filter by platform/type
    if (options.platform) {
      where.type = options.platform;
    }

    // Filter by status (default to active)
    where.status = options.status || 'active';

    // Filter by price range
    if (options.minPrice !== undefined) {
      where.price = { ...(where.price as object), [Op.gte]: options.minPrice };
    }
    if (options.maxPrice !== undefined) {
      where.price = { ...(where.price as object), [Op.lte]: options.maxPrice };
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      rows,
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Find product by ID
   * Buscar producto por ID
   *
   * @param {string} id - Product UUID
   * @returns {Promise<Product>} Product instance
   * @throws {AppError} 404 if product not found
   * @example
   * // English: Get product by ID
   * const product = await productService.findById('uuid-here');
   *
   * // Español: Obtener producto por ID
   * const product = await productService.findById('uuid-aqui');
   */
  async findById(id: string): Promise<Product> {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    return product;
  }

  /**
   * Validate product for purchase
   * Validar producto para compra
   *
   * Checks if product exists and is available for purchase.
   *
   * @param {string} id - Product UUID
   * @returns {Promise<ProductAttributes>} Validated product data
   * @throws {AppError} 400 if product is inactive or not found
   * @example
   * // English: Validate product before purchase
   * const validated = await productService.validateProduct('uuid-here');
   *
   * // Español: Validar producto antes de compra
   * const validated = await productService.validateProduct('uuid-aqui');
   */
  async validateProduct(id: string): Promise<ProductAttributes> {
    const product = await this.findById(id);

    if (product.status !== 'active') {
      throw new AppError(400, 'PRODUCT_INACTIVE', 'Product is not available for purchase');
    }

    return product.toJSON() as ProductAttributes;
  }

  /**
   * Get products by IDs (bulk fetch)
   * Obtener productos por IDs (carga masiva)
   *
   * @param {string[]} ids - Array of product UUIDs
   * @returns {Promise<Product[]>} Array of products
   * @example
   * // English: Get multiple products
   * const products = await productService.findByIds(['uuid1', 'uuid2']);
   *
   * // Español: Obtener múltiples productos
   * const products = await productService.findByIds(['uuid1', 'uuid2']);
   */
  async findByIds(ids: string[]): Promise<Product[]> {
    return Product.findAll({
      where: {
        id: { [Op.in]: ids },
        status: 'active',
      },
    });
  }
}

export const productService = new ProductService();
