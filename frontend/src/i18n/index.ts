/**
 * i18n - Internationalization configuration for MLM Platform
 * Configuración de internacionalización para MLM Platform
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
 * IMPORTANT: For Latin American users, default to Spanish unless user explicitly
 * changed the language preference (stored in localStorage).
 *
 * IMPORTANTE: Para usuarios latinoamericanos, el default es español a menos que
 * el usuario haya cambiado explícitamente el idioma (guardado en localStorage).
 */
function getBrowserLanguage(): string {
  const stored = localStorage.getItem('language');
  if (stored && ['en', 'es'].includes(stored)) {
    return stored;
  }

  // Default to Spanish for Latin American users - ignore browser language
  // Para usuarios latinoamericanos, default español - ignorar idioma del navegador
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
});

/**
 * Change language and persist
 */
export function changeLanguage(lang: 'en' | 'es') {
  localStorage.setItem('language', lang);
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
