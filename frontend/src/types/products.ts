/** Domain types for products / Tipos de dominio para productos. @module types/products */

// Product Types - Streaming Subscriptions E-Commerce
export type StreamingPlatform =
  | 'netflix'
  | 'disney_plus'
  | 'spotify'
  | 'hbo_max'
  | 'amazon_prime'
  | 'youtube_premium'
  | 'apple_tv_plus';

export interface Product {
  id: string;
  name: string;
  platform: StreamingPlatform;
  description?: string;
  price: number;
  currency: string;
  durationDays: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Product list query params with filters.
 * Formerly declared twice (declaration merging) — this single declaration holds the full merged shape.
 * Params de listado de productos con filtros.
 * Antes declarado dos veces (declaration merging) — esta única declaración tiene la forma fusionada completa.
 */
export interface ProductListParams {
  page?: number;
  limit?: number;
  platform?: StreamingPlatform;
  isActive?: boolean;
  type?: ProductType;
  categoryId?: string;
  minStock?: number;
  maxStock?: number;
  search?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// GENERIC PRODUCTS — Multi-type Product System (#27)
// PRODUCTOS GENÉRICOS — Sistema de productos multi-tipo (#27)
// ============================================

/**
 * Product types for generic product catalog
 * Tipos de productos para catálogo genérico
 */
export type ProductType = 'physical' | 'digital' | 'subscription' | 'service';

/**
 * Inventory movement types for stock audit trail
 * Tipos de movimiento de inventario para trazabilidad de stock
 */
export type InventoryMovementType = 'initial' | 'reserve' | 'release' | 'adjust' | 'return';

/**
 * Category for hierarchical categories
 * Categoría para categorías jerárquicas
 */
export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Extended Product for generic products
 * Producto extendido para productos genéricos
 */
export interface GenericProduct extends Product {
  type: ProductType;
  sku?: string | null;
  categoryId?: string | null;
  category?: Category;
  stock: number;
  isDigital: boolean;
  maxQuantityPerUser?: number | null;
  metadata?: Record<string, unknown> | null;
  images?: string[];
}

/**
 * Inventory movement for audit trail
 * Movimiento de inventario para trazabilidad
 */
export interface InventoryMovement {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  referenceId?: string | null;
  performedBy: string;
  performedByUser?: { email: string };
  createdAt: string;
}

/**
 * Product list params with generic filters
 * Params de listado de productos con filtros genéricos
 */
export type GenericProductListParams = ProductListParams;

// ============================================
// ADMIN PRODUCT TYPES
// ============================================

export interface AdminProductResponse {
  id: string;
  name: string;
  platform: StreamingPlatform;
  description?: string;
  price: number;
  currency: string;
  durationDays: number;
  isActive: boolean;
  type: ProductType;
  sku?: string | null;
  categoryId?: string | null;
  category?: Category;
  stock: number;
  isDigital: boolean;
  maxQuantityPerUser?: number | null;
  metadata?: Record<string, unknown> | null;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  platform?: StreamingPlatform;
  description?: string;
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

export interface UpdateProductPayload {
  name?: string;
  platform?: StreamingPlatform;
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

// Inventory management types
export interface InventoryReservePayload {
  quantity: number;
  referenceId: string;
}

export interface InventoryReleasePayload {
  quantity: number;
  referenceId: string;
}

export interface InventoryAdjustPayload {
  quantity: number;
  reason: string;
}

export interface InventoryInitialPayload {
  quantity: number;
}

export interface InventoryReturnPayload {
  quantity: number;
  reason: string;
  referenceId?: string;
}

// ============================================
// ADMIN CATEGORY TYPES
// ============================================

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}
