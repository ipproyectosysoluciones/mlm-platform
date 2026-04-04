/**
 * @fileoverview ProductService - Product management for streaming subscriptions + generic products
 * @description Handles product CRUD, listing, filtering, validation, and inventory management.
 *             Extended with generic product types and inventory control.
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
import { Op, Transaction } from 'sequelize';
import { sequelize, Product, Category, InventoryMovement, User } from '../models';
import { AppError } from '../middleware/error.middleware';
import type {
  ProductAttributes,
  ProductCreationAttributes,
  ProductType,
  GenericProductAttributes,
  GenericProductCreationAttributes,
  GenericProductListOptions,
  InventoryMovementType,
} from '../types';
import type { CategoryCreation, Product as ProductModel } from '../models/Product';
import type { InventoryMovementCreation } from '../models/InventoryMovement';

export interface ProductListOptions {
  page?: number;
  limit?: number;
  platform?:
    | 'netflix'
    | 'disney_plus'
    | 'spotify'
    | 'hbo_max'
    | 'amazon_prime'
    | 'youtube_premium'
    | 'apple_tv'
    | 'other';
  isActive?: boolean; // true for active, false for inactive, undefined for both
  minPrice?: number;
  maxPrice?: number;
  // Extended filters for generic products
  type?: ProductType;
  categoryId?: string;
  minStock?: number;
  maxStock?: number;
  search?: string;
}

export interface PaginatedProducts {
  rows: ProductModel[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProductDto {
  name: string;
  platform?: ProductAttributes['platform'];
  description?: string | null;
  price: number;
  currency?: string;
  durationDays?: number;
  isActive?: boolean;
  type?: ProductType;
  sku?: string | null;
  categoryId?: string | null;
  stock?: number;
  isDigital?: boolean;
  maxQuantityPerUser?: number | null;
  metadata?: Record<string, unknown> | null;
  images?: string[];
}

export interface UpdateProductDto {
  name?: string;
  platform?: ProductAttributes['platform'];
  description?: string | null;
  price?: number;
  currency?: string;
  durationDays?: number;
  isActive?: boolean;
  type?: ProductType;
  sku?: string | null;
  categoryId?: string | null;
  stock?: number;
  isDigital?: boolean;
  maxQuantityPerUser?: number | null;
  metadata?: Record<string, unknown> | null;
  images?: string[];
}

export class ProductService {
  /**
   * Get products with pagination and filtering (extended for generic products)
   * Obtener productos con paginación y filtros (extendido para productos genéricos)
   *
   * @param {ProductListOptions} options - Filter and pagination options
   * @returns {Promise<PaginatedProducts>} Paginated product list
   */
  async getProductList(options: ProductListOptions = {}): Promise<PaginatedProducts> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Filter by platform
    if (options.platform) {
      where.platform = options.platform;
    }

    // Filter by isActive (default to active)
    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    } else {
      where.isActive = true;
    }

    // Filter by price range
    if (options.minPrice !== undefined) {
      where.price = { ...(where.price as object), [Op.gte]: options.minPrice };
    }
    if (options.maxPrice !== undefined) {
      where.price = { ...(where.price as object), [Op.lte]: options.maxPrice };
    }

    // Extended filters for generic products
    if (options.type) {
      where.type = options.type;
    }

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.minStock !== undefined) {
      where.stock = { ...(where.stock as object), [Op.gte]: options.minStock };
    }

    if (options.maxStock !== undefined) {
      where.stock = { ...(where.stock as object), [Op.lte]: options.maxStock };
    }

    // Search filter (name or description)
    if (options.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${options.search}%` } },
        { description: { [Op.iLike]: `%${options.search}%` } },
      ];
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: options.categoryId
        ? [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }]
        : [],
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
   */
  async findById(id: string): Promise<ProductModel> {
    const product = await Product.findByPk(id);

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    return product;
  }

  /**
   * Find product by ID with category included
   * @param {string} id - Product UUID
   * @returns {Promise<Product>} Product with category
   */
  async findByIdWithCategory(id: string): Promise<ProductModel> {
    const product = await Product.findByPk(id, {
      include: [{ model: Category, as: 'category' }],
    });

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    return product;
  }

  /**
   * Create a new product
   * @param {CreateProductDto} data - Product data
   * @returns {Promise<Product>} Created product
   */
  async create(data: CreateProductDto): Promise<ProductModel> {
    // Validate category if provided
    if (data.categoryId) {
      const category = await Category.findByPk(data.categoryId);
      if (!category) {
        throw new AppError(400, 'CATEGORY_NOT_FOUND', 'Category not found');
      }
    }

    // Check for duplicate SKU if provided
    if (data.sku) {
      const existing = await Product.findOne({ where: { sku: data.sku } });
      if (existing) {
        throw new AppError(409, 'PRODUCT_SKU_EXISTS', 'Product SKU already exists');
      }
    }

    const product = await Product.create({
      name: data.name,
      platform: data.platform || 'other',
      description: data.description ?? null,
      price: data.price,
      currency: data.currency || 'USD',
      durationDays: data.durationDays || 30,
      isActive: data.isActive ?? true,
      type: data.type || 'subscription',
      sku: data.sku ?? null,
      categoryId: data.categoryId ?? null,
      stock: data.stock ?? 0,
      isDigital: data.isDigital ?? false,
      maxQuantityPerUser: data.maxQuantityPerUser ?? null,
      metadata: data.metadata ?? null,
      images: data.images ?? [],
    } as ProductModel);

    return product;
  }

  /**
   * Update an existing product
   * @param {string} id - Product UUID
   * @param {UpdateProductDto} data - Update data
   * @returns {Promise<Product>} Updated product
   */
  async update(id: string, data: UpdateProductDto): Promise<ProductModel> {
    const product = await this.findById(id);

    // Validate category if provided
    if (data.categoryId !== undefined && data.categoryId !== null) {
      const category = await Category.findByPk(data.categoryId);
      if (!category) {
        throw new AppError(400, 'CATEGORY_NOT_FOUND', 'Category not found');
      }
    }

    // Check for duplicate SKU if changing
    if (data.sku && data.sku !== product.sku) {
      const existing = await Product.findOne({ where: { sku: data.sku } });
      if (existing) {
        throw new AppError(409, 'PRODUCT_SKU_EXISTS', 'Product SKU already exists');
      }
    }

    await product.update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.platform !== undefined && { platform: data.platform }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.durationDays !== undefined && { durationDays: data.durationDays }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.isDigital !== undefined && { isDigital: data.isDigital }),
      ...(data.maxQuantityPerUser !== undefined && { maxQuantityPerUser: data.maxQuantityPerUser }),
      ...(data.metadata !== undefined && { metadata: data.metadata }),
      ...(data.images !== undefined && { images: data.images }),
    });

    return product.reload();
  }

  /**
   * Delete a product (soft delete by deactivating)
   * @param {string} id - Product UUID
   * @returns {Promise<void>}
   */
  async delete(id: string): Promise<void> {
    const product = await this.findById(id);
    await product.update({ isActive: false });
  }

  /**
   * Validate product for purchase
   * Validar producto para compra
   *
   * Checks if product exists and is available for purchase.
   *
   * @param {string} id - Product UUID
   * @returns {Promise<GenericProductAttributes>} Validated product data
   * @throws {AppError} 400 if product is inactive or not found
   */
  async validateProduct(id: string): Promise<GenericProductAttributes> {
    const product = await this.findById(id);

    if (product.isActive !== true) {
      throw new AppError(400, 'PRODUCT_INACTIVE', 'Product is not available for purchase');
    }

    // Check stock for physical products
    if (product.type === 'physical' && product.stock < 1) {
      throw new AppError(400, 'PRODUCT_OUT_OF_STOCK', 'Product is out of stock');
    }

    return product.toJSON() as GenericProductAttributes;
  }

  /**
   * Get products by IDs (bulk fetch)
   * Obtener productos por IDs (carga masiva)
   *
   * @param {string[]} ids - Array of product UUIDs
   * @returns {Promise<Product[]>} Array of products
   */
  async findByIds(ids: string[]): Promise<ProductModel[]> {
    return Product.findAll({
      where: {
        id: { [Op.in]: ids },
        isActive: true,
      },
    });
  }

  // ============================================
  // INVENTORY MANAGEMENT
  // ============================================

  /**
   * Reserve stock for an order
   * @param {string} productId - Product UUID
   * @param {number} quantity - Quantity to reserve
   * @param {string} referenceId - Order UUID
   * @param {string} performedBy - User UUID
   * @returns {Promise<Product>} Updated product
   */
  async reserveStock(
    productId: string,
    quantity: number,
    referenceId: string,
    performedBy: string
  ): Promise<ProductModel> {
    if (quantity <= 0) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be positive');
    }

    return sequelize.transaction(async (transaction: Transaction) => {
      const product = await Product.findByPk(productId, { transaction, lock: true });

      if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      if (product.type === 'physical' && product.stock < quantity) {
        throw new AppError(
          400,
          'INSUFFICIENT_STOCK',
          `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
        );
      }

      // Create inventory movement
      await InventoryMovement.create(
        {
          productId,
          type: 'reserve',
          quantity: -quantity,
          reason: 'Order reservation',
          referenceId,
          performedBy,
        } as InventoryMovementCreation,
        { transaction }
      );

      // Update stock (only for physical products)
      if (product.type === 'physical') {
        await product.update({ stock: product.stock - quantity }, { transaction });
      }

      return product.reload({ transaction });
    });
  }

  /**
   * Release reserved stock (e.g., order cancelled)
   * @param {string} productId - Product UUID
   * @param {number} quantity - Quantity to release
   * @param {string} referenceId - Order UUID
   * @param {string} performedBy - User UUID
   * @returns {Promise<Product>} Updated product
   */
  async releaseStock(
    productId: string,
    quantity: number,
    referenceId: string,
    performedBy: string
  ): Promise<ProductModel> {
    if (quantity <= 0) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be positive');
    }

    return sequelize.transaction(async (transaction: Transaction) => {
      const product = await Product.findByPk(productId, { transaction, lock: true });

      if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      // Create inventory movement
      await InventoryMovement.create(
        {
          productId,
          type: 'release',
          quantity: quantity,
          reason: 'Order cancelled - stock released',
          referenceId,
          performedBy,
        } as InventoryMovementCreation,
        { transaction }
      );

      // Update stock (only for physical products)
      if (product.type === 'physical') {
        await product.update({ stock: product.stock + quantity }, { transaction });
      }

      return product.reload({ transaction });
    });
  }

  /**
   * Adjust stock manually (admin operation)
   * @param {string} productId - Product UUID
   * @param {number} quantity - Quantity to add (positive) or remove (negative)
   * @param {string} reason - Reason for adjustment
   * @param {string} performedBy - User UUID
   * @returns {Promise<Product>} Updated product
   */
  async adjustStock(
    productId: string,
    quantity: number,
    reason: string,
    performedBy: string
  ): Promise<ProductModel> {
    return sequelize.transaction(async (transaction: Transaction) => {
      const product = await Product.findByPk(productId, { transaction, lock: true });

      if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      const newStock = product.stock + quantity;

      // Stock cannot go below 0
      if (newStock < 0) {
        throw new AppError(
          400,
          'INVALID_STOCK_ADJUSTMENT',
          `Cannot reduce stock below 0. Current: ${product.stock}, Adjustment: ${quantity}`
        );
      }

      // Create inventory movement
      await InventoryMovement.create(
        {
          productId,
          type: 'adjust',
          quantity,
          reason,
          performedBy,
        } as InventoryMovementCreation,
        { transaction }
      );

      // Update stock
      await product.update({ stock: newStock }, { transaction });

      return product.reload({ transaction });
    });
  }

  /**
   * Set initial stock (used when creating product or first stock entry)
   * @param {string} productId - Product UUID
   * @param {number} quantity - Initial quantity
   * @param {string} performedBy - User UUID
   * @returns {Promise<Product>} Updated product
   */
  async setInitialStock(
    productId: string,
    quantity: number,
    performedBy: string
  ): Promise<ProductModel> {
    return sequelize.transaction(async (transaction: Transaction) => {
      const product = await Product.findByPk(productId, { transaction, lock: true });

      if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      // Create inventory movement
      await InventoryMovement.create(
        {
          productId,
          type: 'initial',
          quantity,
          reason: 'Initial stock',
          performedBy,
        } as InventoryMovementCreation,
        { transaction }
      );

      // Set stock
      await product.update({ stock: quantity }, { transaction });

      return product.reload({ transaction });
    });
  }

  /**
   * Record a return (restock)
   * @param {string} productId - Product UUID
   * @param {number} quantity - Quantity returned
   * @param {string} reason - Reason for return
   * @param {string} referenceId - Original order UUID
   * @param {string} performedBy - User UUID
   * @returns {Promise<Product>} Updated product
   */
  async recordReturn(
    productId: string,
    quantity: number,
    reason: string,
    referenceId: string,
    performedBy: string
  ): Promise<ProductModel> {
    return sequelize.transaction(async (transaction: Transaction) => {
      const product = await Product.findByPk(productId, { transaction, lock: true });

      if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      }

      // Create inventory movement
      await InventoryMovement.create(
        {
          productId,
          type: 'return',
          quantity,
          reason,
          referenceId,
          performedBy,
        } as InventoryMovementCreation,
        { transaction }
      );

      // Update stock (only for physical products)
      if (product.type === 'physical') {
        await product.update({ stock: product.stock + quantity }, { transaction });
      }

      return product.reload({ transaction });
    });
  }

  /**
   * Get inventory movements for a product
   * @param {string} productId - Product UUID
   * @param {number} limit - Max records to return
   * @returns {Promise<InventoryMovement[]>} Movements
   */
  async getInventoryMovements(productId: string, limit: number = 50): Promise<InventoryMovement[]> {
    const product = await this.findById(productId);

    return InventoryMovement.findAll({
      where: { productId: product.id },
      order: [['created_at', 'DESC']],
      limit,
    });
  }
}

export const productService = new ProductService();
