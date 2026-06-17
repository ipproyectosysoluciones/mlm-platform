/**
 * @fileoverview Reports Controller Unit Tests
 * @description Tests for ReportsController, StatsController, and AnalyticsController
 * @module __tests__/unit/ReportsController
 */

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../models', () => ({
  User: {
    count: jest.fn(),
    sum: jest.fn(),
    findAll: jest.fn(),
    sequelize: {
      fn: jest.fn().mockReturnValue('SUM(commission.amount)'),
      col: jest.fn().mockReturnValue('commission.amount'),
    },
  },
  Commission: {
    findAll: jest.fn(),
    sum: jest.fn(),
    findOne: jest.fn(),
  },
  Purchase: {
    sum: jest.fn(),
  },
}));

jest.mock('../../services/CRMService', () => ({
  crmService: {
    getCRMStats: jest.fn(),
    getAnalyticsReport: jest.fn(),
    getCRMAlerts: jest.fn(),
    exportAnalyticsReport: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { getGlobalStats, getCommissionsReport } from '../../controllers/admin/StatsController';
import {
  getCRMStats,
  getAnalyticsReport,
  getCRMAlerts,
  exportAnalyticsReport,
} from '../../controllers/crm/AnalyticsController';
import { crmService } from '../../services/CRMService';
import { User, Commission, Purchase } from '../../models';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: 'admin-id', role: 'admin' },
    next: jest.fn(),
    ...overrides,
  } as any;
}

function makeRes() {
  const mockRes: any = {
    _status: 200,
    _json: null,
    _sent: false,
    _data: null,
    _headers: {},
    status: function (code: number) {
      this._status = code;
      return this;
    },
    json: function (data: any) {
      this._json = data;
      return this;
    },
    send: function (data: any) {
      this._sent = true;
      this._data = data;
      return this;
    },
    setHeader: function (key: string, val: string) {
      this._headers[key] = val;
      return this;
    },
  };
  return mockRes;
}

// ── getGlobalStats Tests ─────────────────────────────────────────────────────

describe('StatsController - getGlobalStats', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns global platform stats', async () => {
    (User.count as jest.Mock)
      .mockResolvedValueOnce(100) // totalUsers
      .mockResolvedValueOnce(80) // activeUsers
      .mockResolvedValueOnce(20) // inactiveUsers
      .mockResolvedValueOnce(45) // leftCount
      .mockResolvedValueOnce(55); // rightCount
    (Commission.sum as jest.Mock).mockResolvedValue(5000);
    (Purchase.sum as jest.Mock).mockResolvedValue(100000);
    (User.findAll as jest.Mock).mockResolvedValue([
      { id: '1', email: 'user@test.com', level: 1, status: 'active', createdAt: new Date() },
    ]);

    const req = makeReq();
    const res = makeRes();

    await getGlobalStats(req, res);

    expect(res._json).toMatchObject({
      success: true,
      data: expect.objectContaining({
        totalUsers: 100,
        activeUsers: 80,
        inactiveUsers: 20,
        leftCount: 45,
        rightCount: 55,
        totalCommissions: 5000,
        totalPurchases: 100000,
      }),
    });
  });

  it('handles null sums gracefully', async () => {
    (User.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    (Commission.sum as jest.Mock).mockResolvedValue(null);
    (Purchase.sum as jest.Mock).mockResolvedValue(null);
    (User.findAll as jest.Mock).mockResolvedValue([]);

    const req = makeReq();
    const res = makeRes();

    await getGlobalStats(req, res);

    expect(res._json).toMatchObject({
      success: true,
      data: expect.objectContaining({ totalCommissions: 0, totalPurchases: 0 }),
    });
  });

  it('returns 500 on error', async () => {
    (User.count as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = makeReq();
    const res = makeRes();

    await getGlobalStats(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    });
  });
});

// ── getCommissionsReport Tests ───────────────────────────────────────────────

describe('StatsController - getCommissionsReport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns commissions report with byType aggregation', async () => {
    const mockCommissions = [
      {
        id: 'c1',
        type: 'direct',
        amount: 100,
        status: 'pending',
        user: { email: 'user@test.com' },
        fromUser: { email: 'referrer@test.com' },
        createdAt: new Date(),
      },
    ];
    (Commission.findAll as jest.Mock)
      .mockResolvedValueOnce(mockCommissions)
      .mockResolvedValueOnce([{ type: 'direct', total: '500' }]);

    const req = makeReq({ query: { startDate: '2024-01-01', endDate: '2024-12-31' } });
    const res = makeRes();

    await getCommissionsReport(req, res);

    expect(res._json).toMatchObject({
      success: true,
      data: expect.objectContaining({
        commissions: expect.any(Array),
        byType: expect.any(Array),
      }),
    });
  });

  it('returns commissions report filtered by type', async () => {
    (Commission.findAll as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const req = makeReq({ query: { type: 'direct' } });
    const res = makeRes();

    await getCommissionsReport(req, res);

    expect(res._json).toMatchObject({ success: true });
  });

  it('returns commissions report with default limit 100', async () => {
    (Commission.findAll as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const req = makeReq({ query: {} });
    const res = makeRes();

    await getCommissionsReport(req, res);

    expect(res._json).toMatchObject({ success: true });
  });

  it('returns 500 on error', async () => {
    (Commission.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = makeReq({ query: {} });
    const res = makeRes();

    await getCommissionsReport(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toMatchObject({
      success: false,
      error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    });
  });
});

// ── getCRMStats Tests ───────────────────────────────────────────────────────

describe('AnalyticsController - getCRMStats', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns CRM stats for user', async () => {
    const mockStats = { total: 10, byStatus: {}, bySource: {}, conversionRate: 0.5 };
    (crmService.getCRMStats as jest.Mock).mockResolvedValue(mockStats);

    const req = makeReq({ user: { id: 'user-123', role: 'admin' } });
    const res = makeRes();

    await getCRMStats(req, res);

    expect(crmService.getCRMStats).toHaveBeenCalledWith('user-123');
    expect(res._json).toMatchObject({ success: true, data: mockStats });
  });
});

