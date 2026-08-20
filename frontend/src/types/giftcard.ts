/** Domain types for gift cards / Tipos de dominio para tarjetas de regalo. @module types/giftcard */

// Gift Card Types
export type GiftCardStatus = 'active' | 'redeemed' | 'expired';

export interface GiftCardResponse {
  id: string;
  code: string;
  balance: number;
  status: GiftCardStatus;
  isActive: boolean;
  expiresAt: string;
  qrCodeData: string | null;
  createdByUserId?: string;
  redeemedByUserId?: string | null;
  redeemedAt?: string | null;
  createdAt: string;
}

export interface GiftCardTransactionResponse {
  id: string;
  giftCardId: string;
  amountRedeemed: number;
  transactionType: string;
  status: string;
  createdAt: string;
}

export interface GiftCardCreatePayload {
  amount: number;
  expiresInDays?: number;
}

export interface GiftCardRedeemPayload {
  orderId?: string;
}

export interface GiftCardValidateResponse {
  isValid: boolean;
  reason?: 'NOT_FOUND' | 'ALREADY_REDEEMED' | 'EXPIRED' | 'INACTIVE';
  card?: GiftCardResponse;
}

export interface GiftCardListParams {
  page?: number;
  limit?: number;
  status?: GiftCardStatus;
}
