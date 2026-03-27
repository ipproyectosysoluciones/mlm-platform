# i18n Bilingual System - Design

## 1. Architecture / Arquitectura

```
frontend/src/i18n/
├── index.ts          # Configuración + helpers
└── locales/
    ├── en.json       # English translations
    └── es.json       # Spanish translations
```

## 2. Configuration (index.ts) / Configuración

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';

/**
 * i18n Configuration / Configuración de i18n
 *
 * Bilingual support (ES/EN) with automatic browser language detection
 * and localStorage persistence for user preference.
 *
 * Soporte bilingüe (ES/EN) con detección automática de idioma del navegador
 * y persistencia en localStorage para preferencia del usuario.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'es', // Fallback to Spanish / Respaldo a español
    lng: localStorage.getItem('mlm-language') || 'es',
    interpolation: {
      escapeValue: false, // React already escapes / React ya escapa
    },
    detection: {
      // Order of language detection / Orden de detección de idioma
      order: ['localStorage', 'navigator'],
      // Cache language in localStorage / Guardar idioma en localStorage
      caches: ['localStorage'],
      // Key name in localStorage
      lookupLocalStorage: 'mlm-language',
    },
  });

export default i18n;

/**
 * Change the current language and persist to localStorage
 * / Cambia el idioma actual y persiste en localStorage
 *
 * @example
 * changeLanguage('en'); // Switch to English
 * changeLanguage('es'); // Cambiar a Español
 */
export const changeLanguage = (lang: 'en' | 'es'): void => {
  i18n.changeLanguage(lang);
  localStorage.setItem('mlm-language', lang);
};

/**
 * Get the current language from localStorage
 * / Obtiene el idioma actual de localStorage
 *
 * @returns 'en' | 'es'
 *
 * @example
 * const lang = getCurrentLanguage(); // 'es' or 'en'
 */
export const getCurrentLanguage = (): 'en' | 'es' => {
  return (localStorage.getItem('mlm-language') || 'es') as 'en' | 'es';
};
```

## 3. Translation File Structure / Estructura de Archivos de Traducción

### English (en.json)

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "tree": "Tree",
    "crm": "CRM",
    "landingPages": "Landing Pages",
    "profile": "Profile",
    "admin": "Admin",
    "logout": "Logout",
    "myProfile": "My Profile"
  },
  "auth": {
    "welcome": "Welcome Back",
    "signIn": "Sign In",
    "email": "Email",
    "password": "Password",
    ...
  },
  "crm": {
    "title": "CRM",
    "subtitle": "Manage your leads and clients",
    "newLead": "New Lead",
    "status": {
      "new": "New",
      "contacted": "Contacted",
      "qualified": "Qualified",
      "proposal": "Proposal",
      "negotiation": "Negotiation",
      "won": "Won",
      "lost": "Lost"
    },
    ...
  }
}
```

### Spanish (es.json)

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "tree": "Árbol",
    "crm": "CRM",
    "landingPages": "Landing Pages",
    "profile": "Perfil",
    "admin": "Admin",
    "logout": "Cerrar Sesión",
    "myProfile": "Mi Perfil"
  },
  "auth": {
    "welcome": "Bienvenido",
    "signIn": "Iniciar Sesión",
    "email": "Email",
    "password": "Contraseña",
    ...
  },
  "crm": {
    "title": "CRM",
    "subtitle": "Gestiona tus leads y clientes",
    "newLead": "Nuevo Lead",
    "status": {
      "new": "Nuevo",
      "contacted": "Contactado",
      "qualified": "Calificado",
      "proposal": "Propuesta",
      "negotiation": "Negociación",
      "won": "Ganado",
      "lost": "Perdido"
    },
    ...
  }
}
```

## 4. Language Switcher Component / Componente Selector de Idioma

Located in AppLayout navbar:

```tsx
/**
 * Language Selector Component
 * / Componente Selector de Idioma
 *
 * Displays current language with flag and allows switching between ES/EN.
 * / Muestra idioma actual con bandera y permite cambiar entre ES/EN.
 */
