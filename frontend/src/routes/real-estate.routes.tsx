/**
 * @fileoverview Real Estate routes - Real Estate & Tourism pages
 * @description Route definitions for the Real Estate & Tourism (Sprint 5) public pages
 *              and the authenticated reservation flow.
 *              Definiciones de rutas para las páginas públicas de Real Estate & Turismo (Sprint 5)
 *              y el flujo de reservas autenticado.
 * @module routes/real-estate.routes
 */

/* eslint-disable react-refresh/only-export-components -- route table file: exports route fragments and declares lazy page components; fast refresh is not applicable */

import { lazy, Suspense } from 'react';
import { Route } from 'react-router';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/routes';
import PageLoader from '../components/common/PageLoader';

// Lazy loaded pages for Real Estate & Tourism (Sprint 5)
const PropertiesPage = lazy(() => import('../pages/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('../pages/PropertyDetailPage'));
const ToursPage = lazy(() => import('../pages/ToursPage'));
const TourDetailPage = lazy(() => import('../pages/TourDetailPage'));
const ReservationFlowPage = lazy(() => import('../pages/ReservationFlowPage'));
const MisReservasPage = lazy(() => import('../pages/MisReservasPage'));

export const realEstateRoutes = (
  <>
    {/* Real Estate & Tourism Routes (Sprint 5) */}
    <Route
      path="/properties"
      element={
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <PropertiesPage />
          </Suspense>
        </AppLayout>
      }
    />
    <Route
      path="/properties/:id"
      element={
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <PropertyDetailPage />
          </Suspense>
        </AppLayout>
      }
    />
    <Route
      path="/tours"
      element={
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <ToursPage />
          </Suspense>
        </AppLayout>
      }
    />
    <Route
      path="/tours/:id"
      element={
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <TourDetailPage />
          </Suspense>
        </AppLayout>
      }
    />
    <Route
      path="/reservations/new"
      element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ReservationFlowPage />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/mis-reservas"
      element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <MisReservasPage />
          </Suspense>
        </ProtectedRoute>
      }
    />
  </>
);
