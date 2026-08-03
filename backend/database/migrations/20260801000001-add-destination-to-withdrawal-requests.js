'use strict';

/**
 * @fileoverview Migration: Add payout destination + gateway tracking to withdrawal_requests
 * @description Adds `destination` JSONB (payout destination: { method, email })
 *              plus gateway/notification tracking columns to support real money-out
 *              (PayPal Payouts). All columns are NULL-able so legacy rows
 *              (0 dormant withdrawals) remain valid.
 *
 *              Agrega `destination` JSONB (destino de payout) y columnas de seguimiento
 *              de pasarela/notificación para soportar money-out real (PayPal Payouts).
 *              Todas las columnas son NULL-ables para mantener válidas las filas legacy.
 *
 * @issue wallet-integration — Payouts Reales (PR 1: Schema+Migración)
 * @type {import('sequelize-cli').Migration}
 */

module.exports = {
  /**
   * Apply migration — add destination + gateway tracking columns.
   * Aplica la migración — agrega destination y columnas de seguimiento.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // Payout destination: { method: 'paypal', email }
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "destination" JSONB;`,
        { transaction: t }
      );

      // Gateway tracking — en-flight state while status stays 'approved' (ADR 8)
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "gateway_payout_id" VARCHAR(191);`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "gateway_status" VARCHAR(50);`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "last_gateway_sync_at" TIMESTAMPTZ;`,
        { transaction: t }
      );

      // Notification tracking — best-effort email retry (ADR 9)
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "last_notified_status" VARCHAR(50);`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "last_notified_at" TIMESTAMPTZ;`,
        { transaction: t }
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  /**
   * Revert migration — drop destination + gateway tracking columns.
   * Revierte la migración — elimina destination y columnas de seguimiento.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" DROP COLUMN IF EXISTS "destination";`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" DROP COLUMN IF EXISTS "gateway_payout_id";`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" DROP COLUMN IF EXISTS "gateway_status";`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" DROP COLUMN IF EXISTS "last_gateway_sync_at";`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" DROP COLUMN IF EXISTS "last_notified_status";`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "withdrawal_requests" DROP COLUMN IF EXISTS "last_notified_at";`,
        { transaction: t }
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
};
