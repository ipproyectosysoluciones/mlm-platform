/**
 * @fileoverview Product - Product model for streaming subscriptions
 * @description Sequelize model for products (Netflix, Disney+, Spotify, etc.).
 *             Modelo Sequelize para productos de streaming.
 * @module models/Product
 * @author MLM Development Team
 *
 * @example
 * // English: Get all active streaming products
 * const products = await Product.findAll({ where: { status: 'active' } });
 *
 * // Español: Obtener todos los productos de streaming activos
 * const products = await Product.findAll({ where: { status: 'active' } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type { ProductAttributes, ProductCreationAttributes } from '../types';

type ProductCreation = Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Product Model - Represents streaming subscription products
 * Modelo de Producto - Representa productos de suscripción de streaming
 */
export class Product extends Model<ProductAttributes, ProductCreation> {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare type: 'subscription' | 'one-time' | 'streaming';
  declare price: number;
  declare currency: string;
  declare interval: 'monthly' | 'yearly' | null;
  declare features: string[] | null;
  declare status: 'active' | 'inactive';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

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
    type: {
      type: DataTypes.ENUM('subscription', 'one-time', 'streaming'),
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
    interval: {
      type: DataTypes.ENUM('monthly', 'yearly'),
      allowNull: true,
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['type'] }, { fields: ['status'] }],
  }
);
