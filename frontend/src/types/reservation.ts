/**
 * @fileoverview Reservation types — domain types for the reservation wizard
 * @description Shared types for wizard state, price breakdown, and reservation data.
 *              Extracted from reservationStore.ts for domain-level reuse.
 *              Tipos compartidos para estado del wizard, desglose de precio y datos de reserva.
 * @module types/reservation
 */

import type { Property } from '../services/propertyService';
import type { TourPackage, TourAvailability } from '../services/tourService';

// ============================================
// Wizard Types / Tipos del wizard
// ============================================

/**
 * Wizard step enum (includes 'payment' for post-confirmation flow)
 * Enum de paso del wizard (incluye 'payment' para flujo post-confirmación)
 */
export type WizardStep = 'dates' | 'guests' | 'confirm' | 'payment';

/**
 * Wizard data for a property reservation
 * Datos del wizard para reserva de propiedad
 */
export interface PropertyWizardData {
  type: 'property';
  property: Property;
  checkIn: string;
  checkOut: string;
  guests: number;
  notes: string;
}

/**
 * Wizard data for a tour reservation
 * Datos del wizard para reserva de tour
 */
export interface TourWizardData {
  type: 'tour';
  tour: TourPackage;
  availability: TourAvailability;
  guests: number;
  notes: string;
}

export type WizardData = PropertyWizardData | TourWizardData;

// ============================================
// Price Types / Tipos de precio
// ============================================

/**
 * Computed price breakdown for the current wizard state
 * Desglose de precio calculado para el estado actual del wizard
 */
export interface PriceBreakdown {
  /** Price per unit (night for properties, person for tours) / Precio por unidad */
  pricePerUnit: number;
  /** Currency code / Código de moneda */
  currency: string;
  /** Number of nights (property) or 1 (tour) / Cantidad de noches o 1 */
  totalNights: number;
  /** Number of guests / Cantidad de huéspedes */
  guestCount: number;
  /** pricePerUnit × totalNights / Subtotal sin multiplicar por huéspedes */
  subtotal: number;
  /** pricePerUnit × totalNights × guestCount / Total final */
  totalPrice: number;
  /** Whether it's a property (per night) or tour (per person) / Si es propiedad o tour */
  isProperty: boolean;
}
