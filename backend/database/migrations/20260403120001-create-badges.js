'use strict';

/**
 * @fileoverview Create badges table
 * @description Migration to create badges table linked to achievements.
 *             Migración para crear la tabla badges vinculada a logros.
 * @migration 20260403120001-create-badges
 * @author MLM Development Team
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('badges', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL to the badge image',
      },
      description: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('badges', ['achievement_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('badges');
  },
};
