/**
 * @fileoverview InvoiceWriteController - Invoice write operations
 * @description Controlador de escritura de facturas — delega a InvoiceService.
 *              Handles invoice creation, status update, and cancellation via InvoiceService.
 * @module controllers/invoices/InvoiceWriteController
 * @author MLM Development Team
 *
 * @example
 * // English: Import from sub-controller
 * import { createInvoice, updateInvoiceStatus, cancelInvoice } from '../controllers/invoices';
 *
 * // Español: Importar desde sub-controlador
 * import { createInvoice, updateInvoiceStatus, cancelInvoice } from '../controllers/invoices';
 */
import { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';
import { invoiceService } from '../../services/InvoiceService';
import type { InvoiceStatus, InvoiceType } from '../../types';

/**
 * UUID validation regex
 * Expresión regular para validación de UUID
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valid invoice type values
 * Valores válidos de tipo de factura
 */
const VALID_TYPES: readonly InvoiceType[] = ['subscription', 'purchase', 'upgrade'];

/**
 * Valid invoice status values
 * Valores válidos de estado de factura
 */
const VALID_STATUSES: readonly InvoiceStatus[] = [
  'draft',
  'issued',
  'paid',
  'cancelled',
  'overdue',
  'refunded',
];

/**
 * Create a new invoice.
 * Crear una nueva factura.
 *
 * Validates required `type` field, then delegates to InvoiceService.create().
 * Valida campo `type` requerido, luego delega a InvoiceService.create().
 *
 * @route POST /api/invoices
 * @access Authenticated
 */
export const createInvoice = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const body = req.body;
    const userId = req.user?.id as string;

    // Validate type is present and valid
    if (!body.type || !VALID_TYPES.includes(body.type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing or invalid invoice type',
          details: {
            type: [`Type must be one of: ${VALID_TYPES.join(', ')}`],
          },
        },
      });
      return;
    }

    const invoice = await invoiceService.create({ ...body, userId });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  }
);

/**
 * Update invoice status with transition validation.
 * Actualizar estado de factura con validación de transición.
 *
 * Validates the new status is a valid InvoiceStatus value, then delegates
 * the transition logic to InvoiceService.updateStatus().
 *
 * @route PATCH /api/invoices/:id/status
 * @access Authenticated
 */
export const updateInvoiceStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate UUID
    if (!UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid invoice ID format',
          details: { id: ['Invoice ID must be a valid UUID'] },
        },
      });
      return;
    }

    // Validate status is present and valid
    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status value',
          details: { status: [`Status must be one of: ${VALID_STATUSES.join(', ')}`] },
        },
      });
      return;
    }

    const invoice = await invoiceService.updateStatus(id, status);

    res.json({
      success: true,
      data: invoice,
    });
  }
);

/**
 * Cancel an invoice with ownership check.
 * Cancelar una factura con verificación de propiedad.
 *
 * Delegates ownership verification and status transition to InvoiceService.cancel().
 * Delega verificación de propiedad y transición de estado a InvoiceService.cancel().
 *
 * @route DELETE /api/invoices/:id
 * @access Authenticated (owner or admin)
 */
export const cancelInvoice = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const role = req.user?.role as string;

    // Validate UUID
    if (!UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid invoice ID format',
          details: { id: ['Invoice ID must be a valid UUID'] },
        },
      });
      return;
    }

    const invoice = await invoiceService.cancel(id, userId, role);

    res.json({
      success: true,
      data: invoice,
    });
  }
);
