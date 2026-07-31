/** Domain types for wallet / Tipos de dominio para billetera. @module types/wallet */

// Wallet Types - Digital Wallet
export interface WalletBalance {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
}

export type WalletTransactionType = 'commission' | 'withdrawal' | 'refund';

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

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'processed' | 'cancelled';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  status: WithdrawalStatus;
  rejectionReason?: string;
  approvalComment?: string;
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
