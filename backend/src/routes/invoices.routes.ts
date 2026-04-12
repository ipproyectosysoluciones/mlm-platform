/**
 * @fileoverview InvoiceRoutes - Invoice route definitions and validation
 * @description Defines API routes for invoices with authentication, authorization, and validation.
 *             Define las rutas de API para facturas con autenticación, autorización y validación.
 * @module routes/invoices.routes
 * @author MLM Development Team
 *
 * @example
 * // English: GET /api/invoices - List invoices (user sees own, admin sees all)
 * router.get('/', authenticateToken, getInvoices);
 *
 * // Español: GET /api/invoices - Listar facturas (usuario ve las propias, admin ve todas)
 * router.get('/', authenticateToken, getInvoices);
 */
import { Router, Router as ExpressRouter } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  cancelInvoice,
  generateInvoicePdf,
  downloadInvoicePdf,
} from '../controllers/invoices';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { body, param, query } from 'express-validator';

const router: ExpressRouter = Router();

/**
 * Valid invoice types for validation.
 * Tipos de factura válidos para validación.
 */
const VALID_TYPES = ['subscription', 'purchase', 'upgrade'] as const;

/**
 * Valid invoice statuses for validation.
 * Estados de factura válidos para validación.
 */
const VALID_STATUSES = ['draft', 'issued', 'paid', 'cancelled', 'overdue', 'refunded'] as const;

/**
 * UUID regex matching the project convention (accepts any valid UUID including nil UUID).
 * Regex UUID que sigue la convención del proyecto (acepta cualquier UUID válido incluyendo nil UUID).
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================
// READ ROUTES
// ============================================

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Listar facturas / List invoices
 *     description: |
 *       Obtiene lista de facturas del usuario autenticado con paginación y filtros opcionales.
 *       Admins ven todas las facturas; usuarios regulares solo las propias.
 *       Gets paginated invoice list for the authenticated user with optional filters.
 *       Admins see all invoices; regular users see only their own.
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
 *           enum: [draft, issued, paid, cancelled, overdue, refunded]
 *         description: Filtrar por estado / Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [subscription, purchase, upgrade]
 *         description: Filtrar por tipo / Filter by type
 *     responses:
 *       200:
 *         description: Lista de facturas / Invoice list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invoice'
 *                 meta:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: No autenticado / Not authenticated
 *       500:
 *         description: Error interno / Internal error
 */
router.get(
  '/',
  authenticateToken,
  validate([
    // Validate page query parameter / Validar parámetro de consulta page
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    // Validate limit query parameter / Validar parámetro de consulta limit
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    // Validate status query parameter / Validar parámetro de consulta status
    query('status')
      .optional()
      .isIn([...VALID_STATUSES])
      .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
    // Validate type query parameter / Validar parámetro de consulta type
    query('type')
      .optional()
      .isIn([...VALID_TYPES])
      .withMessage(`Type must be one of: ${VALID_TYPES.join(', ')}`),
  ]),
  asyncHandler(getInvoices)
);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Obtener factura por ID / Get invoice by ID
 *     description: |
 *       Retorna los detalles de una factura específica. Solo el propietario o admin puede verla.
 *       Returns details of a specific invoice. Only the owner or admin can view it.
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
 *       400:
 *         description: ID inválido / Invalid ID format
 *       401:
 *         description: No autenticado / Not authenticated
 *       403:
 *         description: Acceso denegado / Access denied
 *       404:
 *         description: Factura no encontrada / Invoice not found
 */
router.get(
  '/:id',
  authenticateToken,
  validate([
    // Validate UUID format for invoice ID / Validar formato UUID para ID de factura
    param('id').matches(UUID_REGEX).withMessage('Invoice ID must be a valid UUID'),
  ]),
  asyncHandler(getInvoiceById)
);

// ============================================
// WRITE ROUTES
// ============================================

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Crear factura / Create invoice
 *     description: |
 *       Crea una nueva factura. Requiere rol admin.
 *       Creates a new invoice. Requires admin role.
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
 *               - type
 *               - amount
 *               - items
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [subscription, purchase, upgrade]
 *                 description: Tipo de factura / Invoice type
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Monto total / Total amount
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                       description: Descripción del ítem / Item description
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Cantidad / Quantity
 *                     unitPrice:
 *                       type: number
 *                       description: Precio unitario / Unit price
 *                     total:
 *                       type: number
 *                       description: Total del ítem / Item total
 *               currency:
 *                 type: string
 *                 default: USD
 *                 description: Moneda / Currency
 *               description:
 *                 type: string
 *                 description: Descripción / Description
 *     responses:
 *       201:
 *         description: Factura creada exitosamente / Invoice created successfully
 *       400:
 *         description: Error de validación / Validation error
 *       401:
 *         description: No autenticado / Not authenticated
 *       403:
 *         description: Acceso denegado — se requiere admin / Access denied — admin required
 *       500:
 *         description: Error interno / Internal error
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate([
    // Validate invoice type / Validar tipo de factura
    body('type')
      .isIn([...VALID_TYPES])
      .withMessage(`Type must be one of: ${VALID_TYPES.join(', ')}`),
    // Validate amount is a positive number / Validar que el monto sea un número positivo
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    // Validate items is a non-empty array / Validar que items sea un array no vacío
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  ]),
  asyncHandler(createInvoice)
);

