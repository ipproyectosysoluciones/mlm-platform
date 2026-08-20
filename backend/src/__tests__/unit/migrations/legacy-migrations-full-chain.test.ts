/**
 * @fileoverview Integration tests: the full legacy migration chain runs end-to-end on PostgreSQL
 * @description PR 0b of the wallet-integration change (issue #358). `db:migrate` was blocked by
 *              17 legacy migrations written in MySQL dialect — the first one
 *              (`create-products`) aborts with a PostgreSQL syntax error on
 *              `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`.
 *
 *              This test spawns the real sequelize-cli against a clean temporary PostgreSQL
 *              database and proves the whole chain applies in order, is idempotent, rolls back,
 *              and produces a schema aligned with the Sequelize models.
 *
 *              NOTE — base tables: this repository has never had create-migrations for the core
 *              tables (users, purchases, commissions, commission_configs, leads,
 *              withdrawal_requests); they are created by `sequelize.sync()` at app startup
 *              (commit 0a82a08 even deleted 28 migrations). The migration chain is therefore
 *              partial by design and runs on top of a sync-created base schema. The test
 *              bootstraps exactly those base tables (with the columns the chain touches) to
 *              reproduce that state, then runs the real migrations.
 *
 * @module __tests__/unit/migrations/legacy-migrations-full-chain
 * @issue #358 — Fix 17 legacy MySQL migrations to PostgreSQL
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Client } from 'pg';

const BACKEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const SEQUELIZE_CLI_BIN = path.join(
  BACKEND_ROOT,
  'node_modules',
  'sequelize-cli',
  'lib',
  'sequelize'
);
const REAL_MIGRATIONS_DIR = path.join(BACKEND_ROOT, 'database', 'migrations');

const LEGACY_MIGRATION_FILES = [
  '20260325000001-create-products.js',
  '20260325000002-create-orders.js',
  '20260325000003-add-product-id-to-purchases.js',
  '20260326000001-update-orders-status-enum.js',
  '20260328062957-addBusinessTypeToPurchases.js',
  '20260331223551-create-push-subscriptions.js',
  '20260403120000-create-achievements.js',
  '20260403120001-create-badges.js',
  '20260403120002-create-user-achievements.js',
  '20260403120003-add-login-tracking-to-users.js',
  '20260404123835-add-shipping-fields-to-orders.js',
  '20260404123836-create-shipping-addresses.js',
  '20260404123837-create-delivery-providers.js',
  '20260404123838-create-shipment-trackings.js',
  '20260409000000-add-whatsapp-bot-source.js',
  '20260412000001-commission-type-to-varchar.js',
  '20260412000002-seed-unilevel-commission-configs.js',
  '20260801000001-add-destination-to-withdrawal-requests.js',
];

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

function runtimeDbConfig(): DbConfig {
  return {
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT || '5434'),
    user: process.env.TEST_DB_USER || process.env.DB_USER || 'mlm',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'mlm123',
    database: process.env.TEST_DB_NAME || process.env.DB_NAME || 'mlm_test',
  };
}

/** Maintenance connection (no target database) used to create/drop the temp database. */
function maintenanceConfig(): DbConfig {
  return { ...runtimeDbConfig(), database: 'postgres' };
}

function postgresReachableSync(): boolean {
  const { host, port } = runtimeDbConfig();
  const probe = spawnSync(
    process.execPath,
    [
      '--input-type=commonjs',
      '-e',
      [
        'const net = require("node:net");',
        `const socket = net.connect({ host: ${JSON.stringify(host)}, port: ${port} });`,
        'socket.setTimeout(3000);',
        "socket.once('connect', () => { socket.destroy(); process.exit(0); });",
        "socket.once('error', () => process.exit(1));",
        "socket.once('timeout', () => { socket.destroy(); process.exit(1); });",
      ].join('\n'),
    ],
    { timeout: 10000, encoding: 'utf8' }
  );
  return probe.status === 0;
}

interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runCli(args: string[]): CliResult {
  const result = spawnSync(process.execPath, [SEQUELIZE_CLI_BIN, ...args], {
    cwd: BACKEND_ROOT,
    env: { ...process.env, NODE_ENV: 'test' },
    encoding: 'utf8',
    timeout: 120000,
  });
  return { status: result.status, stdout: result.stdout || '', stderr: result.stderr || '' };
}

