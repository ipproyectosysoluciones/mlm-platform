/**
 * @fileoverview WorkflowService Unit Tests — n8n inbound action processing
 * @description Tests for processN8nAction: idempotency, lead status sync, human-guard, unknown lead.
 *              Pruebas para processN8nAction: idempotencia, sincronización de estado, guardia humana, lead desconocido.
 * @module __tests__/unit/WorkflowService
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
  sequelize: {
    query: jest.fn(),
  },
}));

jest.mock('../../models', () => ({
  WorkflowExecution: {
    findOrCreate: jest.fn(),
    findOne: jest.fn(),
  },
  Lead: {
    findByPk: jest.fn(),
  },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { WorkflowService } from '../../services/WorkflowService';
import { WorkflowExecution, Lead } from '../../models';

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEAD_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const EXEC_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const N8N_EXEC_ID = 'exec_abc123';

interface MockExec {
  id: string;
  leadId: string;
  workflowName: string;
  actionType: string;
  n8nExecutionId: string;
  status: string;
  payload: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function buildMockExecution(overrides: Partial<MockExec> = {}): MockExec {
  return {
    id: EXEC_UUID,
    leadId: LEAD_UUID,
    workflowName: 'schedule-visit',
    actionType: 'visit_scheduled',
    n8nExecutionId: N8N_EXEC_ID,
    status: 'success',
    payload: {},
    errorMessage: null,
    createdAt: new Date('2026-04-12T10:00:00Z'),
    updatedAt: new Date('2026-04-12T10:00:00Z'),
    ...overrides,
  };
}

function buildMockLead(overrides: Record<string, unknown> = {}) {
  return {
    id: LEAD_UUID,
    status: 'new',
    automationStatus: 'manual',
    lastWorkflowActionId: null,
    updatedAt: new Date('2026-04-12T09:00:00Z'),
    save: jest.fn().mockImplementation(function (this: Record<string, unknown>) {
      return Promise.resolve(this);
    }),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    service = new WorkflowService();
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-1.5: processN8nAction — Idempotency
  // ──────────────────────────────────────────────────────────────────────────
  describe('processN8nAction() — idempotency', () => {
    it('should create a new WorkflowExecution and return idempotent: false', async () => {
      const mockExec = buildMockExecution();
      const mockLead = buildMockLead();

      (Lead.findByPk as jest.Mock).mockResolvedValue(mockLead);
      (WorkflowExecution.findOrCreate as jest.Mock).mockResolvedValue([mockExec, true]);

      const result = await service.processN8nAction({
        leadId: LEAD_UUID,
        workflowName: 'schedule-visit',
        actionType: 'visit_scheduled',
        n8nExecutionId: N8N_EXEC_ID,
        status: 'success',
      });

      expect(result.idempotent).toBe(false);
      expect(result.executionId).toBe(EXEC_UUID);
      expect(result.leadId).toBe(LEAD_UUID);
      expect(WorkflowExecution.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { leadId: LEAD_UUID, n8nExecutionId: N8N_EXEC_ID },
        })
      );
    });

    it('should return existing WorkflowExecution and idempotent: true on duplicate', async () => {
      const mockExec = buildMockExecution();
      const mockLead = buildMockLead();

      (Lead.findByPk as jest.Mock).mockResolvedValue(mockLead);
      (WorkflowExecution.findOrCreate as jest.Mock).mockResolvedValue([mockExec, false]);

      const result = await service.processN8nAction({
        leadId: LEAD_UUID,
        workflowName: 'schedule-visit',
        actionType: 'visit_scheduled',
        n8nExecutionId: N8N_EXEC_ID,
        status: 'success',
      });

      expect(result.idempotent).toBe(true);
      expect(result.executionId).toBe(EXEC_UUID);
      expect(result.leadId).toBe(LEAD_UUID);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-1.7: processN8nAction — Lead Status Sync + Human Guard
  // ──────────────────────────────────────────────────────────────────────────
  describe('processN8nAction() — lead status sync', () => {
    it('should update lead status when actionType is status_changed and no human edit in last 5 min', async () => {
      // Lead was last updated 10 minutes ago — safe to auto-update
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
      const mockLead = buildMockLead({
        status: 'new',
        automationStatus: 'manual',
        updatedAt: tenMinAgo,
      });
      const mockExec = buildMockExecution({
        actionType: 'status_changed',
        payload: { newStatus: 'contacted' },
      });

      (Lead.findByPk as jest.Mock).mockResolvedValue(mockLead);
      (WorkflowExecution.findOrCreate as jest.Mock).mockResolvedValue([mockExec, true]);

      await service.processN8nAction({
        leadId: LEAD_UUID,
        workflowName: 'lead-nurture',
        actionType: 'status_changed',
        n8nExecutionId: N8N_EXEC_ID,
        status: 'success',
        payload: { newStatus: 'contacted' },
      });

      expect(mockLead.save).toHaveBeenCalled();
      expect(mockLead.status).toBe('contacted');
      expect(mockLead.automationStatus).toBe('n8n');
      expect(mockLead.lastWorkflowActionId).toBe(EXEC_UUID);
    });

    it('should SKIP lead status update when human edited within last 5 min (human-guard)', async () => {
      // Lead was updated 2 minutes ago — human-guard blocks the automation
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
      const mockLead = buildMockLead({
        status: 'qualified',
        automationStatus: 'manual',
        updatedAt: twoMinAgo,
      });
      const mockExec = buildMockExecution({
        actionType: 'status_changed',
        payload: { newStatus: 'contacted' },
      });

      (Lead.findByPk as jest.Mock).mockResolvedValue(mockLead);
      (WorkflowExecution.findOrCreate as jest.Mock).mockResolvedValue([mockExec, true]);

      await service.processN8nAction({
        leadId: LEAD_UUID,
        workflowName: 'lead-nurture',
        actionType: 'status_changed',
        n8nExecutionId: N8N_EXEC_ID,
        status: 'success',
        payload: { newStatus: 'contacted' },
      });

      // Status should remain unchanged — human-guard blocked it
      expect(mockLead.status).toBe('qualified');
      expect(mockLead.save).not.toHaveBeenCalled();
    });

    it('should NOT update lead status when actionType is not status_changed', async () => {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
      const mockLead = buildMockLead({
        status: 'new',
        updatedAt: tenMinAgo,
      });
      const mockExec = buildMockExecution({ actionType: 'email_sent' });

      (Lead.findByPk as jest.Mock).mockResolvedValue(mockLead);
      (WorkflowExecution.findOrCreate as jest.Mock).mockResolvedValue([mockExec, true]);

      await service.processN8nAction({
        leadId: LEAD_UUID,
        workflowName: 'welcome-sequence',
        actionType: 'email_sent',
        n8nExecutionId: N8N_EXEC_ID,
        status: 'success',
      });

      // Status must remain 'new' — only status_changed should trigger an update
      expect(mockLead.status).toBe('new');
      expect(mockLead.save).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // T-1.9: processN8nAction — Unknown Lead
  // ──────────────────────────────────────────────────────────────────────────
  describe('processN8nAction() — unknown lead', () => {
    it('should throw LeadNotFoundError when lead does not exist', async () => {
      (Lead.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        service.processN8nAction({
          leadId: 'nonexistent-uuid',
          workflowName: 'schedule-visit',
          actionType: 'visit_scheduled',
          n8nExecutionId: N8N_EXEC_ID,
          status: 'success',
        })
      ).rejects.toThrow('Lead not found');

      // findOrCreate should never be called when lead doesn't exist
      expect(WorkflowExecution.findOrCreate).not.toHaveBeenCalled();
    });
  });
});
