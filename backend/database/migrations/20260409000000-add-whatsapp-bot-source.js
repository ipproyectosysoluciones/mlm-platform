'use strict';

/**
 * @fileoverview Migration: Add 'whatsapp_bot' value to enum_leads_source
 * @description Adds the 'whatsapp_bot' source type to the leads source enum so the
 *              backend can persist leads captured by the WhatsApp AI bot (Sophia / Max).
 *              Agrega el tipo 'whatsapp_bot' al enum de fuentes de leads para que el
 *              backend pueda persistir leads capturados por el bot de WhatsApp con IA.
 *
 * NOTE: ALTER TYPE ... ADD VALUE cannot run inside an explicit transaction in PostgreSQL.
 *       The Sequelize queryInterface.sequelize.query() call bypasses the default transaction.
 *       NOTA: ALTER TYPE ... ADD VALUE no puede ejecutarse dentro de una transacción explícita
 *       en PostgreSQL. La llamada directa a sequelize.query() evita la transacción por defecto.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * Apply migration — adds 'whatsapp_bot' to enum_leads_source if not present.
   * Aplica la migración — agrega 'whatsapp_bot' a enum_leads_source si no existe.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    // ADD VALUE is non-transactional in PostgreSQL — must run outside explicit transaction
    // ADD VALUE no es transaccional en PostgreSQL — debe ejecutarse fuera de transacción
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'whatsapp_bot'
            AND enumtypid = (
              SELECT oid FROM pg_type WHERE typname = 'enum_leads_source'
            )
        ) THEN
          ALTER TYPE "enum_leads_source" ADD VALUE 'whatsapp_bot';
        END IF;
      END
      $$;
    `);
  },

  /**
   * Revert migration — PostgreSQL does not support removing enum values.
   * Revierte la migración — PostgreSQL no soporta eliminar valores de enum.
   * This is a no-op: the value remains but causes no issues if unused.
   * Esto es un no-op: el valor queda pero no causa problemas si no se usa.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @returns {Promise<void>}
   */
  async down(queryInterface) {
    // PostgreSQL does not allow removing enum values — intentional no-op
    // PostgreSQL no permite eliminar valores de enum — no-op intencional
    console.warn(
      '[migration:down] Cannot remove enum value "whatsapp_bot" from enum_leads_source — PostgreSQL limitation. Value will remain unused.'
    );
  },
};
