/**
 * @fileoverview InvoiceController - Invoice API endpoints
 * @description Controlador principal de facturas — re-exporta sub-controladores.
 *              Handles all invoice-related API endpoints.
 *              This file re-exports from sub-controllers.
 * @module controllers/InvoiceController
 * @author MLM Development Team
 *
 * @example
 * // English: GET /api/invoices - List all invoices
 * const response = await fetch('/api/invoices?page=1&limit=20');
 *
 * // Español: GET /api/invoices - Listar todas las facturas
 * const response = await fetch('/api/invoices?page=1&limit=20');
 */

// Re-export from sub-controllers
// Read operations
export { getInvoices, getInvoiceById } from './invoices/InvoiceReadController';

// Write operations (create, status update, cancellation)
export {
  createInvoice,
  updateInvoiceStatus,
  cancelInvoice,
} from './invoices/InvoiceWriteController';

// PDF operations
export { generateInvoicePdf, downloadInvoicePdf } from './invoices/InvoicePdfController';
