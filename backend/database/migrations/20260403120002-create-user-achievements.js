'use strict';

/**
 * @fileoverview Create user_achievements table
 * @description Migration to create user_achievements junction table tracking which
 *             achievements each user has unlocked.
 *             Migración para crear la tabla user_achievements que registra qué logros
 *             ha desbloqueado cada usuario.
 * @migration 20260403120002-create-user-achievements
 * @author MLM Development Team
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_achievements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      achievement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'achievements',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      unlocked_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      notified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the user has been notified about this achievement',
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

    await queryInterface.addIndex('user_achievements', ['user_id']);
    await queryInterface.addIndex('user_achievements', ['achievement_id']);
    await queryInterface.addIndex('user_achievements', ['user_id', 'achievement_id'], {
      unique: true,
      name: 'user_achievements_user_id_achievement_id_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_achievements');
  },
};
