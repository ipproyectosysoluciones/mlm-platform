/**
 * @fileoverview EmailCampaignService Unit Tests
 * @description Tests for template validation/rendering, template CRUD, campaign CRUD,
 *              send/schedule/pause/retry flows.
 *              Pruebas para validación/renderizado de templates, CRUD de templates, CRUD de campañas,
 *              flujos de envío/programación/pausa/reintento.
 * @module __tests__/unit/EmailCampaignService
 */

// ============================================
// MOCKS — Deben ir ANTES de los imports
// ============================================

// Mock config/database
jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn((cb: (t: unknown) => Promise<unknown>) =>
      cb({
        LOCK: { UPDATE: 'UPDATE' },
      })
    ),
  },
}));

// Mock models
jest.mock('../../models', () => ({
  EmailTemplate: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn(),
  },
  EmailCampaign: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  CampaignRecipient: {
    bulkCreate: jest.fn(),
  },
  EmailQueue: {
    bulkCreate: jest.fn(),
    update: jest.fn(),
  },
  EmailCampaignLog: {
    create: jest.fn(),
  },
  User: {
    findAll: jest.fn(),
  },
}));

import { EmailCampaignService, emailCampaignService } from '../../services/EmailCampaignService';
import {
  EmailTemplate,
  EmailCampaign,
  CampaignRecipient,
  EmailQueue,
  EmailCampaignLog,
  User,
} from '../../models';
import { sequelize } from '../../config/database';
import { EMAIL_CAMPAIGN_STATUS, EMAIL_QUEUE_STATUS, ALLOWED_TEMPLATE_VARIABLES } from '../../types';

