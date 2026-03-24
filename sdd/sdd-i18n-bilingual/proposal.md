# SDD: i18n Bilingual System / Sistema de Internacionalización Bilingüe

## Change Name

**i18n Bilingual System**

## 1. Overview

Implementación de sistema de internacionalización bilingüe (ES/EN) con:

- Detección automática de idioma del navegador
- Persistencia de preferencia en localStorage
- Traducciones completas en todas las páginas
- Hooks utilitarios para cambio de idioma

> Implementation of bilingual internationalization system (ES/EN) with:
>
> - Automatic browser language detection
> - Preference persistence in localStorage
> - Complete translations on all pages
> - Utility hooks for language switching

## 2. Motivation / Problem

### Problem Statement / Declaración del Problema

- Necesidad de soportar usuarios hispanohablantes e anglófonos
- UI debe responder al idioma del navegador automáticamente
- Preferencia de idioma debe persistir entre sesiones
- Textos hardcodeados hacen difícil mantener consistencia

> Need to support Spanish-speaking and English-speaking users
> UI should respond to browser language automatically
> Language preference must persist between sessions
> Hardcoded text makes consistency hard to maintain

### Why This Change / Por Qué Este Cambio

1. **Accesibilidad**: Soporte nativo para ambos idiomas principales de la región
2. **UX**: Experiencia personalizada según preferencia del usuario
3. **Mantenibilidad**: Un solo lugar para traducir, múltiples páginas benefiting

## 3. Scope

### In Scope:

- Configuración react-i18next
- Archivos de traducción (en.json, es.json)
- Helper functions (changeLanguage, getCurrentLanguage)
- Detección automática de idioma
- Persistencia en localStorage
- Traducción de todos los componentes existentes

### Out of Scope:

- Otros idiomas (portugués, francés, etc.)
- Traducciones de emails transaccionales
- Pluralización avanzada
- RTL (right-to-left) support

## 4. Approach

### Technology / Tecnología

- **react-i18next** para manejo de traducciones
- **i18next-browser-languagedetector** para detección automática
- Namespace único 'translation' (configuración default)
- Banderas emoji para selector visual

### Translation Structure / Estructura de Traducciones

```json
{
  "nav": { "dashboard": "Dashboard", "tree": "Árbol", ... },
  "auth": { "welcome": "Bienvenido", "signIn": "Iniciar Sesión", ... },
  "dashboard": { ... },
  "tree": { ... },
  "profile": { ... },
  "admin": { ... },
  "crm": { ... },
  "landingPages": { ... },
  "common": { "save": "Guardar", "cancel": "Cancelar", ... }
}
```

## 5. Files Affected

### Created / Creados

| File                                 | Description             |
| ------------------------------------ | ----------------------- |
| `sdd/sdd-i18n-bilingual/proposal.md` | Este documento          |
| `sdd/sdd-i18n-bilingual/spec.md`     | Especificación técnica  |
| `sdd/sdd-i18n-bilingual/design.md`   | Diseño e implementación |

### Modified / Modificados

| File                                           | Changes                    |
| ---------------------------------------------- | -------------------------- |
| `frontend/src/i18n/index.ts`                   | Config + helpers           |
| `frontend/src/i18n/locales/en.json`            | Traducciones inglés        |
| `frontend/src/i18n/locales/es.json`            | Traducciones español       |
| `frontend/src/components/layout/AppLayout.tsx` | Language selector          |
| `frontend/src/pages/*.tsx`                     | Todas las páginas usan t() |

## 6. Implementation Notes

### Language Detection Logic

```typescript
// Priority: localStorage > navigator.language > default (es)
const savedLang = localStorage.getItem('mlm-language');
const browserLang = navigator.language?.split('-')[0];
const lang = savedLang || (['en', 'es'].includes(browserLang) ? browserLang : 'es');
```

### Helper Functions

```typescript
export const changeLanguage = (lang: 'en' | 'es'): void => {
  i18n.changeLanguage(lang);
  localStorage.setItem('mlm-language', lang);
};

export const getCurrentLanguage = (): 'en' | 'es' => {
  return (localStorage.getItem('mlm-language') || 'es') as 'en' | 'es';
};
```

## 7. Rollout Plan

1. ✅ Configurar i18n en frontend (completado)
2. ✅ Agregar traducciones para todas las páginas (completado)
3. ✅ Actualizar CRM.tsx con traducciones completas (completado)
4. ⏳ Verificar que build pasa
5. ⏳ Testear cambio de idioma en todas las páginas

## 8. Status

**PROPOSED** → APPROVED → IMPLEMENTED

## 9. Dependencies

- react-i18next >= 14.x
- i18next-browser-languagedetector
- react >= 18.x

## 10. Risks

| Risk                           | Mitigation                  |
| ------------------------------ | --------------------------- |
| Missing translation keys       | Fallback a key name         |
| Hardcoded strings remaining    | ESLint rule + code review   |
| Language switch not persisting | localStorage check on mount |

---

## Status History

| Version | Date       | Status   |
| ------- | ---------- | -------- |
| 1.0     | 2026-03-22 | Proposed |
