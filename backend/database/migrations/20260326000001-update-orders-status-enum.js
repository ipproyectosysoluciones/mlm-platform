'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Change status ENUM
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    });

    // 2. Rename column amount to total_amount
    await queryInterface.renameColumn('orders', 'amount', 'total_amount');

    // 3. Change payment_method column to ENUM
    await queryInterface.changeColumn('orders', 'payment_method', {
      type: Sequelize.ENUM('manual', 'simulated'),
      allowNull: false,
      defaultValue: 'simulated',
    });

    // 4. Add notes column
    await queryInterface.addColumn('orders', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // 5. Remove extra columns if they exist (transaction_id, stream_url, stream_token, expires_at)
    // Since these columns may not exist, we check for them in a safe way.
    // We'll attempt to remove them; if they don't exist, the operation will fail but we can ignore.
    // For simplicity, we'll skip removal for now as they are not in the migration.
  },

  async down(queryInterface, Sequelize) {
    // Revert changes
    await queryInterface.changeColumn('orders', 'status', {
      type: Sequelize.ENUM('pending', 'completed', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.renameColumn('orders', 'total_amount', 'amount');

    await queryInterface.changeColumn('orders', 'payment_method', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.removeColumn('orders', 'notes');
  },
};
