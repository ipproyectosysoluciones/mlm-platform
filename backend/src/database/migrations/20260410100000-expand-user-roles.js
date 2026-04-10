/**
 * @fileoverview Expand User Roles Enum Migration
 * @description Migración para agregar 6 nuevos roles al ENUM enum_users_role:
 *              super_admin, finance, sales, advisor, guest, bot
 *              This is an ADDITIVE migration - NO destructive changes
 * @module database/migrations/expandUserRoles
 * @author MLM Development Team
 *
 * @example
 * // English: Run migration to expand user roles
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para expandir roles de usuario
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Add new roles to enum_users_role enum
   * Roles added: super_admin, finance, sales, advisor, guest, bot
   *
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // Add all new role values - IF NOT EXISTS ensures idempotency
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'super_admin';
      `);
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'finance';
      `);
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'sales';
      `);
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'advisor';
      `);
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'guest';
      `);
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'bot';
      `);
    }
  },

  /**
   * Down: Cannot remove enum values in PostgreSQL
   * NOTE: PostgreSQL does not support removing ENUM values directly.
   *       Manual intervention required for rollback.
   *
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    // In PostgreSQL, we cannot remove enum values directly.
    // This would require dropping and recreating the entire type.
    // For production, do NOT roll back - this is for development only.
    console.warn(
      '[expand-user-roles] Cannot remove enum values in PostgreSQL - manual intervention required'
    );
  },
};
