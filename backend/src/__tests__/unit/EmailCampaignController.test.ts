/**
 * @fileoverview EmailCampaignController Unit Tests
 * @description Tests for template CRUD endpoints, campaign CRUD endpoints, preview, send,
 *              schedule, pause, retry, and logs controller handlers.
 *              Pruebas para endpoints CRUD de templates, endpoints CRUD de campañas, preview, envío,
 *              programación, pausa, reintento y logs de controladores.
 * @module __tests__/unit/EmailCampaignController
 */

// ============================================
// MOCKS — Deben ir ANTES de los imports
// ============================================

const mockEmailCampaignService = {
  createTemplate: jest.fn(),
  listTemplates: jest.fn(),
  getTemplate: jest.fn(),
  deleteTemplate: jest.fn(),
  createCampaign: jest.fn(),
  listCampaigns: jest.fn(),
  getCampaign: jest.fn(),
  renderTemplate: jest.fn(),
  sendCampaign: jest.fn(),
  scheduleCampaign: jest.fn(),
  pauseCampaign: jest.fn(),
  retryFailedEmails: jest.fn(),
};

jest.mock('../../services/EmailCampaignService', () => ({
  emailCampaignService: mockEmailCampaignService,
}));

const mockEmailCampaignLogFindAndCountAll = jest.fn();
jest.mock('../../models', () => ({
  EmailCampaignLog: {
    findAndCountAll: mockEmailCampaignLogFindAndCountAll,
  },
}));

import { Response } from 'express';
import {
  createTemplate,
  listTemplates,
  getTemplate,
  deleteTemplate,
  createCampaign,
  getCampaign,
  sendCampaign,
  scheduleCampaign,
  retryFailedEmails,
  getCampaignLogs,
} from '../../controllers/EmailCampaignController';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

// ============================================
// TEST HELPERS — Helpers de Test
// ============================================

function createMockReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return {
    user: { id: 'user-uuid-1', email: 'admin@test.com', role: 'admin' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as unknown as AuthenticatedRequest;
}

function createMockRes(): Response & { _json: unknown; _status: number } {
  const res = {
    _json: null as unknown,
    _status: 200,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: unknown) {
      res._json = data;
      return res;
    },
  } as unknown as Response & { _json: unknown; _status: number };
  return res;
}

// ============================================
// TESTS
// ============================================

