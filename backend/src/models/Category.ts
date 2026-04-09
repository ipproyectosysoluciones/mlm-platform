/**
 * @fileoverview Category - Hierarchical category model
 * @description Sequelize model for categories with parent-child relationships.
 *             Supports hierarchical tree structure with max depth of 5 levels.
 *             Modelo Sequelize para categorías con relaciones padre-hijo.
 * @module models/Category
 * @author MLM Development Team
 *
 * @example
 * // English: Get category tree
 * const categories = await Category.findAll({ where: { parentId: null } });
 *
 * // Español: Obtener árbol de categorías
 * const categories = await Category.findAll({ where: { parentId: null } });
 */
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import type { CategoryAttributes } from '../types';

type CategoryCreation = Optional<CategoryAttributes, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Category Model - Represents hierarchical product categories
 * Modelo de Categoría - Representa categorías jerárquicas de productos
 */
export class Category
  extends Model<CategoryAttributes, CategoryCreation>
  implements CategoryAttributes
{
  declare id: string;
  declare parentId: string | null;
  declare name: string;
  declare slug: string;
  declare description: string | null;
  declare isActive: boolean;
  declare sortOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Associations
  declare parent?: Category | null;
  declare children?: Category[];
}

/**
 * Maximum depth for category hierarchy (enforced at application level)
 */
export const MAX_CATEGORY_DEPTH = 5;

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',
      comment: 'Parent category ID for hierarchical structure',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Category display name / Nombre para mostrar de la categoría',
      validate: {
        notEmpty: {
          msg: 'Category name cannot be empty',
        },
      },
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'URL-friendly slug / Slug amigable para URL',
      validate: {
        notEmpty: {
          msg: 'Category slug cannot be empty',
        },
        is: {
          args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          msg: 'Slug must be lowercase alphanumeric with hyphens only',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Category description / Descripción de la categoría',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
      comment: 'Whether category is active / Si la categoría está activa',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
      comment: 'Display order for sorting / Orden de visualización',
    },
  },
  {
    sequelize,
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['parent_id'] },
      { fields: ['is_active', 'sort_order'] },
      { fields: ['slug'] },
    ],
  }
);
