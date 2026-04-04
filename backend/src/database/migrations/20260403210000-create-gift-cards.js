/**
 * @fileoverview Create Gift Cards Table Migration
 * @description Migration for gift_cards table with balance tracking, status management, and expiration
 *              Migración para tabla gift_cards con seguimiento de balance, gestión de estado y expiración
 * @module database/migrations/createGiftCards
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // English: Run migration to create gift_cards table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla gift_cards
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
   * Up: Create gift_cards table with constraints and indexes
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gift_cards', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Human-readable gift card code / Código legible de gift card',
      },
      qr_code_data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Base64 PNG data URL for QR code / URL de datos base64 PNG para código QR',
      },
      balance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Gift card balance / Balance de la gift card',
      },
      status: {
        type: Sequelize.ENUM('active', 'redeemed', 'expired'),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Gift card status / Estado de la gift card',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Soft delete flag / Flag de borrado suave',
      },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'User who created/purchased the gift card / Usuario que creó/compró la gift card',
      },
      redeemed_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        comment: 'User who redeemed the gift card / Usuario que canjeó la gift card',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment:
          'Expiration date (30 days from creation) / Fecha de expiración (30 días desde creación)',
      },
      redeemed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date when gift card was redeemed / Fecha cuando se canjeó la gift card',
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft delete timestamp / Timestamp de borrado suave',
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

    // Constraint: balance must be > 0
    await queryInterface.addConstraint('gift_cards', {
      fields: ['balance'],
      type: 'check',
      where: {
        balance: {
          [Sequelize.Op.gt]: 0,
        },
      },
      name: 'chk_gift_cards_balance_positive',
    });

    // Composite index: status + expires_at (for active card lookups)
    await queryInterface.addIndex('gift_cards', ['status', 'expires_at'], {
      name: 'idx_gift_cards_status_expires',
    });

    // Index: created_by_user_id (admin dashboard — view cards by creator)
    await queryInterface.addIndex('gift_cards', ['created_by_user_id'], {
      name: 'idx_gift_cards_created_by',
    });

    // Index: redeemed_by_user_id (admin dashboard — view redeemed cards)
    await queryInterface.addIndex('gift_cards', ['redeemed_by_user_id'], {
      name: 'idx_gift_cards_redeemed_by',
    });
  },

  /**
   * Down: Drop gift_cards table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('gift_cards');
  },
};
