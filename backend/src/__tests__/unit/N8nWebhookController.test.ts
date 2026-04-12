/**
 * @fileoverview N8nWebhookController Unit Tests — POST /webhooks/internal/n8n-action
 * @description Tests for the n8n-action webhook endpoint handler:
 *   400 missing fields, 201 new execution, 200 idempotent, 422 unknown lead.
 *
 * ES: Pruebas para el handler del endpoint webhook n8n-action:
 *   400 campos faltantes, 201 nueva ejecución, 200 idempotente, 422 lead desconocido.
 *
 * @module __tests__/unit/N8nWebhookController
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
  WorkflowExecution: { findOrCreate: jest.fn(), findOne: jest.fn() },
  Lead: { findByPk: jest.fn() },
}));

/**
 * Shared mock for processN8nAction — configured per test.
 * Mock compartido para processN8nAction — configurado por test.
 */
const mockProcessN8nAction = jest.fn();

jest.mock('../../services/WorkflowService', () => {
  /**
   * Real LeadNotFoundError so instanceof works in the controller.
   * LeadNotFoundError real para que instanceof funcione en el controller.
   */
  class LeadNotFoundError extends Error {
    constructor(leadId: string) {
      super(`Lead not found: ${leadId}`);
      this.name = 'LeadNotFoundError';
    }
  }
  return {
    LeadNotFoundError,
    WorkflowService: jest.fn().mockImplementation(() => ({
      processN8nAction: mockProcessN8nAction,
    })),
  };
});

// ── Imports ───────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { handleN8nAction } from '../../controllers/N8nWebhookController';
import { LeadNotFoundError } from '../../services/WorkflowService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEAD_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const EXEC_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const N8N_EXEC_ID = 'exec_abc123';

function buildValidBody(overrides: Record<string, unknown> = {}) {
  return {
    leadId: LEAD_UUID,
    workflowName: 'schedule-visit',
    actionType: 'visit_scheduled',
    n8nExecutionId: N8N_EXEC_ID,
    status: 'success',
    ...overrides,
  };
}

function buildMockRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function buildMockReq(body: Record<string, unknown> = {}): Request {
  return { body } as Request;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('handleN8nAction controller', () => {
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-1.11a: 400 — Missing required fields
  // ──────────────────────────────────────────────────────────────────────────
  describe('400 — validation', () => {
    it('should return 400 when leadId is missing', async () => {
      const req = buildMockReq(buildValidBody({ leadId: undefined }));
      const res = buildMockRes();

      await handleN8nAction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should return 400 when n8nExecutionId is missing', async () => {
      const req = buildMockReq(buildValidBody({ n8nExecutionId: undefined }));
      const res = buildMockRes();

      await handleN8nAction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-1.11b: 201 — New execution created
  // ──────────────────────────────────────────────────────────────────────────
  describe('201 — new execution', () => {
    it('should return 201 with idempotent: false when execution is new', async () => {
      mockProcessN8nAction.mockResolvedValue({
        executionId: EXEC_UUID,
        leadId: LEAD_UUID,
        idempotent: false,
      });

      const req = buildMockReq(buildValidBody());
      const res = buildMockRes();

      await handleN8nAction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        executionId: EXEC_UUID,
        leadId: LEAD_UUID,
        idempotent: false,
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-1.11c: 200 — Idempotent duplicate
  // ──────────────────────────────────────────────────────────────────────────
  describe('200 — idempotent', () => {
    it('should return 200 with idempotent: true when execution is duplicate', async () => {
      mockProcessN8nAction.mockResolvedValue({
        executionId: EXEC_UUID,
        leadId: LEAD_UUID,
        idempotent: true,
      });

      const req = buildMockReq(buildValidBody());
      const res = buildMockRes();

      await handleN8nAction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        executionId: EXEC_UUID,
        leadId: LEAD_UUID,
        idempotent: true,
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-1.11d: 422 — Unknown lead
  // ──────────────────────────────────────────────────────────────────────────
  describe('422 — unknown lead', () => {
    it('should return 422 when WorkflowService throws LeadNotFoundError', async () => {
      mockProcessN8nAction.mockRejectedValue(new LeadNotFoundError('nonexistent-uuid'));

      const req = buildMockReq(buildValidBody({ leadId: 'nonexistent-uuid' }));
      const res = buildMockRes();

      await handleN8nAction(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Lead not found'),
        })
      );
    });
  });
});
