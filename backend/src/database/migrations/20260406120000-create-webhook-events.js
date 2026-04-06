/**
 * @fileoverview Create Webhook Events Table Migration
 * @description Creates the webhook_events table for persistent idempotency tracking.
 *   Prevents double-processing of payment webhook events from PayPal, MercadoPago, etc.
 *   Replaces the in-memory Set in PayPalService (not durable across restarts).
 *
 * ES: Crea la tabla webhook_events para idempotencia persistente.
 *   Evita procesar dos veces el mismo evento de pago entre reinicios del servidor.
 *
 * EN: Creates the webhook_events table for persistent idempotency.
 *   Prevents double-processing of the same payment event across server restarts.
 *
 * @example
 * // English: Run migration
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create webhook_events table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('webhook_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      event_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Provider-assigned event ID — unique per provider',
      },
      provider: {
        type: Sequelize.ENUM('paypal', 'mercadopago', 'stripe'),
        allowNull: false,
        comment: 'Payment provider that sent the webhook',
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Event type string, e.g. PAYMENT.CAPTURE.COMPLETED',
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Timestamp when the event was first successfully processed',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Composite unique index — same eventId can exist for different providers
    await queryInterface.addIndex('webhook_events', ['event_id', 'provider'], {
      unique: true,
      name: 'webhook_events_event_id_provider_unique',
    });

    // Index to efficiently prune old records
    await queryInterface.addIndex('webhook_events', ['processed_at'], {
      name: 'webhook_events_processed_at_idx',
    });
  },

  /**
   * Down: Drop webhook_events table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('webhook_events');
    // Note: ENUM types must be manually dropped in PostgreSQL if needed
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_webhook_events_provider";');
  },
};
