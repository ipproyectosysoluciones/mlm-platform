/**
 * @fileoverview VatRateService - VAT (IVA) rates by country
 * @description Returns the configured VAT rate for a country, consumed by
 *              CommissionService.calculateMarketplaceFee (SPLIT-4 / BE-4).
 *              CO (0.19) is the active marketplace country; MX/AR/CL/ES rates
 *              are defined but inactive. Unknown countries fall back to 0.
 *
 *              Devuelve la tasa IVA configurada por país, consumida por
 *              CommissionService.calculateMarketplaceFee (SPLIT-4 / BE-4).
 * @module services/VatRateService
 */

import { config } from '../config/env.js';

export class VatRateService {
  /**
   * Get the VAT rate for a country (0 when unknown / not configured).
   * Obtener la tasa IVA de un país (0 si es desconocido / no configurado).
   *
   * @param country - ISO-3166 alpha-2 country code / Código de país ISO-3166 alpha-2
   * @returns VAT rate as a decimal (e.g. 0.19 = 19%) or 0 / Tasa IVA decimal o 0
   */
  static getVatRate(country: string): number {
    if (!country) return 0;

    const rate = config.marketplace.vatRates[country.toUpperCase()];
    return typeof rate === 'number' ? rate : 0;
  }
}

export default VatRateService;
