# Tasks: i18n Bilingual System

## Phase 1: Configuration / Configuración

- [ ] 1.1 Install react-i18next and i18next packages
- [ ] 1.2 Create `frontend/src/i18n/index.ts` with configuration
- [ ] 1.3 Configure LanguageDetector plugin for browser detection
- [ ] 1.4 Set default language to 'es' (Spanish)
- [ ] 1.5 Configure fallback language chain

## Phase 2: Translation Files / Archivos de Traducción

- [ ] 2.1 Create `frontend/src/i18n/locales/es.json` with Spanish translations
- [ ] 2.2 Create `frontend/src/i18n/locales/en.json` with English translations
- [ ] 2.3 Add translations for common UI elements (buttons, labels, errors)
- [ ] 2.4 Add translations for page-specific content (dashboard, tree, CRM)
- [ ] 2.5 Organize keys by namespace (auth, dashboard, tree, crm, common)

## Phase 3: Translation Keys / Claves de Traducción

- [ ] 3.1 Add `auth.*` namespace for authentication pages
- [ ] 3.2 Add `dashboard.*` namespace for dashboard content
- [ ] 3.3 Add `tree.*` namespace for tree visualization
- [ ] 3.4 Add `crm.*` namespace for CRM module (status names, etc.)
- [ ] 3.5 Add `common.*` namespace for shared UI elements

## Phase 4: i18next Integration / Integración con i18next

- [ ] 4.1 Create LanguageSwitcher component with flag icons
- [ ] 4.2 Integrate LanguageSwitcher into AppLayout
- [ ] 4.3 Wrap App with I18nextProvider in main.tsx
- [ ] 4.4 Add useTranslation hook to all components
- [ ] 4.5 Replace hardcoded strings with t() function calls

## Phase 5: Component Translation / Traducción de Componentes

- [ ] 5.1 Update Login/Register pages with i18n
- [ ] 5.2 Update Dashboard page with i18n
- [ ] 5.3 Update Tree visualization with i18n
- [ ] 5.4 Update CRM components with i18n
- [ ] 5.5 Update AdminDashboard with i18n
- [ ] 5.6 Update all form validation messages

## Phase 6: Persistence / Persistencia

- [ ] 6.1 Implement localStorage persistence for language preference
- [ ] 6.2 Add 'mlm-language' key to localStorage
- [ ] 6.3 Read persisted language on app initialization
- [ ] 6.4 Update LanguageSwitcher to reflect current state

## Phase 7: Browser Detection / Detección de Navegador

- [ ] 7.1 Detect navigator.language on page load
- [ ] 7.2 Match 'es-\*' patterns to Spanish
- [ ] 7.3 Match 'en-\*' patterns to English
- [ ] 7.4 Apply detected language before first render
- [ ] 7.5 Respect persisted preference over browser detection

## Phase 8: Testing / Pruebas

- [ ] 8.1 Write unit tests for LanguageSwitcher component
- [ ] 8.2 Write E2E test for language switching
- [ ] 8.3 Write E2E test for browser language detection
- [ ] 8.4 Verify all pages have translations in both languages
- [ ] 8.5 Test with different browser languages (es, en, fr, de)

---

**Total: 38 tasks across 8 phases**
