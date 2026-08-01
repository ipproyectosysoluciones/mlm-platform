/**
 * @fileoverview App - Root application component
 * @description Pure orchestration: error boundary, auth provider, offline banner, router
 *              and analytics. Route definitions live in src/routes/.
 *              Orquestación pura: error boundary, auth provider, offline banner, router
 *              y analytics. Las definiciones de rutas viven en src/routes/.
 * @module App
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { hasAuthToken } from './lib/authGuard';
import OfflineBanner from './components/OfflineBanner';
import { preloadData } from './lib/preload';
import { dashboardService, authService } from './services/api';
import { appRoutes } from './routes';

function App() {
  // Preload critical data on app init — ONLY when authenticated
  // Precargar datos críticos al iniciar la app — SOLO cuando está autenticado
  useEffect(() => {
    if (hasAuthToken()) {
      preloadData('dashboard', () => dashboardService.getDashboard());
      preloadData('currentUser', () => authService.getProfile());
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <OfflineBanner />
        <BrowserRouter>
          <Routes>{appRoutes}</Routes>
        </BrowserRouter>
        <Analytics />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
// Deploy trigger: mié 01 abr 2026 17:31:08 -05
// GPG test: mié 01 abr 2026 17:44:04 -05
// Deploy trigger: mié 01 abr 2026 18:35:55 -05
