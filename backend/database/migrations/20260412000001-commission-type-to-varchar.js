'use strict';

/**
 * @fileoverview Migration: Convert ENUM → VARCHAR(20) for commission columns
 * @description Replaces commissions.type and commission_configs.level from PostgreSQL ENUM
 *              to VARCHAR(20) to support N-level unilevel commission model.
 *              Strategy: add VARCHAR col → copy data → drop old → rename → drop ENUM type.
 *
 *              Reemplaza commissions.type y commission_configs.level de ENUM de PostgreSQL
 *              a VARCHAR(20) para soportar modelo de comisiones unilevel de N niveles.
 *
 * @issue #157 — Commission Model Migration Binary → Unilevel
 * @type {import('sequelize-cli').Migration}
 */

module.exports = {
  /**
   * Apply migration — convert ENUM columns to VARCHAR(20).
   * Aplica la migración — convierte columnas ENUM a VARCHAR(20).
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // ─── 1. commissions.type: ENUM → VARCHAR(20) ───────────────────────

      // 1a. Add new VARCHAR column
      await queryInterface.sequelize.query(
        `ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "type_new" VARCHAR(20);`,
        { transaction: t }
      );

      // 1b. Copy data from old type to type_new
      await queryInterface.sequelize.query(
        `UPDATE "commissions" SET "type_new" = "type"::text WHERE "type_new" IS NULL;`,
        { transaction: t }
      );

      // 1c. Drop old ENUM column
      await queryInterface.sequelize.query(
        `ALTER TABLE "commissions" DROP COLUMN IF EXISTS "type";`,
        { transaction: t }
      );

      // 1d. Rename type_new → type
      await queryInterface.sequelize.query(
        `ALTER TABLE "commissions" RENAME COLUMN "type_new" TO "type";`,
        { transaction: t }
      );

      // 1e. Set NOT NULL
      await queryInterface.sequelize.query(
        `ALTER TABLE "commissions" ALTER COLUMN "type" SET NOT NULL;`,
        { transaction: t }
      );

      // 1f. Recreate index on type
      await queryInterface.sequelize.query(
        `CREATE INDEX IF NOT EXISTS "commissions_type" ON "commissions" ("type");`,
        { transaction: t }
      );

      // 1g. Drop old ENUM type
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_commissions_type";`, {
        transaction: t,
      });

      // 1h. Add model column (unilevel vs binary)
      await queryInterface.sequelize.query(
        `ALTER TABLE "commissions" ADD COLUMN IF NOT EXISTS "model" VARCHAR(10) DEFAULT 'unilevel';`,
        { transaction: t }
      );

      // 1i. Backfill existing rows as binary (they predate the unilevel migration)
      await queryInterface.sequelize.query(
        `UPDATE "commissions" SET "model" = 'binary' WHERE "model" = 'unilevel' OR "model" IS NULL;`,
        { transaction: t }
      );

      // ─── 2. commission_configs.level: ENUM → VARCHAR(20) ───────────────

      // 2a. Add new VARCHAR column
      await queryInterface.sequelize.query(
        `ALTER TABLE "commission_configs" ADD COLUMN IF NOT EXISTS "level_new" VARCHAR(20);`,
        { transaction: t }
      );

      // 2b. Copy data from old level to level_new
      await queryInterface.sequelize.query(
        `UPDATE "commission_configs" SET "level_new" = "level"::text WHERE "level_new" IS NULL;`,
        { transaction: t }
      );

      // 2c. Drop old ENUM column
      await queryInterface.sequelize.query(
        `ALTER TABLE "commission_configs" DROP COLUMN IF EXISTS "level";`,
        { transaction: t }
      );

      // 2d. Rename level_new → level
      await queryInterface.sequelize.query(
        `ALTER TABLE "commission_configs" RENAME COLUMN "level_new" TO "level";`,
        { transaction: t }
      );

      // 2e. Set NOT NULL
      await queryInterface.sequelize.query(
        `ALTER TABLE "commission_configs" ALTER COLUMN "level" SET NOT NULL;`,
        { transaction: t }
      );

      // 2f. Recreate unique index (business_type, level)
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "commission_configs_business_type_level"
         ON "commission_configs" ("business_type", "level");`,
        { transaction: t }
      );

      // 2g. Drop old ENUM type
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_commission_configs_level";`, {
        transaction: t,
      });

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  /**
   * Revert migration — convert VARCHAR(20) back to ENUM.
   * Revierte la migración — convierte VARCHAR(20) de vuelta a ENUM.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // ─── 1. commissions.type: VARCHAR → ENUM ───────────────────────────

      // 1a. Create ENUM type
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_commissions_type" AS ENUM ('direct', 'level_1', 'level_2', 'level_3', 'level_4');`,
        { transaction: t }
      );

      // 1b. Add ENUM column
      await queryInterface.sequelize.query(
        `ALTER TABLE "commissions" ADD COLUMN "type_old" "enum_commissions_type";`,
        { transaction: t }
      );

      // 1c. Copy valid data (only values that fit the old ENUM)
      await queryInterface.sequelize.query(
        `UPDATE "commissions" SET "type_old" = "type"::"enum_commissions_type"
         WHERE "type" IN ('direct', 'level_1', 'level_2', 'level_3', 'level_4');`,
        { transaction: t }
      );

      // 1d. Drop VARCHAR column
      await queryInterface.sequelize.query(`ALTER TABLE "commissions" DROP COLUMN "type";`, {
        transaction: t,
      });

      // 1e. Rename type_old → type
      await queryInterface.sequelize.query(
        `ALTER TABLE "commissions" RENAME COLUMN "type_old" TO "type";`,
        { transaction: t }
      );

      // 1f. Set NOT NULL
      await queryInterface.sequelize.query(
        `ALTER TABLE "commissions" ALTER COLUMN "type" SET NOT NULL;`,
        { transaction: t }
      );

      // 1g. Drop the model column added by up()
      await queryInterface.sequelize.query(
        `ALTER TABLE "commissions" DROP COLUMN IF EXISTS "model";`,
        { transaction: t }
      );

      // ─── 2. commission_configs.level: VARCHAR → ENUM ───────────────────

      // 2a. Create ENUM type
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_commission_configs_level" AS ENUM ('direct', 'level_1', 'level_2', 'level_3', 'level_4');`,
        { transaction: t }
      );

      // 2b. Add ENUM column
      await queryInterface.sequelize.query(
        `ALTER TABLE "commission_configs" ADD COLUMN "level_old" "enum_commission_configs_level";`,
        { transaction: t }
      );

      // 2c. Copy valid data
      await queryInterface.sequelize.query(
        `UPDATE "commission_configs" SET "level_old" = "level"::"enum_commission_configs_level"
         WHERE "level" IN ('direct', 'level_1', 'level_2', 'level_3', 'level_4');`,
        { transaction: t }
      );

      // 2d. Drop VARCHAR column
      await queryInterface.sequelize.query(
        `ALTER TABLE "commission_configs" DROP COLUMN "level";`,
        { transaction: t }
      );

      // 2e. Rename level_old → level
      await queryInterface.sequelize.query(
        `ALTER TABLE "commission_configs" RENAME COLUMN "level_old" TO "level";`,
        { transaction: t }
      );

      // 2f. Set NOT NULL
      await queryInterface.sequelize.query(
        `ALTER TABLE "commission_configs" ALTER COLUMN "level" SET NOT NULL;`,
        { transaction: t }
      );

      // 2g. Delete rows with levels beyond level_4 (cleanup for rollback)
      await queryInterface.sequelize.query(
        `DELETE FROM "commission_configs" WHERE "level" IS NULL;`,
        { transaction: t }
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
};
