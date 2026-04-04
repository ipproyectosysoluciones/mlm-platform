'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shipment_trackings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'order_id',
        comment: 'FK to orders table',
      },
      vendor_order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'vendor_order_id',
        comment: 'FK to vendor_orders table',
      },
      provider_id: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'provider_id',
        comment: 'FK to delivery_providers table',
      },
      tracking_number: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'tracking_number',
      },
      status: {
        type: Sequelize.ENUM(
          'pending',
          'picked_up',
          'in_transit',
          'out_for_delivery',
          'delivered',
          'failed',
          'returned'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      status_history: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: '[]',
        field: 'status_history',
        comment: 'Array of status history entries [{ status, timestamp, details? }]',
      },
      estimated_delivery: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'estimated_delivery',
      },
      actual_delivery: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'actual_delivery',
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

    await queryInterface.addIndex('shipment_trackings', ['order_id']);
    await queryInterface.addIndex('shipment_trackings', ['vendor_order_id']);
    await queryInterface.addIndex('shipment_trackings', ['tracking_number']);
    await queryInterface.addIndex('shipment_trackings', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('shipment_trackings');
  },
};
