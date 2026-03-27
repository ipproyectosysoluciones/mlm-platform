/**
 * @fileoverview Add wallet migration fields to commissions table
 * @description Adds description and migratedToWallet columns to commissions table
 * @module database/migrations/20260327030000-addCommissionWalletFields
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Up migration - add columns
 */
async function up() {
  await sequelize.getQueryInterface().addColumn('commissions', 'description', {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional description for the commission',
  });

  await sequelize.getQueryInterface().addColumn('commissions', 'migrated_to_wallet', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Flag indicating if this commission has been migrated to wallet',
  });

  // Add index for efficient querying of unmigrated commissions
  await sequelize.getQueryInterface().addIndex('commissions', ['migrated_to_wallet']);
}

/**
 * Down migration - remove columns
 */
async function down() {
  await sequelize.getQueryInterface().removeColumn('commissions', 'description');
  await sequelize.getQueryInterface().removeColumn('commissions', 'migrated_to_wallet');
}

// Execute if called directly
if (require.main === module) {
  up()
    .then(() => {
      console.log(
        '✅ Migration 20260327030000: Added description and migrated_to_wallet to commissions'
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { up, down };
