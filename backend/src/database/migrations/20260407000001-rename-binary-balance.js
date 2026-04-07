/**
 * @fileoverview Migration: rename binary_balance → network_balance
 * @description Renames the enum value 'binary_balance' to 'network_balance' in the
 *              condition_type column of the achievements table. PostgreSQL enums require
 *              adding the new value first, migrating existing rows, then removing the old value.
 *
 *              Renombra el valor de enum 'binary_balance' a 'network_balance' en la columna
 *              condition_type de la tabla achievements. Los enums de PostgreSQL requieren agregar
 *              el valor nuevo primero, migrar las filas existentes y luego remover el valor viejo.
 *
 * @module migrations/20260407000001-rename-binary-balance
 * @sprint Sprint 6 — v2.2.0
 */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * @description Renames enum value binary_balance → network_balance.
   *              Uses raw SQL because Sequelize does not support renaming PostgreSQL enum values natively.
   *
   *              Renombra el valor de enum binary_balance → network_balance.
   *              Usa SQL directo porque Sequelize no soporta renombrar valores de enum de PostgreSQL nativamente.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Step 1: Add new enum value 'network_balance' to the existing enum type
      // Paso 1: Agregar el nuevo valor 'network_balance' al tipo enum existente
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_achievements_conditionType" ADD VALUE IF NOT EXISTS 'network_balance';`,
        { transaction }
      );

      // Step 2: Migrate existing rows that have 'binary_balance' → 'network_balance'
      // Paso 2: Migrar filas existentes con 'binary_balance' → 'network_balance'
      await queryInterface.sequelize.query(
        `UPDATE achievements SET "conditionType" = 'network_balance' WHERE "conditionType" = 'binary_balance';`,
        { transaction }
      );

      // Step 3: Remove old enum value — only possible if no rows use it anymore.
      // PostgreSQL requires renaming via pg_catalog for this operation.
      // Paso 3: Eliminar el valor viejo — solo posible si ninguna fila lo usa.
      // PostgreSQL requiere renombrar vía pg_catalog para esta operación.
      await queryInterface.sequelize.query(
        `UPDATE pg_catalog.pg_enum
         SET enumlabel = 'network_balance_deprecated'
         WHERE enumlabel = 'binary_balance'
           AND enumtypid = (
             SELECT oid FROM pg_catalog.pg_type
             WHERE typname = 'enum_achievements_conditionType'
           );`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  /**
   * @description Rolls back: restores 'binary_balance' enum value and migrates rows back.
   *              Rollback: restaura el valor 'binary_balance' y revierte las filas migradas.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Step 1: Restore the old enum label from the deprecated placeholder
      // Paso 1: Restaurar el label viejo desde el placeholder deprecated
      await queryInterface.sequelize.query(
        `UPDATE pg_catalog.pg_enum
         SET enumlabel = 'binary_balance'
         WHERE enumlabel = 'network_balance_deprecated'
           AND enumtypid = (
             SELECT oid FROM pg_catalog.pg_type
             WHERE typname = 'enum_achievements_conditionType'
           );`,
        { transaction }
      );

      // Step 2: Revert migrated rows back to 'binary_balance'
      // Paso 2: Revertir las filas migradas de vuelta a 'binary_balance'
      await queryInterface.sequelize.query(
        `UPDATE achievements SET "conditionType" = 'binary_balance' WHERE "conditionType" = 'network_balance';`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
