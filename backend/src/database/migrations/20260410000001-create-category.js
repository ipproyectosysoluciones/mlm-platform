/**
 * @fileoverview Create Categories Table Migration
 * @description Migration for categories table with hierarchical parent-child relationships
 *              Supports max depth of 5 levels (enforced at application level)
 * @module database/migrations/createCategory
 * @author MLM Development Team
 *
 * @example
 * // English: Run migration to create categories table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla de categorías
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create categories table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'Parent category ID for hierarchical structure',
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Category display name / Nombre para mostrar de la categoría',
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'URL-friendly slug / Slug amigable para URL',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Category description / Descripción de la categoría',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether category is active / Si la categoría está activa',
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Display order for sorting / Orden de visualización',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Constraint: name must not be empty
    await queryInterface.addConstraint('categories', {
      fields: ['name'],
      type: 'check',
      where: {
        name: {
          [Sequelize.Op.ne]: '',
        },
      },
      name: 'chk_categories_name_not_empty',
    });

    // Constraint: slug must not be empty
    await queryInterface.addConstraint('categories', {
      fields: ['slug'],
      type: 'check',
      where: {
        slug: {
          [Sequelize.Op.ne]: '',
        },
      },
      name: 'chk_categories_slug_not_empty',
    });

    // Index: parent_id for hierarchical queries
    await queryInterface.addIndex('categories', ['parent_id'], {
      name: 'idx_categories_parent',
    });

    // Index: is_active + sort_order for admin listing
    await queryInterface.addIndex('categories', ['is_active', 'sort_order'], {
      name: 'idx_categories_active_order',
    });

    // Index: slug for lookups
    await queryInterface.addIndex('categories', ['slug'], {
      name: 'idx_categories_slug',
    });

    // Add foreign key from products table to categories (if products table exists)
    // This is done in the add-product-extensions migration
  },

  /**
   * Down: Drop categories table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('categories');
  },
};
