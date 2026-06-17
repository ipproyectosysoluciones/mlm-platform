/**
 * @fileoverview CTA i18n keys validation / Validación de claves i18n de CTA
 * @description Ensures all CTA keys exist in both ES and EN locale files
 *              Verifica que todas las claves CTA existan en ambos archivos de locale
 * @module i18n/cta-keys.test
 */

import { describe, it, expect } from 'vitest';
import es from '../locales/es.json';
import en from '../locales/en.json';

/** Required CTA keys per design spec D1 / Claves CTA requeridas según spec D1 */
const REQUIRED_CTA_KEYS = [
  'securePayment',
  'confirmPayment',
  'cancel',
  'back',
  'continue',
] as const;

describe('i18n — CTA keys (T1.1)', () => {
  it('ES locale has all required cta.* keys', () => {
    const esCta = (es as Record<string, unknown>).cta as Record<string, string> | undefined;
    expect(esCta).toBeDefined();

    for (const key of REQUIRED_CTA_KEYS) {
      expect(esCta, `Missing ES key: cta.${key}`).toHaveProperty(key);
      expect(typeof esCta![key]).toBe('string');
      expect(esCta![key].length).toBeGreaterThan(0);
    }
  });

  it('EN locale has all required cta.* keys', () => {
    const enCta = (en as Record<string, unknown>).cta as Record<string, string> | undefined;
    expect(enCta).toBeDefined();

    for (const key of REQUIRED_CTA_KEYS) {
      expect(enCta, `Missing EN key: cta.${key}`).toHaveProperty(key);
      expect(typeof enCta![key]).toBe('string');
      expect(enCta![key].length).toBeGreaterThan(0);
    }
  });

  it('ES and EN cta keys are different (translated, not duplicated)', () => {
    const esCta = (es as Record<string, unknown>).cta as Record<string, string>;
    const enCta = (en as Record<string, unknown>).cta as Record<string, string>;

    // At least securePayment should differ between languages
    expect(esCta.securePayment).not.toBe(enCta.securePayment);
  });
});
