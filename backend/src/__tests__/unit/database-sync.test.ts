/**
 * @fileoverview Unit tests for syncDatabase options (PR 0 infra)
 * @description syncDatabase accepted only a boolean (force). server.ts received
 *              `--alter` but ignored it (the log said "alter mode" while running
 *              sequelize.sync({ force: false })), and scripts/init-db.sh passed
 *              `{ alter: true }`, which was truthy → force → DROP TABLES. The
 *              new signature accepts `{ force?, alter? }` or a legacy boolean
 *              and forwards the exact options to sequelize.sync.
 *
 * @module __tests__/unit/database-sync
 */

import { sequelize, syncDatabase } from '../../config/database.js';

describe('syncDatabase options', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('forwards { alter: true } to sequelize.sync (--alter mode)', async () => {
    const syncSpy = jest.spyOn(sequelize, 'sync').mockResolvedValue(undefined as never);
    await syncDatabase({ alter: true });
    expect(syncSpy).toHaveBeenCalledWith({ alter: true });
  });

  it('maps the legacy boolean true to { force: true } (force-sync callers)', async () => {
    const syncSpy = jest.spyOn(sequelize, 'sync').mockResolvedValue(undefined as never);
    await syncDatabase(true);
    expect(syncSpy).toHaveBeenCalledWith({ force: true });
  });

  it('maps the legacy boolean false to an empty options object (create-if-missing)', async () => {
    const syncSpy = jest.spyOn(sequelize, 'sync').mockResolvedValue(undefined as never);
    await syncDatabase(false);
    expect(syncSpy).toHaveBeenCalledWith({});
  });

  it('defaults to create-if-missing (no force, no alter)', async () => {
    const syncSpy = jest.spyOn(sequelize, 'sync').mockResolvedValue(undefined as never);
    await syncDatabase();
    expect(syncSpy).toHaveBeenCalledWith({});
  });
});
