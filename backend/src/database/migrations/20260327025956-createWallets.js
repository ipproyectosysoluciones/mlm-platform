/**
 * @fileoverview Create Wallets Tables Migration
 * @description Migration for wallets, wallet_transactions, and withdrawal_requests tables
 * @module database/migrations/createWallets
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // English: Run migration to create wallet tables
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tablas de wallet
 * npx sequelize-cli db:migrate
 *
 * @example
 * // English: Revert migration
 * npx sequelize-cli db:migrate:undo
 *
 * // Español: Revertir migración
 * npx sequelize-cli db:migrate:undo
 */
'use strict';

module.exports = {
  /**
   * Up: Create wallets, wallet_transactions, and withdrawal_requests tables
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    // Create wallets table
    await queryInterface.createTable('wallets', {
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
      balance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add index for user_id
    await queryInterface.addIndex('wallets', ['user_id'], {
      unique: true,
      name: 'wallets_user_id_unique',
    });

    // Create wallet_transactions table
    await queryInterface.createTable('wallet_transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      wallet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'wallets',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('commission_earned', 'withdrawal', 'fee', 'adjustment'),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Reference to commission_id or withdrawal_request_id',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      exchange_rate: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true,
        comment: 'Rate used if original currency != USD',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for wallet_transactions
    await queryInterface.addIndex('wallet_transactions', ['wallet_id'], {
      name: 'wallet_transactions_wallet_id_idx',
    });
    await queryInterface.addIndex('wallet_transactions', ['type'], {
      name: 'wallet_transactions_type_idx',
    });
    await queryInterface.addIndex('wallet_transactions', ['created_at'], {
      name: 'wallet_transactions_created_at_idx',
    });

    // Create withdrawal_requests table
    await queryInterface.createTable('withdrawal_requests', {
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
      requested_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      fee_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      net_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'paid', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      approval_comment: {
        type: Sequelize.TEXT,
        allowNull: true,
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for withdrawal_requests
    await queryInterface.addIndex('withdrawal_requests', ['user_id'], {
      name: 'withdrawal_requests_user_id_idx',
    });
    await queryInterface.addIndex('withdrawal_requests', ['status'], {
      name: 'withdrawal_requests_status_idx',
    });
    await queryInterface.addIndex('withdrawal_requests', ['created_at'], {
      name: 'withdrawal_requests_created_at_idx',
    });
  },

  /**
   * Down: Drop wallets, wallet_transactions, and withdrawal_requests tables
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('withdrawal_requests');
    await queryInterface.dropTable('wallet_transactions');
    await queryInterface.dropTable('wallets');
  },
};
