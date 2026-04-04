/**
 * @fileoverview Add Product Extensions Migration
 * @description Migration to add generic product fields: type, sku, categoryId, stock, isDigital, maxQuantityPerUser, metadata, images
 *              This is an ADDITIVE migration - NO destructive changes
 * @module database/migrations/addProductExtensions
 * @author MLM Development Team
 *
 * @example
 * // English: Run migration to add product extension fields
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para agregar campos de extensión de producto
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Add product extension columns
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    // Add type column - VIRTUAL column that deduces from subscriptionType
    // Existing products will default to 'subscription' for backward compatibility
    await queryInterface.addColumn('products', 'type', {
      type: Sequelize.ENUM('physical', 'digital', 'subscription', 'service'),
      allowNull: true,
      defaultValue: 'subscription',
      comment: 'Product type: physical, digital, subscription, service',
    });

    // Add sku column for inventory management
    await queryInterface.addColumn('products', 'sku', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Stock Keeping Unit - unique product identifier',
    });

    // Add categoryId column for category relationship
    await queryInterface.addColumn('products', 'category_id', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'Foreign key to categories table',
    });

    // Add stock column for inventory tracking
    await queryInterface.addColumn('products', 'stock', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Available stock quantity',
    });

    // Add isDigital column
    await queryInterface.addColumn('products', 'is_digital', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether product is digital (no physical shipping)',
    });

    // Add maxQuantityPerUser column for purchase limits
    await queryInterface.addColumn('products', 'max_quantity_per_user', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Maximum quantity a single user can purchase',
    });

    // Add metadata column for flexible product attributes
    await queryInterface.addColumn('products', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'Flexible metadata for product-specific attributes',
    });

    // Add images column for product images
    await queryInterface.addColumn('products', 'images', {
      type: Sequelize.ARRAY(Sequelize.STRING(500)),
      allowNull: true,
      defaultValue: [],
      comment: 'Array of product image URLs',
    });

    // Add indexes for new columns
    await queryInterface.addIndex('products', ['type'], {
      name: 'idx_products_type',
    });

    await queryInterface.addIndex('products', ['category_id'], {
      name: 'idx_products_category',
    });

    await queryInterface.addIndex('products', ['sku'], {
      name: 'idx_products_sku',
    });

    await queryInterface.addIndex('products', ['stock'], {
      name: 'idx_products_stock',
    });
  },

  /**
   * Down: Remove product extension columns
   * NOTE: This is for rollback only - production should NOT run this
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('products', 'idx_products_type');
    await queryInterface.removeIndex('products', 'idx_products_category');
    await queryInterface.removeIndex('products', 'idx_products_sku');
    await queryInterface.removeIndex('products', 'idx_products_stock');

    // Remove columns
    await queryInterface.removeColumn('products', 'images');
    await queryInterface.removeColumn('products', 'metadata');
    await queryInterface.removeColumn('products', 'max_quantity_per_user');
    await queryInterface.removeColumn('products', 'is_digital');
    await queryInterface.removeColumn('products', 'stock');
    await queryInterface.removeColumn('products', 'category_id');
    await queryInterface.removeColumn('products', 'sku');
    await queryInterface.removeColumn('products', 'type');
  },
};
