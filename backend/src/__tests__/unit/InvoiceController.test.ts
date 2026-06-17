/**
 * @fileoverview InvoiceController Unit Tests (Read + Write + PDF controllers)
 * @description Tests for invoice CRUD handlers delegating to InvoiceService.
 *              Pruebas para handlers de factura que delegan a InvoiceService.
 * @module __tests__/unit/InvoiceController
 */

// ── Mocks (before any import) ─────────────────────────────────────────────────

jest.mock('../../services/InvoiceService', () => ({
  invoiceService: {
    list: jest.fn(),
    listForUser: jest.fn(),
    findByIdForUser: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    cancel: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../config/env', () => ({
  config: {
    platform: { domain: 'test.com' },
  },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { getInvoices, getInvoiceById } from '../../controllers/invoices/InvoiceReadController';
import {
  createInvoice,
  updateInvoiceStatus,
  cancelInvoice,
} from '../../controllers/invoices/InvoiceWriteController';
import {
  generateInvoicePdf,
  downloadInvoicePdf,
} from '../../controllers/invoices/InvoicePdfController';
import { invoiceService } from '../../services/InvoiceService';
import { AppError } from '../../middleware/error.middleware';

// ── Helpers ───────────────────────────────────────────────────────────────────

const flushPromises = () => new Promise<void>((r) => setImmediate(r));
const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: 'user-uuid', email: 'test@test.com', role: 'user', referralCode: 'REF-001' },
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function createMockRes() {
  const res: Record<string, jest.Mock> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Build a mock Invoice model instance (mimics Sequelize model shape) */
function buildMockInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_UUID,
    orderId: null,
    userId: 'user-uuid',
    invoiceNumber: 'INV-202604-00001',
    type: 'purchase',
    status: 'draft',
    amount: 100,
    tax: 10,
    currency: 'USD',
    items: [{ description: 'Item 1', quantity: 1, unitPrice: 100, total: 100 }],
    metadata: null,
    issuedAt: null,
    dueAt: null,
    paidAt: null,
    cancelledAt: null,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
    // Compat fields used by PDF HTML template
    userName: 'Test User',
    userEmail: 'test@test.com',
    description: 'Test invoice',
    dueDate: new Date('2026-05-01'),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// InvoiceReadController
// ══════════════════════════════════════════════════════════════════════════════

describe('InvoiceReadController - getInvoices', () => {
  afterEach(() => jest.clearAllMocks());

  it('admin calls invoiceService.list with parsed filters and pagination', async () => {
    const mockResult = { rows: [buildMockInvoice()], count: 1 };
    (invoiceService.list as jest.Mock).mockResolvedValue(mockResult);

    const req = createMockReq({
      user: { id: 'admin-uuid', email: 'admin@test.com', role: 'admin', referralCode: 'ADM' },
      query: { page: '2', limit: '15', status: 'draft' },
    });
    const res = createMockRes();
    const next = jest.fn();

    await getInvoices(req, res, next);
    await flushPromises();

    expect(invoiceService.list).toHaveBeenCalledWith({
      status: 'draft',
      page: 2,
      limit: 15,
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: mockResult.rows,
        meta: expect.objectContaining({ total: 1, page: 2, limit: 15 }),
      })
    );
  });

  it('regular user calls invoiceService.listForUser with userId', async () => {
    const mockResult = { rows: [buildMockInvoice()], count: 1 };
    (invoiceService.listForUser as jest.Mock).mockResolvedValue(mockResult);

    const req = createMockReq({
      query: { page: '1', limit: '20' },
    });
    const res = createMockRes();
    const next = jest.fn();

    await getInvoices(req, res, next);
    await flushPromises();

    expect(invoiceService.listForUser).toHaveBeenCalledWith('user-uuid', { page: 1, limit: 20 });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: mockResult.rows,
        meta: expect.objectContaining({ total: 1, page: 1, limit: 20 }),
      })
    );
  });
});

