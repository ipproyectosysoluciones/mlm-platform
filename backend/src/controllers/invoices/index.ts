/**
 * @fileoverview Invoices sub-controllers barrel export
 * @description Barrel export for invoice sub-controllers
 * @module controllers/invoices
 *
 * @example
 * // English: Import from sub-controllers
 * import { getInvoices, getInvoiceById } from '../controllers/invoices';
 * import { createInvoice, updateInvoice, deleteInvoice } from '../controllers/invoices';
 * import { generateInvoicePdf, downloadInvoicePdf } from '../controllers/invoices';
 *
 * // Español: Importar desde sub-controladores
 * import { getInvoices, getInvoiceById } from '../controllers/invoices';
 * import { createInvoice, updateInvoice, deleteInvoice } from '../controllers/invoices';
 * import { generateInvoicePdf, downloadInvoicePdf } from '../controllers/invoices';
 */

// Invoice read controller (retrieval operations)
export { getInvoices, getInvoiceById } from './InvoiceReadController';

// Invoice write controller (CRUD operations)
export { createInvoice, updateInvoice, deleteInvoice } from './InvoiceWriteController';

// Invoice PDF controller (PDF generation)
export { generateInvoicePdf, downloadInvoicePdf } from './InvoicePdfController';
