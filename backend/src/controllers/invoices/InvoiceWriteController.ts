/**
 * @fileoverview InvoiceWriteController - Invoice write operations
 * @description Controlador de escritura de facturas
 *              Handles invoice creation, update, and deletion
 * @module controllers/invoices/InvoiceWriteController
 * @author MLM Development Team
 *
 * @example
 * // English: Import from sub-controller
 * import { createInvoice, updateInvoice, deleteInvoice } from '../controllers/invoices';
 *
 * // Español: Importar desde sub-controlador
 * import { createInvoice, updateInvoice, deleteInvoice } from '../controllers/invoices';
 */
import { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';
import {
  invoiceStore,
  InvoiceStatus,
  InvoiceType,
  type InvoiceData,
  type InvoiceItem,
} from './store';

/**
 * UUID validation regex
 * Expresión regular para validación de UUID
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Create invoice request body interface
 * Interfaz de cuerpo para crear factura
 */
interface CreateInvoiceBody {
  userId: string;
  type: InvoiceType;
  description: string;
  items: InvoiceItem[];
  dueDate: string;
}

/**
 * Update invoice request body interface
 * Interfaz de cuerpo para actualizar factura
 */
interface UpdateInvoiceBody {
  status?: InvoiceStatus;
  description?: string;
  dueDate?: string;
  paidAt?: string;
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
  items: InvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  paidAt?: Date;
}

/**
 * Generate unique invoice number
 * Generar número único de factura
 */
const generateInvoiceNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `INV-${timestamp}-${random}`;
};

/**
 * Create a new invoice
 * Crear una nueva factura
 *
 * @route POST /api/invoices
 * @access Admin only
 * @param {AuthenticatedRequest} req - Express request with invoice data
 * @param {Response} res - Express response
 * @returns {ApiResponse} Created invoice
 *
 * @swagger
 * /invoices:
 *   post:
 *     summary: Crear factura / Create invoice
 *     description: Crea una nueva factura. Solo accesible por administradores.
 *     tags: [invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - description
 *               - items
 *               - dueDate
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [subscription, purchase, upgrade]
 *               description:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Factura creada / Invoice created
 *       400:
 *         description: Datos inválidos / Invalid data
 *       401:
 *         description: No autorizado / Unauthorized
 *       403:
 *         description: Prohibido / Forbidden (not admin)
 */
export const createInvoice = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Check admin role (mock - implement actual check)
    // if (req.user?.role !== 'admin') {
    //   res.status(403).json({
    //     success: false,
    //     error: {
    //       code: 'FORBIDDEN',
    //       message: 'Admin access required',
    //     },
    //   });
    //   return;
    // }

    const body = req.body as CreateInvoiceBody;

    // Validate required fields
    if (!body.userId || !body.type || !body.description || !body.items || !body.dueDate) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            fields: ['userId', 'type', 'description', 'items', 'dueDate'],
          },
        },
      });
      return;
    }

    // Validate UUID format
    if (!UUID_REGEX.test(body.userId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID format',
          details: {
            userId: ['User ID must be a valid UUID'],
          },
        },
      });
      return;
    }

    // Validate invoice type
    if (!Object.values(InvoiceType).includes(body.type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid invoice type',
          details: {
            type: ['Type must be one of: subscription, purchase, upgrade'],
          },
        },
      });
      return;
    }

    // Validate items array
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Items array is required and cannot be empty',
        },
      });
      return;
    }

    // Calculate total amount
    const totalAmount = body.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Create new invoice (mock - replace with actual service call)
    const newInvoice: InvoiceData = {
      id: crypto.randomUUID(),
      invoiceNumber: generateInvoiceNumber(),
      userId: body.userId,
      userName: 'User Name', // Mock - get from user service
      userEmail: 'user@example.com', // Mock - get from user service
      type: body.type,
      status: InvoiceStatus.PENDING,
      amount: totalAmount,
      currency: 'USD',
      description: body.description,
      items: body.items,
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: new Date(body.dueDate),
    };

    invoiceStore.push(newInvoice);

    const response = {
      success: true,
      data: newInvoice,
    };

    res.status(201).json(response);
  }
);

