/**
 * @fileoverview Create Inventory Movements Table Migration
 * @description Migration for inventory_movements table - audit trail for stock changes
 *              Records all stock modifications: initial, reserve, release, adjust, return
 * @module database/migrations/createInventoryMovement
 * @author MLM Development Team
 *
 * @example
 * // English: Run migration to create inventory_movements table
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración para crear tabla inventory_movements
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create inventory_movements table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_movements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
        comment: 'Product this movement affects / Producto que este movimiento afecta',
      },
      type: {
        type: Sequelize.ENUM('initial', 'reserve', 'release', 'adjust', 'return'),
        allowNull: false,
        comment: 'Movement type: initial, reserve, release, adjust, return',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment:
          'Quantity changed (positive or negative) / Cantidad cambiada (positiva o negativa)',
      },
      reason: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Reason for the movement / Razón del movimiento',
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment:
          'Reference to related entity (order, return, etc.) / Referencia a entidad relacionada',
      },
      performed_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        comment: 'User who performed this action / Usuario que realizó esta acción',
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

    // Constraint: quantity cannot be zero
    await queryInterface.addConstraint('inventory_movements', {
      fields: ['quantity'],
      type: 'check',
      where: {
        quantity: {
          [Sequelize.Op.ne]: 0,
        },
      },
      name: 'chk_inventory_movements_quantity_not_zero',
    });

    // Index: product_id for querying movements by product
    await queryInterface.addIndex('inventory_movements', ['product_id'], {
      name: 'idx_inventory_movements_product',
    });

    // Index: type for filtering by movement type
    await queryInterface.addIndex('inventory_movements', ['type'], {
      name: 'idx_inventory_movements_type',
    });

    // Index: performed_by for auditing user actions
    await queryInterface.addIndex('inventory_movements', ['performed_by'], {
      name: 'idx_inventory_movements_performed_by',
    });

    // Index: reference_id for finding related movements
    await queryInterface.addIndex('inventory_movements', ['reference_id'], {
      name: 'idx_inventory_movements_reference',
    });

    // Index: created_at for time-based queries
    await queryInterface.addIndex('inventory_movements', ['created_at'], {
      name: 'idx_inventory_movements_created_at',
    });

    // Composite index for common queries
    await queryInterface.addIndex('inventory_movements', ['product_id', 'type', 'created_at'], {
      name: 'idx_inventory_movements_product_type_date',
    });
  },

  /**
   * Down: Drop inventory_movements table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inventory_movements');
  },
};
