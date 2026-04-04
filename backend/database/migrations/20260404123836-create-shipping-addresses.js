'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shipping_addresses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'FK to users table',
      },
      label: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'User-defined label (e.g., "Home", "Office")',
      },
      recipient_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'recipient_name',
      },
      street: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        field: 'postal_code',
      },
      country: {
        type: Sequelize.STRING(3),
        allowNull: false,
        comment: 'ISO 3166-1 alpha-3 country code',
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_default',
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Delivery instructions',
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'deleted_at',
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

    await queryInterface.addIndex('shipping_addresses', ['user_id']);
    await queryInterface.addIndex('shipping_addresses', ['user_id', 'is_default']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('shipping_addresses');
  },
};
