/**
 * @fileoverview InvoiceStore - Centralized mock data store for invoices
 * @description Almacenamiento centralizado de datos mock para facturas
 *              This ensures all invoice controllers share the same data
 * @module controllers/invoices/store
 * @author MLM Development Team
 */

/**
 * Invoice status enum
 * Enum de estados de factura
 */
export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

/**
 * Invoice type enum
 * Enum de tipos de factura
 */
export enum InvoiceType {
  SUBSCRIPTION = 'subscription',
  PURCHASE = 'purchase',
  UPGRADE = 'upgrade',
}

/**
 * Invoice item interface
 * Interfaz de ítem de factura
 */
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Invoice data structure
 * Estructura de datos de factura
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

/**
 * Shared invoice storage
 * Almacenamiento compartido de facturas
 * This array is shared across all invoice controllers
 */
export const invoiceStore: InvoiceData[] = [];
