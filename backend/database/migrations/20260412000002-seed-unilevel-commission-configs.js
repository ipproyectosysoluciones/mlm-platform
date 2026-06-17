'use strict';

/**
 * @fileoverview Migration: Seed default unilevel commission configs
 * @description Inserts 10-level default commission rates for businessType='membresia'
 *              with ON CONFLICT DO NOTHING for idempotency. Down() removes those exact rows.
 *
 *              Inserta tasas de comisión por defecto de 10 niveles para
 *              businessType='membresia' con ON CONFLICT DO NOTHING para idempotencia.
 *
 * @issue #157 — Commission Model Migration Binary → Unilevel
 * @type {import('sequelize-cli').Migration}
 */

/** @type {Array<{ level: string; percentage: number }>} */
const SEED_RATES = [
  { level: 'direct', percentage: 0.1 },
  { level: 'level_1', percentage: 0.08 },
  { level: 'level_2', percentage: 0.06 },
  { level: 'level_3', percentage: 0.05 },
  { level: 'level_4', percentage: 0.04 },
  { level: 'level_5', percentage: 0.03 },
  { level: 'level_6', percentage: 0.03 },
  { level: 'level_7', percentage: 0.02 },
  { level: 'level_8', percentage: 0.02 },
  { level: 'level_9', percentage: 0.02 },
];

const BUSINESS_TYPE = 'membresia';

module.exports = {
  /**
   * Apply migration — seed 10-level unilevel commission configs.
   * Aplica la migración — inserta configs de comisión unilevel de 10 niveles.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const values = SEED_RATES.map(
        (r) =>
          `(gen_random_uuid(), '${BUSINESS_TYPE}', '${r.level}', ${r.percentage}, true, NOW(), NOW())`
      ).join(',\n         ');

      await queryInterface.sequelize.query(
        `INSERT INTO "commission_configs"
           ("id", "business_type", "level", "percentage", "is_active", "created_at", "updated_at")
         VALUES
         ${values}
         ON CONFLICT ("business_type", "level") DO NOTHING;`,
        { transaction: t }
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  /**
   * Revert migration — remove the seeded commission config rows.
   * Revierte la migración — elimina las filas de config de comisión insertadas.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      const levels = SEED_RATES.map((r) => `'${r.level}'`).join(', ');

      await queryInterface.sequelize.query(
        `DELETE FROM "commission_configs"
         WHERE "business_type" = '${BUSINESS_TYPE}'
           AND "level" IN (${levels});`,
        { transaction: t }
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
};
