/**
 * @fileoverview InvoiceService - Invoice management for billing system
 * @description Handles invoice creation, retrieval, status transitions, and cancellation.
 *             Gestión de facturas: creación, consulta, transiciones de estado y cancelación.
 * @module services/InvoiceService
 * @author MLM Development Team
 *
 * @example
 * // English: Create a new invoice for a user
 * const invoice = await invoiceService.create({ userId, type: 'purchase', items, amount, tax, currency });
 *
 * // Español: Crear nueva factura para un usuario
 * const invoice = await invoiceService.create({ userId, type: 'purchase', items, amount, tax, currency });
 */
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { Invoice } from '../models';
import { AppError } from '../middleware/error.middleware';
import type { InvoiceCreationAttributes, InvoiceStatus, UserRole } from '../types';

/**
 * Valid status transitions for invoices
 * Transiciones de estado válidas para facturas
 *
 * Key = current status, Value = array of allowed next statuses
 * Clave = estado actual, Valor = array de estados siguientes permitidos
 */
const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['issued', 'cancelled'],
  issued: ['paid', 'overdue', 'cancelled'],
  paid: ['refunded'],
  overdue: ['paid', 'cancelled'],
  cancelled: [],
  refunded: [],
};

/**
 * Admin roles that bypass ownership checks
 * Roles de admin que omiten verificación de propiedad
 */
const ADMIN_ROLES: readonly UserRole[] = ['super_admin', 'admin'] as const;

export class InvoiceService {
  /**
   * Generate the next invoice number from the database sequence.
   * Generar el siguiente número de factura desde la secuencia de base de datos.
   *
   * Format: INV-YYYYMM-NNNNN (e.g., INV-202604-00005)
   * Formato: INV-YYYYMM-NNNNN (ej., INV-202604-00005)
   *
   * @returns {Promise<string>} Formatted invoice number / Número de factura formateado
   *
   * @example
   * // English: Get next invoice number
   * const num = await invoiceService.getNextInvoiceNumber(); // 'INV-202604-00042'
   *
   * // Español: Obtener siguiente número de factura
   * const num = await invoiceService.getNextInvoiceNumber(); // 'INV-202604-00042'
   */
  async getNextInvoiceNumber(): Promise<string> {
    const result = (await sequelize.query("SELECT nextval('invoice_number_seq')", {
      type: QueryTypes.SELECT,
    })) as Array<{ nextval: string }>;

    const seq = Number(result[0].nextval);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const datePart = `${year}${month}`;
    const seqPart = String(seq).padStart(5, '0');

    return `INV-${datePart}-${seqPart}`;
  }

  /**
   * Create a new invoice with auto-generated invoice number.
   * Crear nueva factura con número de factura auto-generado.
   *
   * @param {InvoiceCreationAttributes} data - Invoice creation data / Datos de creación de factura
   * @returns {Promise<Invoice>} Created invoice instance / Instancia de factura creada
   * @throws {AppError} 400 VALIDATION_ERROR if items array is empty / si el array de ítems está vacío
   *
   * @example
   * // English: Create an invoice
   * const inv = await invoiceService.create({ userId: 'u1', type: 'purchase', items: [...], amount: 100, tax: 10, currency: 'USD' });
   *
   * // Español: Crear una factura
   * const inv = await invoiceService.create({ userId: 'u1', type: 'purchase', items: [...], amount: 100, tax: 10, currency: 'USD' });
   */
  async create(data: InvoiceCreationAttributes): Promise<Invoice> {
    if (!data.items || data.items.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invoice must have at least one item');
    }

    const invoiceNumber = await this.getNextInvoiceNumber();

    return Invoice.create({
      ...data,
      invoiceNumber,
      status: data.status ?? 'draft',
    } as Record<string, unknown>);
  }

  /**
   * Find an invoice by its primary key.
   * Buscar factura por su clave primaria.
   *
   * @param {string} id - Invoice UUID / UUID de factura
   * @returns {Promise<Invoice>} Invoice instance / Instancia de factura
   * @throws {AppError} 404 INVOICE_NOT_FOUND if not found / si no se encuentra
   *
   * @example
   * // English: Find invoice by ID
   * const invoice = await invoiceService.findById('uuid');
   *
   * // Español: Buscar factura por ID
   * const invoice = await invoiceService.findById('uuid');
   */
  async findById(id: string): Promise<Invoice> {
    const invoice = await Invoice.findByPk(id);

    if (!invoice) {
      throw new AppError(404, 'INVOICE_NOT_FOUND', 'Invoice not found');
    }

    return invoice;
  }

  /**
   * Find invoice by ID with ownership check (admin bypass).
   * Buscar factura por ID con verificación de propiedad (bypass para admin).
   *
   * @param {string} id - Invoice UUID / UUID de factura
   * @param {string} userId - Requesting user's UUID / UUID del usuario solicitante
   * @param {string} role - User role for authorization / Rol del usuario para autorización
   * @returns {Promise<Invoice>} Invoice instance / Instancia de factura
   * @throws {AppError} 404 if not found / si no se encuentra
   * @throws {AppError} 403 INVOICE_FORBIDDEN if user is not owner and not admin / si no es propietario ni admin
   *
   * @example
   * // English: Get invoice with ownership check
   * const invoice = await invoiceService.findByIdForUser('inv-uuid', 'user-uuid', 'user');
   *
   * // Español: Obtener factura con verificación de propiedad
   * const invoice = await invoiceService.findByIdForUser('inv-uuid', 'user-uuid', 'user');
   */
  async findByIdForUser(id: string, userId: string, role: string): Promise<Invoice> {
    const invoice = await this.findById(id);

    const isAdmin = ADMIN_ROLES.includes(role as UserRole);
    if (!isAdmin && invoice.userId !== userId) {
      throw new AppError(
        403,
        'INVOICE_FORBIDDEN',
        'You do not have permission to view this invoice'
      );
    }

    return invoice;
  }