describe('EmailCampaignService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // TASK 22-2: validateTemplate
  // ============================================

  describe('validateTemplate()', () => {
    it('should return valid: true for template with allowed variables', async () => {
      const result = await emailCampaignService.validateTemplate(
        '<p>Hello {{firstName}} {{lastName}}</p>',
        'Welcome {{firstName}}'
      );

      expect(result.valid).toBe(true);
      expect(result.variablesUsed).toEqual(expect.arrayContaining(['firstName', 'lastName']));
      expect(result.error).toBeUndefined();
    });

    it('should return valid: true for template with no variables', async () => {
      const result = await emailCampaignService.validateTemplate(
        '<p>Hello World</p>',
        'Welcome to our store'
      );

      expect(result.valid).toBe(true);
      expect(result.variablesUsed).toEqual([]);
    });

    it('should return valid: false for template with unknown variable', async () => {
      const result = await emailCampaignService.validateTemplate(
        '<p>Hello {{unknownVar}}</p>',
        'Subject'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown variable: {{unknownVar}}');
      expect(result.allowed).toEqual(ALLOWED_TEMPLATE_VARIABLES);
    });

    it('should detect variables in subject line too', async () => {
      const result = await emailCampaignService.validateTemplate(
        '<p>Static content</p>',
        'Hey {{firstName}}, check this!'
      );

      expect(result.valid).toBe(true);
      expect(result.variablesUsed).toContain('firstName');
    });

    it('should reject unknown variable in subject even if body is clean', async () => {
      const result = await emailCampaignService.validateTemplate(
        '<p>Clean body</p>',
        'Hey {{fakeVar}}'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown variable: {{fakeVar}}');
    });

    it('should return all allowed variables when all are used', async () => {
      const html =
        '<p>{{firstName}} {{lastName}} {{email}} {{referralCode}} {{discountCode}} {{expiresAt}}</p>';
      const result = await emailCampaignService.validateTemplate(html, 'Subject');

      expect(result.valid).toBe(true);
      expect(result.variablesUsed).toHaveLength(6);
    });
  });

  // ============================================
  // TASK 22-2: renderTemplate
  // ============================================

  describe('renderTemplate()', () => {
    it('should replace variables with provided values', async () => {
      const result = await emailCampaignService.renderTemplate(
        '<p>Hello {{firstName}} {{lastName}}</p>',
        { firstName: 'John', lastName: 'Doe' }
      );

      expect(result).toBe('<p>Hello John Doe</p>');
    });

    it('should leave unmatched placeholders intact when no value provided', async () => {
      const result = await emailCampaignService.renderTemplate(
        '<p>Hello {{firstName}} {{lastName}}</p>',
        { firstName: 'John' }
      );

      expect(result).toBe('<p>Hello John {{lastName}}</p>');
    });

    it('should HTML-escape values to prevent XSS injection', async () => {
      const result = await emailCampaignService.renderTemplate('<p>Hello {{firstName}}</p>', {
        firstName: '<script>alert("xss")</script>',
      });

      expect(result).toBe('<p>Hello &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>');
      expect(result).not.toContain('<script>');
    });

    it('should escape ampersands and single quotes', async () => {
      const result = await emailCampaignService.renderTemplate('<p>{{firstName}}</p>', {
        firstName: "Ben & Jerry's",
      });

      expect(result).toBe('<p>Ben &amp; Jerry&#39;s</p>');
    });

    it('should handle empty variables object gracefully', async () => {
      const html = '<p>Hello {{firstName}}</p>';
      const result = await emailCampaignService.renderTemplate(html, {});

      expect(result).toBe('<p>Hello {{firstName}}</p>');
    });
  });

  // ============================================
  // TASK 22-2: createTemplate
  // ============================================

  describe('createTemplate()', () => {
    it('should validate and create a template with correct attributes', async () => {
      const mockTemplate = {
        id: 'tpl-uuid-1',
        createdByUserId: 'admin-uuid',
        name: 'Welcome Email',
        subjectLine: 'Welcome {{firstName}}!',
        htmlContent: '<h1>Hi {{firstName}}</h1>',
        wysiwygState: {},
        variablesUsed: ['firstName'],
      };

      (EmailTemplate.create as jest.Mock).mockResolvedValue(mockTemplate);

      const result = await emailCampaignService.createTemplate(
        'admin-uuid',
        'Welcome Email',
        'Welcome {{firstName}}!',
        '<h1>Hi {{firstName}}</h1>'
      );

      expect(EmailTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdByUserId: 'admin-uuid',
          name: 'Welcome Email',
          subjectLine: 'Welcome {{firstName}}!',
          htmlContent: '<h1>Hi {{firstName}}</h1>',
          variablesUsed: ['firstName'],
        })
      );
      expect(result).toEqual(mockTemplate);
    });

    it('should throw if template contains unknown variable', async () => {
      await expect(
        emailCampaignService.createTemplate(
          'admin-uuid',
          'Bad Template',
          'Subject',
          '<p>{{invalidVar}}</p>'
        )
      ).rejects.toThrow('Unknown variable: {{invalidVar}}');

      expect(EmailTemplate.create).not.toHaveBeenCalled();
    });

    it('should pass WYSIWYG state when provided', async () => {
      const wysiwygState = { blocks: [{ type: 'header', text: 'Hello' }] };
      (EmailTemplate.create as jest.Mock).mockResolvedValue({ id: 'tpl-uuid-2' });

      await emailCampaignService.createTemplate(
        'admin-uuid',
        'Test Template',
        'Subject',
        '<p>Body</p>',
        wysiwygState
      );

      expect(EmailTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          wysiwygState,
        })
      );
    });
  });

  // ============================================
  // TASK 22-2: getTemplate
  // ============================================

  describe('getTemplate()', () => {
    it('should find template by ID excluding soft-deleted ones', async () => {
      const mockTemplate = { id: 'tpl-uuid', name: 'Test' };
      (EmailTemplate.findOne as jest.Mock).mockResolvedValue(mockTemplate);

      const result = await emailCampaignService.getTemplate('tpl-uuid');

      expect(EmailTemplate.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tpl-uuid', deletedAt: null },
        })
      );
      expect(result).toEqual(mockTemplate);
    });

    it('should return null if template not found', async () => {
      (EmailTemplate.findOne as jest.Mock).mockResolvedValue(null);

      const result = await emailCampaignService.getTemplate('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // TASK 22-2: listTemplates
  // ============================================

  describe('listTemplates()', () => {
    it('should return paginated templates with default options', async () => {
      const mockResult = {
        rows: [{ id: 'tpl-1' }, { id: 'tpl-2' }],
        count: 2,
      };
      (EmailTemplate.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await emailCampaignService.listTemplates();

      expect(EmailTemplate.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          limit: 20,
          offset: 0,
          order: [['created_at', 'DESC']],
        })
      );
      expect(result.rows).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should apply filters and custom pagination', async () => {
      const mockResult = { rows: [], count: 0 };
      (EmailTemplate.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await emailCampaignService.listTemplates({
        page: 3,
        limit: 5,
        createdByUserId: 'user-uuid',
      });

      expect(EmailTemplate.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, createdByUserId: 'user-uuid' },
          limit: 5,
          offset: 10, // (page 3 - 1) * 5
        })
      );
    });
  });

  // ============================================
  // TASK 22-2: deleteTemplate
  // ============================================

  describe('deleteTemplate()', () => {
    it('should soft-delete template and return true', async () => {
      (EmailTemplate.update as jest.Mock).mockResolvedValue([1]);

      const result = await emailCampaignService.deleteTemplate('tpl-uuid');

      expect(EmailTemplate.update).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) }),
        { where: { id: 'tpl-uuid', deletedAt: null } }
      );
      expect(result).toBe(true);
    });

    it('should return false if template not found (already deleted or nonexistent)', async () => {
      (EmailTemplate.update as jest.Mock).mockResolvedValue([0]);

      const result = await emailCampaignService.deleteTemplate('nonexistent');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // TASK 22-2: createCampaign
  // ============================================

  describe('createCampaign()', () => {
    it('should create a campaign in draft status when template exists', async () => {
      const mockTemplate = { id: 'tpl-uuid', name: 'Template' };
      const mockCampaign = {
        id: 'camp-uuid',
        name: 'Test Campaign',
        status: 'draft',
        emailTemplateId: 'tpl-uuid',
      };

      (EmailTemplate.findOne as jest.Mock).mockResolvedValue(mockTemplate);
      (EmailCampaign.create as jest.Mock).mockResolvedValue(mockCampaign);

      const result = await emailCampaignService.createCampaign({
        createdByUserId: 'admin-uuid',
        emailTemplateId: 'tpl-uuid',
        name: 'Test Campaign',
      });

      expect(EmailCampaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EMAIL_CAMPAIGN_STATUS.DRAFT,
          emailTemplateId: 'tpl-uuid',
          name: 'Test Campaign',
        })
      );
      expect(result).toEqual(mockCampaign);
    });

    it('should throw "Template not found" if template does not exist', async () => {
      (EmailTemplate.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        emailCampaignService.createCampaign({
          createdByUserId: 'admin-uuid',
          emailTemplateId: 'nonexistent',
          name: 'Bad Campaign',
        })
      ).rejects.toThrow('Template not found');

      expect(EmailCampaign.create).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // TASK 22-2: getCampaign & listCampaigns
  // ============================================

  describe('getCampaign()', () => {
    it('should return campaign with template and user associations', async () => {
      const mockCampaign = { id: 'camp-uuid', name: 'Test', status: 'draft' };
      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(mockCampaign);

      const result = await emailCampaignService.getCampaign('camp-uuid');

      expect(EmailCampaign.findByPk).toHaveBeenCalledWith('camp-uuid', {
        include: expect.arrayContaining([
          expect.objectContaining({ model: User, as: 'createdByUser' }),
          expect.objectContaining({ model: EmailTemplate, as: 'emailTemplate' }),
        ]),
      });
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('listCampaigns()', () => {
    it('should return paginated campaigns with default options', async () => {
      const mockResult = { rows: [{ id: 'c-1' }], count: 1 };
      (EmailCampaign.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await emailCampaignService.listCampaigns();

      expect(EmailCampaign.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          limit: 20,
          offset: 0,
          order: [['created_at', 'DESC']],
        })
      );
      expect(result.count).toBe(1);
    });

    it('should apply status and user filters with custom pagination', async () => {
      const mockResult = { rows: [], count: 0 };
      (EmailCampaign.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await emailCampaignService.listCampaigns({
        page: 2,
        limit: 10,
        status: 'sending',
        createdByUserId: 'user-uuid',
      });

      expect(EmailCampaign.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'sending', createdByUserId: 'user-uuid' },
          limit: 10,
          offset: 10,
        })
      );
    });
  });

  // ============================================
  // TASK 22-3: sendCampaign
  // ============================================

  describe('sendCampaign()', () => {
    it('should lock campaign with SELECT FOR UPDATE, create recipients, queue items, and update status', async () => {
      const mockCampaign = {
        id: 'camp-uuid',
        status: EMAIL_CAMPAIGN_STATUS.DRAFT,
        emailTemplateId: 'tpl-uuid',
        recipientSegment: null,
        update: jest.fn().mockResolvedValue(undefined),
      };
      const mockTemplate = {
        id: 'tpl-uuid',
        htmlContent: '<p>Hi {{firstName}}</p>',
        subjectLine: 'Hello {{firstName}}',
      };
      const mockUsers = [
        { id: 'user-1', email: 'alice@test.com', referralCode: 'REF1' },
        { id: 'user-2', email: 'bob@test.com', referralCode: 'REF2' },
      ];
      const mockRecipientRecords = [
        { id: 'cr-1', campaignId: 'camp-uuid', userId: 'user-1' },
        { id: 'cr-2', campaignId: 'camp-uuid', userId: 'user-2' },
      ];

      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(mockCampaign);
      (EmailTemplate.findByPk as jest.Mock).mockResolvedValue(mockTemplate);
      (User.findAll as jest.Mock).mockResolvedValue(mockUsers);
      (CampaignRecipient.bulkCreate as jest.Mock).mockResolvedValue(mockRecipientRecords);
      (EmailQueue.bulkCreate as jest.Mock).mockResolvedValue([]);
      (EmailCampaignLog.create as jest.Mock).mockResolvedValue({});

      await emailCampaignService.sendCampaign('camp-uuid');

      // Verify SELECT FOR UPDATE lock
      expect(EmailCampaign.findByPk).toHaveBeenCalledWith('camp-uuid', {
        lock: 'UPDATE',
        transaction: expect.anything(),
      });

      // Verify recipients created
      expect(CampaignRecipient.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ campaignId: 'camp-uuid', userId: 'user-1' }),
          expect.objectContaining({ campaignId: 'camp-uuid', userId: 'user-2' }),
        ]),
        expect.objectContaining({ transaction: expect.anything() })
      );

      // Verify queue items created
      expect(EmailQueue.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            campaignId: 'camp-uuid',
            userId: 'user-1',
            status: 'pending',
          }),
        ]),
        expect.objectContaining({ transaction: expect.anything() })
      );

      // Verify status updated to sending
      expect(mockCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EMAIL_CAMPAIGN_STATUS.SENDING,
          startedAt: expect.any(Date),
          recipientCount: 2,
        }),
        expect.objectContaining({ transaction: expect.anything() })
      );

      // Verify log created
      expect(EmailCampaignLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId: 'camp-uuid',
          eventType: 'sending_started',
        }),
        expect.objectContaining({ transaction: expect.anything() })
      );
    });

    it('should throw "Campaign not found" if campaign does not exist', async () => {
      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(emailCampaignService.sendCampaign('nonexistent')).rejects.toThrow(
        'Campaign not found'
      );
    });

    it('should throw with statusCode 409 if campaign is already sending', async () => {
      const mockCampaign = {
        id: 'camp-uuid',
        status: EMAIL_CAMPAIGN_STATUS.SENDING,
      };
      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(mockCampaign);

      try {
        await emailCampaignService.sendCampaign('camp-uuid');
        fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Campaign is already sending');
        expect((error as Error & { statusCode: number }).statusCode).toBe(409);
      }
    });

    it('should throw with statusCode 400 if campaign is in completed status', async () => {
      const mockCampaign = {
        id: 'camp-uuid',
        status: EMAIL_CAMPAIGN_STATUS.COMPLETED,
      };
      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(mockCampaign);

      try {
        await emailCampaignService.sendCampaign('camp-uuid');
        fail('Should have thrown');
      } catch (error: unknown) {
        expect((error as Error).message).toContain('Cannot send campaign');
        expect((error as Error & { statusCode: number }).statusCode).toBe(400);
      }
    });
  });

  // ============================================
  // TASK 22-3: scheduleCampaign
  // ============================================

  describe('scheduleCampaign()', () => {
    it('should schedule a draft campaign for future delivery', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 7); // 7 days from now
      const mockCampaign = {
        id: 'camp-uuid',
        status: EMAIL_CAMPAIGN_STATUS.DRAFT,
        update: jest.fn().mockResolvedValue(undefined),
      };

      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(mockCampaign);
      (EmailCampaignLog.create as jest.Mock).mockResolvedValue({});

      await emailCampaignService.scheduleCampaign('camp-uuid', futureDate);

      expect(mockCampaign.update).toHaveBeenCalledWith({
        status: EMAIL_CAMPAIGN_STATUS.SCHEDULED,
        scheduledFor: futureDate,
      });
      expect(EmailCampaignLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId: 'camp-uuid',
          eventType: 'scheduled',
        })
      );
    });

    it('should throw if scheduled time is in the past', async () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday

      await expect(emailCampaignService.scheduleCampaign('camp-uuid', pastDate)).rejects.toThrow(
        'Scheduled time must be in the future'
      );

      expect(EmailCampaign.findByPk).not.toHaveBeenCalled();
    });

    it('should throw if campaign is not in draft status', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const mockCampaign = {
        id: 'camp-uuid',
        status: EMAIL_CAMPAIGN_STATUS.SENDING,
      };

      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(mockCampaign);

      await expect(emailCampaignService.scheduleCampaign('camp-uuid', futureDate)).rejects.toThrow(
        "Cannot schedule campaign in 'sending' status"
      );
    });
  });

  // ============================================
  // TASK 22-3: pauseCampaign
  // ============================================

  describe('pauseCampaign()', () => {
    it('should pause a sending campaign and log the event', async () => {
      const mockCampaign = {
        id: 'camp-uuid',
        status: EMAIL_CAMPAIGN_STATUS.SENDING,
        update: jest.fn().mockResolvedValue(undefined),
      };

      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(mockCampaign);
      (EmailCampaignLog.create as jest.Mock).mockResolvedValue({});

      await emailCampaignService.pauseCampaign('camp-uuid');

      expect(mockCampaign.update).toHaveBeenCalledWith({
        status: EMAIL_CAMPAIGN_STATUS.PAUSED,
      });
      expect(EmailCampaignLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId: 'camp-uuid',
          eventType: 'paused',
        })
      );
    });

    it('should throw if campaign is not in sending status', async () => {
      const mockCampaign = {
        id: 'camp-uuid',
        status: EMAIL_CAMPAIGN_STATUS.DRAFT,
      };

      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(mockCampaign);

      await expect(emailCampaignService.pauseCampaign('camp-uuid')).rejects.toThrow(
        "Cannot pause campaign in 'draft' status"
      );
    });

    it('should throw "Campaign not found" if campaign does not exist', async () => {
      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(emailCampaignService.pauseCampaign('nonexistent')).rejects.toThrow(
        'Campaign not found'
      );
    });
  });

  // ============================================
  // TASK 22-3: retryFailedEmails
  // ============================================

  describe('retryFailedEmails()', () => {
    it('should re-queue failed emails and set campaign back to sending', async () => {
      const mockCampaign = {
        id: 'camp-uuid',
        status: EMAIL_CAMPAIGN_STATUS.COMPLETED,
        update: jest.fn().mockResolvedValue(undefined),
      };

      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(mockCampaign);
      (EmailQueue.update as jest.Mock).mockResolvedValue([3]); // 3 failed emails retried
      (EmailCampaignLog.create as jest.Mock).mockResolvedValue({});

      const count = await emailCampaignService.retryFailedEmails('camp-uuid');

      expect(count).toBe(3);
      expect(EmailQueue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: EMAIL_QUEUE_STATUS.PENDING,
          retryCount: 0,
          nextRetryAt: null,
          lastError: null,
        }),
        expect.objectContaining({
          where: {
            campaignId: 'camp-uuid',
            status: EMAIL_QUEUE_STATUS.FAILED,
          },
        })
      );
      expect(mockCampaign.update).toHaveBeenCalledWith({
        status: EMAIL_CAMPAIGN_STATUS.SENDING,
      });
      expect(EmailCampaignLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId: 'camp-uuid',
          eventType: 'retry_failed',
          details: { retriedCount: 3 },
        })
      );
    });

    it('should return 0 and NOT log/update if no failed emails found', async () => {
      const mockCampaign = {
        id: 'camp-uuid',
        status: EMAIL_CAMPAIGN_STATUS.COMPLETED,
        update: jest.fn(),
      };

      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(mockCampaign);
      (EmailQueue.update as jest.Mock).mockResolvedValue([0]); // no failed emails

      const count = await emailCampaignService.retryFailedEmails('camp-uuid');

      expect(count).toBe(0);
      expect(EmailCampaignLog.create).not.toHaveBeenCalled();
      expect(mockCampaign.update).not.toHaveBeenCalled();
    });

    it('should throw "Campaign not found" if campaign does not exist', async () => {
      (EmailCampaign.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(emailCampaignService.retryFailedEmails('nonexistent')).rejects.toThrow(
        'Campaign not found'
      );
    });
  });

  // ============================================
  // SINGLETON EXPORT
  // ============================================

  describe('singleton export', () => {
    it('should export a singleton instance of EmailCampaignService', () => {
      expect(emailCampaignService).toBeInstanceOf(EmailCampaignService);
    });
  });
});
