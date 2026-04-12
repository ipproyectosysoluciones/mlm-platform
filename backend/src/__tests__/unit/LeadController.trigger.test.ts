/**
 * @fileoverview Unit test for createLead → triggerLeadCreated wiring
 * @description Verifies that creating a lead via the controller fires the n8n
 *   outbound trigger in a fire-and-forget manner (does not block the 201 response).
 *
 * ES: Verifica que al crear un lead via el controlador se dispara el trigger
 *   outbound de n8n de forma fire-and-forget (no bloquea la respuesta 201).
 *
 * @module __tests__/unit/LeadController.trigger
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
  WorkflowExecution: { findOrCreate: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  Lead: { findByPk: jest.fn() },
}));

const mockCreateLead = jest.fn();
jest.mock('../../services/CRMService', () => ({
  crmService: {
    createLead: mockCreateLead,
  },
}));

const mockTriggerLeadCreated = jest.fn();
jest.mock('../../services/WorkflowService', () => ({
  WorkflowService: jest.fn().mockImplementation(() => ({
    triggerLeadCreated: mockTriggerLeadCreated,
  })),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { createLead } from '../../controllers/crm/LeadController';
import type { Request, Response } from 'express';

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEAD_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function buildReq(overrides: Record<string, unknown> = {}): Request {
  return {
    user: { id: 'user-uuid-001' },
    body: {
      contactName: 'Juan Pérez',
      contactEmail: 'juan@example.com',
    },
    ...overrides,
  } as unknown as Request;
}

function buildRes(): Response & { _statusCode: number; _json: unknown } {
  const res = {
    _statusCode: 200,
    _json: null,
    status(code: number) {
      res._statusCode = code;
      return res;
    },
    json(data: unknown) {
      res._json = data;
      return res;
    },
  };
  return res as unknown as Response & { _statusCode: number; _json: unknown };
}

/** Flush all pending microtasks (Promise callbacks) */
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LeadController.createLead — n8n trigger wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggerLeadCreated.mockResolvedValue(undefined);
  });

  it('should call triggerLeadCreated with the created lead after sending 201', async () => {
    const mockLead = {
      id: LEAD_UUID,
      contactName: 'Juan Pérez',
      contactEmail: 'juan@example.com',
      toJSON: () => ({ id: LEAD_UUID }),
    };
    mockCreateLead.mockResolvedValue(mockLead);

    const req = buildReq();
    const res = buildRes();

    await createLead(req as never, res as never);
    await flushPromises();

    // Response was sent with 201
    expect(res._statusCode).toBe(201);
    expect(res._json).toEqual({ success: true, data: mockLead });

    // Trigger was fired with the created lead
    expect(mockTriggerLeadCreated).toHaveBeenCalledTimes(1);
    expect(mockTriggerLeadCreated).toHaveBeenCalledWith(mockLead);
  });

  it('should still return 201 even if triggerLeadCreated throws', async () => {
    const mockLead = {
      id: LEAD_UUID,
      contactName: 'Juan Pérez',
      contactEmail: 'juan@example.com',
      toJSON: () => ({ id: LEAD_UUID }),
    };
    mockCreateLead.mockResolvedValue(mockLead);
    mockTriggerLeadCreated.mockRejectedValue(new Error('n8n down'));

    const req = buildReq();
    const res = buildRes();

    // createLead itself should not throw even if trigger fails
    await createLead(req as never, res as never);
    await flushPromises();

    expect(res._statusCode).toBe(201);
    expect(res._json).toEqual({ success: true, data: mockLead });
  });
});
