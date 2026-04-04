'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('delivery_providers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      tracking_url_template: {
        type: Sequelize.STRING(500),
        allowNull: true,
        field: 'tracking_url_template',
        comment: 'Template for tracking URL, e.g., https://example.com/track/{tracking}',
      },
      webhook_secret: {
        type: Sequelize.STRING(255),
        allowNull: true,
        field: 'webhook_secret',
        comment: 'Secret for webhook signature validation (HMAC-SHA256)',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
        comment: 'Flexible metadata for provider-specific settings',
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

    await queryInterface.addIndex('delivery_providers', ['slug'], { unique: true });
    await queryInterface.addIndex('delivery_providers', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('delivery_providers');
  },
};
