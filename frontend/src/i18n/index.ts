/**
 * i18n - Internationalization configuration for Nexo Real
 * Configuración de internacionalización para Nexo Real
 *
 * @module i18n
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

/**
 * Detect browser/system language
 * Detecta el idioma del navegador/sistema
 *
 * Priority:
 * 1. Check localStorage['mlm-language'] for user preference
 * 2. Detect from navigator.language (browser language)
 * 3. Default to Spanish for Latin American users
 *
 * Prioridad:
 * 1. localStorage['mlm-language'] para preferencia del usuario
 * 2. navigator.language para detectar idioma del navegador
 * 3. Default español para usuarios latinoamericanos
 */
export function getBrowserLanguage(): string {
  // 1. Check localStorage first for user preference
  const stored = localStorage.getItem('mlm-language');
  if (stored && ['en', 'es'].includes(stored)) {
    return stored;
  }

  // 2. Detect from browser language (navigator.language)
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.toLowerCase();

    // If starts with 'en', return English
    if (browserLang.startsWith('en')) {
      return 'en';
    }

    // If starts with 'es', return Spanish
    if (browserLang.startsWith('es')) {
      return 'es';
    }
  }

  // 3. Default to Spanish for Latin American users
  return 'es';
}

/**
 * i18n configuration
 */
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: getBrowserLanguage(),
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  // Configure detection order and storage
  detection: {
    // Check localStorage first, then browser language
    order: ['localStorage', 'navigator'],
    // Cache the language in localStorage
    caches: ['localStorage'],
    // Custom key for localStorage
    lookupLocalStorage: 'mlm-language',
    // Only allow our supported languages
    checkWhitelist: true,
  },
});

/**
 * Change language and persist
 */
export function changeLanguage(lang: 'en' | 'es') {
  localStorage.setItem('mlm-language', lang);
  i18n.changeLanguage(lang);
}

/**
 * Get current language
 */
export function getCurrentLanguage(): string {
  return i18n.language;
}

/**
 * Supported languages
 */
export const supportedLanguages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]['code'];

export default i18n;
