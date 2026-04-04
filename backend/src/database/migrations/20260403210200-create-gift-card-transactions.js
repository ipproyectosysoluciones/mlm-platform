/**
 * @fileoverview Create Gift Card Transactions Table Migration
 * @description Migration for gift_card_transactions audit log table
 *              Migración para tabla gift_card_transactions — registro de auditoría
 * @module database/migrations/createGiftCardTransactions
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // English: Run migration to create gift_card_transactions table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla gift_card_transactions
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create gift_card_transactions table with indexes
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gift_card_transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      gift_card_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'gift_cards',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'FK to gift_cards table / FK a tabla gift_cards',
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'FK to orders table (nullable) / FK a tabla orders (nullable)',
      },
      redeemed_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'User who performed the transaction / Usuario que realizó la transacción',
      },
      amount_redeemed: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Amount redeemed in this transaction / Monto canjeado en esta transacción',
      },
      transaction_type: {
        type: Sequelize.ENUM('redemption', 'refund', 'adjustment'),
        allowNull: false,
        comment: 'Type of transaction / Tipo de transacción',
      },
      status: {
        type: Sequelize.ENUM('completed', 'refunded', 'failed'),
        allowNull: false,
        defaultValue: 'completed',
        comment: 'Transaction status / Estado de la transacción',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Extra context (JSON) / Contexto adicional (JSON)',
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

    // Index: gift_card_id (lookup transactions by gift card)
    await queryInterface.addIndex('gift_card_transactions', ['gift_card_id'], {
      name: 'idx_gift_card_transactions_gift_card',
    });

    // Index: order_id (lookup transactions by order)
    await queryInterface.addIndex('gift_card_transactions', ['order_id'], {
      name: 'idx_gift_card_transactions_order',
    });
  },

  /**
   * Down: Drop gift_card_transactions table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('gift_card_transactions');
  },
};