/**
 * Update an existing invoice
 * Actualizar una factura existente
 *
 * @route PUT /api/invoices/:id
 * @access Admin only
 * @param {AuthenticatedRequest} req - Express request with invoice ID and update data
 * @param {Response} res - Express response
 * @returns {ApiResponse} Updated invoice
 *
 * @swagger
 * /invoices/{id}:
 *   put:
 *     summary: Actualizar factura / Update invoice
 *     description: Actualiza una factura existente. Solo accesible por administradores.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, cancelled, overdue]
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               paidAt:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Factura actualizada / Invoice updated
 *       400:
 *         description: Datos inválidos / Invalid data
 *       401:
 *         description: No autorizado / Unauthorized
 *       403:
 *         description: Prohibido / Forbidden
 *       404:
 *         description: Factura no encontrada / Invoice not found
 */
export const updateInvoice = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Check admin role (mock - implement actual check)
    // if (req.user?.role !== 'admin') {
    //   res.status(403).json({
    //     success: false,
    //     error: {
    //       code: 'FORBIDDEN',
    //       message: 'Admin access required',
    //     },
    //   });
    //   return;
    // }

    const { id } = req.params;
    const body = req.body as UpdateInvoiceBody;

    // Validate UUID format
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

    // Find invoice (mock - replace with actual service call)
    const invoiceIndex = invoiceStore.findIndex((inv) => inv.id === id);

    if (invoiceIndex === -1) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      });
      return;
    }

    const invoice = invoiceStore[invoiceIndex];

    // Validate status if provided
    if (body.status && !Object.values(InvoiceStatus).includes(body.status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status value',
        },
      });
      return;
    }

    // Update fields
    if (body.status) {
      invoice.status = body.status;
      if (body.status === InvoiceStatus.PAID && body.paidAt) {
        invoice.paidAt = new Date(body.paidAt);
      }
    }
    if (body.description) {
      invoice.description = body.description;
    }
    if (body.dueDate) {
      invoice.dueDate = new Date(body.dueDate);
    }
    if (body.paidAt) {
      invoice.paidAt = new Date(body.paidAt);
    }

    invoice.updatedAt = new Date();

    const response = {
      success: true,
      data: invoice,
    };

    res.json(response);
  }
);

/**
 * Delete an invoice
 * Eliminar una factura
 *
 * @route DELETE /api/invoices/:id
 * @access Admin only
 * @param {AuthenticatedRequest} req - Express request with invoice ID
 * @param {Response} res - Express response
 * @returns {ApiResponse} Deletion confirmation
 *
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Eliminar factura / Delete invoice
 *     description: Elimina una factura. Solo accesible por administradores.
 *         Nota: En producción, se recomienda marcar como cancelada en lugar de eliminar.
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
 *         description: Factura eliminada / Invoice deleted
 *       400:
 *         description: ID inválido / Invalid ID format
 *       401:
 *         description: No autorizado / Unauthorized
 *       403:
 *         description: Prohibido / Forbidden
 *       404:
 *         description: Factura no encontrada / Invoice not found
 */
export const deleteInvoice = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Check admin role (mock - implement actual check)
    // if (req.user?.role !== 'admin') {
    //   res.status(403).json({
    //     success: false,
    //     error: {
    //       code: 'FORBIDDEN',
    //       message: 'Admin access required',
    //     },
    //   });
    //   return;
    // }

    const { id } = req.params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid invoice ID format',
        },
      });
      return;
    }

    // Find and delete invoice (mock - replace with actual service call)
    const invoiceIndex = invoiceStore.findIndex((inv) => inv.id === id);

    if (invoiceIndex === -1) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      });
      return;
    }

    // In production, prefer soft delete (mark as cancelled) instead of hard delete
    // For now, we'll implement hard delete in mock
    const deletedInvoice = invoiceStore.splice(invoiceIndex, 1)[0];

    const response = {
      success: true,
      data: {
        message: 'Invoice deleted successfully',
        deletedId: deletedInvoice.id,
      },
    };

    res.json(response);
  }
);