describe('InvoiceReadController - getInvoiceById', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 200 with invoice data for valid UUID', async () => {
    const mockInvoice = buildMockInvoice();
    (invoiceService.findByIdForUser as jest.Mock).mockResolvedValue(mockInvoice);

    const req = createMockReq({ params: { id: VALID_UUID } });
    const res = createMockRes();
    const next = jest.fn();

    await getInvoiceById(req, res, next);
    await flushPromises();

    expect(invoiceService.findByIdForUser).toHaveBeenCalledWith(VALID_UUID, 'user-uuid', 'user');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: VALID_UUID }),
      })
    );
  });

  it('returns 400 validation error for invalid UUID', async () => {
    const req = createMockReq({ params: { id: 'not-a-uuid' } });
    const res = createMockRes();
    const next = jest.fn();

    await getInvoiceById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// InvoiceWriteController
// ══════════════════════════════════════════════════════════════════════════════

describe('InvoiceWriteController - createInvoice', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 201 with created invoice on success', async () => {
    const mockInvoice = buildMockInvoice();
    (invoiceService.create as jest.Mock).mockResolvedValue(mockInvoice);

    const req = createMockReq({
      body: {
        type: 'purchase',
        items: [{ description: 'Widget', quantity: 2, unitPrice: 50, total: 100 }],
        amount: 100,
        tax: 10,
        currency: 'USD',
      },
    });
    const res = createMockRes();
    const next = jest.fn();

    await createInvoice(req, res, next);
    await flushPromises();

    expect(invoiceService.create).toHaveBeenCalledWith({ ...req.body, userId: 'user-uuid' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: VALID_UUID }),
      })
    );
  });

  it('returns 400 validation error when type is missing', async () => {
    const req = createMockReq({
      body: {
        items: [{ description: 'Widget', quantity: 1, unitPrice: 50, total: 50 }],
        amount: 50,
      },
    });
    const res = createMockRes();
    const next = jest.fn();

    await createInvoice(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });
});

describe('InvoiceWriteController - updateInvoiceStatus', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 200 with updated invoice on success', async () => {
    const mockInvoice = buildMockInvoice({ status: 'issued' });
    (invoiceService.updateStatus as jest.Mock).mockResolvedValue(mockInvoice);

    const req = createMockReq({
      params: { id: VALID_UUID },
      body: { status: 'issued' },
    });
    const res = createMockRes();
    const next = jest.fn();

    await updateInvoiceStatus(req, res, next);
    await flushPromises();

    expect(invoiceService.updateStatus).toHaveBeenCalledWith(VALID_UUID, 'issued');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ status: 'issued' }),
      })
    );
  });

  it('returns 400 when status is invalid', async () => {
    const req = createMockReq({
      params: { id: VALID_UUID },
      body: { status: 'invalid_status' },
    });
    const res = createMockRes();
    const next = jest.fn();

    await updateInvoiceStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      })
    );
  });
});

describe('InvoiceWriteController - cancelInvoice', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 200 with cancelled invoice on success', async () => {
    const mockInvoice = buildMockInvoice({ status: 'cancelled' });
    (invoiceService.cancel as jest.Mock).mockResolvedValue(mockInvoice);

    const req = createMockReq({ params: { id: VALID_UUID } });
    const res = createMockRes();
    const next = jest.fn();

    await cancelInvoice(req, res, next);
    await flushPromises();

    expect(invoiceService.cancel).toHaveBeenCalledWith(VALID_UUID, 'user-uuid', 'user');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ status: 'cancelled' }),
      })
    );
  });

  it('propagates 403 AppError when service throws forbidden', async () => {
    const error = new AppError(403, 'INVOICE_FORBIDDEN', 'You do not have permission');
    (invoiceService.cancel as jest.Mock).mockRejectedValue(error);

    const req = createMockReq({ params: { id: VALID_UUID } });
    const res = createMockRes();
    const next = jest.fn();

    await cancelInvoice(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledWith(error);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// InvoicePdfController
// ══════════════════════════════════════════════════════════════════════════════

describe('InvoicePdfController - generateInvoicePdf (preview)', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 200 with HTML content on success', async () => {
    const mockInvoice = buildMockInvoice();
    (invoiceService.findByIdForUser as jest.Mock).mockResolvedValue(mockInvoice);

    const req = createMockReq({ params: { id: VALID_UUID } });
    const res = createMockRes();
    const next = jest.fn();

    await generateInvoicePdf(req, res, next);
    await flushPromises();

    expect(invoiceService.findByIdForUser).toHaveBeenCalledWith(VALID_UUID, 'user-uuid', 'user');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'));
  });
});

describe('InvoicePdfController - downloadInvoicePdf', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 200 with PDF content-type on success', async () => {
    const mockInvoice = buildMockInvoice();
    (invoiceService.findByIdForUser as jest.Mock).mockResolvedValue(mockInvoice);

    const req = createMockReq({ params: { id: VALID_UUID } });
    const res = createMockRes();
    const next = jest.fn();

    await downloadInvoicePdf(req, res, next);
    await flushPromises();

    expect(invoiceService.findByIdForUser).toHaveBeenCalledWith(VALID_UUID, 'user-uuid', 'user');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
  });
});
