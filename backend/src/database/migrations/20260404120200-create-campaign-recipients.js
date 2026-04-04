/**
 * @fileoverview Create Campaign Recipients Table Migration
 * @description Migration for campaign_recipients table tracking per-recipient delivery status
 *              Migración para tabla campaign_recipients con seguimiento de estado de entrega por destinatario
 * @module database/migrations/createCampaignRecipients
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // English: Run migration to create campaign_recipients table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla campaign_recipients
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create campaign_recipients table with constraints and indexes
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('campaign_recipients', {
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
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Recipient user / Usuario destinatario',
      },
      email_address: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email address at time of send / Email al momento del envío',
      },
      status: {
        type: Sequelize.ENUM(
          'pending',
          'sent',
          'delivered',
          'opened',
          'clicked',
          'bounced',
          'failed'
        ),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Delivery status / Estado de entrega',
      },
      opened_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'First open timestamp / Timestamp de primera apertura',
      },
      first_click_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'First click timestamp / Timestamp de primer click',
      },
      click_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total clicks / Total de clicks',
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When email was sent / Cuándo se envió el email',
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
    });

    // Composite index: campaign_id + status (campaign recipient listing)
    await queryInterface.addIndex('campaign_recipients', ['campaign_id', 'status'], {
      name: 'idx_campaign_recipients_campaign',
    });

    // Index: user_id (find all campaigns a user received)
    await queryInterface.addIndex('campaign_recipients', ['user_id'], {
      name: 'idx_campaign_recipients_user',
    });
  },

  /**
   * Down: Drop campaign_recipients table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('campaign_recipients');
  },
};