/**
 * Base schema the app normally creates via sequelize.sync() — see file header.
 * Columns are the minimal surface the migration chain touches.
 */
const BASE_SCHEMA_SQL = [
  'CREATE TABLE "users" ("id" UUID PRIMARY KEY);',
  'CREATE TABLE "purchases" ("id" UUID PRIMARY KEY);',
  'CREATE TABLE "commissions" ("id" UUID PRIMARY KEY, "type" VARCHAR(20) NOT NULL);',
  `CREATE TABLE "commission_configs" (
     "id" UUID PRIMARY KEY,
     "business_type" VARCHAR(50) NOT NULL,
     "level" VARCHAR(20) NOT NULL,
     "percentage" NUMERIC(10,4) NOT NULL,
     "is_active" BOOLEAN NOT NULL DEFAULT true,
     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   );`,
  `CREATE TYPE "enum_leads_source" AS ENUM ('website','referral','social','landing_page','manual','other');`,
  `CREATE TABLE "leads" ("id" UUID PRIMARY KEY, "source" "enum_leads_source" NOT NULL DEFAULT 'website');`,
  'CREATE TABLE "withdrawal_requests" ("id" UUID PRIMARY KEY);',
];

async function withPg<T>(config: DbConfig, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(config);
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

describe('legacy migration chain (17) runs end-to-end on PostgreSQL', () => {
  const postgresReachable = postgresReachableSync();
  const pgTest = postgresReachable ? it : it.skip;

  const tempDbName = `mlm_test_mig0b_${process.pid}_${Date.now()}`;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mlm-migration-chain-'));
  let tempOptionsPath = '';

  beforeAll(async () => {
    if (!postgresReachable) return;

    // 1. Clean temp database (drop leftovers from a crashed run, then recreate).
    await withPg(maintenanceConfig(), async (client) => {
      await client.query(`DROP DATABASE IF EXISTS "${tempDbName}" WITH (FORCE)`);
      await client.query(`CREATE DATABASE "${tempDbName}"`);
    });

    // 2. Bootstrap the base tables that sequelize.sync() normally creates.
    const tempDb = { ...runtimeDbConfig(), database: tempDbName };
    await withPg(tempDb, async (client) => {
      for (const statement of BASE_SCHEMA_SQL) {
        await client.query(statement);
      }
    });

    // 3. Temp --options-path pointing at the REAL migrations dir + the temp DB.
    const configPath = path.join(tempDir, 'config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        test: {
          username: tempDb.user,
          password: tempDb.password,
          database: tempDb.database,
          host: tempDb.host,
          port: tempDb.port,
          dialect: 'postgres',
          logging: false,
        },
      })
    );
    // 2b. Build a legacy-only migration snapshot (exclude marketplace migrations
    // (20260803*) so the chain assertion LEGACY_MIGRATION_FILES stays accurate).
    const LEGACY_MIGRATIONS_SNAPSHOT = path.join(tempDir, 'legacy-migrations');
    fs.mkdirSync(LEGACY_MIGRATIONS_SNAPSHOT, { recursive: true });
    for (const file of LEGACY_MIGRATION_FILES) {
      fs.copyFileSync(
        path.join(REAL_MIGRATIONS_DIR, file),
        path.join(LEGACY_MIGRATIONS_SNAPSHOT, file)
      );
    }

    tempOptionsPath = path.join(tempDir, 'options.json');
    fs.writeFileSync(
      tempOptionsPath,
      JSON.stringify({
        config: configPath,
        'migrations-path': LEGACY_MIGRATIONS_SNAPSHOT,
        'seeders-path': path.join(BACKEND_ROOT, 'database', 'seeders'),
        'models-path': path.join(BACKEND_ROOT, 'src', 'models'),
      })
    );
  });

  afterAll(async () => {
    if (!postgresReachable) return;
    await withPg(maintenanceConfig(), async (client) => {
      await client.query(`DROP DATABASE IF EXISTS "${tempDbName}" WITH (FORCE)`);
    }).catch(() => {});
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  pgTest('applies all 17 legacy migrations in order without PostgreSQL syntax errors', async () => {
    const result = runCli(['db:migrate', '--options-path', tempOptionsPath]);
    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/syntax error|ReferenceError|ES module scope/i);
    expect(result.stderr).not.toMatch(/ON UPDATE/i);

    await withPg({ ...runtimeDbConfig(), database: tempDbName }, async (client) => {
      const meta = await client.query('SELECT name FROM "SequelizeMeta" ORDER BY name');
      const applied = meta.rows.map((r: { name: string }) => r.name);
      expect(applied).toEqual(LEGACY_MIGRATION_FILES);

      // products.updated_at must not carry the MySQL ON UPDATE clause.
      const def = await client.query(
        `SELECT column_default FROM information_schema.columns
           WHERE table_name = 'products' AND column_name = 'updated_at'`
      );
      expect(def.rows[0].column_default).not.toMatch(/ON UPDATE/i);

      // orders.status enum must now be (pending, completed, failed) — the
      // MySQL-era changeColumn() no-ops on PG, the raw-SQL dance must not.
      const statusEnum = await client.query(
        `SELECT e.enumlabel FROM pg_enum e
           WHERE e.enumtypid = 'enum_orders_status'::regtype
           ORDER BY e.enumsortorder`
      );
      expect(statusEnum.rows.map((r: { enumlabel: string }) => r.enumlabel)).toEqual([
        'pending',
        'completed',
        'failed',
      ]);

      // orders.payment_method aligned with the Order model (4 values).
      const paymentEnum = await client.query(
        `SELECT e.enumlabel FROM pg_enum e
           WHERE e.enumtypid = 'enum_orders_payment_method'::regtype
           ORDER BY e.enumsortorder`
      );
      expect(paymentEnum.rows.map((r: { enumlabel: string }) => r.enumlabel)).toEqual([
        'manual',
        'simulated',
        'paypal',
        'mercadopago',
      ]);

      // commissions.type converted to VARCHAR(20).
      const commissionType = await client.query(
        `SELECT data_type, character_maximum_length FROM information_schema.columns
           WHERE table_name = 'commissions' AND column_name = 'type'`
      );
      expect(commissionType.rows[0].data_type).toBe('character varying');

      // whatsapp_bot added to enum_leads_source.
      const whatsapp = await client.query(
        `SELECT 1 FROM pg_enum e WHERE e.enumtypid = 'enum_leads_source'::regtype
           AND e.enumlabel = 'whatsapp_bot'`
      );
      expect(whatsapp.rows.length).toBe(1);

      // Seed migration inserted the 10 default unilevel rates.
      const seeded = await client.query(
        `SELECT count(*)::int AS n FROM "commission_configs" WHERE "business_type" = 'membresia'`
      );
      expect(seeded.rows[0].n).toBe(10);
    });
  });

  pgTest('is idempotent: a second db:migrate run executes nothing', async () => {
    const result = runCli(['db:migrate', '--options-path', tempOptionsPath]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/No migrations were executed/);
  });

  pgTest('rolls the last migration back with db:migrate:undo (down)', async () => {
    const result = runCli(['db:migrate:undo', '--options-path', tempOptionsPath]);
    expect(result.status).toBe(0);
    await withPg({ ...runtimeDbConfig(), database: tempDbName }, async (client) => {
      // The last migration is now the wallet one (20260801000001): its down()
      // drops the payout columns from withdrawal_requests.
      const walletCols = await client.query(
        `SELECT count(*)::int AS n FROM information_schema.columns
           WHERE table_name = 'withdrawal_requests'
             AND column_name IN ('destination', 'gateway_payout_id', 'gateway_status',
                                 'last_gateway_sync_at', 'last_notified_status', 'last_notified_at')`
      );
      expect(walletCols.rows[0].n).toBe(0);
      // The seed migration is no longer last, so its rows must still be there.
      const seeded = await client.query(
        `SELECT count(*)::int AS n FROM "commission_configs" WHERE "business_type" = 'membresia'`
      );
      expect(seeded.rows[0].n).toBe(10);
      const meta = await client.query('SELECT name FROM "SequelizeMeta"');
      expect(meta.rows.length).toBe(LEGACY_MIGRATION_FILES.length - 1);
    });
  });
});
