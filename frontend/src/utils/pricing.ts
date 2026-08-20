/**
 * @fileoverview Pricing utility functions
 * @description Pure utility functions for price calculations and formatting
 *               Funciones de utilidad puras para cálculos y formato de precios
 * @module utils/pricing
 */

import type { WizardData } from '../stores/reservationStore';
import type { PriceBreakdown } from '../types/reservation';

/**
 * Calculate the number of days between two date strings
 * Calcular la cantidad de días entre dos strings de fecha
 * @param checkIn - ISO date string for check-in
 * @param checkOut - ISO date string for check-out
 * @returns Number of nights (minimum 1)
 */
export function daysBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

/**
 * Compute full price breakdown from current wizard data
 * Calcular desglose completo de precio desde los datos del wizard
 * @param wizardData - Current wizard data / Datos actuales del wizard
 * @returns PriceBreakdown or null if data is insufficient
 */
export function computePriceBreakdown(wizardData: WizardData | null): PriceBreakdown | null {
  if (!wizardData) return null;

  if (wizardData.type === 'property') {
    const totalNights = daysBetween(wizardData.checkIn, wizardData.checkOut);
    const pricePerUnit = Number(wizardData.property.price);
    const currency = wizardData.property.currency;
    const guestCount = wizardData.guests;
    const subtotal = pricePerUnit * totalNights;
    const totalPrice = subtotal * guestCount;

    return {
      pricePerUnit,
      currency,
      totalNights,
      guestCount,
      subtotal,
      totalPrice,
      isProperty: true,
    };
  }

  // Tour: price is per person, 1 "night"
  const pricePerUnit = Number(wizardData.tour.price);
  const currency = wizardData.tour.currency;
  const guestCount = wizardData.guests;
  const totalNights = 1;
  const subtotal = pricePerUnit * totalNights;
  const totalPrice = subtotal * guestCount;

  return {
    pricePerUnit,
    currency,
    totalNights,
    guestCount,
    subtotal,
    totalPrice,
    isProperty: false,
  };
}

/**
 * Format a price amount with currency symbol
 * Formatear un monto con símbolo de moneda
 * @param amount - Numeric amount
 * @param currency - Currency code (e.g. "USD", "ARS")
 * @returns Formatted string like "$1,200.00"
 */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
