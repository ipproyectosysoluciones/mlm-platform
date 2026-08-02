/**
 * @fileoverview Unit tests for migration: add-destination-to-withdrawal-requests
 * @description Tests the column-add strategy on withdrawal_requests: destination JSONB
 *              plus gateway/notification tracking columns (gateway_payout_id,
 *              gateway_status, last_gateway_sync_at, last_notified_status,
 *              last_notified_at). Verifies the idempotency guard (IF NOT EXISTS),
 *              correct SQL types, and rollback (down).
 *
 * @module __tests__/unit/migrations/add-destination-withdrawal
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const migrationAddDestination = require('../../../../database/migrations/20260801000001-add-destination-to-withdrawal-requests');

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

/** Lower-cased SQL of every query issued, joined into one string for matching. */
function allSql(query: jest.Mock): string {
  return query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Migration: add-destination-to-withdrawal-requests', () => {
  describe('up()', () => {
    it('should execute SQL queries and commit on success', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();

      await migrationAddDestination.up(queryInterface, {});

      expect(query.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(commit).toHaveBeenCalledTimes(1);
      expect(rollback).not.toHaveBeenCalled();
    });

    it('should add destination JSONB column to withdrawal_requests', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationAddDestination.up(queryInterface, {});

      expect(allSql(query).toLowerCase()).toMatch(
        /alter table "withdrawal_requests".*add column.*"destination".*jsonb/i
      );
    });

    it('should add gateway_payout_id VARCHAR(191) column', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationAddDestination.up(queryInterface, {});

      expect(allSql(query).toLowerCase()).toMatch(
        /add column.*"gateway_payout_id".*varchar\(191\)/i
      );
    });

    it('should add gateway_status VARCHAR(50) column', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationAddDestination.up(queryInterface, {});

      expect(allSql(query).toLowerCase()).toMatch(/add column.*"gateway_status".*varchar\(50\)/i);
    });

    it('should add last_gateway_sync_at TIMESTAMPTZ column', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationAddDestination.up(queryInterface, {});

      expect(allSql(query).toLowerCase()).toMatch(
        /add column.*"last_gateway_sync_at".*timestamptz/i
      );
    });

    it('should add last_notified_status VARCHAR(50) column', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationAddDestination.up(queryInterface, {});

      expect(allSql(query).toLowerCase()).toMatch(
        /add column.*"last_notified_status".*varchar\(50\)/i
      );
    });

    it('should add last_notified_at TIMESTAMPTZ column', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationAddDestination.up(queryInterface, {});

      expect(allSql(query).toLowerCase()).toMatch(/add column.*"last_notified_at".*timestamptz/i);
    });

    it('should guard every ADD COLUMN with IF NOT EXISTS (idempotent)', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationAddDestination.up(queryInterface, {});

      const addColumnStatements = query.mock.calls
        .map((c: unknown[]) => (c[0] as string).toLowerCase())
        .filter((sql: string) => /add column/i.test(sql));

      // All six columns must be added with the idempotency guard so re-running
      // the migration against an already-migrated database does not fail.
      expect(addColumnStatements).toHaveLength(6);
      for (const sql of addColumnStatements) {
        expect(sql).toMatch(/add column if not exists/);
      }
    });

    it('should rollback and rethrow on error', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();
      query.mockRejectedValueOnce(new Error('DB error'));

      await expect(migrationAddDestination.up(queryInterface, {})).rejects.toThrow('DB error');

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });
  });

  describe('down()', () => {
    it('should execute SQL queries and commit on success', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();

      await migrationAddDestination.down(queryInterface, {});

      expect(query.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(commit).toHaveBeenCalledTimes(1);
      expect(rollback).not.toHaveBeenCalled();
    });

    it('should drop all six columns with IF EXISTS (idempotent rollback)', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationAddDestination.down(queryInterface, {});

      const dropColumnStatements = query.mock.calls
        .map((c: unknown[]) => (c[0] as string).toLowerCase())
        .filter((sql: string) => /drop column/i.test(sql));

      expect(dropColumnStatements).toHaveLength(6);
      for (const sql of dropColumnStatements) {
        expect(sql).toMatch(/drop column if exists/);
      }

      const sql = allSql(query).toLowerCase();
      expect(sql).toMatch(/drop column.*"destination"/);
      expect(sql).toMatch(/drop column.*"gateway_payout_id"/);
      expect(sql).toMatch(/drop column.*"gateway_status"/);
      expect(sql).toMatch(/drop column.*"last_gateway_sync_at"/);
      expect(sql).toMatch(/drop column.*"last_notified_status"/);
      expect(sql).toMatch(/drop column.*"last_notified_at"/);
    });

    it('should rollback and rethrow on error', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();
      query.mockRejectedValueOnce(new Error('Rollback fail'));

      await expect(migrationAddDestination.down(queryInterface, {})).rejects.toThrow(
        'Rollback fail'
      );

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });
  });
});
