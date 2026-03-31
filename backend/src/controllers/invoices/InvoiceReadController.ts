/**
 * @fileoverview InvoiceReadController - Invoice retrieval operations
 * @description Controlador de lectura de facturas
 *              Handles invoice listing and retrieval by ID
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

/**
 * UUID validation regex
 * Expresión regular para validación de UUID
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Invoice status enum
 * Enum de estados de factura
 */
enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

/**
 * Invoice type enum
 * Enum de tipos de factura
 */
enum InvoiceType {
  SUBSCRIPTION = 'subscription',
  PURCHASE = 'purchase',
  UPGRADE = 'upgrade',
}

/**
 * Mock invoice data structure (to be replaced with actual service)
 * Estructura de datos de factura mockeada (reemplazar con servicio real)
 */
interface InvoiceData {
  id: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: InvoiceType;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  description: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  paidAt?: Date;
}

/**
 * Mock invoice service (placeholder for future implementation)
 * Servicio mock de facturas (placeholder para futura implementación)
 */
const mockInvoices: InvoiceData[] = [];

/**
 * Get list of invoices with pagination and optional status filtering
 * Obtener lista de facturas con paginación y filtro opcional por estado
 *
 * @route GET /api/invoices
 * @access Authenticated (user or admin)
 * @param {AuthenticatedRequest} req - Express request with query params
 * @param {Response} res - Express response
 * @returns {ApiResponse} Paginated invoice list
 *
 * @swagger
 * /invoices:
 *   get:
 *     summary: Listar facturas / List invoices
 *     description: Obtiene lista de facturas con paginación opcional. Requiere autenticación.
 *     tags: [invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página / Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Límite por página / Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, cancelled, overdue]
 *         description: Filtrar por estado / Filter by status
 *     responses:
 *       200:
 *         description: Lista de facturas / Invoice list
 *       401:
 *         description: No autorizado / Unauthorized
 *       500:
 *         description: Error del servidor / Server error
 */
export const getInvoices = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;

    // Validate status filter
    let validatedStatus: InvoiceStatus | undefined;
    if (status && Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      validatedStatus = status as InvoiceStatus;
    }

    // Mock implementation - replace with actual service call
    const filteredInvoices = validatedStatus
      ? mockInvoices.filter((inv) => inv.status === validatedStatus)
      : mockInvoices;

    const offset = (page - 1) * limit;
    const paginatedInvoices = filteredInvoices.slice(offset, offset + limit);

    const response = {
      success: true,
      data: paginatedInvoices,
      pagination: {
        total: filteredInvoices.length,
        page,
        limit,
        totalPages: Math.ceil(filteredInvoices.length / limit),
      },
    };

    res.json(response);
  }
);

/**
 * Get single invoice by ID
 * Obtener factura individual por ID
 *
 * @route GET /api/invoices/:id
 * @access Authenticated (owner or admin)
 * @param {AuthenticatedRequest} req - Express request with invoice ID param
 * @param {Response} res - Express response
 * @returns {ApiResponse} Single invoice details
 *
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Obtener factura por ID / Get invoice by ID
 *     description: Retorna los detalles de una factura específica. Requiere autenticación.
 *     tags: [invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la factura / Invoice ID
 *     responses:
 *       200:
 *         description: Detalles de la factura / Invoice details
 *       404:
 *         description: Factura no encontrada / Invoice not found
 *       400:
 *         description: ID inválido / Invalid ID format
 *       401:
 *         description: No autorizado / Unauthorized
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

    // Mock implementation - replace with actual service call
    const invoice = mockInvoices.find((inv) => inv.id === id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
          details: {
            id: ['Invoice with the specified ID does not exist'],
          },
        },
      });
      return;
    }

    // Check ownership (mock - implement actual authorization)
    // const userId = req.user?.id;
    // if (invoice.userId !== userId && req.user?.role !== 'admin') {
    //   res.status(403).json({
    //     success: false,
    //     error: {
    //       code: 'FORBIDDEN',
    //       message: 'Access denied to this invoice',
    //     },
    //   });
    //   return;
    // }

    const response = {
      success: true,
      data: invoice,
    };

    res.json(response);
  }
);
