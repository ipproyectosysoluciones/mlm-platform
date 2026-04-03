import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')!).render(<App />);
