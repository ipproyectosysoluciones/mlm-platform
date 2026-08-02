/**
 * @fileoverview Migration runner mechanism tests — sequelize-cli under Node ESM
 * @description PR 0 (infra) of the wallet-integration change. The backend
 *              package.json declares `"type": "module"`, so the legacy CommonJS
 *              `.sequelizerc` crashed with `ReferenceError: require is not
 *              defined in ES module scope` and sequelize-cli could not require()
 *              the CommonJS migration files either. The fix:
 *                1. `.sequelizerc.json` (JSON) replaces the broken rc file and is
 *                   passed to the CLI via `--options-path`.
 *                2. `backend/database/package.json` (`{"type":"commonjs"}`)
 *                   scopes the migrations directory as CommonJS so Node loads
 *                   the CJS migrations as CJS even inside the ESM package.
 *              These tests prove: the runner options load, every real migration
 *              loads as CJS from a spawned Node process, and the CLI can apply,
 *              idempotently re-run, and undo a CJS migration against the test
 *              database (apply → idempotent → down).
 *
 * @module __tests__/unit/migrations/migration-runner-esm
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
const FIXTURE_MIGRATIONS_DIR = path.join(__dirname, 'fixtures', 'migrations');
const FIXTURE_MIGRATION_FILE = '20260801999999-migration-runner-probe.js';

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * Runtime DB connection settings: honour the explicit test overrides first,
 * fall back to the CI unit-test env vars (DB_*), then to the repository's
 * database/config/config.json `test` block values.
 */
function runtimeDbConfig(): DbConfig {
  return {
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.TEST_DB_PORT || process.env.DB_PORT || '5434'),
    user: process.env.TEST_DB_USER || process.env.DB_USER || 'mlm',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'mlm123',
    database: process.env.TEST_DB_NAME || process.env.DB_NAME || 'mlm_test',
  };
}

/** Synchronous TCP reachability probe — lets us skip the PG suite when no test DB exists. */
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

/** Runs the real sequelize-cli binary (Node subprocess) from the backend package. */
function runCli(args: string[]): CliResult {
  const result = spawnSync(process.execPath, [SEQUELIZE_CLI_BIN, ...args], {
    cwd: BACKEND_ROOT,
    env: { ...process.env, NODE_ENV: 'test' },
    encoding: 'utf8',
    timeout: 60000,
  });
  return { status: result.status, stdout: result.stdout || '', stderr: result.stderr || '' };
}

interface RunnerOptions {
  dir: string;
  optionsPath: string;
}

/**
 * Builds a temporary `--options-path` JSON (absolute paths, like the sanctioned
 * workaround) pointing at a runtime-generated DB config and the fixture
 * migrations directory.
 */
function makeTempRunnerOptions(): RunnerOptions {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mlm-migration-runner-'));
  const db = runtimeDbConfig();
  const configPath = path.join(dir, 'config.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      test: {
        username: db.user,
        password: db.password,
        database: db.database,
        host: db.host,
        port: db.port,
        dialect: 'postgres',
        logging: false,
      },
    })
  );
  const optionsPath = path.join(dir, 'options.json');
  fs.writeFileSync(
    optionsPath,
    JSON.stringify({
      config: configPath,
      'migrations-path': FIXTURE_MIGRATIONS_DIR,
      'seeders-path': path.join(BACKEND_ROOT, 'database', 'seeders'),
      'models-path': path.join(BACKEND_ROOT, 'src', 'models'),
    })
  );
  return { dir, optionsPath };
}

async function withPg<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client(runtimeDbConfig());
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

