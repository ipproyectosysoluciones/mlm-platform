/**
 * @fileoverview AutomationController Unit Tests — GET /api/crm/automation/*
 * @description Tests for the CRM automation status and executions endpoints.
 *
 * ES: Pruebas para los endpoints de estado y ejecuciones de automatización CRM.
 * EN: Tests for the CRM automation status and executions endpoints.
 *
 * @module __tests__/unit/AutomationController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../config/database', () => ({
  sequelize: { query: jest.fn() },
}));

jest.mock('../../models', () => ({
  WorkflowExecution: {
    count: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  Lead: { findByPk: jest.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  getAutomationStatus,
  getAutomationExecutions,
} from '../../controllers/crm/AutomationController';
import { WorkflowExecution } from '../../models';

// ── Helpers ───────────────────────────────────────────────────────────────────

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: 'user-uuid', email: 'admin@test.com', role: 'admin' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

function createMockNext() {
  return jest.fn();
}

/** Flush microtasks (asyncHandler compat) */
function flushPromises() {
  return new Promise<void>((resolve) => process.nextTick(resolve));
}

// ── Tests: getAutomationStatus ────────────────────────────────────────────────

describe('AutomationController - getAutomationStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return automation status with totalExecutions, pendingFollowUps, and lastActionAt', async () => {
    const mockCount = WorkflowExecution.count as jest.Mock;
    const mockFindOne = WorkflowExecution.findOne as jest.Mock;

    // Total executions
    mockCount.mockResolvedValueOnce(42);
    // Pending follow-ups (status: 'pending')
    mockCount.mockResolvedValueOnce(3);
    // Last action
    mockFindOne.mockResolvedValueOnce({ createdAt: new Date('2026-04-12T18:00:00Z') });

    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    await getAutomationStatus(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        totalExecutions: 42,
        pendingFollowUps: 3,
        lastActionAt: new Date('2026-04-12T18:00:00Z'),
      },
    });
  });

  it('should return zero-state when no executions exist', async () => {
    const mockCount = WorkflowExecution.count as jest.Mock;
    const mockFindOne = WorkflowExecution.findOne as jest.Mock;

    mockCount.mockResolvedValueOnce(0);
    mockCount.mockResolvedValueOnce(0);
    mockFindOne.mockResolvedValueOnce(null);

    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    await getAutomationStatus(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        totalExecutions: 0,
        pendingFollowUps: 0,
        lastActionAt: null,
      },
    });
  });
});

// ── Tests: getAutomationExecutions ────────────────────────────────────────────

describe('AutomationController - getAutomationExecutions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated executions with default page=1, limit=20', async () => {
    const mockFindAndCountAll = WorkflowExecution.findAndCountAll as jest.Mock;

    const mockRows = [
      {
        id: 'exec-1',
        leadId: 'lead-1',
        workflowName: 'schedule-visit',
        actionType: 'visit_scheduled',
        status: 'success',
        createdAt: new Date('2026-04-12T17:00:00Z'),
        Lead: { contactName: 'John Doe', contactPhone: '+5491155556666' },
      },
      {
        id: 'exec-2',
        leadId: 'lead-2',
        workflowName: 'human-handoff',
        actionType: 'status_changed',
        status: 'success',
        createdAt: new Date('2026-04-12T16:00:00Z'),
        Lead: { contactName: 'Jane Smith', contactPhone: '+5491177778888' },
      },
    ];

    mockFindAndCountAll.mockResolvedValueOnce({ rows: mockRows, count: 50 });

    const req = createMockReq({ query: {} });
    const res = createMockRes();
    const next = createMockNext();

    await getAutomationExecutions(req, res, next);

    // Verify findAndCountAll called with correct pagination
    expect(mockFindAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
        offset: 0,
        order: [['createdAt', 'DESC']],
      })
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockRows,
      total: 50,
      page: 1,
      limit: 20,
    });
  });

  it('should respect custom page and limit query params', async () => {
    const mockFindAndCountAll = WorkflowExecution.findAndCountAll as jest.Mock;

    mockFindAndCountAll.mockResolvedValueOnce({ rows: [], count: 50 });

    const req = createMockReq({ query: { page: '3', limit: '10' } });
    const res = createMockRes();
    const next = createMockNext();

    await getAutomationExecutions(req, res, next);

    expect(mockFindAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 20, // (page 3 - 1) * 10
      })
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
      total: 50,
      page: 3,
      limit: 10,
    });
  });

  it('should clamp limit to max 100 to prevent abuse', async () => {
    const mockFindAndCountAll = WorkflowExecution.findAndCountAll as jest.Mock;

    mockFindAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });

    const req = createMockReq({ query: { page: '1', limit: '9999' } });
    const res = createMockRes();
    const next = createMockNext();

    await getAutomationExecutions(req, res, next);

    expect(mockFindAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 100,
      })
    );
  });
});
