'use strict';

/**
 * @fileoverview Migration: Add marketplace fields to vendor_orders
 * @description Adds tax_rate, tax_amount and country columns used by the
 *              marketplace split (VAT over the platform commission).
 *              Añade campos de marketplace a vendor_orders.
 *
 * @issue #365 — Marketplace: MercadoPago vendor charges (PR A / task A3)
 * @type {import('sequelize-cli').Migration}
 */

module.exports = {
  /**
   * Apply migration — add marketplace columns.
   * Aplica la migración — añade columnas de marketplace.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // 1. tax_rate — VAT rate applied to the platform commission (0.19 CO)
      await queryInterface.sequelize.query(
        `ALTER TABLE "vendor_orders" ADD COLUMN IF NOT EXISTS "tax_rate" DECIMAL(5,4) DEFAULT 0;`,
        { transaction: t }
      );

      // 2. tax_amount — VAT over commission in platform currency units
      await queryInterface.sequelize.query(
        `ALTER TABLE "vendor_orders" ADD COLUMN IF NOT EXISTS "tax_amount" DECIMAL(10,4) DEFAULT 0;`,
        { transaction: t }
      );

      // 3. country — ISO country of the vendor charge (CO only)
      await queryInterface.sequelize.query(
        `ALTER TABLE "vendor_orders" ADD COLUMN IF NOT EXISTS "country" VARCHAR(2);`,
        { transaction: t }
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  /**
   * Revert migration — drop the added columns.
   * Revierte la migración — elimina las columnas añadidas.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `ALTER TABLE "vendor_orders" DROP COLUMN IF EXISTS "tax_rate",
         DROP COLUMN IF EXISTS "tax_amount",
         DROP COLUMN IF EXISTS "country";`,
        { transaction: t }
      );
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
};
