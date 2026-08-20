'use strict';

/**
 * @fileoverview Migration: Add marketplace fields to orders
 * @description Adds vendor_id (nullable FK), country, marketplace_fee and
 *              fee_breakdown JSONB to orders; makes product_id nullable so a
 *              marketplace order can exist without a platform product.
 *              Añade campos de marketplace a orders.
 *
 * @issue #365 — Marketplace: MercadoPago vendor charges (PR A / task A2)
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
      // 1. vendor_id — nullable FK to vendors (set NULL on vendor delete)
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "vendor_id" UUID;`,
        { transaction: t }
      );

      // 2. country — ISO country of the vendor charge (CO only)
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "country" VARCHAR(2);`,
        { transaction: t }
      );

      // 3. marketplace_fee — integer COP fee charged by the platform (HALF_UP)
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "marketplace_fee" BIGINT;`,
        { transaction: t }
      );

      // 4. fee_breakdown — JSONB { pctPlataforma, commission, taxRate, tax }
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fee_breakdown" JSONB;`,
        { transaction: t }
      );

      // 5. product_id → nullable (marketplace orders may not map to a product)
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders" ALTER COLUMN "product_id" DROP NOT NULL;`,
        { transaction: t }
      );

      // 6. FK + index on vendor_id (constraint may already exist)
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
           IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_vendor_id_fkey') THEN
             ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_fkey"
               FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id")
               ON DELETE SET NULL ON UPDATE CASCADE;
           END IF;
         END $$;`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX IF NOT EXISTS "orders_vendor_id" ON "orders" ("vendor_id");`,
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
      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "orders_vendor_id";`, {
        transaction: t,
      });
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_vendor_id_fkey";`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "orders" DROP COLUMN IF EXISTS "vendor_id",
         DROP COLUMN IF EXISTS "country",
         DROP COLUMN IF EXISTS "marketplace_fee",
         DROP COLUMN IF EXISTS "fee_breakdown";`,
        { transaction: t }
      );
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
};
