'use strict';

/**
 * @fileoverview Add login tracking columns to users table
 * @description Adds last_login_at and login_streak columns to users table.
 *             These columns are required for the consistency_30 achievement
 *             (currently seeded as coming_soon until streak logic is defined).
 *             Agrega columnas de seguimiento de login a la tabla users.
 * @migration 20260403120003-add-login-tracking-to-users
 * @author MLM Development Team
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'last_login_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of the last login — used for login streak tracking',
    });

    await queryInterface.addColumn('users', 'login_streak', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of consecutive daily logins',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'login_streak');
    await queryInterface.removeColumn('users', 'last_login_at');
  },
};
