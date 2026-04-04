/**
 * @fileoverview Add Vendor Role to User Enum Migration
 * @description Migration to add 'vendor' to user_role enum type
 *              This is an ADDITIVE migration - NO destructive changes
 * @module database/migrations/addVendorRole
 * @author MLM Development Team
 *
 * @example
 * // English: Run migration to add vendor role
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para agregar rol vendor
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Add vendor to user_role enum
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    // Check if we're using PostgreSQL
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // Add 'vendor' value to user_role enum type
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'vendor';
      `);
    }
  },

  /**
   * Down: Remove vendor from user_role enum
   * NOTE: This removes vendor role - only for rollback
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    // In PostgreSQL, we cannot remove enum values directly
    // This would require dropping and recreating the type
    // For production, do NOT roll back - this is for development only
    console.warn('Cannot remove enum values in PostgreSQL - manual intervention required');
  },
};
