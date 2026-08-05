'use strict';

/**
 * Fixture migration for the ESM migration-runner mechanism test (PR 0 infra).
 *
 * Creates/drops a throwaway `migration_runner_probe` table. It is loaded by
 * sequelize-cli from a CommonJS-scoped directory (this folder carries its own
 * package.json with `{"type":"commonjs"}`), proving that CJS migrations run
 * under the backend's ESM package (`"type": "module"`) without the
 * `ReferenceError: require is not defined` crash that the legacy `.sequelizerc`
 * caused. This mirrors the real fix applied to backend/database/package.json.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('migration_runner_probe', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      value: {
        type: Sequelize.STRING(255),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('migration_runner_probe');
  },
};
