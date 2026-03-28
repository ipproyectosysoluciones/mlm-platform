'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('purchases', 'business_type', {
      type: Sequelize.ENUM('suscripcion', 'producto', 'membresia', 'servicio', 'otro'),
      allowNull: false,
      defaultValue: 'producto',
      comment: 'Tipo de negocio o servicio',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('purchases', 'business_type');
  },
};