  /**
   * List invoices with optional filters and pagination.
   * Listar facturas con filtros opcionales y paginación.
   *
   * @param {Object} [options] - Filter and pagination options / Opciones de filtro y paginación
   * @param {InvoiceStatus} [options.status] - Filter by status / Filtrar por estado
   * @param {number} [options.page] - Page number (default: 1) / Número de página (default: 1)
   * @param {number} [options.limit] - Items per page (default: 20, max: 100) / Ítems por página
   * @returns {Promise<{ rows: Invoice[], count: number }>} Paginated results / Resultados paginados
   *
   * @example
   * // English: List all draft invoices
   * const { rows, count } = await invoiceService.list({ status: 'draft', page: 1, limit: 10 });
   *
   * // Español: Listar todas las facturas borrador
   * const { rows, count } = await invoiceService.list({ status: 'draft', page: 1, limit: 10 });
   */
  async list(options?: {
    status?: InvoiceStatus;
    page?: number;
    limit?: number;
  }): Promise<{ rows: Invoice[]; count: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }

    return Invoice.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * List invoices for a specific user with optional filters.
   * Listar facturas de un usuario específico con filtros opcionales.
   *
   * @param {string} userId - User UUID / UUID del usuario
   * @param {Object} [options] - Filter and pagination options / Opciones de filtro y paginación
   * @returns {Promise<{ rows: Invoice[], count: number }>} Paginated results / Resultados paginados
   *
   * @example
   * // English: List user's invoices
   * const { rows, count } = await invoiceService.listForUser('user-uuid');
   *
   * // Español: Listar facturas del usuario
   * const { rows, count } = await invoiceService.listForUser('user-uuid');
   */
  async listForUser(
    userId: string,
    options?: { status?: InvoiceStatus; page?: number; limit?: number }
  ): Promise<{ rows: Invoice[]; count: number }> {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (options?.status) {
      where.status = options.status;
    }

    return Invoice.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Update invoice status with transition validation.
   * Actualizar estado de factura con validación de transición.
   *
   * Automatically sets timestamp fields:
   * - draft→issued: sets issuedAt
   * - issued→paid / overdue→paid: sets paidAt
   * - →cancelled: sets cancelledAt
   *
   * Automáticamente establece campos de fecha:
   * - draft→issued: establece issuedAt
   * - issued→paid / overdue→paid: establece paidAt
   * - →cancelled: establece cancelledAt
   *
   * @param {string} id - Invoice UUID / UUID de factura
   * @param {InvoiceStatus} newStatus - Target status / Estado destino
   * @returns {Promise<Invoice>} Updated invoice / Factura actualizada
   * @throws {AppError} 404 if not found / si no se encuentra
   * @throws {AppError} 422 INVALID_STATUS_TRANSITION if transition not allowed / si la transición no es válida
   *
   * @example
   * // English: Issue a draft invoice
   * const invoice = await invoiceService.updateStatus('inv-uuid', 'issued');
   *
   * // Español: Emitir una factura borrador
   * const invoice = await invoiceService.updateStatus('inv-uuid', 'issued');
   */
  async updateStatus(id: string, newStatus: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.findById(id);
    const currentStatus = invoice.status as InvoiceStatus;
    const allowed = STATUS_TRANSITIONS[currentStatus];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(
        422,
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from '${currentStatus}' to '${newStatus}'`
      );
    }

    invoice.status = newStatus;

    // Set timestamp fields based on transition
    const now = new Date();
    if (newStatus === 'issued') {
      invoice.issuedAt = now;
    }
    if (newStatus === 'paid') {
      invoice.paidAt = now;
    }
    if (newStatus === 'cancelled') {
      invoice.cancelledAt = now;
    }

    await invoice.save();
    return invoice;
  }

  /**
   * Cancel an invoice with ownership check.
   * Cancelar una factura con verificación de propiedad.
   *
   * Only invoices in a state that allows transition to 'cancelled' can be cancelled.
   * Solo facturas en un estado que permite transición a 'cancelled' pueden ser canceladas.
   *
   * @param {string} id - Invoice UUID / UUID de factura
   * @param {string} userId - Requesting user UUID / UUID del usuario solicitante
   * @param {string} role - User role / Rol del usuario
   * @returns {Promise<Invoice>} Cancelled invoice / Factura cancelada
   * @throws {AppError} 404 if not found / si no se encuentra
   * @throws {AppError} 403 if forbidden / si no tiene permiso
   * @throws {AppError} 422 if status transition is invalid / si la transición de estado no es válida
   *
   * @example
   * // English: Cancel an invoice
   * const invoice = await invoiceService.cancel('inv-uuid', 'user-uuid', 'user');
   *
   * // Español: Cancelar una factura
   * const invoice = await invoiceService.cancel('inv-uuid', 'user-uuid', 'user');
   */
  async cancel(id: string, userId: string, role: string): Promise<Invoice> {
    const invoice = await this.findByIdForUser(id, userId, role);
    const currentStatus = invoice.status as InvoiceStatus;
    const allowed = STATUS_TRANSITIONS[currentStatus];

    if (!allowed || !allowed.includes('cancelled')) {
      throw new AppError(
        422,
        'INVALID_STATUS_TRANSITION',
        `Cannot cancel invoice with status '${currentStatus}'`
      );
    }

    invoice.status = 'cancelled';
    invoice.cancelledAt = new Date();
    await invoice.save();

    return invoice;
  }
}

/**
 * Singleton instance of InvoiceService
 * Instancia singleton de InvoiceService
 */
export const invoiceService = new InvoiceService();
