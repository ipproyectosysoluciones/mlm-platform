/**
 * @fileoverview Create QR Mappings Table Migration
 * @description Migration for qr_mappings table — short code to gift card UUID mapping
 *              Migración para tabla qr_mappings — mapeo de código corto a UUID de gift card
 * @module database/migrations/createQrMappings
 * @author MLM Development Team
 * @version 1.0.0
 *
 * @example
 * // English: Run migration to create qr_mappings table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla qr_mappings
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create qr_mappings table with indexes
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('qr_mappings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      short_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true,
        comment: 'URL-safe short code for QR resolution / Código corto URL-safe para resolución QR',
      },
      gift_card_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'gift_cards',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'FK to gift_cards table / FK a tabla gift_cards',
      },
      scan_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of times QR was scanned / Número de veces que el QR fue escaneado',
      },
      last_scanned_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last scan timestamp / Timestamp del último escaneo',
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

    // Index: short_code (fast QR resolution)
    await queryInterface.addIndex('qr_mappings', ['short_code'], {
      unique: true,
      name: 'idx_qr_mappings_short_code',
    });

    // Index: gift_card_id (reverse lookup)
    await queryInterface.addIndex('qr_mappings', ['gift_card_id'], {
      unique: true,
      name: 'idx_qr_mappings_gift_card',
    });
  },

  /**
   * Down: Drop qr_mappings table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('qr_mappings');
  },
};
