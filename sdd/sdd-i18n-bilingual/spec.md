# i18n Bilingual System - Specification

## 1. Overview / Descripción General

Sistema de internacionalización bilingüe (ES/EN) para la plataforma MLM que permite:

- Detección automática del idioma del navegador
- Cambio manual de idioma con persistencia
- Traducciones completas en todos los componentes

> Bilingual internationalization system (ES/EN) for the MLM platform that enables:
>
> - Automatic browser language detection
> - Manual language switching with persistence
> - Complete translations across all components

---

## 2. Requirements / Requisitos

### FR-i18n-1: Configuration / Configuración

| ID          | Requirement                                      | Status |
| ----------- | ------------------------------------------------ | ------ |
| FR-i18n-1.1 | react-i18next configurado con fallback a español | ✅     |
| FR-i18n-1.2 | LanguageDetector plugin para navigator.language  | ✅     |
| FR-i18n-1.3 | lng inicial desde localStorage o default 'es'    | ✅     |

### FR-i18n-2: Translation Files / Archivos de Traducción

| ID          | Requirement                                     | Status |
| ----------- | ----------------------------------------------- | ------ |
| FR-i18n-2.1 | en.json con todas las keys en inglés            | ✅     |
| FR-i18n-2.2 | es.json con todas las keys en español           | ✅     |
| FR-i18n-2.3 | Keys organizadas por namespace (page/component) | ✅     |
| FR-i18n-2.4 | Nombres de status con prefijos (crm.status.xxx) | ✅     |

### FR-i18n-3: Auto-detection / Detección Automática

| ID          | Requirement                             | Status |
| ----------- | --------------------------------------- | ------ |
| FR-i18n-3.1 | Detectar idioma del navegador al cargar | ✅     |
| FR-i18n-3.2 | Si es 'es' o 'es-\*', usar español      | ✅     |
| FR-i18n-3.3 | Si es 'en' o 'en-\*', usar inglés       | ✅     |
| FR-i18n-3.4 | Default: español ('es')                 | ✅     |

### FR-i18n-4: Persistence / Persistencia

| ID          | Requirement                         | Status |
| ----------- | ----------------------------------- | ------ |
| FR-i18n-4.1 | Guardar preferencia en localStorage | ✅     |
| FR-i18n-4.2 | Key: 'mlm-language'                 | ✅     |
| FR-i18n-4.3 | Leer al iniciar app                 | ✅     |

### FR-i18n-5: Language Switcher / Selector de Idioma

| ID          | Requirement                            | Status |
| ----------- | -------------------------------------- | ------ |
| FR-i18n-5.1 | Selector visual con banderas (🇪🇸 / 🇺🇸) | ✅     |
| FR-i18n-5.2 | Localizado en navbar (AppLayout)       | ✅     |
| FR-i18n-5.3 | Cambio instantáneo sin reload          | ✅     |

---

## 3. Translation Namespace Structure / Estructura de Namespaces

```json
{
  "tree": {
    "title": "Árbol Binario / Binary Tree",
    "search": { "placeholder": "...", ... },
    "controls": { "zoomIn": "...", ... },
    "details": { "title": "...", ... },
    ...
  },
  "dashboard": { ... },
  "nav": { ... },
  "auth": { ... },
  "profile": { ... },
  "admin": { ... },
  "crm": {
    "title": "CRM",
    "subtitle": "...",
    "status": {
      "new": "Nuevo",
      "contacted": "Contactado",
      ...
    },
    "tabs": {
      "leads": "Leads",
      "tasks": "Tareas",
      "stats": "Estadísticas"
    },
    ...
  },
  "landingPages": { ... },
  "common": {
    "loading": "...",
    "error": "...",
    "save": "Guardar",
    "cancel": "Cancelar",
    ...
  }
}
```

---

## 4. API / Implementation / Implementación

### Helper Functions (frontend/src/i18n/index.ts)

```typescript
/**
 * Change the current language and persist to localStorage
 * @param lang - 'en' | 'es'
 */
export const changeLanguage = (lang: 'en' | 'es'): void => {
  i18n.changeLanguage(lang);
  localStorage.setItem('mlm-language', lang);
};

/**
 * Get the current language from localStorage
 * @returns 'en' | 'es'
 */
export const getCurrentLanguage = (): 'en' | 'es' => {
  return (localStorage.getItem('mlm-language') || 'es') as 'en' | 'es';
};
```

### Language Detection Logic / Lógica de Detección

```typescript
// Priority: localStorage > navigator.language > default (es)
const detectLanguage = (): 'en' | 'es' => {
  const savedLang = localStorage.getItem('mlm-language');
  if (savedLang && ['en', 'es'].includes(savedLang)) {
    return savedLang as 'en' | 'es';
  }

  const browserLang = navigator.language?.split('-')[0];
  if (['en', 'es'].includes(browserLang)) {
    return browserLang as 'en' | 'es';
  }

  return 'es'; // Default to Spanish
};
```

---

## 5. Acceptance Criteria / Criterios de Aceptación

### Functional / Funcionales

| #    | Criterion                                      | Verified |
| ---- | ---------------------------------------------- | -------- |
| AC-1 | App detecta idioma del navegador correctamente | ⏳       |
| AC-2 | Cambio manual persiste al recargar             | ⏳       |
| AC-3 | Todas las páginas usan t() para textos         | ✅       |
| AC-4 | No hay textos hardcodeados en componentes      | ✅       |
| AC-5 | Flags visibles en navbar                       | ✅       |
| AC-6 | Cambio de idioma es instantáneo                | ⏳       |

### Non-Functional / No Funcionales

| #    | Criterion                | Target      |
| ---- | ------------------------ | ----------- |
| NF-1 | Bundle size increase     | < 50KB      |
| NF-2 | Initial load time impact | < 100ms     |
| NF-3 | Translation file size    | < 50KB each |

---

## 6. Components Using i18n / Componentes con i18n

| Component          | Translation Keys Used   |
| ------------------ | ----------------------- |
| AppLayout.tsx      | nav.\*                  |
| Login.tsx          | auth.\*                 |
| Register.tsx       | auth.\*                 |
| Dashboard.tsx      | dashboard._, nav._      |
| TreeView.tsx       | tree._, nav._           |
| Profile.tsx        | profile._, nav._        |
| AdminDashboard.tsx | admin._, nav._          |
| CRM.tsx            | crm._, nav._, common.\* |
| LandingPages.tsx   | landingPages._, nav._   |

---

## 7. Out of Scope / Fuera de Alcance

- Traducción de contenido dinámico del usuario
- Pluralización con variables (n !== 1)
- Género gramatical
- Timezone localization
- Date/number formatting por locale
- RTL support

---

## 8. Status

**APPROVED**

## 9. Related Documents

- [proposal.md](./proposal.md) - Motivation and scope
- [design.md](./design.md) - Implementation details