// ── getAnalyticsReport Tests ─────────────────────────────────────────────────

describe('AnalyticsController - getAnalyticsReport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns analytics report with default period month', async () => {
    const mockReport = { period: 'month', total: 100 };
    (crmService.getAnalyticsReport as jest.Mock).mockResolvedValue(mockReport);

    const req = makeReq({ query: {} });
    const res = makeRes();

    await getAnalyticsReport(req, res);

    expect(crmService.getAnalyticsReport).toHaveBeenCalledWith(
      'admin-id',
      expect.objectContaining({ period: 'month' })
    );
    expect(res._json).toMatchObject({ success: true, data: mockReport });
  });

  it('returns analytics report with custom period and date range', async () => {
    const mockReport = { period: 'custom', total: 200 };
    (crmService.getAnalyticsReport as jest.Mock).mockResolvedValue(mockReport);

    const req = makeReq({
      query: { period: 'custom', dateFrom: '2024-01-01', dateTo: '2024-12-31' },
    });
    const res = makeRes();

    await getAnalyticsReport(req, res);

    expect(crmService.getAnalyticsReport).toHaveBeenCalledWith(
      'admin-id',
      expect.objectContaining({
        period: 'custom',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      })
    );
  });

  it('returns analytics report for week period', async () => {
    const mockReport = { period: 'week', total: 50 };
    (crmService.getAnalyticsReport as jest.Mock).mockResolvedValue(mockReport);

    const req = makeReq({ query: { period: 'week' } });
    const res = makeRes();

    await getAnalyticsReport(req, res);

    expect(crmService.getAnalyticsReport).toHaveBeenCalledWith(
      'admin-id',
      expect.objectContaining({ period: 'week' })
    );
  });
});

// ── getCRMAlerts Tests ──────────────────────────────────────────────────────

describe('AnalyticsController - getCRMAlerts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns CRM alerts with default daysInactive', async () => {
    const mockAlerts = [{ type: 'inactive_lead', count: 5 }];
    (crmService.getCRMAlerts as jest.Mock).mockResolvedValue(mockAlerts);

    const req = makeReq({ query: {} });
    const res = makeRes();

    await getCRMAlerts(req, res);

    expect(crmService.getCRMAlerts).toHaveBeenCalledWith('admin-id', 7);
    expect(res._json).toMatchObject({ success: true, data: mockAlerts });
  });

  it('returns CRM alerts with custom daysInactive', async () => {
    (crmService.getCRMAlerts as jest.Mock).mockResolvedValue([]);

    const req = makeReq({ query: { daysInactive: '14' } });
    const res = makeRes();

    await getCRMAlerts(req, res);

    expect(crmService.getCRMAlerts).toHaveBeenCalledWith('admin-id', 14);
  });
});

// ── exportAnalyticsReport Tests ─────────────────────────────────────────────

describe('AnalyticsController - exportAnalyticsReport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exports analytics report as CSV', async () => {
    const mockCsv = 'period,total\nmonth,100\n';
    (crmService.exportAnalyticsReport as jest.Mock).mockResolvedValue(mockCsv);

    const req = makeReq({ query: {} });
    const res = makeRes();

    await exportAnalyticsReport(req, res);

    expect(res._headers).toMatchObject({ 'Content-Type': 'text/csv' });
    expect(res._headers['Content-Disposition']).toContain('crm-analytics-');
    expect(res._data).toBe(mockCsv);
  });

  it('exports CSV with custom date range', async () => {
    const mockCsv = 'period,total\ncustom,200\n';
    (crmService.exportAnalyticsReport as jest.Mock).mockResolvedValue(mockCsv);

    const req = makeReq({
      query: { period: 'custom', dateFrom: '2024-01-01', dateTo: '2024-06-30' },
    });
    const res = makeRes();

    await exportAnalyticsReport(req, res);

    expect(crmService.exportAnalyticsReport).toHaveBeenCalledWith(
      'admin-id',
      expect.objectContaining({
        period: 'custom',
        dateFrom: '2024-01-01',
        dateTo: '2024-06-30',
      })
    );
  });
});
