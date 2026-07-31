/**
 * @fileoverview Landing routes - Public landing pages
 * @description Route definitions for public landing pages wrapped in the app layout.
 *              Definiciones de rutas de landing públicas envueltas en el layout de la app.
 * @module routes/landing.routes
 */

import { lazy, Suspense } from 'react';
import { Route } from 'react-router';
import { AppLayout } from '../components/layout/AppLayout';
import PageLoader from '../components/common/PageLoader';

// Lazy loaded pages for Real Estate & Tourism landing (Sprint 7)
const NexoRealLanding = lazy(() => import('../pages/landing/NexoRealLanding'));

export function LandingRoutes() {
  return (
    <>
      {/* Landing page - Nexo Real home */}
      <Route
        path="/"
        element={
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <NexoRealLanding />
            </Suspense>
          </AppLayout>
        }
      />
    </>
  );
}
