/**
 * @fileoverview InvoiceService Unit Tests
 * @description Tests for invoice creation, retrieval, status transitions, and cancellation.
 *              Pruebas para creación, consulta, transiciones de estado y cancelación de facturas.
 * @module __tests__/unit/InvoiceService
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
  Invoice: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
  },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { InvoiceService, invoiceService } from '../../services/InvoiceService';
import { Invoice } from '../../models';
import { sequelize } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import type { InvoiceCreationAttributes, InvoiceStatus } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const OTHER_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

function buildMockInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_UUID,
    orderId: null,
    userId: 'user-1',
    invoiceNumber: 'INV-202604-00001',
    type: 'purchase' as const,
    status: 'draft' as InvoiceStatus,
    amount: 100,
    tax: 10,
    currency: 'USD',
    items: [{ description: 'Test Item', quantity: 1, unitPrice: 100, total: 100 }],
    metadata: null,
    issuedAt: null,
    dueAt: null,
    paidAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-04-12'),
    updatedAt: new Date('2026-04-12'),
    save: jest.fn().mockImplementation(function (this: Record<string, unknown>) {
      return Promise.resolve(this);
    }),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InvoiceService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getNextInvoiceNumber
  // ────────────────────────────────────────────────────────────────────────────

  describe('getNextInvoiceNumber', () => {
    it('formats sequence value with YYYYMM prefix and zero-padded 5-digit suffix', async () => {
      (sequelize.query as jest.Mock).mockResolvedValue([{ nextval: '5' }]);

      const service = new InvoiceService();
      const result = await service.getNextInvoiceNumber();

      // Format: INV-YYYYMM-NNNNN
      expect(result).toMatch(/^INV-\d{6}-00005$/);
      expect(sequelize.query).toHaveBeenCalledWith(
        "SELECT nextval('invoice_number_seq')",
        expect.objectContaining({ type: 'SELECT' })
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // create
  // ────────────────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates invoice with auto-generated invoiceNumber matching INV-YYYYMM-NNNNN', async () => {
      (sequelize.query as jest.Mock).mockResolvedValue([{ nextval: '42' }]);
      const mockCreated = buildMockInvoice({ invoiceNumber: 'INV-202604-00042' });
      (Invoice.create as jest.Mock).mockResolvedValue(mockCreated);

      const data: InvoiceCreationAttributes = {
        userId: 'user-1',
        orderId: null,
        type: 'purchase',
        amount: 100,
        tax: 10,
        currency: 'USD',
        items: [{ description: 'Test Item', quantity: 1, unitPrice: 100, total: 100 }],
        metadata: null,
        dueAt: null,
      };

      const result = await invoiceService.create(data);

      expect(result.invoiceNumber).toMatch(/^INV-\d{6}-\d{5}$/);
      expect(Invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: expect.stringMatching(/^INV-\d{6}-00042$/),
          status: 'draft',
        })
      );
    });

    it('throws validation error when items array is empty', async () => {
      const data: InvoiceCreationAttributes = {
        userId: 'user-1',
        orderId: null,
        type: 'purchase',
        amount: 100,
        tax: 10,
        currency: 'USD',
        items: [],
        metadata: null,
        dueAt: null,
      };

      await expect(invoiceService.create(data)).rejects.toThrow(AppError);
      await expect(invoiceService.create(data)).rejects.toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // findById
  // ────────────────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns invoice when found', async () => {
      const mock = buildMockInvoice();
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mock);

      const result = await invoiceService.findById(VALID_UUID);

      expect(result).toEqual(mock);
      expect(Invoice.findByPk).toHaveBeenCalledWith(VALID_UUID);
    });

    it('throws AppError 404 INVOICE_NOT_FOUND when not found', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(invoiceService.findById(VALID_UUID)).rejects.toThrow(AppError);
      await expect(invoiceService.findById(VALID_UUID)).rejects.toMatchObject({
        statusCode: 404,
        code: 'INVOICE_NOT_FOUND',
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // findByIdForUser
  // ────────────────────────────────────────────────────────────────────────────

  describe('findByIdForUser', () => {
    it('returns invoice when userId matches (owner access)', async () => {
      const mock = buildMockInvoice({ userId: 'user-1' });
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mock);

      const result = await invoiceService.findByIdForUser(VALID_UUID, 'user-1', 'user');

      expect(result).toEqual(mock);
    });

    it('throws AppError 403 INVOICE_FORBIDDEN when user does not match and role=user', async () => {
      const mock = buildMockInvoice({ userId: 'user-1' });
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mock);

      await expect(
        invoiceService.findByIdForUser(VALID_UUID, 'other-user', 'user')
      ).rejects.toThrow(AppError);
      await expect(
        invoiceService.findByIdForUser(VALID_UUID, 'other-user', 'user')
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'INVOICE_FORBIDDEN',
      });
    });

    it('allows admin to access any invoice (admin bypass)', async () => {
      const mock = buildMockInvoice({ userId: 'user-1' });
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mock);

      const result = await invoiceService.findByIdForUser(VALID_UUID, 'admin-user', 'admin');

      expect(result).toEqual(mock);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // list
  // ────────────────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('calls findAndCountAll with no where clause when no filters provided', async () => {
      const mockResult = { rows: [buildMockInvoice()], count: 1 };
      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await invoiceService.list();

      expect(result).toEqual(mockResult);
      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('filters by status when status filter is provided', async () => {
      const mockResult = { rows: [], count: 0 };
      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await invoiceService.list({ status: 'draft' });

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'draft' },
        })
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // listForUser
  // ────────────────────────────────────────────────────────────────────────────

  describe('listForUser', () => {
    it('scopes query to the given userId', async () => {
      const mockResult = { rows: [buildMockInvoice()], count: 1 };
      (Invoice.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

      await invoiceService.listForUser('u1');

      expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'u1' }),
        })
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // updateStatus
  // ────────────────────────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('transitions draft→issued and sets issuedAt', async () => {
      const mock = buildMockInvoice({ status: 'draft', issuedAt: null });
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mock);

      const result = await invoiceService.updateStatus(VALID_UUID, 'issued');

      expect(mock.save).toHaveBeenCalled();
      expect(result.status).toBe('issued');
      expect(result.issuedAt).toBeInstanceOf(Date);
    });

    it('transitions issued→paid and sets paidAt', async () => {
      const mock = buildMockInvoice({ status: 'issued', issuedAt: new Date() });
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mock);

      const result = await invoiceService.updateStatus(VALID_UUID, 'paid');

      expect(mock.save).toHaveBeenCalled();
      expect(result.status).toBe('paid');
      expect(result.paidAt).toBeInstanceOf(Date);
    });

    it('throws AppError 422 INVALID_STATUS_TRANSITION for paid→draft', async () => {
      const mock = buildMockInvoice({ status: 'paid' });
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mock);

      await expect(invoiceService.updateStatus(VALID_UUID, 'draft')).rejects.toThrow(AppError);
      await expect(invoiceService.updateStatus(VALID_UUID, 'draft')).rejects.toMatchObject({
        statusCode: 422,
        code: 'INVALID_STATUS_TRANSITION',
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // cancel
  // ────────────────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('sets status to cancelled and cancelledAt for owner invoice', async () => {
      const mock = buildMockInvoice({ status: 'draft', userId: 'user-1' });
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mock);

      const result = await invoiceService.cancel(VALID_UUID, 'user-1', 'user');

      expect(mock.save).toHaveBeenCalled();
      expect(result.status).toBe('cancelled');
      expect(result.cancelledAt).toBeInstanceOf(Date);
    });

    it('throws AppError 422 INVALID_STATUS_TRANSITION when already cancelled', async () => {
      const mock = buildMockInvoice({ status: 'cancelled', userId: 'user-1' });
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mock);

      await expect(invoiceService.cancel(VALID_UUID, 'user-1', 'user')).rejects.toThrow(AppError);
      await expect(invoiceService.cancel(VALID_UUID, 'user-1', 'user')).rejects.toMatchObject({
        statusCode: 422,
        code: 'INVALID_STATUS_TRANSITION',
      });
    });
  });
});
