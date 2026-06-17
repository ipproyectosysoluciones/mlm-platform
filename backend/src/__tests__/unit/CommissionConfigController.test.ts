/**
 * @fileoverview CommissionConfig Controller Unit Tests
 * @description Tests for CommissionConfigWriteController and CommissionConfigReadController
 * @module __tests__/unit/CommissionConfigController
 */

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../models', () => ({
  CommissionConfig: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  createConfig,
  updateConfig,
  deleteConfig,
} from '../../controllers/commissions/CommissionConfigWriteController';
import {
  getAllConfigs,
  getConfigById,
  getActiveRates,
} from '../../controllers/commissions/CommissionConfigReadController';
import { CommissionConfig } from '../../models';

// ── Helpers ───────────────────────────────────────────────────────────────────

const flushMicrotasks = () => new Promise<void>((r) => setImmediate(r));

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: 'admin-id', role: 'admin' },
    ...overrides,
  } as any;
}

function makeRes() {
  const mockRes: any = {
    _status: 200,
    _json: null,
    status: function (code: number) {
      this._status = code;
      return this;
    },
    json: function (data: any) {
      this._json = data;
      return this;
    },
  };
  return mockRes;
}

// ── createConfig Tests ────────────────────────────────────────────────────────

describe('CommissionConfigWriteController - createConfig', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates config successfully', async () => {
    const mockConfig = {
      id: VALID_UUID,
      businessType: 'producto',
      level: 'direct',
      percentage: 0.1,
      isActive: true,
    };
    (CommissionConfig.findOne as jest.Mock).mockResolvedValue(null);
    (CommissionConfig.create as jest.Mock).mockResolvedValue(mockConfig);

    const req = makeReq({ body: { businessType: 'producto', level: 'direct', percentage: 0.1 } });
    const res = makeRes();

    await createConfig(req, res);

    expect(res._status).toBe(201);
    expect(res._json).toMatchObject({ success: true, data: mockConfig });
  });

  it('returns 400 for invalid businessType', async () => {
    const req = makeReq({ body: { businessType: 'invalid', level: 'direct', percentage: 0.1 } });
    const res = makeRes();

    await createConfig(req, res);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'INVALID_BUSINESS_TYPE' }),
    });
  });

  it('returns 400 for invalid level pattern', async () => {
    const req = makeReq({ body: { businessType: 'producto', level: 'invalid', percentage: 0.1 } });
    const res = makeRes();

    await createConfig(req, res);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'INVALID_LEVEL' }),
    });
  });

  it('returns 400 for percentage < 0', async () => {
    const req = makeReq({ body: { businessType: 'producto', level: 'direct', percentage: -0.1 } });
    const res = makeRes();

    await createConfig(req, res);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'INVALID_PERCENTAGE' }),
    });
  });

  it('returns 400 for percentage > 1', async () => {
    const req = makeReq({ body: { businessType: 'producto', level: 'direct', percentage: 1.5 } });
    const res = makeRes();

    await createConfig(req, res);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'INVALID_PERCENTAGE' }),
    });
  });

  it('returns 409 when config already exists', async () => {
    (CommissionConfig.findOne as jest.Mock).mockResolvedValue({ id: 'existing' });

    const req = makeReq({ body: { businessType: 'producto', level: 'direct', percentage: 0.1 } });
    const res = makeRes();

    await createConfig(req, res);

    expect(res._status).toBe(409);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'CONFIG_EXISTS' }),
    });
  });
});

// ── updateConfig Tests ────────────────────────────────────────────────────────

