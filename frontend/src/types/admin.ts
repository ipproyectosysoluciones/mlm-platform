/** Domain types for admin / commission config / Tipos de dominio para config de comisiones de admin. @module types/admin */

// Commission Config Types
export type BusinessType = 'suscripcion' | 'producto' | 'membresia' | 'servicio' | 'otro';
export type CommissionLevel = 'direct' | 'level_1' | 'level_2' | 'level_3' | 'level_4';

export interface CommissionConfig {
  id: string;
  businessType: BusinessType;
  customBusinessName?: string;
  level: CommissionLevel;
  percentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionConfigCreate {
  businessType: BusinessType;
  customBusinessName?: string;
  level: CommissionLevel;
  percentage: number;
}

export interface CommissionConfigUpdate {
  percentage?: number;
  isActive?: boolean;
}

export interface CommissionRates {
  businessType: BusinessType;
  levels: Record<CommissionLevel, number>;
}
