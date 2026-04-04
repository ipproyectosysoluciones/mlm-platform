/**
 * @fileoverview Create Vendor Tables Migration
 * @description Migration to create vendors, vendor_orders, and vendor_payouts tables
 * @module database/migrations/createVendorTables
 * @author MLM Development Team
 *
 * @example
 * // English: Run migration to create vendor tables
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tablas de vendedor
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create vendor-related tables
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    // Create vendors table
    await queryInterface.createTable('vendors', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      business_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      logo_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'suspended', 'rejected'),
        defaultValue: 'pending',
      },
      commission_rate: {
        type: Sequelize.DECIMAL(5, 4),
        defaultValue: 0.7,
        comment: 'Vendor commission rate (e.g., 0.7000 = 70%)',
      },
      contact_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      contact_phone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      address: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      bank_details: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Encrypted bank details for payouts',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      deleted_at: {
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

    // Create vendor_orders table
    await queryInterface.createTable('vendor_orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      vendor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      commission_amount: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        comment: 'Total MLM commissions for this vendor order',
      },
      vendor_amount: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        comment: 'Amount to be paid to vendor',
      },
      platform_amount: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        comment: 'Platform net after vendor and MLM commissions',
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'cancelled'),
        defaultValue: 'pending',
      },
      notes: {
        type: Sequelize.TEXT,
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

    // Create vendor_payouts table
    await queryInterface.createTable('vendor_payouts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      vendor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
      },
      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      payment_reference: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      period_start: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      period_end: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      requested_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      processed_at: {
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

    // Create indexes for vendors table
    await queryInterface.addIndex('vendors', ['user_id'], {
      name: 'idx_vendors_user_id',
      unique: true,
    });
    await queryInterface.addIndex('vendors', ['slug'], {
      name: 'idx_vendors_slug',
      unique: true,
    });
    await queryInterface.addIndex('vendors', ['status'], {
      name: 'idx_vendors_status',
    });

    // Create indexes for vendor_orders table
    await queryInterface.addIndex('vendor_orders', ['order_id'], {
      name: 'idx_vendor_orders_order_id',
    });
    await queryInterface.addIndex('vendor_orders', ['vendor_id'], {
      name: 'idx_vendor_orders_vendor_id',
    });
    await queryInterface.addIndex('vendor_orders', ['status'], {
      name: 'idx_vendor_orders_status',
    });

    // Create indexes for vendor_payouts table
    await queryInterface.addIndex('vendor_payouts', ['vendor_id'], {
      name: 'idx_vendor_payouts_vendor_id',
    });
    await queryInterface.addIndex('vendor_payouts', ['status'], {
      name: 'idx_vendor_payouts_status',
    });
    await queryInterface.addIndex('vendor_payouts', ['requested_at'], {
      name: 'idx_vendor_payouts_requested_at',
    });
  },

  /**
   * Down: Drop vendor-related tables
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('vendor_payouts', 'idx_vendor_payouts_requested_at');
    await queryInterface.removeIndex('vendor_payouts', 'idx_vendor_payouts_status');
    await queryInterface.removeIndex('vendor_payouts', 'idx_vendor_payouts_vendor_id');
    await queryInterface.removeIndex('vendor_orders', 'idx_vendor_orders_status');
    await queryInterface.removeIndex('vendor_orders', 'idx_vendor_orders_vendor_id');
    await queryInterface.removeIndex('vendor_orders', 'idx_vendor_orders_order_id');
    await queryInterface.removeIndex('vendors', 'idx_vendors_status');
    await queryInterface.removeIndex('vendors', 'idx_vendors_slug');
    await queryInterface.removeIndex('vendors', 'idx_vendors_user_id');

    // Drop tables
    await queryInterface.dropTable('vendor_payouts');
    await queryInterface.dropTable('vendor_orders');
    await queryInterface.dropTable('vendors');
  },
};
