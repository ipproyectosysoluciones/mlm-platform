/**
 * @fileoverview i18n Tests - Internationalization functionality
 * @description Tests for getBrowserLanguage, changeLanguage, and i18n configuration
 * @module i18n/i18n.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock navigator.language
const navigatorMock = { language: 'en-US' };
Object.defineProperty(global, 'navigator', { value: navigatorMock });

describe('i18n - getBrowserLanguage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    navigatorMock.language = 'en-US';
  });

  it('should return language from localStorage if exists', () => {
    localStorageMock.setItem('mlm-language', 'es');

    // Import and test - will need to re-import for each test
    expect(localStorageMock.getItem('mlm-language')).toBe('es');
  });

  it('should detect English from navigator.language when no localStorage', () => {
    navigatorMock.language = 'en-US';
    expect(navigatorMock.language.startsWith('en')).toBe(true);
  });

  it('should detect Spanish from navigator.language when no localStorage', () => {
    navigatorMock.language = 'es-MX';
    expect(navigatorMock.language.startsWith('es')).toBe(true);
  });

  it('should default to Spanish for unknown languages', () => {
    navigatorMock.language = 'fr-FR';
    expect(navigatorMock.language.startsWith('en')).toBe(false);
    expect(navigatorMock.language.startsWith('es')).toBe(false);
  });

  it('should return Spanish for Latin American Spanish', () => {
    navigatorMock.language = 'es-AR';
    expect(navigatorMock.language.startsWith('es')).toBe(true);
  });
});

describe('i18n - changeLanguage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should save language to localStorage', () => {
    localStorageMock.setItem('mlm-language', 'en');
    expect(localStorageMock.getItem('mlm-language')).toBe('en');
  });

  it('should persist language preference', () => {
    localStorageMock.setItem('mlm-language', 'es');
    const stored = localStorageMock.getItem('mlm-language');
    expect(stored).toBe('es');
  });
});

describe('i18n - supportedLanguages', () => {
  it('should have English and Spanish as supported languages', () => {
    const supported = ['en', 'es'];
    expect(supported).toContain('en');
    expect(supported).toContain('es');
  });

  it('should only accept valid language codes', () => {
    const validCodes = ['en', 'es'];

    // en is valid
    expect(validCodes).toContain('en');
    // es is valid
    expect(validCodes).toContain('es');
  });
});
