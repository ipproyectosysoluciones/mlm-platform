import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n'; // i18n configuration / Configuración de i18n
import App from './App.tsx';

// Initialize Sentry if DSN is provided
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PRODUCTION ? 0.1 : 1.0,
  });
}

createRoot(document.getElementById('root')!).render(<App />);
