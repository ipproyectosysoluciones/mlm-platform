/** Domain types for marketplace vendors / Tipos de dominio para vendedores del marketplace. @module types/vendor */

// ============================================
// MARKETPLACE MULTI-VENDOR — Phase 2 (#25)
// MULTI-VENDEDOR — Fase 2 (#25)
// ============================================

/**
 * Vendor status lifecycle
 * Ciclo de vida del estado del vendedor
 */
export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

/**
 * Vendor order status
 * Estado del pedido del vendedor
 */
export type VendorOrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

/**
 * Vendor payout status
 * Estado del pago al vendedor
 */
export type VendorPayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Vendor attributes
 * Atributos del vendedor
 */
export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  status: VendorStatus;
  commissionRate: number;
  contactEmail: string;
  contactPhone?: string | null;
  address?: Record<string, unknown> | null;
  bankDetails?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor creation payload
 * Payload para crear vendedor
 */
export interface VendorRegistrationPayload {
  businessName: string;
  contactEmail: string;
  contactPhone?: string;
  description?: string;
  address?: Record<string, unknown>;
}

/**
 * Vendor order attributes
 * Atributos del pedido del vendedor
 */
export interface VendorOrder {
  id: string;
  orderId: string;
  vendorId?: string | null;
  subtotal: number;
  commissionAmount: number;
  vendorAmount: number;
  platformAmount: number;
  status: VendorOrderStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor payout attributes
 * Atributos del pago al vendedor
 */
export interface VendorPayout {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  status: VendorPayoutStatus;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor payout request
 * Solicitud de pago del vendedor
 */
export interface VendorPayoutRequest {
  amount: number;
  paymentMethod?: string;
}

/**
 * Vendor dashboard data
 * Datos del panel del vendedor
 */
export interface VendorDashboard {
  totalSales: number;
  totalRevenue: number;
  pendingPayouts: number;
  productCount: number;
  recentSales: Array<{
    orderId: string;
    amount: number;
    status: VendorOrderStatus;
    createdAt: string;
  }>;
}
