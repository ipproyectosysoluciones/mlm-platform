'use strict';

/**
 * @fileoverview Create achievements table
 * @description Migration to create achievements table for the Achievements & Badges feature.
 *             Migración para crear la tabla achievements del sistema de logros.
 * @migration 20260403120000-create-achievements
 * @author MLM Development Team
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('achievements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique identifier for the achievement (e.g. first_sale, team_10)',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      icon: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Emoji icon for the achievement',
      },
      condition_type: {
        type: Sequelize.ENUM(
          'count_referrals',
          'sales_amount',
          'sales_count',
          'login_streak',
          'binary_balance'
        ),
        allowNull: false,
      },
      condition_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tier: {
        type: Sequelize.ENUM('bronze', 'silver', 'gold'),
        allowNull: false,
      },
      points: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('active', 'coming_soon', 'disabled'),
        allowNull: false,
        defaultValue: 'active',
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

    await queryInterface.addIndex('achievements', ['key'], { unique: true });
    await queryInterface.addIndex('achievements', ['status']);
    await queryInterface.addIndex('achievements', ['condition_type']);
    await queryInterface.addIndex('achievements', ['tier']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('achievements');
  },
};
