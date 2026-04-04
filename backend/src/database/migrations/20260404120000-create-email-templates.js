/**
 * @fileoverview Create Email Templates Table Migration
 * @description Migration for email_templates table with WYSIWYG state, template variables, and soft delete
 *              Migración para tabla email_templates con estado WYSIWYG, variables de template y borrado suave
 * @module database/migrations/createEmailTemplates
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // English: Run migration to create email_templates table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla email_templates
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create email_templates table with constraints and indexes
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_templates', {
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
        comment: 'Admin who created the template / Admin que creó el template',
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Template name / Nombre del template',
      },
      subject_line: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment:
          'Email subject line (may contain {{variables}}) / Asunto del email (puede contener {{variables}})',
      },
      html_content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Raw HTML content from WYSIWYG builder / Contenido HTML raw del builder WYSIWYG',
      },
      wysiwyg_state: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Builder state for re-editing / Estado del builder para re-edición',
      },
      variables_used: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
        defaultValue: [],
        comment:
          'Array of {{var}} names used in template / Array de nombres de {{var}} usados en el template',
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft delete timestamp (paranoid) / Timestamp de borrado suave',
      },
    });

    // Constraint: name must not be empty
    await queryInterface.addConstraint('email_templates', {
      fields: ['name'],
      type: 'check',
      where: {
        name: {
          [Sequelize.Op.ne]: '',
        },
      },
      name: 'chk_email_templates_name_not_empty',
    });

    // Index: created_by_user_id + created_at (admin template listing)
    await queryInterface.addIndex('email_templates', ['created_by_user_id', 'created_at'], {
      name: 'idx_email_templates_created_by',
    });
  },

  /**
   * Down: Drop email_templates table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_templates');
  },
};
