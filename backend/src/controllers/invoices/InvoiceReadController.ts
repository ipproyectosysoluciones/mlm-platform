/**
 * @fileoverview InvoiceReadController - Invoice retrieval operations
 * @description Controlador de lectura de facturas — delega a InvoiceService.
 *              Handles invoice listing and retrieval by ID via InvoiceService.
 * @module controllers/invoices/InvoiceReadController
 * @author MLM Development Team
 *
 * @example
 * // English: Import from sub-controller
 * import { getInvoices, getInvoiceById } from '../controllers/invoices';
 *
 * // Español: Importar desde sub-controlador
 * import { getInvoices, getInvoiceById } from '../controllers/invoices';
 */
import { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';
import { invoiceService } from '../../services/InvoiceService';
import type { InvoiceStatus } from '../../types';

/**
 * UUID validation regex
 * Expresión regular para validación de UUID
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valid invoice status values for filter validation
 * Valores válidos de estado de factura para validación de filtros
 */
const VALID_STATUSES: readonly string[] = [
  'draft',
  'issued',
  'paid',
  'cancelled',
  'overdue',
  'refunded',
];

/**
 * Get list of invoices with pagination and optional status filtering.
 * Admin users see all invoices; regular users see only their own.
 *
 * Obtener lista de facturas con paginación y filtro opcional por estado.
 * Admins ven todas las facturas; usuarios regulares solo las propias.
 *
 * @route GET /api/invoices
 * @access Authenticated (user or admin)
 */
export const getInvoices = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;

    const userId = req.user?.id as string;
    const role = req.user?.role as string;
    const isAdmin = role === 'admin' || role === 'super_admin';

    // Build options — only include status if it's a valid value
    const options: { status?: InvoiceStatus; page: number; limit: number } = { page, limit };
    if (status && VALID_STATUSES.includes(status)) {
      options.status = status as InvoiceStatus;
    }

    const result = isAdmin
      ? await invoiceService.list(options)
      : await invoiceService.listForUser(userId, options);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total: result.count,
        page,
        limit,
      },
    });
  }
);

/**
 * Get single invoice by ID with ownership check.
 * Obtener factura individual por ID con verificación de propiedad.
 *
 * @route GET /api/invoices/:id
 * @access Authenticated (owner or admin)
 */
export const getInvoiceById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid invoice ID format',
          details: {
            id: ['Invoice ID must be a valid UUID'],
          },
        },
      });
      return;
    }

    const userId = req.user?.id as string;
    const role = req.user?.role as string;

    const invoice = await invoiceService.findByIdForUser(id, userId, role);

    res.json({
      success: true,
      data: invoice,
    });
  }
);
