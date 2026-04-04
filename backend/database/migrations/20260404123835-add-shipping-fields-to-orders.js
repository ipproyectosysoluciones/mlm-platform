'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add shipping fields to orders table
    await queryInterface.addColumn('orders', 'shipping_address_id', {
      type: Sequelize.UUID,
      allowNull: true,
      field: 'shipping_address_id',
      comment: 'FK to shipping_addresses table',
    });

    await queryInterface.addColumn('orders', 'shipping_cost', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      field: 'shipping_cost',
      comment: 'Cost of shipping',
    });

    await queryInterface.addColumn('orders', 'shipping_status', {
      type: Sequelize.ENUM(
        'not_required',
        'pending_shipment',
        'shipped',
        'in_transit',
        'delivered'
      ),
      allowNull: true,
      defaultValue: 'not_required',
      field: 'shipping_status',
      comment: 'Shipping status for the order',
    });

    // Add indexes for the new columns
    await queryInterface.addIndex('orders', ['shipping_address_id']);
    await queryInterface.addIndex('orders', ['shipping_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('orders', ['shipping_status']);
    await queryInterface.removeIndex('orders', ['shipping_address_id']);
    await queryInterface.removeColumn('orders', 'shipping_status');
    await queryInterface.removeColumn('orders', 'shipping_cost');
    await queryInterface.removeColumn('orders', 'shipping_address_id');
  },
};
