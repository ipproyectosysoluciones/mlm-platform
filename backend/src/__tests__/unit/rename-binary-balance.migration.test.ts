/**
 * @fileoverview Unit tests for migration 20260407000001-rename-binary-balance
 * @description Tests for up/down migration functions using a mocked queryInterface.
 *              Verifies that the correct SQL queries are executed in the correct order
 *              and that rollback is called on error.
 *
 *              Tests para las funciones up/down de la migracion usando queryInterface mockeado.
 *              Verifica que las queries SQL correctas se ejecutan en el orden correcto
 *              y que rollback se llama en caso de error.
 *
 * @module __tests__/unit/rename-binary-balance.migration
 * @sprint Sprint 6 - v2.2.0
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const migration = require('../../database/migrations/20260407000001-rename-binary-balance');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a mock queryInterface with a mock sequelize instance.
 * Construye un queryInterface simulado con una instancia de sequelize simulada.
 */
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

describe('Migration: 20260407000001-rename-binary-balance', () => {
  // ── up ──────────────────────────────────────────────────────────────────────

  describe('up()', () => {
    it('should execute 3 SQL queries and commit transaction', async () => {
      // Arrange / Preparar
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();

      // Act / Actuar
      await migration.up(queryInterface, {});

      // Assert - 3 queries: ADD VALUE, UPDATE rows, rename pg_enum
      expect(query).toHaveBeenCalledTimes(3);
      expect(commit).toHaveBeenCalledTimes(1);
      expect(rollback).not.toHaveBeenCalled();
    });

    it('should ADD VALUE network_balance as first query', async () => {
      // Arrange / Preparar
      const { queryInterface, query } = makeMockQueryInterface();

      // Act / Actuar
      await migration.up(queryInterface, {});

      // Assert - first call adds network_balance enum value
      const firstCall = query.mock.calls[0][0] as string;
      expect(firstCall).toMatch(/ADD VALUE IF NOT EXISTS 'network_balance'/i);
      expect(firstCall).toMatch(/enum_achievements_conditionType/);
    });

    it('should UPDATE rows binary_balance to network_balance as second query', async () => {
      // Arrange / Preparar
      const { queryInterface, query } = makeMockQueryInterface();

      // Act / Actuar
      await migration.up(queryInterface, {});

      // Assert - second call updates the existing rows
      const secondCall = query.mock.calls[1][0] as string;
      expect(secondCall).toMatch(/UPDATE achievements/i);
      expect(secondCall).toMatch(/'network_balance'/);
      expect(secondCall).toMatch(/WHERE.*'binary_balance'/);
    });

    it('should rename pg_enum label as third query', async () => {
      // Arrange / Preparar
      const { queryInterface, query } = makeMockQueryInterface();

      // Act / Actuar
      await migration.up(queryInterface, {});

      // Assert - third call renames the old pg_enum label
      const thirdCall = query.mock.calls[2][0] as string;
      expect(thirdCall).toMatch(/pg_catalog\.pg_enum/i);
      expect(thirdCall).toMatch(/'network_balance_deprecated'/);
    });

    it('should rollback and rethrow when a query fails', async () => {
      // Arrange / Preparar
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();
      const dbError = new Error('DB error');
      query.mockRejectedValueOnce(dbError);

      // Act / Actuar
      await expect(migration.up(queryInterface, {})).rejects.toThrow('DB error');

      // Assert - rollback was called, commit was not
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });
  });

  // ── down ────────────────────────────────────────────────────────────────────

  describe('down()', () => {
    it('should execute 2 SQL queries and commit transaction', async () => {
      // Arrange / Preparar
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();

      // Act / Actuar
      await migration.down(queryInterface, {});

      // Assert - 2 queries: restore pg_enum label, revert rows
      expect(query).toHaveBeenCalledTimes(2);
      expect(commit).toHaveBeenCalledTimes(1);
      expect(rollback).not.toHaveBeenCalled();
    });

    it('should restore binary_balance label from deprecated placeholder', async () => {
      // Arrange / Preparar
      const { queryInterface, query } = makeMockQueryInterface();

      // Act / Actuar
      await migration.down(queryInterface, {});

      // Assert - first call restores binary_balance from deprecated placeholder
      const firstCall = query.mock.calls[0][0] as string;
      expect(firstCall).toMatch(/pg_catalog\.pg_enum/i);
      expect(firstCall).toMatch(/'binary_balance'/);
      expect(firstCall).toMatch(/'network_balance_deprecated'/);
    });

    it('should revert migrated rows back to binary_balance', async () => {
      // Arrange / Preparar
      const { queryInterface, query } = makeMockQueryInterface();

      // Act / Actuar
      await migration.down(queryInterface, {});

      // Assert - second call reverts the rows
      const secondCall = query.mock.calls[1][0] as string;
      expect(secondCall).toMatch(/UPDATE achievements/i);
      expect(secondCall).toMatch(/'binary_balance'/);
      expect(secondCall).toMatch(/WHERE.*'network_balance'/);
    });

    it('should rollback and rethrow when a query fails', async () => {
      // Arrange / Preparar
      const { queryInterface, commit, rollback, query } = makeMockQueryInterface();
      const dbError = new Error('Rollback failed');
      query.mockRejectedValueOnce(dbError);

      // Act / Actuar
      await expect(migration.down(queryInterface, {})).rejects.toThrow('Rollback failed');

      // Assert - rollback was called, commit was not
      expect(rollback).toHaveBeenCalledTimes(1);
      expect(commit).not.toHaveBeenCalled();
    });
  });
});
