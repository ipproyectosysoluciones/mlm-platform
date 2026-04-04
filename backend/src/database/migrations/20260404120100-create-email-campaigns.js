/**
 * @fileoverview Create Email Campaigns Table Migration
 * @description Migration for email_campaigns table with status lifecycle, scheduling, and delivery stats
 *              Migración para tabla email_campaigns con ciclo de vida de estado, programación y estadísticas de envío
 * @module database/migrations/createEmailCampaigns
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // English: Run migration to create email_campaigns table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla email_campaigns
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create email_campaigns table with constraints and indexes
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_campaigns', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Admin who created the campaign / Admin que creó la campaña',
      },
      email_template_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'email_templates',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        comment: 'Template used for this campaign / Template usado para esta campaña',
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Campaign name / Nombre de la campaña',
      },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'Campaign lifecycle status / Estado del ciclo de vida de la campaña',
      },
      scheduled_for: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When to send (NULL = manual trigger) / Cuándo enviar (NULL = trigger manual)',
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When sending started / Cuándo empezó el envío',
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When all emails processed / Cuándo se procesaron todos los emails',
      },
      recipient_segment: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
        comment: 'Segment filter (e.g. { type: "all_users" }) / Filtro de segmento',
      },
      recipient_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total recipients / Total de destinatarios',
      },
      sent_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Successfully sent / Enviados exitosamente',
      },
      failed_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Permanently failed / Fallos permanentes',
      },
      deferred_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Deferred for retry / Diferidos para reintento',
      },
      bounce_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Bounced emails / Emails rebotados',
      },
      open_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Opened emails / Emails abiertos',
      },
      click_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Clicked emails / Emails con clicks',
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

    // Constraint: counts must be non-negative
    await queryInterface.addConstraint('email_campaigns', {
      fields: ['sent_count'],
      type: 'check',
      where: {
        sent_count: { [Sequelize.Op.gte]: 0 },
      },
      name: 'chk_email_campaigns_counts_non_negative',
    });

    // Index: status (dashboard filtering)
    await queryInterface.addIndex('email_campaigns', ['status'], {
      name: 'idx_email_campaigns_status',
    });

    // Index: scheduled_for (scheduler job to find due campaigns)
    await queryInterface.addIndex('email_campaigns', ['scheduled_for'], {
      name: 'idx_email_campaigns_scheduled',
      where: { status: 'scheduled' },
    });
  },

  /**
   * Down: Drop email_campaigns table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_campaigns');
  },
};
