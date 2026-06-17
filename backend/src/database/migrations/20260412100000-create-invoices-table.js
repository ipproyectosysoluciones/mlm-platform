/**
 * @fileoverview Create Invoices Table Migration
 * @description Migration to create the invoices table with ENUMs, sequence, and indexes
 *             Migración para crear la tabla invoices con ENUMs, secuencia e índices
 * @module database/migrations/createInvoicesTable
 * @author MLM Development Team
 *
 * @example
 * // English: Run migration to create invoices table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla de facturas
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create invoices table with ENUMs, sequence, and indexes
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    // Create ENUM types
    await queryInterface.sequelize.query(
      `CREATE TYPE IF NOT EXISTS "enum_invoices_type" AS ENUM ('subscription', 'purchase', 'upgrade');`
    );
    await queryInterface.sequelize.query(
      `CREATE TYPE IF NOT EXISTS "enum_invoices_status" AS ENUM ('draft', 'issued', 'paid', 'cancelled', 'overdue', 'refunded');`
    );

    // Create sequence for invoice numbers
    await queryInterface.sequelize.query(
      `CREATE SEQUENCE IF NOT EXISTS "invoice_number_seq" START WITH 1 INCREMENT BY 1;`
    );

    // Create invoices table
    await queryInterface.createTable('invoices', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'SET NULL',
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
      invoice_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      type: {
        type: '"enum_invoices_type"',
        allowNull: false,
      },
      status: {
        type: '"enum_invoices_status"',
        allowNull: false,
        defaultValue: 'draft',
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      tax: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      items: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      issued_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      due_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancelled_at: {
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
    });

    // Create indexes
    await queryInterface.addIndex('invoices', ['user_id'], {
      name: 'idx_invoices_user_id',
    });
    await queryInterface.addIndex('invoices', ['order_id'], {
      name: 'idx_invoices_order_id',
    });
    await queryInterface.addIndex('invoices', ['invoice_number'], {
      name: 'idx_invoices_invoice_number',
      unique: true,
    });
    await queryInterface.addIndex('invoices', ['status'], {
      name: 'idx_invoices_status',
    });
    await queryInterface.addIndex('invoices', ['issued_at'], {
      name: 'idx_invoices_issued_at',
    });
    await queryInterface.addIndex('invoices', ['type'], {
      name: 'idx_invoices_type',
    });
  },

  /**
   * Down: Drop invoices table, sequence, and ENUMs
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('invoices', 'idx_invoices_type');
    await queryInterface.removeIndex('invoices', 'idx_invoices_issued_at');
    await queryInterface.removeIndex('invoices', 'idx_invoices_status');
    await queryInterface.removeIndex('invoices', 'idx_invoices_invoice_number');
    await queryInterface.removeIndex('invoices', 'idx_invoices_order_id');
    await queryInterface.removeIndex('invoices', 'idx_invoices_user_id');

    // Drop table
    await queryInterface.dropTable('invoices');

    // Drop sequence
    await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS "invoice_number_seq";');

    // Drop ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invoices_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invoices_type";');
  },
};
