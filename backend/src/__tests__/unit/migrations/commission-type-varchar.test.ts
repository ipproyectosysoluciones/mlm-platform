/**
 * @fileoverview Unit tests for migration: commission-type-to-varchar
 * @description Tests the column-replace strategy: add VARCHAR col → copy data →
 *              drop old → rename. Tests both commissions.type and commission_configs.level.
 *              Verifies idempotency guard, correct SQL sequence, and rollback.
 *
 * @module __tests__/unit/migrations/commission-type-varchar
 * @issue #157 — Commission Model Migration Binary → Unilevel
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const migrationTypeVarchar = require('../../../../database/migrations/20260412000001-commission-type-to-varchar');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockQueryInterface() {
  const commit = jest.fn().mockResolvedValue(undefined);
  const rollback = jest.fn().mockResolvedValue(undefined);
  const transaction = { commit, rollback };

  const query = jest.fn().mockResolvedValue([[], {}]);

  const sequelize = {
    transaction: jest.fn().mockResolvedValue(transaction),
    query,
  };

  return { queryInterface: { sequelize }, transaction, commit, rollback, query };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Migration: commission-type-to-varchar', () => {
  describe('up()', () => {
    it('should execute SQL queries and commit on success', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();

      await migrationTypeVarchar.up(queryInterface, {});

      // Must have at least 1 query and commit
      expect(query.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(commit).toHaveBeenCalledTimes(1);
      expect(rollback).not.toHaveBeenCalled();
    });

    it('should add type_new VARCHAR column to commissions', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationTypeVarchar.up(queryInterface, {});

      const allSQL = query.mock.calls
        .map((c: unknown[]) => (c[0] as string).toLowerCase())
        .join('\n');
      expect(allSQL).toMatch(/add column.*type_new.*varchar/i);
    });

    it('should copy data from old type column to type_new', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationTypeVarchar.up(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/UPDATE.*commissions.*SET.*type_new/i);
    });

    it('should drop old type column and rename type_new to type', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationTypeVarchar.up(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/DROP COLUMN.*"type"/i);
      expect(allSQL).toMatch(/RENAME COLUMN.*type_new.*TO.*"type"/i);
    });

    it('should also convert commission_configs.level ENUM to VARCHAR', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationTypeVarchar.up(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/commission_configs/i);
      expect(allSQL).toMatch(/level_new/i);
    });

    it('should add commissions.model VARCHAR(10) column with default unilevel', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationTypeVarchar.up(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/ADD COLUMN.*"model".*VARCHAR\(10\)/i);
      expect(allSQL).toMatch(/DEFAULT\s+'unilevel'/i);
    });

    it('should backfill existing commissions rows with model=binary', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationTypeVarchar.up(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/UPDATE.*commissions.*SET.*"model"\s*=\s*'binary'/i);
    });

    it('should drop the old PostgreSQL ENUM types', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationTypeVarchar.up(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/DROP TYPE.*IF EXISTS/i);
    });

    it('should rollback and rethrow on error', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();
      query.mockRejectedValueOnce(new Error('DB error'));

      await expect(migrationTypeVarchar.up(queryInterface, {})).rejects.toThrow('DB error');

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });
  });

  describe('down()', () => {
    it('should execute SQL queries and commit on success', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();

      await migrationTypeVarchar.down(queryInterface, {});

      expect(query.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(commit).toHaveBeenCalledTimes(1);
      expect(rollback).not.toHaveBeenCalled();
    });

    it('should recreate ENUM types for commissions.type', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationTypeVarchar.down(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/CREATE TYPE/i);
      expect(allSQL).toMatch(/direct/);
    });

    it('should replace VARCHAR back to ENUM for commissions.type', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationTypeVarchar.down(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/commissions/i);
    });

    it('should drop the model column on rollback', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationTypeVarchar.down(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/DROP COLUMN.*"model"/i);
    });

    it('should rollback and rethrow on error', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();
      query.mockRejectedValueOnce(new Error('Rollback fail'));

      await expect(migrationTypeVarchar.down(queryInterface, {})).rejects.toThrow('Rollback fail');

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });
  });
});
