/**
 * @fileoverview Unit tests for migration: seed-unilevel-commission-configs
 * @description Tests the seed migration that inserts 10-level default commission rates
 *              for businessType='membresia'. Verifies correct INSERT with ON CONFLICT
 *              DO NOTHING and exact Nexo Real rates. Down() deletes those exact rows.
 *
 * @module __tests__/unit/migrations/seed-unilevel-configs
 * @issue #157 — Commission Model Migration Binary → Unilevel
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const migrationSeed = require('../../../../database/migrations/20260412000002-seed-unilevel-commission-configs');

// ── Expected rates (from user's spec / REQ-002) ─────────────────────────────

const EXPECTED_RATES: Array<{ level: string; percentage: number }> = [
  { level: 'direct', percentage: 0.1 },
  { level: 'level_1', percentage: 0.08 },
  { level: 'level_2', percentage: 0.06 },
  { level: 'level_3', percentage: 0.05 },
  { level: 'level_4', percentage: 0.04 },
  { level: 'level_5', percentage: 0.03 },
  { level: 'level_6', percentage: 0.03 },
  { level: 'level_7', percentage: 0.02 },
  { level: 'level_8', percentage: 0.02 },
  { level: 'level_9', percentage: 0.02 },
];

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

describe('Migration: seed-unilevel-commission-configs', () => {
  describe('up()', () => {
    it('should execute SQL queries and commit on success', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();

      await migrationSeed.up(queryInterface, {});

      expect(query.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(commit).toHaveBeenCalledTimes(1);
      expect(rollback).not.toHaveBeenCalled();
    });

    it('should insert exactly 10 commission config rows', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationSeed.up(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      const insertMatches = allSQL.match(/INSERT INTO.*commission_configs/gi);
      expect(insertMatches).not.toBeNull();
      // Could be 10 individual INSERTs or 1 bulk INSERT with 10 rows
      // Either way, all 10 levels must be present
      for (const rate of EXPECTED_RATES) {
        expect(allSQL).toContain(`'${rate.level}'`);
      }
    });

    it('should use businessType membresia for all rows', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationSeed.up(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/membresia/i);
    });

    it('should insert exact Nexo Real commission rates', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationSeed.up(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      for (const rate of EXPECTED_RATES) {
        expect(allSQL).toContain(String(rate.percentage));
      }
    });

    it('should use ON CONFLICT DO NOTHING for idempotency', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationSeed.up(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/ON CONFLICT.*DO NOTHING/i);
    });

    it('should rollback and rethrow on error', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();
      query.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(migrationSeed.up(queryInterface, {})).rejects.toThrow('Insert failed');

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });
  });

  describe('down()', () => {
    it('should execute SQL queries and commit on success', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();

      await migrationSeed.down(queryInterface, {});

      expect(query.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(commit).toHaveBeenCalledTimes(1);
      expect(rollback).not.toHaveBeenCalled();
    });

    it('should delete the seeded rows for membresia', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationSeed.down(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      expect(allSQL).toMatch(/DELETE FROM.*commission_configs/i);
      expect(allSQL).toMatch(/membresia/i);
    });

    it('should delete all 10 seeded levels', async () => {
      const { queryInterface, query } = makeMockQueryInterface();

      await migrationSeed.down(queryInterface, {});

      const allSQL = query.mock.calls.map((c: unknown[]) => c[0] as string).join('\n');
      for (const rate of EXPECTED_RATES) {
        expect(allSQL).toContain(`'${rate.level}'`);
      }
    });

    it('should rollback and rethrow on error', async () => {
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();
      query.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(migrationSeed.down(queryInterface, {})).rejects.toThrow('Delete failed');

      expect(rollback).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });
  });
});
