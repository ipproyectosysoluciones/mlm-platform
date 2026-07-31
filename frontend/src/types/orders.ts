/** Domain types for orders / Tipos de dominio para pedidos. @module types/orders */

import type { Product } from './products';

// Order Types - Streaming Subscriptions E-Commerce
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'simulated' | 'paypal' | 'mercadopago';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  productId: string;
  product?: Product;
  purchaseId?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  /** Amount from POST /orders (create) response */
  amount: number;
  /** Total amount from GET /orders (list/single) response */
  totalAmount?: number;
  currency: string;
  commissionTotal?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateOrderRequest {
  productId: string;
  paymentMethod: PaymentMethod;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
