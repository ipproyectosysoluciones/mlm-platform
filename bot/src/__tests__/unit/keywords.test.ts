import { describe, it, expect } from 'vitest';

import {
  BALANCE_KEYWORDS,
  NETWORK_KEYWORDS,
  SUPPORT_KEYWORDS,
  SCHEDULE_KEYWORDS,
  HANDOFF_KEYWORDS,
  BOT_KEYWORDS,
} from '../../config/keywords.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('keywords config', () => {
  describe('BALANCE_KEYWORDS', () => {
    it('includes Spanish keyword "saldo"', () => {
      expect(BALANCE_KEYWORDS).toContain('saldo');
    });

    it('includes English keyword "wallet"', () => {
      expect(BALANCE_KEYWORDS).toContain('wallet');
    });

    it('is non-empty and satisfies the tuple requirement [string, ...string[]]', () => {
      expect(BALANCE_KEYWORDS.length).toBeGreaterThanOrEqual(1);
      expect(typeof BALANCE_KEYWORDS[0]).toBe('string');
    });
  });

  describe('NETWORK_KEYWORDS', () => {
    it('includes Spanish phrase "mi red"', () => {
      expect(NETWORK_KEYWORDS).toContain('mi red');
    });

    it('includes English keyword "downline"', () => {
      expect(NETWORK_KEYWORDS).toContain('downline');
    });

    it('is non-empty and satisfies the tuple requirement [string, ...string[]]', () => {
      expect(NETWORK_KEYWORDS.length).toBeGreaterThanOrEqual(1);
      expect(typeof NETWORK_KEYWORDS[0]).toBe('string');
    });
  });

  describe('SUPPORT_KEYWORDS', () => {
    it('includes Spanish keyword "ayuda"', () => {
      expect(SUPPORT_KEYWORDS).toContain('ayuda');
    });

    it('includes English keyword "help"', () => {
      expect(SUPPORT_KEYWORDS).toContain('help');
    });

    it('is non-empty and satisfies the tuple requirement [string, ...string[]]', () => {
      expect(SUPPORT_KEYWORDS.length).toBeGreaterThanOrEqual(1);
      expect(typeof SUPPORT_KEYWORDS[0]).toBe('string');
    });
  });

  describe('SCHEDULE_KEYWORDS', () => {
    it('includes Spanish keyword "agendar"', () => {
      expect(SCHEDULE_KEYWORDS).toContain('agendar');
    });

    it('includes English keyword "schedule"', () => {
      expect(SCHEDULE_KEYWORDS).toContain('schedule');
    });
  });

  describe('HANDOFF_KEYWORDS', () => {
    it('includes English phrase "speak to a human"', () => {
      expect(HANDOFF_KEYWORDS).toContain('speak to a human');
    });
  });

  describe('BOT_KEYWORDS registry', () => {
    it('has all expected top-level keys', () => {
      const expectedKeys: string[] = [
        'balance',
        'network',
        'support',
        'schedule',
        'handoff',
        'properties',
        'tours',
        'commissions',
        'language',
        'skip',
      ];

      for (const key of expectedKeys) {
        expect(BOT_KEYWORDS).toHaveProperty(key);
      }
    });

    it('balance key maps to BALANCE_KEYWORDS', () => {
      expect(BOT_KEYWORDS.balance).toBe(BALANCE_KEYWORDS);
    });

    it('network key maps to NETWORK_KEYWORDS', () => {
      expect(BOT_KEYWORDS.network).toBe(NETWORK_KEYWORDS);
    });

    it('language sub-object has "es" and "en" arrays', () => {
      expect(Array.isArray(BOT_KEYWORDS.language.es)).toBe(true);
      expect(Array.isArray(BOT_KEYWORDS.language.en)).toBe(true);
      expect(BOT_KEYWORDS.language.es.length).toBeGreaterThan(0);
      expect(BOT_KEYWORDS.language.en.length).toBeGreaterThan(0);
    });

    it('skip array includes "skip" and "omitir"', () => {
      expect(BOT_KEYWORDS.skip).toContain('skip');
      expect(BOT_KEYWORDS.skip).toContain('omitir');
    });
  });
});
