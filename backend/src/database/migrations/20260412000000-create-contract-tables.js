/**
 * @fileoverview Create Contract Tables Migration
 * @description Migration to create contract_templates and affiliate_contracts tables
 * @module database/migrations/createContractTables
 * @author MLM Development Team
 *
 * @example
 * // English: Run migration to create contract tables
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tablas de contratos
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create contract-related tables
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    // Create contract_templates table
    await queryInterface.createTable('contract_templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM(
          'AFFILIATE_AGREEMENT',
          'COMPENSATION_PLAN',
          'PRIVACY_POLICY',
          'TERMS_OF_SERVICE'
        ),
        allowNull: false,
      },
      version: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'e.g., "1.0.0"',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Full contract HTML',
      },
      content_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'SHA256 of content at creation time',
      },
      effective_from: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      effective_to: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'NULL = current active version',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Create affiliate_contracts table
    await queryInterface.createTable('affiliate_contracts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      template_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'contract_templates',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED'),
        defaultValue: 'PENDING',
      },
      signed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When accepted',
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: false,
        comment: 'IPv4/IPv6',
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      content_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'Hash of content at time of signing',
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      revoked_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
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

    // Create indexes for contract_templates table
    await queryInterface.addIndex('contract_templates', ['type'], {
      name: 'idx_contract_templates_type',
    });
    await queryInterface.addIndex('contract_templates', ['type', 'is_active'], {
      name: 'idx_contract_templates_type_is_active',
    });
    await queryInterface.addIndex('contract_templates', ['effective_from'], {
      name: 'idx_contract_templates_effective_from',
    });

    // Create indexes for affiliate_contracts table
    await queryInterface.addIndex('affiliate_contracts', ['user_id', 'template_id'], {
      name: 'idx_affiliate_contracts_user_template',
      unique: true,
    });
    await queryInterface.addIndex('affiliate_contracts', ['user_id'], {
      name: 'idx_affiliate_contracts_user_id',
    });
    await queryInterface.addIndex('affiliate_contracts', ['template_id'], {
      name: 'idx_affiliate_contracts_template_id',
    });
    await queryInterface.addIndex('affiliate_contracts', ['status'], {
      name: 'idx_affiliate_contracts_status',
    });
  },

  /**
   * Down: Drop contract-related tables
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('affiliate_contracts', 'idx_affiliate_contracts_status');
    await queryInterface.removeIndex('affiliate_contracts', 'idx_affiliate_contracts_template_id');
    await queryInterface.removeIndex('affiliate_contracts', 'idx_affiliate_contracts_user_id');
    await queryInterface.removeIndex(
      'affiliate_contracts',
      'idx_affiliate_contracts_user_template'
    );
    await queryInterface.removeIndex('contract_templates', 'idx_contract_templates_effective_from');
    await queryInterface.removeIndex('contract_templates', 'idx_contract_templates_type_is_active');
    await queryInterface.removeIndex('contract_templates', 'idx_contract_templates_type');

    // Drop tables
    await queryInterface.dropTable('affiliate_contracts');
    await queryInterface.dropTable('contract_templates');
  },
};