describe('EmailCampaignController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // TEMPLATE ENDPOINTS
  // ============================================

  describe('createTemplate()', () => {
    it('should create a template and return 201', async () => {
      const mockTemplate = {
        id: 'tpl-1',
        name: 'Welcome',
        subjectLine: 'Hello {{firstName}}',
        variablesUsed: ['firstName'],
        createdAt: new Date(),
      };
      mockEmailCampaignService.createTemplate.mockResolvedValue(mockTemplate);

      const req = createMockReq({
        body: { name: 'Welcome', subjectLine: 'Hello {{firstName}}', htmlContent: '<p>Hi</p>' },
      });
      const res = createMockRes();

      await createTemplate(req, res);

      expect(res._status).toBe(201);
      expect((res._json as any).success).toBe(true);
      expect((res._json as any).data.id).toBe('tpl-1');
    });

    it('should return 400 on validation error', async () => {
      mockEmailCampaignService.createTemplate.mockRejectedValue(
        new Error('Unknown variable: badVar')
      );

      const req = createMockReq({
        body: { name: 'Bad', subjectLine: '{{badVar}}', htmlContent: '<p>{{badVar}}</p>' },
      });
      const res = createMockRes();

      await createTemplate(req, res);

      expect(res._status).toBe(400);
      expect((res._json as any).success).toBe(false);
      expect((res._json as any).error.code).toBe('TEMPLATE_VALIDATION_ERROR');
    });
  });

  describe('listTemplates()', () => {
    it('should return paginated templates', async () => {
      mockEmailCampaignService.listTemplates.mockResolvedValue({
        rows: [
          {
            id: 'tpl-1',
            name: 'Template 1',
            subjectLine: 'Sub 1',
            variablesUsed: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        count: 1,
      });

      const req = createMockReq({ query: { page: '1', limit: '10' } });
      const res = createMockRes();

      await listTemplates(req, res);

      expect(res._status).toBe(200);
      expect((res._json as any).success).toBe(true);
      expect((res._json as any).data).toHaveLength(1);
      expect((res._json as any).pagination.total).toBe(1);
    });
  });

  describe('getTemplate()', () => {
    it('should return 404 when template not found', async () => {
      mockEmailCampaignService.getTemplate.mockResolvedValue(null);

      const req = createMockReq({ params: { id: 'nonexistent-uuid' } });
      const res = createMockRes();

      await getTemplate(req, res);

      expect(res._status).toBe(404);
      expect((res._json as any).error.code).toBe('TEMPLATE_NOT_FOUND');
    });
  });

  describe('deleteTemplate()', () => {
    it('should return success on delete', async () => {
      mockEmailCampaignService.deleteTemplate.mockResolvedValue(true);

      const req = createMockReq({ params: { id: 'tpl-1' } });
      const res = createMockRes();

      await deleteTemplate(req, res);

      expect(res._status).toBe(200);
      expect((res._json as any).success).toBe(true);
    });
  });

  // ============================================
  // CAMPAIGN ENDPOINTS
  // ============================================

  describe('createCampaign()', () => {
    it('should create a campaign and return 201', async () => {
      const mockCampaign = {
        id: 'camp-1',
        name: 'Newsletter Q1',
        status: 'draft',
        createdAt: new Date(),
      };
      mockEmailCampaignService.createCampaign.mockResolvedValue(mockCampaign);

      const req = createMockReq({
        body: { name: 'Newsletter Q1', emailTemplateId: 'tpl-1' },
      });
      const res = createMockRes();

      await createCampaign(req, res);

      expect(res._status).toBe(201);
      expect((res._json as any).data.id).toBe('camp-1');
    });

    it('should return 404 when template not found', async () => {
      mockEmailCampaignService.createCampaign.mockRejectedValue(new Error('Template not found'));

      const req = createMockReq({
        body: { name: 'Bad', emailTemplateId: 'nonexistent' },
      });
      const res = createMockRes();

      await createCampaign(req, res);

      expect(res._status).toBe(404);
      expect((res._json as any).error.code).toBe('TEMPLATE_NOT_FOUND');
    });
  });

  describe('getCampaign()', () => {
    it('should return campaign with stats', async () => {
      const mockCampaign = {
        id: 'camp-1',
        name: 'Test Campaign',
        status: 'completed',
        recipientCount: 100,
        sentCount: 95,
        failedCount: 5,
        deferredCount: 0,
        bounceCount: 2,
        openCount: 50,
        clickCount: 20,
        scheduledFor: null,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
      };
      mockEmailCampaignService.getCampaign.mockResolvedValue(mockCampaign);

      const req = createMockReq({ params: { id: 'camp-1' } });
      const res = createMockRes();

      await getCampaign(req, res);

      expect(res._status).toBe(200);
      expect((res._json as any).data.stats.sentCount).toBe(95);
      expect((res._json as any).data.stats.deliveryRate).toBe('95.0%');
    });
  });

  describe('sendCampaign()', () => {
    it('should send campaign and return status', async () => {
      mockEmailCampaignService.sendCampaign.mockResolvedValue(undefined);
      mockEmailCampaignService.getCampaign.mockResolvedValue({
        status: 'sending',
        recipientCount: 50,
      });

      const req = createMockReq({ params: { id: 'camp-1' } });
      const res = createMockRes();

      await sendCampaign(req, res);

      expect(res._status).toBe(200);
      expect((res._json as any).data.status).toBe('sending');
    });
  });

  describe('scheduleCampaign()', () => {
    it('should schedule campaign and return scheduled info', async () => {
      const futureDate = '2026-12-31T00:00:00Z';
      mockEmailCampaignService.scheduleCampaign.mockResolvedValue(undefined);

      const req = createMockReq({
        params: { id: 'camp-1' },
        body: { scheduledFor: futureDate },
      });
      const res = createMockRes();

      await scheduleCampaign(req, res);

      expect(res._status).toBe(200);
      expect((res._json as any).data.status).toBe('scheduled');
      expect((res._json as any).data.scheduledFor).toBe(futureDate);
    });
  });

  describe('retryFailedEmails()', () => {
    it('should return retry count', async () => {
      mockEmailCampaignService.retryFailedEmails.mockResolvedValue(7);

      const req = createMockReq({ params: { id: 'camp-1' } });
      const res = createMockRes();

      await retryFailedEmails(req, res);

      expect(res._status).toBe(200);
      expect((res._json as any).data.retriedCount).toBe(7);
    });
  });

  describe('getCampaignLogs()', () => {
    it('should return paginated logs', async () => {
      mockEmailCampaignLogFindAndCountAll.mockResolvedValue({
        rows: [{ id: 'log-1', eventType: 'sent', details: {} }],
        count: 1,
      });

      const req = createMockReq({
        params: { id: 'camp-1' },
        query: { limit: '50', offset: '0' },
      });
      const res = createMockRes();

      await getCampaignLogs(req, res);

      expect(res._status).toBe(200);
      expect((res._json as any).data).toHaveLength(1);
      expect((res._json as any).pagination.total).toBe(1);
    });

    it('should filter logs by eventType', async () => {
      mockEmailCampaignLogFindAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      const req = createMockReq({
        params: { id: 'camp-1' },
        query: { eventType: 'sent', limit: '50', offset: '0' },
      });
      const res = createMockRes();

      await getCampaignLogs(req, res);

      expect(mockEmailCampaignLogFindAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ campaignId: 'camp-1', eventType: 'sent' }),
        })
      );
    });
  });
});
