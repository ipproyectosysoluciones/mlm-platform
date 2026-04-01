'use strict';

/**
 * @fileoverview Create push_subscriptions table for Web Push notifications
 * @description Migration to create push_subscriptions table for storing
 *             browser push notification subscriptions.
 * @migration 20260331223551-create-push-subscriptions
 * @author MLM Development Team
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('push_subscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      endpoint: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      keys: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'JSON object containing p256dh and auth keys from PushSubscription',
      },
      browser: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Browser name (chrome, firefox, safari, edge)',
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

    // Add indexes for efficient queries
    await queryInterface.addIndex('push_subscriptions', ['user_id']);
    await queryInterface.addIndex('push_subscriptions', ['endpoint']);
    await queryInterface.addIndex('push_subscriptions', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('push_subscriptions');
  },
};
