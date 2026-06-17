/**
 * @fileoverview Invoices sub-controllers barrel export
 * @description Barrel export for invoice sub-controllers.
 *              Exportación barrel de sub-controladores de facturas.
 * @module controllers/invoices
 *
 * @example
 * // English: Import from sub-controllers
 * import { getInvoices, getInvoiceById } from '../controllers/invoices';
 * import { createInvoice, updateInvoiceStatus, cancelInvoice } from '../controllers/invoices';
 * import { generateInvoicePdf, downloadInvoicePdf } from '../controllers/invoices';
 *
 * // Español: Importar desde sub-controladores
 * import { getInvoices, getInvoiceById } from '../controllers/invoices';
 * import { createInvoice, updateInvoiceStatus, cancelInvoice } from '../controllers/invoices';
 * import { generateInvoicePdf, downloadInvoicePdf } from '../controllers/invoices';
 */

// Invoice read controller (retrieval operations)
export { getInvoices, getInvoiceById } from './InvoiceReadController';

// Invoice write controller (create, status update, cancellation)
export { createInvoice, updateInvoiceStatus, cancelInvoice } from './InvoiceWriteController';

// Invoice PDF controller (PDF generation)
export { generateInvoicePdf, downloadInvoicePdf } from './InvoicePdfController';