describe('CommissionConfigWriteController - updateConfig', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates config successfully', async () => {
    const mockConfig = { id: VALID_UUID, percentage: 0.1, isActive: true, save: jest.fn() };
    (CommissionConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

    const req = makeReq({ params: { id: VALID_UUID }, body: { percentage: 0.2 } });
    const res = makeRes();

    await updateConfig(req, res);

    expect(mockConfig.percentage).toBe(0.2);
    expect(mockConfig.save).toHaveBeenCalled();
    expect(res._json).toMatchObject({ success: true });
  });

  it('returns 404 when config not found', async () => {
    (CommissionConfig.findByPk as jest.Mock).mockResolvedValue(null);

    const req = makeReq({ params: { id: 'nonexistent' }, body: { percentage: 0.2 } });
    const res = makeRes();

    await updateConfig(req, res);

    expect(res._status).toBe(404);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'CONFIG_NOT_FOUND' }),
    });
  });

  it('returns 400 for invalid percentage on update', async () => {
    const mockConfig = { id: VALID_UUID, percentage: 0.1, save: jest.fn() };
    (CommissionConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

    const req = makeReq({ params: { id: VALID_UUID }, body: { percentage: 5 } });
    const res = makeRes();

    await updateConfig(req, res);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'INVALID_PERCENTAGE' }),
    });
  });
});

// ── deleteConfig Tests ────────────────────────────────────────────────────────

describe('CommissionConfigWriteController - deleteConfig', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes config successfully', async () => {
    const mockConfig = { id: VALID_UUID, destroy: jest.fn() };
    (CommissionConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

    const req = makeReq({ params: { id: VALID_UUID } });
    const res = makeRes();

    await deleteConfig(req, res);

    expect(mockConfig.destroy).toHaveBeenCalled();
    expect(res._json).toMatchObject({ success: true, data: null });
  });

  it('returns 404 when config not found', async () => {
    (CommissionConfig.findByPk as jest.Mock).mockResolvedValue(null);

    const req = makeReq({ params: { id: 'nonexistent' } });
    const res = makeRes();

    await deleteConfig(req, res);

    expect(res._status).toBe(404);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'CONFIG_NOT_FOUND' }),
    });
  });
});

// ── getAllConfigs Tests ───────────────────────────────────────────────────────

describe('CommissionConfigReadController - getAllConfigs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all configs ordered by businessType and level', async () => {
    const mockConfigs = [
      { id: '1', businessType: 'membresia', level: 'direct', percentage: 0.05 },
      { id: '2', businessType: 'producto', level: 'level_1', percentage: 0.1 },
    ];
    (CommissionConfig.findAll as jest.Mock).mockResolvedValue(mockConfigs);

    const req = makeReq({ query: {} });
    const res = makeRes();

    await getAllConfigs(req, res);

    expect(res._json).toMatchObject({ success: true, data: mockConfigs });
    expect(CommissionConfig.findAll).toHaveBeenCalledWith({
      order: [
        ['businessType', 'ASC'],
        ['level', 'ASC'],
      ],
    });
  });
});

// ── getConfigById Tests ───────────────────────────────────────────────────────

describe('CommissionConfigReadController - getConfigById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns config by id', async () => {
    const mockConfig = {
      id: VALID_UUID,
      businessType: 'producto',
      level: 'direct',
      percentage: 0.1,
    };
    (CommissionConfig.findByPk as jest.Mock).mockResolvedValue(mockConfig);

    const req = makeReq({ params: { id: VALID_UUID } });
    const res = makeRes();

    await getConfigById(req, res);

    expect(res._json).toMatchObject({ success: true, data: mockConfig });
  });

  it('returns 404 when config not found', async () => {
    (CommissionConfig.findByPk as jest.Mock).mockResolvedValue(null);

    const req = makeReq({ params: { id: 'nonexistent' } });
    const res = makeRes();

    await getConfigById(req, res);

    expect(res._status).toBe(404);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'CONFIG_NOT_FOUND' }),
    });
  });
});

// ── getActiveRates Tests ──────────────────────────────────────────────────────

describe('CommissionConfigReadController - getActiveRates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 for invalid businessType', async () => {
    const req = makeReq({ params: { businessType: 'invalid' } });
    const res = makeRes();

    await getActiveRates(req, res);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'INVALID_BUSINESS_TYPE' }),
    });
  });
});
