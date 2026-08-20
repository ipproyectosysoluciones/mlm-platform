/**
 * @fileoverview Unit tests for VatRateService
 * @description Tests for VAT rate lookup per country (BE-4): CO active (0.19),
 *              MX/AR/CL/ES defined but inactive, unknown country falls back to 0.
 * @module __tests__/VatRateService
 */

import { VatRateService } from '../services/VatRateService.js';

// ─── Mock env config (marketplace.vatRates) ─────────────────────────────────
jest.mock('../config/env.js', () => ({
  config: {
    marketplace: {
      vatRates: {
        CO: 0.19,
        MX: 0.16,
        AR: 0.21,
        CL: 0.19,
        ES: 0.21,
      },
    },
  },
}));

describe('VatRateService', () => {
  describe('getVatRate', () => {
    it('returns 0.19 for Colombia (CO active)', () => {
      expect(VatRateService.getVatRate('CO')).toBe(0.19);
    });

    it('returns the defined rate for MX even though the country is inactive', () => {
      expect(VatRateService.getVatRate('MX')).toBe(0.16);
    });

    it('returns defined rates for AR, CL and ES', () => {
      expect(VatRateService.getVatRate('AR')).toBe(0.21);
      expect(VatRateService.getVatRate('CL')).toBe(0.19);
      expect(VatRateService.getVatRate('ES')).toBe(0.21);
    });

    it('is case-insensitive', () => {
      expect(VatRateService.getVatRate('co')).toBe(0.19);
    });

    it('falls back to 0 for unknown countries', () => {
      expect(VatRateService.getVatRate('XX')).toBe(0);
      expect(VatRateService.getVatRate('')).toBe(0);
    });

    it('falls back to 0 for missing input', () => {
      // @ts-expect-error — deliberate misuse to test fallback
      expect(VatRateService.getVatRate(undefined)).toBe(0);
    });
  });
});
