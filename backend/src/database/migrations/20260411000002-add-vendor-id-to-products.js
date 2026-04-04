/**
 * @fileoverview Add Vendor ID to Products Migration
 * @description Migration to add vendor_id column to products table
 *              Null = platform-owned product, UUID = vendor-owned product
 * @module database/migrations/addVendorIdToProducts
 * @author MLM Development Team
 *
 * @example
 * // English: Run migration to add vendor_id to products
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para agregar vendor_id a productos
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Add vendor_id column to products
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    // Add vendor_id column - nullable for backward compatibility
    await queryInterface.addColumn('products', 'vendor_id', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: 'FK to vendors table - null means platform-owned product',
      references: {
        model: 'vendors',
        key: 'id',
      },
    });

    // Add index for vendor_id
    await queryInterface.addIndex('products', ['vendor_id'], {
      name: 'idx_products_vendor_id',
    });
  },

  /**
   * Down: Remove vendor_id column from products
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('products', 'idx_products_vendor_id');

    // Remove column
    await queryInterface.removeColumn('products', 'vendor_id');
  },
};
