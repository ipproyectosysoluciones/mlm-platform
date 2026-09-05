/** Domain types for wallet / Tipos de dominio para billetera. @module types/wallet */

// Wallet Config — Backend configuration response
export interface WalletConfig {
  minimumWithdrawal: number;
  maximumWithdrawal: number;
  maximumWithdrawalDailyPerUser: number;
  payoutMode: 'manual' | 'auto';
  feePercentage: number;
}

// Wallet Types - Digital Wallet
export interface WalletBalance {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export type WalletTransactionType =
  | 'commission_earned'
  | 'withdrawal'
  | 'fee'
  | 'adjustment'
  | 'deposit'
  | 'commission'
  | 'refund';

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;
  referenceId?: string;
  description?: string;
  exchangeRate?: number;
  createdAt: Date;
}

export type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'processed'
  | 'cancelled'
  | 'paid'
  | 'failed';

// Withdrawal Destination — Where to send the money
export interface WithdrawalDestination {
  method: 'paypal';
  email: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  status: WithdrawalStatus;
  destination?: WithdrawalDestination;
  gatewayPayoutId?: string;
  gatewayStatus?: string;
  rejectionReason?: string;
  approvalComment?: string;
  approvedBy?: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface TransactionListParams {
  page?: number;
  limit?: number;
  type?: WalletTransactionType;
  startDate?: string;
  endDate?: string;
}

export interface TransactionListResponse {
  data: WalletTransaction[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Admin types — Admin wallet operations
export interface AdminListWithdrawalsParams {
  status?: WithdrawalStatus;
  page?: number;
  limit?: number;
}

export interface AdminListWithdrawalsResponse {
  data: WithdrawalRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminApproveWithdrawalParams {
  comment?: string;
}

export interface AdminRejectWithdrawalParams {
  reason: string;
}

// Crypto Price Types
export interface CryptoPriceInfo {
  usd: number;
  usd_24h_change?: number;
}

export interface CryptoPrices {
  bitcoin: CryptoPriceInfo;
  ethereum: CryptoPriceInfo;
  tether: CryptoPriceInfo;
  lastUpdated: string;
}
