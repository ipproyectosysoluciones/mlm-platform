/**
 * @fileoverview EmptyState & loading i18n keys validation
 * @description Ensures all emptyStates.* and loading.* keys exist in both ES and EN locale files
 *              Verifica que todas las claves emptyStates.* y loading.* existan en ambos archivos de locale
 * @module i18n/empty-state-keys.test
 */

import { describe, it, expect } from 'vitest';
import es from '../locales/es.json';
import en from '../locales/en.json';

/** Required emptyStates keys per design spec / Claves emptyStates requeridas según spec */
const REQUIRED_EMPTY_STATE_KEYS = ['tours', 'properties', 'cart', 'reservation', 'order'] as const;

/** Required loading keys per design spec / Claves loading requeridas según spec */
const REQUIRED_LOADING_KEYS = ['processingPayment', 'fetchingData'] as const;

describe('i18n — emptyStates keys (T2.1)', () => {
  it('ES locale has all required emptyStates.* keys with title and description', () => {
    const esEmptyStates = (es as Record<string, unknown>).emptyStates as
      | Record<string, Record<string, string>>
      | undefined;
    expect(esEmptyStates).toBeDefined();

    for (const key of REQUIRED_EMPTY_STATE_KEYS) {
      expect(esEmptyStates, `Missing ES emptyStates.${key}`).toHaveProperty(key);
      expect(esEmptyStates![key].title, `Missing ES emptyStates.${key}.title`).toBeDefined();
      expect(esEmptyStates![key].title.length).toBeGreaterThan(0);
      expect(
        esEmptyStates![key].description,
        `Missing ES emptyStates.${key}.description`
      ).toBeDefined();
      expect(esEmptyStates![key].description.length).toBeGreaterThan(0);
    }
  });

  it('EN locale has all required emptyStates.* keys with title and description', () => {
    const enEmptyStates = (en as Record<string, unknown>).emptyStates as
      | Record<string, Record<string, string>>
      | undefined;
    expect(enEmptyStates).toBeDefined();

    for (const key of REQUIRED_EMPTY_STATE_KEYS) {
      expect(enEmptyStates, `Missing EN emptyStates.${key}`).toHaveProperty(key);
      expect(enEmptyStates![key].title, `Missing EN emptyStates.${key}.title`).toBeDefined();
      expect(enEmptyStates![key].title.length).toBeGreaterThan(0);
      expect(
        enEmptyStates![key].description,
        `Missing EN emptyStates.${key}.description`
      ).toBeDefined();
      expect(enEmptyStates![key].description.length).toBeGreaterThan(0);
    }
  });

  it('ES and EN emptyStates keys differ (translated, not duplicated)', () => {
    const esEmptyStates = (es as Record<string, unknown>).emptyStates as Record<
      string,
      Record<string, string>
    >;
    const enEmptyStates = (en as Record<string, unknown>).emptyStates as Record<
      string,
      Record<string, string>
    >;

    // At least tours.title should differ between languages
    expect(esEmptyStates.tours.title).not.toBe(enEmptyStates.tours.title);
  });
});

describe('i18n — loading keys (T2.1)', () => {
  it('ES locale has all required loading.* keys', () => {
    const esLoading = (es as Record<string, unknown>).loading as Record<string, string> | undefined;
    expect(esLoading).toBeDefined();

    for (const key of REQUIRED_LOADING_KEYS) {
      expect(esLoading, `Missing ES loading.${key}`).toHaveProperty(key);
      expect(typeof esLoading![key]).toBe('string');
      expect(esLoading![key].length).toBeGreaterThan(0);
    }
  });

  it('EN locale has all required loading.* keys', () => {
    const enLoading = (en as Record<string, unknown>).loading as Record<string, string> | undefined;
    expect(enLoading).toBeDefined();

    for (const key of REQUIRED_LOADING_KEYS) {
      expect(enLoading, `Missing EN loading.${key}`).toHaveProperty(key);
      expect(typeof enLoading![key]).toBe('string');
      expect(enLoading![key].length).toBeGreaterThan(0);
    }
  });

  it('ES and EN loading keys differ (translated, not duplicated)', () => {
    const esLoading = (es as Record<string, unknown>).loading as Record<string, string>;
    const enLoading = (en as Record<string, unknown>).loading as Record<string, string>;

    expect(esLoading.processingPayment).not.toBe(enLoading.processingPayment);
  });
});
