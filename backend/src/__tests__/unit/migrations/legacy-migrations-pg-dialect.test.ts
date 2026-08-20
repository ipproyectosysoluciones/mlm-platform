/**
 * @fileoverview Unit tests: legacy migrations must be PostgreSQL-compatible
 * @description Scans the 17 legacy migrations in backend/database/migrations for
 *              MySQL-only constructs that PostgreSQL rejects. The known blocker
 *              (issue #358): `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` in the
 *              `updated_at` default of the create-table migrations — PostgreSQL has
 *              no ON UPDATE clause for column defaults and aborts with a syntax
 *              error, so the first migration (`create-products`) kills `db:migrate`.
 *
 *              The scan also locks the contract that timestamp defaults are
 *              Sequelize literals (not raw strings, which would be quoted as
 *              text) and that migration enums reproduce the values the Sequelize
 *              models expect (e.g. products.platform).
 *
 * @module __tests__/unit/migrations/legacy-migrations-pg-dialect
 * @issue #358 — Fix 17 legacy MySQL migrations to PostgreSQL
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Sequelize } = require('sequelize');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const createProducts = require('../../../../database/migrations/20260325000001-create-products');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createOrders = require('../../../../database/migrations/20260325000002-create-orders');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createPushSubscriptions = require('../../../../database/migrations/20260331223551-create-push-subscriptions');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createAchievements = require('../../../../database/migrations/20260403120000-create-achievements');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createBadges = require('../../../../database/migrations/20260403120001-create-badges');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createUserAchievements = require('../../../../database/migrations/20260403120002-create-user-achievements');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createShippingAddresses = require('../../../../database/migrations/20260404123836-create-shipping-addresses');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createDeliveryProviders = require('../../../../database/migrations/20260404123837-create-delivery-providers');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createShipmentTrackings = require('../../../../database/migrations/20260404123838-create-shipment-trackings');

interface CapturedTable {
  attributes: Record<string, { type?: { key?: string }; defaultValue?: unknown }>;
}

function makeCaptureQueryInterface() {
  const createdTables = new Map<string, CapturedTable>();

  const query = jest.fn().mockResolvedValue([[], {}]);
  const transaction = {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };

  const queryInterface = {
    sequelize: {
      query,
      transaction: jest.fn().mockResolvedValue(transaction),
    },
    createTable: jest.fn(async (tableName: string, attributes: CapturedTable['attributes']) => {
      createdTables.set(tableName, { attributes });
    }),
    addColumn: jest.fn(),
    addIndex: jest.fn(),
    removeIndex: jest.fn(),
    removeColumn: jest.fn(),
    dropTable: jest.fn(),
    changeColumn: jest.fn(),
    renameColumn: jest.fn(),
  };

  return { queryInterface, createdTables };
}

/**
 * Normalizes a Sequelize default to its raw SQL string.
 * Sequelize.literal('X') → { val: 'X' }; raw strings pass through unchanged.
 */
function defaultSql(defaultValue: unknown): string {
  if (typeof defaultValue === 'string') return defaultValue;
  if (defaultValue && typeof defaultValue === 'object' && 'val' in defaultValue) {
    return String((defaultValue as { val: unknown }).val);
  }
  return String(defaultValue);
}

interface LegacyMigration {
  up: (queryInterface: Record<string, unknown>, sequelize: typeof Sequelize) => Promise<void>;
}

const CREATE_TABLE_CASES: Array<{ name: string; migration: LegacyMigration }> = [
  { name: 'products', migration: createProducts },
  { name: 'orders', migration: createOrders },
  { name: 'push_subscriptions', migration: createPushSubscriptions },
  { name: 'achievements', migration: createAchievements },
  { name: 'badges', migration: createBadges },
  { name: 'user_achievements', migration: createUserAchievements },
  { name: 'shipping_addresses', migration: createShippingAddresses },
  { name: 'delivery_providers', migration: createDeliveryProviders },
  { name: 'shipment_trackings', migration: createShipmentTrackings },
];

describe('Legacy migrations: PostgreSQL dialect scan (issue #358)', () => {
  describe('timestamp defaults must be PostgreSQL-compatible', () => {
    for (const { name, migration } of CREATE_TABLE_CASES) {
      it(`${name}.updated_at must not use MySQL "ON UPDATE CURRENT_TIMESTAMP"`, async () => {
        const { queryInterface, createdTables } = makeCaptureQueryInterface();
        await migration.up(queryInterface, Sequelize);

        const table = createdTables.get(name);
        expect(table).toBeDefined();
        const updatedAt = table!.attributes.updated_at;
        expect(updatedAt).toBeDefined();
        expect(defaultSql(updatedAt!.defaultValue)).not.toMatch(/ON UPDATE/i);
      });

      it(`${name}.updated_at default must be a Sequelize literal CURRENT_TIMESTAMP`, async () => {
        const { queryInterface, createdTables } = makeCaptureQueryInterface();
        await migration.up(queryInterface, Sequelize);

        const table = createdTables.get(name);
        const updatedAt = table!.attributes.updated_at;
        expect(defaultSql(updatedAt!.defaultValue)).toBe('CURRENT_TIMESTAMP');
      });

      it(`${name}.created_at default must be a Sequelize literal CURRENT_TIMESTAMP`, async () => {
        const { queryInterface, createdTables } = makeCaptureQueryInterface();
        await migration.up(queryInterface, Sequelize);

        const table = createdTables.get(name);
        const createdAt = table!.attributes.created_at;
        expect(createdAt).toBeDefined();
        expect(defaultSql(createdAt!.defaultValue)).toBe('CURRENT_TIMESTAMP');
      });
    }
  });

  describe('migration enums align with the Sequelize models', () => {
    it('products.platform enum must include the "other" value from the Product model', async () => {
      const { queryInterface, createdTables } = makeCaptureQueryInterface();
      await createProducts.up(queryInterface, Sequelize);

      const platform = createdTables.get('products')!.attributes.platform;
      const values = (platform!.type as { values?: string[] }).values ?? [];
      expect(values).toContain('other');
    });
  });
});