const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => changeLanguage('es')}
        className={`px-2 py-1 rounded text-sm ${
          currentLang === 'es' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'
        }`}
        aria-label="Cambiar a Español"
      >
        🇪🇸 ES
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded text-sm ${
          currentLang === 'en' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'
        }`}
        aria-label="Switch to English"
      >
        🇺🇸 EN
      </button>
    </div>
  );
};
```

## 5. Usage in Components / Uso en Componentes

### Basic Usage / Uso Básico

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('crm.title')}</h1>
      <p>{t('crm.subtitle')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Nested Keys / Keys Anidados

```tsx
// crm.status.new = "Nuevo" (ES) / "New" (EN)
<span>{t('crm.status.new')}</span>

// crm.tabs.leads = "Leads" / "Leads"
<span>{t('crm.tabs.leads')}</span>
```

### With Variables / Con Variables

```tsx
// Translation: "{{count}} items found"
// Usage:
<span>{t('search.results', { count: 5 })}</span>
// Output: "5 items found" / "5 elementos encontrados"
```

### Dynamic Keys / Keys Dinámicos

```tsx
// When the key is dynamic
const statusKey = `crm.status.${lead.status}`;
<span>{t(statusKey)}</span>

// Or with defaultValue
<span>{t(`crm.status.${lead.status}`, { defaultValue: lead.status })}</span>
```

## 6. Translation Best Practices / Mejores Prácticas

### ✅ Do / Hacer

```tsx
// Use descriptive keys
{
  t('crm.contactName');
}
{
  t('dashboard.totalEarnings');
}

// Use nested structure for organization
{
  t('tree.controls.zoomIn');
}

// Handle missing keys gracefully
{
  t('crm.status.new', { defaultValue: 'New' });
}
```

### ❌ Don't / No Hacer

```tsx
// Don't hardcode strings
<span>Bienvenido</span>; // ❌

// Don't use non-descriptive keys
{
  t('t1');
} // ❌

// Don't nest too deeply
{
  t('a.b.c.d.e.f');
} // ❌ (max 3-4 levels)
```

## 7. Adding New Translations / Agregar Nuevas Traducciones

### Step 1: Add to en.json (English first)

```json
{
  "module": {
    "newKey": "New English text"
  }
}
```

### Step 2: Add to es.json (Same structure)

```json
{
  "module": {
    "newKey": "Nuevo texto en español"
  }
}
```

### Step 3: Use in component

```tsx
<span>{t('module.newKey')}</span>
```

## 8. Testing / Pruebas

### Manual Testing Checklist

- [ ] App loads with correct language from browser
- [ ] Language persists after page reload
- [ ] Manual switch works instantly (no page reload)
- [ ] All pages show correct translations
- [ ] No "missing translation" warnings in console
- [ ] Works in Chrome, Firefox, Safari

### Automated Testing (Future)

```typescript
// Example test
it('should switch language and persist', () => {
  render(<App />);

  // Switch to English
  fireEvent.click(screen.getByText('🇺🇸 EN'));

  // Verify language changed
  expect(screen.getByText('Sign In')).toBeInTheDocument();

  // Reload page
  window.location.reload();

  // Verify language persisted
  expect(screen.getByText('Sign In')).toBeInTheDocument();
});
```

## 9. Performance Considerations / Consideraciones de Rendimiento

| Aspect       | Impact      | Mitigation             |
| ------------ | ----------- | ---------------------- |
| Bundle size  | ~40KB added | Tree-shaking enabled   |
| Initial load | ~50ms extra | Async loading possible |
| Runtime      | Negligible  | i18next is optimized   |

## 10. Browser Support / Soporte de Navegadores

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 11. Status

**IMPLEMENTED**

## 12. Related Documents

- [proposal.md](./proposal.md) - Motivation and scope
- [spec.md](./spec.md) - Requirements specification
