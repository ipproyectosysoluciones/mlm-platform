'use strict';

/**
 * Migration: create-tour-packages
 * Creates the tour_packages table for Nexo Real Tourism module (Issue #60)
 * Crea la tabla tour_packages para el módulo de Turismo de Nexo Real (Issue #60)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tour_packages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM(
          'adventure',
          'cultural',
          'relaxation',
          'gastronomic',
          'ecotourism',
          'luxury'
        ),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      title_en: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description_en: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      destination: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING(100),
        defaultValue: 'Colombia',
        allowNull: false,
      },
      duration_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },
      price_includes: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false,
      },
      price_excludes: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false,
      },
      images: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false,
      },
      max_capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      min_group_size: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'draft'),
        defaultValue: 'active',
        allowNull: false,
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
      deleted_at: {
        type: Sequelize.DATE,
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

    // Indexes / Índices
    await queryInterface.addIndex('tour_packages', ['type'], { name: 'tour_packages_type_idx' });
    await queryInterface.addIndex('tour_packages', ['destination'], {
      name: 'tour_packages_destination_idx',
    });
    await queryInterface.addIndex('tour_packages', ['country'], {
      name: 'tour_packages_country_idx',
    });
    await queryInterface.addIndex('tour_packages', ['status'], {
      name: 'tour_packages_status_idx',
    });
    await queryInterface.addIndex('tour_packages', ['vendor_id'], {
      name: 'tour_packages_vendor_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tour_packages');
  },
};
