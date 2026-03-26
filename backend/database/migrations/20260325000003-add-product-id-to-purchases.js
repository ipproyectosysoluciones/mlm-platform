'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchases', 'product_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('purchases', ['product_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('purchases', 'product_id');
    await queryInterface.removeColumn('purchases', 'product_id');
  },
};
