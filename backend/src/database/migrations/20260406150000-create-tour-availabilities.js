'use strict';

/**
 * Migration: create-tour-availabilities
 * Creates the tour_availabilities table for Nexo Real Tourism module (Issue #60)
 * Crea la tabla tour_availabilities para el módulo de Turismo de Nexo Real (Issue #60)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tour_availabilities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tour_package_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tour_packages',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      available_spots: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      booked_spots: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      is_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      notes: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Index on tour_package_id / Índice en tour_package_id
    await queryInterface.addIndex('tour_availabilities', ['tour_package_id'], {
      name: 'tour_availabilities_package_id_idx',
    });

    // Composite unique index on (tour_package_id, date) / Índice único compuesto en (tour_package_id, date)
    await queryInterface.addIndex('tour_availabilities', ['tour_package_id', 'date'], {
      unique: true,
      name: 'tour_availabilities_package_date_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tour_availabilities');
  },
};
