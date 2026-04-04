/**
 * @fileoverview Create Email Queue Table Migration
 * @description Migration for email_queue table with retry tracking, Brevo integration, and exponential backoff
 *              Migración para tabla email_queue con seguimiento de reintentos, integración Brevo y backoff exponencial
 * @module database/migrations/createEmailQueue
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // English: Run migration to create email_queue table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla email_queue
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create email_queue table with constraints and indexes
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_queue', {
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
        allowNull: false,
        references: {
          model: 'campaign_recipients',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Associated recipient record / Registro de destinatario asociado',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Target user / Usuario destinatario',
      },
      email_address: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Target email address / Dirección de email destino',
      },
      subject_line: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Rendered subject line / Asunto renderizado',
      },
      html_content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment:
          'Rendered HTML content (variables replaced) / HTML renderizado (variables reemplazadas)',
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'sent', 'deferred', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Queue item status / Estado del item en cola',
      },
      retry_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of retry attempts / Número de reintentos',
      },
      next_retry_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment:
          'Next retry timestamp (exponential backoff) / Próximo reintento (backoff exponencial)',
      },
      last_error: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Last error message / Último mensaje de error',
      },
      brevo_message_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Brevo tracking message ID / ID de mensaje de tracking Brevo',
      },
      brevo_response: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
        comment: 'Full Brevo API response / Respuesta completa de API Brevo',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When email was processed / Cuándo se procesó el email',
      },
    });

    // Index: status + next_retry_at (queue processor picks up pending/deferred items)
    await queryInterface.addIndex('email_queue', ['status', 'next_retry_at'], {
      name: 'idx_email_queue_status_retry',
      where: { status: ['pending', 'deferred'] },
    });

    // Index: campaign_id (campaign queue stats)
    await queryInterface.addIndex('email_queue', ['campaign_id'], {
      name: 'idx_email_queue_campaign',
    });
  },

  /**
   * Down: Drop email_queue table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_queue');
  },
};
