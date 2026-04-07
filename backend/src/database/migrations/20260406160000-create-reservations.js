'use strict';

/**
 * Migration: create-reservations
 * Creates the `reservations` table for unified property and tour bookings.
 * Crea la tabla `reservations` para reservas unificadas de propiedades y tours.
 *
 * @module migrations/20260406160000-create-reservations
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * Run migration — create reservations table
   * Ejecutar migración — crear tabla de reservas
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reservations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('property', 'tour'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
        defaultValue: 'pending',
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      vendor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      // Property-specific fields
      property_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'properties',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      check_in: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      check_out: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      // Tour-specific fields
      tour_package_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tour_packages',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tour_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      group_size: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },

      // Guest information
      guest_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      guest_email: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      guest_phone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      // Pricing
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },

      // Payment
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid', 'refunded', 'failed'),
        defaultValue: 'pending',
        allowNull: false,
      },
      payment_id: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },

      // Notes
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // Timestamps
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Indexes
    await queryInterface.addIndex('reservations', ['type'], {
      name: 'reservations_type',
    });
    await queryInterface.addIndex('reservations', ['status'], {
      name: 'reservations_status',
    });
    await queryInterface.addIndex('reservations', ['user_id'], {
      name: 'reservations_user_id',
    });
    await queryInterface.addIndex('reservations', ['vendor_id'], {
      name: 'reservations_vendor_id',
    });
    await queryInterface.addIndex('reservations', ['property_id'], {
      name: 'reservations_property_id',
    });
    await queryInterface.addIndex('reservations', ['tour_package_id'], {
      name: 'reservations_tour_package_id',
    });
    await queryInterface.addIndex('reservations', ['payment_status'], {
      name: 'reservations_payment_status',
    });
    await queryInterface.addIndex('reservations', ['tour_date'], {
      name: 'reservations_tour_date',
    });
    await queryInterface.addIndex('reservations', ['type', 'status'], {
      name: 'reservations_type_status',
    });
  },

  /**
   * Rollback migration — drop reservations table
   * Revertir migración — eliminar tabla de reservas
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reservations');
    // Drop ENUM types for PostgreSQL
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reservations_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reservations_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reservations_payment_status";');
  },
};
