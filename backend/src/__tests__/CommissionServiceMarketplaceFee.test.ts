/**
 * @fileoverview Unit tests for CommissionService.calculateMarketplaceFee
 * @description Tests for the pure marketplace fee calculation (A7 / D4 / SPLIT-4):
 *              pct_plataforma = 1 - commissionRate; commission = base × pct;
 *              tax = commission × VAT; fee = commission + tax; all HALF_UP
 *              rounded to integer COP; commission + tax === fee always.
 * @module __tests__/CommissionServiceMarketplaceFee
 */

import { CommissionService } from '../services/CommissionService.js';

// ─── Module mocks (CommissionService imports models, wallet, email, config) ──
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
  },
}));

jest.mock('../config/database', () => ({
  sequelize: { query: jest.fn(), transaction: jest.fn(), sync: jest.fn() },
}));

jest.mock('../models/index.js', () => ({
  User: {},
  Commission: {},
  Purchase: {},
  CommissionConfig: {},
}));

jest.mock('../services/WalletService.js', () => ({ walletService: {} }));
jest.mock('../services/EmailService.js', () => ({ emailService: {} }));

// ─── Mock env config (marketplace.vatRates used via VatRateService) ─────────
jest.mock('../config/env.js', () => ({
  config: {
    marketplace: {
      vatRates: { CO: 0.19, MX: 0.16, AR: 0.21, CL: 0.19, ES: 0.21 },
    },
    features: { cryptoWallet: false },
  },
}));

describe('CommissionService.calculateMarketplaceFee', () => {
  describe('G-4 canonical case: base 1,000,000 COP / commissionRate 0.70 / CO', () => {
    const result = CommissionService.calculateMarketplaceFee({
      base: 1000000,
      commissionRate: 0.7,
      country: 'CO',
    });

    it('computes pct_plataforma as 1 - commissionRate', () => {
      expect(result.pctPlataforma).toBeCloseTo(0.3, 10);
      expect(result.commissionRate).toBe(0.7);
    });

    it('computes commission = base × pct_plataforma (300,000)', () => {
      expect(result.commission).toBe(300000);
    });

    it('computes tax = commission × VAT CO 19% (57,000)', () => {
      expect(result.taxRate).toBe(0.19);
      expect(result.tax).toBe(57000);
    });

    it('computes fee = commission + tax (357,000)', () => {
      expect(result.fee).toBe(357000);
    });

    it('guarantees commission + tax === fee (verified sum)', () => {
      expect(result.commission + result.tax).toBe(result.fee);
    });
  });

  describe('HALF_UP rounding to integer COP', () => {
    it('rounds .5 up (base 999,999 × 0.30 = 299,999.7 → 300,000)', () => {
      const result = CommissionService.calculateMarketplaceFee({
        base: 999999,
        commissionRate: 0.7,
        country: 'CO',
      });
      expect(result.commission).toBe(300000);
    });

    it('rounds the tax too (commission × 0.19)', () => {
      // commission = round(999999 * 0.30) = 300000 → tax = 57000
      const result = CommissionService.calculateMarketplaceFee({
        base: 999999,
        commissionRate: 0.7,
        country: 'CO',
      });
      expect(result.tax).toBe(57000);
      expect(result.commission + result.tax).toBe(result.fee);
    });

    it('exact .5 boundary rounds up (HALF_UP): base 100 × 0.005 → 1', () => {
      const result = CommissionService.calculateMarketplaceFee({
        base: 100,
        commissionRate: 0.995,
        country: 'CO',
      });
      expect(result.pctPlataforma).toBeCloseTo(0.005, 10);
      expect(result.commission).toBe(1);
    });

    it('always returns integers for commission, tax and fee', () => {
      const result = CommissionService.calculateMarketplaceFee({
        base: 1234567,
        commissionRate: 0.63,
        country: 'CO',
      });
      expect(Number.isInteger(result.commission)).toBe(true);
      expect(Number.isInteger(result.tax)).toBe(true);
      expect(Number.isInteger(result.fee)).toBe(true);
      expect(result.commission + result.tax).toBe(result.fee);
    });
  });

  describe('country-driven tax rate', () => {
    it('uses the VAT rate of the given country', () => {
      const co = CommissionService.calculateMarketplaceFee({
        base: 1000000,
        commissionRate: 0.7,
        country: 'CO',
      });
      const mx = CommissionService.calculateMarketplaceFee({
        base: 1000000,
        commissionRate: 0.7,
        country: 'MX',
      });
      expect(co.taxRate).toBe(0.19);
      expect(mx.taxRate).toBe(0.16);
      expect(mx.tax).toBe(48000); // 300000 × 0.16
      expect(mx.commission + mx.tax).toBe(mx.fee);
    });

    it('falls back to 0 tax for unknown countries', () => {
      const result = CommissionService.calculateMarketplaceFee({
        base: 1000000,
        commissionRate: 0.7,
        country: 'XX',
      });
      expect(result.taxRate).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.fee).toBe(result.commission);
    });
  });

  describe('edge cases', () => {
    it('zero commission rate → pct_plataforma 1, commission = base', () => {
      const result = CommissionService.calculateMarketplaceFee({
        base: 500000,
        commissionRate: 0,
        country: 'CO',
      });
      expect(result.pctPlataforma).toBe(1);
      expect(result.commission).toBe(500000);
    });

    it('100% commission rate → pct_plataforma 0, commission 0, fee 0', () => {
      const result = CommissionService.calculateMarketplaceFee({
        base: 500000,
        commissionRate: 1,
        country: 'CO',
      });
      expect(result.pctPlataforma).toBe(0);
      expect(result.commission).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('zero base → zero fee', () => {
      const result = CommissionService.calculateMarketplaceFee({
        base: 0,
        commissionRate: 0.7,
        country: 'CO',
      });
      expect(result.fee).toBe(0);
    });
  });
});
