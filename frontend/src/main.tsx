import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import './i18n'; // i18n configuration / Configuración de i18n
import App from './App.tsx';

/**
 * Initialize Sentry for error tracking
 * Inicializa Sentry para tracking de errores
 */
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.PROD ? 'production' : 'development',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Capture console errors in development
    initialScope: {
      tags: { build: import.meta.env.MODE },
    },
  });
}

/**
 * Render app wrapped in HelmetProvider for SEO meta tags management.
 * HelmetProvider is required by react-helmet-async to manage <head> tags
 * (title, meta description, Open Graph, JSON-LD) across all pages.
 *
 * Renderiza la app envuelta en HelmetProvider para gestión de meta tags SEO.
 * HelmetProvider es requerido por react-helmet-async para gestionar tags <head>
 * (title, meta description, Open Graph, JSON-LD) en todas las páginas.
 */
createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
