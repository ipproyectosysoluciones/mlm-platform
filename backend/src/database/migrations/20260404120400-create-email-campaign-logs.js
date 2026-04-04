/**
 * @fileoverview Create Email Campaign Logs Table Migration
 * @description Migration for email_campaign_logs audit trail table with event tracking
 *              Migración para tabla email_campaign_logs de auditoría con seguimiento de eventos
 * @module database/migrations/createEmailCampaignLogs
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // English: Run migration to create email_campaign_logs table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla email_campaign_logs
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create email_campaign_logs table with indexes
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_campaign_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'email_campaigns',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Parent campaign / Campaña padre',
      },
      campaign_recipient_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'campaign_recipients',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment:
          'Associated recipient (nullable for campaign-level events) / Destinatario asociado (nullable para eventos de campaña)',
      },
      event_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment:
          'Event type: created | sent | failed | bounced | opened | clicked | paused | completed',
      },
      event_timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the event occurred / Cuándo ocurrió el evento',
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Event details (provider response, error reason, metadata) / Detalles del evento',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Composite index: campaign_id + event_type (campaign event filtering)
    await queryInterface.addIndex('email_campaign_logs', ['campaign_id', 'event_type'], {
      name: 'idx_email_campaign_logs_campaign',
    });

    // Index: campaign_recipient_id (per-recipient event history)
    await queryInterface.addIndex('email_campaign_logs', ['campaign_recipient_id'], {
      name: 'idx_email_campaign_logs_recipient',
    });
  },

  /**
   * Down: Drop email_campaign_logs table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_campaign_logs');
  },
};
