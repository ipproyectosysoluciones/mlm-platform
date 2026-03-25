'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      purchase_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'purchases',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('orders', ['order_number'], { unique: true });
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['product_id']);
    await queryInterface.addIndex('orders', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  },
};