/**
 * @swagger
 * /invoices/{id}/status:
 *   patch:
 *     summary: Actualizar estado de factura / Update invoice status
 *     description: |
 *       Actualiza el estado de una factura con validación de transición. Requiere rol admin.
 *       Updates invoice status with transition validation. Requires admin role.
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, issued, paid, cancelled, overdue, refunded]
 *                 description: Nuevo estado / New status
 *     responses:
 *       200:
 *         description: Estado actualizado / Status updated
 *       400:
 *         description: Estado inválido o transición no permitida / Invalid status or forbidden transition
 *       401:
 *         description: No autenticado / Not authenticated
 *       403:
 *         description: Acceso denegado — se requiere admin / Access denied — admin required
 *       404:
 *         description: Factura no encontrada / Invoice not found
 */
router.patch(
  '/:id/status',
  authenticateToken,
  requireAdmin,
  validate([
    // Validate UUID format for invoice ID / Validar formato UUID para ID de factura
    param('id').matches(UUID_REGEX).withMessage('Invoice ID must be a valid UUID'),
    // Validate status value / Validar valor de estado
    body('status')
      .isIn([...VALID_STATUSES])
      .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  ]),
  asyncHandler(updateInvoiceStatus)
);

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Cancelar factura / Cancel invoice
 *     description: |
 *       Cancela una factura. El propietario o admin puede cancelar.
 *       Cancels an invoice. Owner or admin can cancel.
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
 *         description: Factura cancelada / Invoice cancelled
 *       400:
 *         description: ID inválido o cancelación no permitida / Invalid ID or cancellation not allowed
 *       401:
 *         description: No autenticado / Not authenticated
 *       403:
 *         description: Acceso denegado / Access denied
 *       404:
 *         description: Factura no encontrada / Invoice not found
 */
router.delete(
  '/:id',
  authenticateToken,
  validate([
    // Validate UUID format for invoice ID / Validar formato UUID para ID de factura
    param('id').matches(UUID_REGEX).withMessage('Invoice ID must be a valid UUID'),
  ]),
  asyncHandler(cancelInvoice)
);

// ============================================
// PDF ROUTES
// ============================================

/**
 * @swagger
 * /invoices/{id}/preview:
 *   get:
 *     summary: Previsualizar factura como HTML / Preview invoice as HTML
 *     description: |
 *       Genera y retorna la factura como HTML para previsualización.
 *       Generates and returns the invoice as HTML for preview.
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
 *         description: HTML de la factura / Invoice HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: ID inválido / Invalid ID format
 *       401:
 *         description: No autenticado / Not authenticated
 *       403:
 *         description: Acceso denegado / Access denied
 *       404:
 *         description: Factura no encontrada / Invoice not found
 */
router.get(
  '/:id/preview',
  authenticateToken,
  validate([
    // Validate UUID format for invoice ID / Validar formato UUID para ID de factura
    param('id').matches(UUID_REGEX).withMessage('Invoice ID must be a valid UUID'),
  ]),
  asyncHandler(generateInvoicePdf)
);

/**
 * @swagger
 * /invoices/{id}/pdf:
 *   get:
 *     summary: Descargar factura como PDF / Download invoice as PDF
 *     description: |
 *       Genera y descarga la factura como PDF.
 *       Generates and downloads the invoice as PDF.
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
 *         description: Archivo PDF de la factura / Invoice PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: ID inválido / Invalid ID format
 *       401:
 *         description: No autenticado / Not authenticated
 *       403:
 *         description: Acceso denegado / Access denied
 *       404:
 *         description: Factura no encontrada / Invoice not found
 */
router.get(
  '/:id/pdf',
  authenticateToken,
  validate([
    // Validate UUID format for invoice ID / Validar formato UUID para ID de factura
    param('id').matches(UUID_REGEX).withMessage('Invoice ID must be a valid UUID'),
  ]),
  asyncHandler(downloadInvoicePdf)
);

export default router;
