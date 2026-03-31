/**
 * @fileoverview InvoicePdfController - PDF generation for invoices
 * @description Controlador de PDF de facturas
 *              Handles invoice PDF generation and download
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
import { invoiceStore } from './store';

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
  name: 'MLM Platform',
  address: '123 Business Street, City, Country',
  phone: '+1 (555) 123-4567',
  email: 'billing@mlmplatform.com',
  taxId: 'TAX-12345678',
};

/**
 * Generate HTML content for invoice PDF
 * Generar contenido HTML para PDF de factura
 */
const generateInvoiceHtml = (invoice: InvoiceData): string => {
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

  const statusColor =
    invoice.status === InvoiceStatus.PAID
      ? '#22c55e'
      : invoice.status === InvoiceStatus.PENDING
        ? '#f59e0b'
        : invoice.status === InvoiceStatus.OVERDUE
          ? '#ef4444'
          : '#6b7280';

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
          <p><strong>${invoice.userName}</strong></p>
          <p>${invoice.userEmail}</p>
          <p>User ID: ${invoice.userId}</p>
        </div>
        <div class="party">
          <h3>Invoice Details</h3>
          <p><strong>Date:</strong> ${formatDate(invoice.createdAt)}</p>
          <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
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
 * Generate and preview invoice as HTML
 * Generar y previsualizar factura como HTML
 *
 * @route GET /api/invoices/:id/preview
 * @access Authenticated (owner or admin)
 * @param {AuthenticatedRequest} req - Express request with invoice ID
 * @param {Response} res - Express response
 * @returns {string} HTML content
 *
 * @swagger
 * /invoices/{id}/preview:
 *   get:
 *     summary: Previsualizar factura / Preview invoice
 *     description: Genera una previsualización HTML de la factura.
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
 *         description: HTML de previsualización / HTML preview
 *       400:
 *         description: ID inválido / Invalid ID format
 *       401:
 *         description: No autorizado / Unauthorized
 *       404:
 *         description: Factura no encontrada / Invoice not found
 */
export const generateInvoicePdf = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Find invoice (mock - replace with actual service call)
    const invoice = invoiceStore.find((inv) => inv.id === id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
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

    // Generate HTML content
    const htmlContent = generateInvoiceHtml(invoice);

    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  }
);

/**
 * Download invoice as PDF
 * Descargar factura como PDF
 *
 * @route GET /api/invoices/:id/pdf
 * @access Authenticated (owner or admin)
 * @param {AuthenticatedRequest} req - Express request with invoice ID
 * @param {Response} res - Express response
 * @returns {Buffer} PDF file
 *
 * @swagger
 * /invoices/{id}/pdf:
 *   get:
 *     summary: Descargar PDF de factura / Download invoice PDF
 *     description: Descarga la factura en formato PDF.
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
 *         description: Archivo PDF / PDF file
 *       400:
 *         description: ID inválido / Invalid ID format
 *       401:
 *         description: No autorizado / Unauthorized
 *       404:
 *         description: Factura no encontrada / Invoice not found
 *       500:
 *         description: Error al generar PDF / PDF generation error
 */
export const downloadInvoicePdf = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Find invoice (mock - replace with actual service call)
    const invoice = invoiceStore.find((inv) => inv.id === id);

    if (!invoice) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
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

    // Generate HTML content
    const htmlContent = generateInvoiceHtml(invoice);

    // NOTE: For production, integrate a PDF library like:
    // - puppeteer (headless Chrome)
    // - pdfkit
    // - wkhtmltopdf
    // For now, return HTML as downloadable file
    // In a real implementation:
    // const pdfBuffer = await generatePdfFromHtml(htmlContent);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${invoice.invoiceNumber}.html"`
    );

    // Sending HTML as placeholder - in production, convert to PDF
    res.send(Buffer.from(htmlContent));
  }
);