describe('migration runner (sequelize-cli under Node ESM)', () => {
  describe('runner options file (.sequelizerc.json replaces the ESM-broken rc file)', () => {
    const optionsPath = path.join(BACKEND_ROOT, '.sequelizerc.json');

    it('provides a JSON options file that sequelize-cli can require() under the ESM package', () => {
      expect(fs.existsSync(optionsPath)).toBe(true);
    });

    it('removes the legacy CommonJS .sequelizerc that crashes with "require is not defined"', () => {
      expect(fs.existsSync(path.join(BACKEND_ROOT, '.sequelizerc'))).toBe(false);
    });

    it('references existing paths (config, migrations, seeders, models)', () => {
      const opts = JSON.parse(fs.readFileSync(optionsPath, 'utf8')) as Record<string, string>;
      for (const key of ['config', 'migrations-path', 'seeders-path', 'models-path']) {
        expect(opts[key]).toBeTruthy();
        expect(fs.existsSync(path.join(BACKEND_ROOT, opts[key]))).toBe(true);
      }
    });

    it('keeps a DB config with a test environment for NODE_ENV=test', () => {
      const configPath = path.join(BACKEND_ROOT, 'database', 'config', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;
      expect(config.test).toBeDefined();
    });
  });

  describe('migration files load as CommonJS inside the ESM package', () => {
    it('scopes backend/database as CommonJS via database/package.json', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(BACKEND_ROOT, 'database', 'package.json'), 'utf8')
      ) as { type?: string };
      expect(pkg.type).toBe('commonjs');
    });

    it('loads every real migration from backend/database/migrations in a spawned Node process', () => {
      const script = [
        'const fs = require("node:fs");',
        'const path = require("node:path");',
        'const dir = process.argv[1];',
        'const files = fs.readdirSync(dir).filter((f) => /^(?!.*\\.d\\.ts$).*\\.(cjs|js|cts|ts)$/.test(f)).sort();',
        'for (const f of files) {',
        '  const mod = require(path.join(dir, f));',
        "  if (typeof mod.up !== 'function' || typeof mod.down !== 'function') {",
        "    throw new Error('migration ' + f + ' must export up() and down()');",
        '  }',
        '}',
        "console.log('loaded ' + files.length + ' migrations from ' + dir);",
      ].join('\n');
      const result = spawnSync(
        process.execPath,
        ['--input-type=commonjs', '-e', script, REAL_MIGRATIONS_DIR],
        { cwd: BACKEND_ROOT, encoding: 'utf8', timeout: 30000 }
      );
      expect(result.status).toBe(0);
      expect(result.stderr || '').not.toMatch(
        /ReferenceError|ES module scope|require is not defined/i
      );
      expect(result.stdout || '').toMatch(/loaded \d+ migrations/);
    });
  });

  describe('sequelize-cli against the test database (apply → idempotent → down)', () => {
    const postgresReachable = postgresReachableSync();
    const pgTest = postgresReachable ? it : it.skip;
    const runnerOptions = makeTempRunnerOptions();

    beforeAll(async () => {
      if (!postgresReachable) return;
      // Remove residue from a previous failed run.
      await withPg(async (client) => {
        await client.query('DROP TABLE IF EXISTS "migration_runner_probe"');
        await client.query('DELETE FROM "SequelizeMeta" WHERE name = $1', [FIXTURE_MIGRATION_FILE]);
      });
    });

    afterAll(async () => {
      if (!postgresReachable) return;
      await withPg(async (client) => {
        await client.query('DROP TABLE IF EXISTS "migration_runner_probe"');
        await client.query('DELETE FROM "SequelizeMeta" WHERE name = $1', [FIXTURE_MIGRATION_FILE]);
      }).catch(() => {});
      fs.rmSync(runnerOptions.dir, { recursive: true, force: true });
    });

    pgTest('applies a CJS migration via --options-path without ESM errors', async () => {
      const result = runCli(['db:migrate', '--options-path', runnerOptions.optionsPath]);
      expect(result.status).toBe(0);
      expect(result.stderr).not.toMatch(/ReferenceError|ES module scope|require is not defined/i);
      await withPg(async (client) => {
        const { rows } = await client.query(
          "SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_runner_probe'"
        );
        expect(rows.length).toBe(1);
        const meta = await client.query('SELECT name FROM "SequelizeMeta" WHERE name = $1', [
          FIXTURE_MIGRATION_FILE,
        ]);
        expect(meta.rows.length).toBe(1);
      });
    });

    pgTest('is idempotent: a second db:migrate run executes nothing', async () => {
      const result = runCli(['db:migrate', '--options-path', runnerOptions.optionsPath]);
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/No migrations were executed/);
    });

    pgTest('rolls the migration back with db:migrate:undo (down)', async () => {
      const result = runCli(['db:migrate:undo', '--options-path', runnerOptions.optionsPath]);
      expect(result.status).toBe(0);
      await withPg(async (client) => {
        const { rows } = await client.query(
          "SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_runner_probe'"
        );
        expect(rows.length).toBe(0);
        const meta = await client.query('SELECT name FROM "SequelizeMeta" WHERE name = $1', [
          FIXTURE_MIGRATION_FILE,
        ]);
        expect(meta.rows.length).toBe(0);
      });
    });
  });
});
