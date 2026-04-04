/**
 * @fileoverview Product - Product model for streaming subscriptions + generic products
 * @description Sequelize model for products (Netflix, Disney+, Spotify, etc.) AND generic products.
 *             Extended with type, category, inventory, and metadata fields.
 *             Modelo Sequelize para productos de streaming y genéricos.
 * @module models/Product
 * @author MLM Development Team
 *
 * @example
 * // English: Get all active streaming products
 * const products = await Product.findAll({ where: { isActive: true } });
 *
 * // Español: Obtener todos los productos de streaming activos
 * const products = await Product.findAll({ where: { isActive: true } });
 *
 * @example
 * // English: Get products by type (physical, digital, subscription, service)
 * const digitalProducts = await Product.findAll({ where: { type: 'digital' } });
 *
 * // Español: Obtener productos por tipo
 * const digitalProducts = await Product.findAll({ where: { type: 'digital' } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type {
  ProductAttributes,
  ProductCreationAttributes,
  ProductType,
  GenericProductAttributes,
  GenericProductCreationAttributes,
} from '../types';

// Base optional attributes (without extensions)
type ProductCreation = Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'>;

// Extended optional attributes
type GenericProductCreation = Optional<
  GenericProductAttributes,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'type'
  | 'sku'
  | 'categoryId'
  | 'stock'
  | 'isDigital'
  | 'maxQuantityPerUser'
  | 'metadata'
  | 'images'
>;

/**
 * Product Model - Represents streaming subscription products AND generic products
 * Modelo de Producto - Representa productos de suscripción de streaming Y productos genéricos
 */
export class Product
  extends Model<GenericProductAttributes, GenericProductCreation>
  implements GenericProductAttributes
{
  // Base ProductAttributes
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare platform: ProductAttributes['platform'];
  declare price: number;
  declare currency: string;
  declare durationDays: number;
  declare isActive: boolean;

  // Extended GenericProductAttributes
  declare type: ProductType;
  declare sku: string | null;
  declare categoryId: string | null;
  declare stock: number;
  declare isDigital: boolean;
  declare maxQuantityPerUser: number | null;
  declare metadata: Record<string, unknown> | null;
  declare images: string[];

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare category?: Category | null;
  declare inventoryMovements?: InventoryMovement[];
}

// Placeholder imports for associations - will be set up in index.ts
import type { Category } from './Category';
import type { InventoryMovement } from './InventoryMovement';

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    platform: {
      type: DataTypes.ENUM(
        'netflix',
        'disney_plus',
        'spotify',
        'hbo_max',
        'amazon_prime',
        'youtube_premium',
        'apple_tv',
        'other'
      ),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'duration_days',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    // Extended fields for generic products
    type: {
      type: DataTypes.ENUM('physical', 'digital', 'subscription', 'service'),
      allowNull: true,
      defaultValue: 'subscription',
      field: 'type',
      comment: 'Product type: physical, digital, subscription, service',
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'sku',
      comment: 'Stock Keeping Unit - unique product identifier',
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'category_id',
      comment: 'Foreign key to categories table',
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'stock',
      comment: 'Available stock quantity',
    },
    isDigital: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_digital',
      comment: 'Whether product is digital (no physical shipping)',
    },
    maxQuantityPerUser: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_quantity_per_user',
      comment: 'Maximum quantity a single user can purchase',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      field: 'metadata',
      comment: 'Flexible metadata for product-specific attributes',
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING(500)),
      allowNull: true,
      defaultValue: [],
      field: 'images',
      comment: 'Array of product image URLs',
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['platform'] },
      { fields: ['is_active'] },
      { fields: ['type'] },
      { fields: ['category_id'] },
      { fields: ['sku'] },
      { fields: ['stock'] },
    ],
  }
);
