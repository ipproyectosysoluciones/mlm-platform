/**
 * @fileoverview Create Properties Table Migration
 * @description Creates the properties table for Nexo Real property listings module.
 *   Supports rental, sale, and management listing types with geo data, JSONB fields,
 *   soft-delete (paranoid), and vendor association.
 *
 * ES: Crea la tabla properties para el módulo de listados inmobiliarios de Nexo Real.
 *   Soporta tipos alquiler, venta y gestión con datos geo, campos JSONB,
 *   borrado suave (paranoid) y asociación a vendedor.
 *
 * EN: Creates the properties table for Nexo Real property listings module.
 *   Supports rental, sale, and management types with geo data, JSONB fields,
 *   soft-delete (paranoid), and vendor association.
 *
 * @example
 * // English: Run migration
 * npx sequelize-cli db:migrate
 *
 * // Español: Ejecutar migración
 * npx sequelize-cli db:migrate
 */
'use strict';

module.exports = {
  /**
   * Up: Create properties table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('properties', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('rental', 'sale', 'management'),
        allowNull: false,
        comment: 'Property listing type: rental, sale, or management',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Property title in Spanish',
      },
      title_en: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Property title in English',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Property description in Spanish',
      },
      description_en: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Property description in English',
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Listing price',
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'COP',
        comment: 'ISO 4217 currency code',
      },
      price_negotiable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the price is negotiable',
      },
      bedrooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of bedrooms',
      },
      bathrooms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of bathrooms',
      },
      area_m2: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Total area in square meters',
      },
      address: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Street address',
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'City name',
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Colombia',
        comment: 'Country name',
      },
      lat: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
        comment: 'Latitude coordinate',
      },
      lng: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
        comment: 'Longitude coordinate',
      },
      amenities: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'List of amenity strings or objects',
      },
      images: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'List of image URL strings or objects',
      },
      status: {
        type: Sequelize.ENUM('available', 'rented', 'sold', 'paused'),
        allowNull: false,
        defaultValue: 'available',
        comment: 'Current listing status',
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
        comment: 'FK to vendors table — nullable',
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft-delete timestamp (paranoid)',
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

    // Index on status for filtering available/rented/sold listings
    await queryInterface.addIndex('properties', ['status'], {
      name: 'properties_status_idx',
    });

    // Index on city for geographic filtering
    await queryInterface.addIndex('properties', ['city'], {
      name: 'properties_city_idx',
    });

    // Index on type for listing type filtering
    await queryInterface.addIndex('properties', ['type'], {
      name: 'properties_type_idx',
    });

    // Index on vendor_id for vendor-specific queries
    await queryInterface.addIndex('properties', ['vendor_id'], {
      name: 'properties_vendor_id_idx',
    });
  },

  /**
   * Down: Drop properties table
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('properties');
    // Note: ENUM types must be manually dropped in PostgreSQL if needed
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_properties_type";');
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_properties_status";');
  },
};
