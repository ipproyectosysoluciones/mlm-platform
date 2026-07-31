/** Domain types for affiliate contracts / Tipos de dominio para contratos de afiliado. @module types/contract */

// ============================================
// AFFILIATE CONTRACTS — Phase 3.5 (#44)
// CONTRATOS DE AFILIADO — Fase 3.5 (#44)
// ============================================

export type ContractType =
  | 'AFFILIATE_AGREEMENT'
  | 'COMPENSATION_PLAN'
  | 'PRIVACY_POLICY'
  | 'TERMS_OF_SERVICE';

export type ContractStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED';

export interface Contract {
  id: string;
  type: ContractType;
  version: string;
  title: string;
  content: string;
  effectiveFrom: string;
  status: ContractStatus | null;
  signedAt: string | null;
  contentHash: string;
}

export interface ContractAcceptanceRequest {
  templateId: string;
}

export interface ContractAcceptanceResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    status: ContractStatus;
    signedAt: string;
  };
}
