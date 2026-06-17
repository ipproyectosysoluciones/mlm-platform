/**
 * @fileoverview InvoiceStore - Legacy types from in-memory invoice store
 * @description Tipos legacy del almacenamiento en memoria de facturas.
 *              The invoiceStore array has been removed. All persistence is now
 *              handled by the Invoice Sequelize model via InvoiceService.
 * @module controllers/invoices/store
 * @author MLM Development Team
 *
 * @deprecated Use types from `../../types/index.ts` and `InvoiceService` instead.
 *             Usar tipos de `../../types/index.ts` y `InvoiceService` en su lugar.
 */

/**
 * @deprecated Use `InvoiceStatus` type from `../../types/index.ts` instead.
 *             Usar tipo `InvoiceStatus` de `../../types/index.ts`.
 */
export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

/**
 * @deprecated Use `InvoiceType` type from `../../types/index.ts` instead.
 *             Usar tipo `InvoiceType` de `../../types/index.ts`.
 */
export enum InvoiceType {
  SUBSCRIPTION = 'subscription',
  PURCHASE = 'purchase',
  UPGRADE = 'upgrade',
}

/**
 * @deprecated Use `InvoiceItem` interface from `../../types/index.ts` instead.
 *             Usar interfaz `InvoiceItem` de `../../types/index.ts`.
 */
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * @deprecated Use `InvoiceAttributes` interface from `../../types/index.ts` instead.
 *             Usar interfaz `InvoiceAttributes` de `../../types/index.ts`.
 */
export interface InvoiceData {
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
