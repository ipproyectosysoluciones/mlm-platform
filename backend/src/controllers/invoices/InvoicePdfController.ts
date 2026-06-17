/**
 * @fileoverview InvoicePdfController - PDF generation for invoices
 * @description Controlador de PDF de facturas — delega a InvoiceService.
 *              Handles invoice PDF generation and download via InvoiceService.
 * @module controllers/invoices/InvoicePdfController
 * @author MLM Development Team
 *
 * @example
 * // English: Import from sub-controller
 * import { generateInvoicePdf, downloadInvoicePdf } from '../controllers/invoices';
 *
 * // Español: Importar desde sub-controlador
 * import { generateInvoicePdf, downloadInvoicePdf } from '../controllers/invoices';
 */
import { Response } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler';
import { invoiceService } from '../../services/InvoiceService';
import { config } from '../../config/env';

/**
 * UUID validation regex
 * Expresión regular para validación de UUID
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Company information for PDF generation
 * Información de la empresa para generación de PDF
 */
const COMPANY_INFO = {
  name: 'Nexo Real',
  address: '123 Business Street, City, Country',
  phone: '+1 (555) 123-4567',
  email: `billing@${config.platform.domain}`,
  taxId: 'TAX-12345678',
};

/**
 * Shape of invoice data used for HTML generation.
 * Forma de datos de factura usados para generación HTML.
 *
 * Accepts both the Sequelize model instance and legacy compat fields.
 */
interface InvoiceForHtml {
  invoiceNumber: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  description?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: Date;
  dueDate?: Date;
  dueAt?: Date | null;
  paidAt?: Date | null;
}

/**
 * Generate HTML content for invoice PDF.
 * Generar contenido HTML para PDF de factura.
 *
 * @param {InvoiceForHtml} invoice - Invoice data / Datos de factura
 * @returns {string} HTML string / Cadena HTML
 */
const generateInvoiceHtml = (invoice: InvoiceForHtml): string => {
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const itemsHtml = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unitPrice, invoice.currency)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.total, invoice.currency)}</td>
      </tr>
    `
    )
    .join('');

  // Status color mapping — supports both old enum and new string literals
  const statusLower = invoice.status.toLowerCase();
  const statusColor =
    statusLower === 'paid'
      ? '#22c55e'
      : statusLower === 'draft' || statusLower === 'issued' || statusLower === 'pending'
        ? '#f59e0b'
        : statusLower === 'overdue'
          ? '#ef4444'
          : '#6b7280';

  // Support both legacy (dueDate) and new (dueAt) field names
  const dueDate = invoice.dueDate ?? invoice.dueAt;
  const userName = invoice.userName ?? `User ${invoice.userId}`;
  const userEmail = invoice.userEmail ?? '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .company-info h1 {
          color: #1e40af;
          font-size: 28px;
          margin: 0 0 10px 0;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info h2 {
          margin: 0 0 10px 0;
          color: #1e40af;
        }
        .invoice-number {
          color: #666;
          font-size: 14px;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          background-color: ${statusColor};
        }
        .parties {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .party {
          width: 45%;
        }
        .party h3 {
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .party p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        thead th {
          background-color: #f8fafc;
          padding: 12px 10px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          color: #666;
          border-bottom: 2px solid #e2e8f0;
        }
        .totals {
          text-align: right;
          margin-bottom: 40px;
        }
        .totals .total-row {
          display: flex;
          justify-content: flex-end;
          padding: 8px 0;
        }
        .totals .label {
          width: 150px;
          color: #666;
        }
        .totals .value {
          width: 100px;
          text-align: right;
          font-weight: bold;
        }
        .totals .grand-total {
          font-size: 18px;
          color: #1e40af;
          border-top: 2px solid #e2e8f0;
          padding-top: 10px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${COMPANY_INFO.name}</h1>
          <p>${COMPANY_INFO.address}</p>
          <p>${COMPANY_INFO.phone}</p>
          <p>${COMPANY_INFO.email}</p>
          <p>Tax ID: ${COMPANY_INFO.taxId}</p>
        </div>
        <div class="invoice-info">
          <h2>INVOICE</h2>
          <div class="invoice-number">${invoice.invoiceNumber}</div>
          <div style="margin-top: 10px;">
            <span class="status">${invoice.status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <h3>Bill To</h3>
          <p><strong>${userName}</strong></p>
          <p>${userEmail}</p>
          <p>User ID: ${invoice.userId}</p>
        </div>
        <div class="party">
          <h3>Invoice Details</h3>
          <p><strong>Date:</strong> ${formatDate(invoice.createdAt)}</p>
          ${dueDate ? `<p><strong>Due Date:</strong> ${formatDate(dueDate)}</p>` : ''}
          <p><strong>Type:</strong> ${invoice.type}</p>
          ${invoice.paidAt ? `<p><strong>Paid On:</strong> ${formatDate(invoice.paidAt)}</p>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span class="label">Subtotal:</span>
          <span class="value">${formatCurrency(invoice.amount, invoice.currency)}</span>
        </div>
        <div class="total-row">
          <span class="label">Tax (0%):</span>
          <span class="value">${formatCurrency(0, invoice.currency)}</span>
        </div>
        <div class="total-row grand-total">
          <span class="label">Total:</span>
          <span class="value">${formatCurrency(invoice.amount, invoice.currency)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>For questions about this invoice, contact ${COMPANY_INFO.email}</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate and preview invoice as HTML.
 * Generar y previsualizar factura como HTML.
 *
 * @route GET /api/invoices/:id/preview
 * @access Authenticated (owner or admin)
 */
export const generateInvoicePdf = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

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

    const userId = req.user?.id as string;
    const role = req.user?.role as string;

    const invoice = await invoiceService.findByIdForUser(id, userId, role);

    const htmlContent = generateInvoiceHtml(invoice as unknown as InvoiceForHtml);

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  }
);

/**
 * Download invoice as PDF.
 * Descargar factura como PDF.
 *
 * @route GET /api/invoices/:id/pdf
 * @access Authenticated (owner or admin)
 */
export const downloadInvoicePdf = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

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

    const userId = req.user?.id as string;
    const role = req.user?.role as string;

    const invoice = await invoiceService.findByIdForUser(id, userId, role);

    const htmlContent = generateInvoiceHtml(invoice as unknown as InvoiceForHtml);

    // NOTE: For production, integrate a PDF library like puppeteer or pdfkit.
    // For now, return HTML content as PDF placeholder.
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
    );
    res.send(Buffer.from(htmlContent));
  }
);
