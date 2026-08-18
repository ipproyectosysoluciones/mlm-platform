'use strict';

/**
 * @fileoverview Migration: Create vendor_mercadopago_accounts table
 * @description Stores the encrypted OAuth tokens and connection status of a
 *              vendor MercadoPago account (one per country).
 *              Crea la tabla de cuentas MercadoPago de vendedores con tokens
 *              OAuth cifrados y estado de conexión (una por país).
 *
 * @issue #365 — Marketplace: MercadoPago vendor charges (PR A / task A1)
 * @type {import('sequelize-cli').Migration}
 */

module.exports = {
  /**
   * Apply migration — create table.
   * Aplica la migración — crea la tabla.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'vendor_mercadopago_accounts',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          vendor_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'vendors', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          mp_user_id: {
            type: Sequelize.STRING(64),
            allowNull: true,
          },
          status: {
            type: Sequelize.ENUM('processing', 'connected', 'expired', 'disconnected'),
            allowNull: false,
            defaultValue: 'processing',
          },
          country: {
            type: Sequelize.STRING(2),
            allowNull: false,
            defaultValue: 'CO',
          },
          access_token_encrypted: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          refresh_token_encrypted: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          code_verifier_encrypted: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          state_expires_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          access_token_expires_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          last_connected_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction: t }
      );

      // One active connection per vendor and country
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "uq_vendor_mercadopago_accounts_vendor_country"
         ON "vendor_mercadopago_accounts" ("vendor_id", "country");`,
        { transaction: t }
      );

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  /**
   * Revert migration — drop table.
   * Revierte la migración — elimina la tabla.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   * @returns {Promise<void>}
   */
  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('vendor_mercadopago_accounts', { transaction: t });
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_vendor_mercadopago_accounts_status";`,
        { transaction: t }
      );
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },
};
