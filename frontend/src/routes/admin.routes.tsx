/**
 * @fileoverview Admin routes - Admin-only pages
 * @description Route definitions for admin-only pages: dashboard, commissions, email campaigns,
 *              and the Real Estate & Tourism CRUD management pages.
 *              Definiciones de rutas para páginas de solo admin: dashboard, comisiones, campañas
 *              de email y las páginas CRUD de gestión de Real Estate & Turismo.
 * @module routes/admin.routes
 */

import { lazy, Suspense } from 'react';
import { Route } from 'react-router';
import { AdminRoute } from '../components/routes';
import PageLoader from '../components/common/PageLoader';
import AdminDashboard from '../pages/AdminDashboard';
import CommissionConfigPage from '../pages/CommissionConfigPage';

// Lazy loaded pages for Email Campaign Management
const EmailCampaignPage = lazy(() => import('../pages/EmailCampaignPage'));

// Lazy loaded admin pages for Real Estate & Tourism management (Sprint 6)
const AdminPropertiesPage = lazy(() => import('../pages/AdminPropertiesPage'));
const AdminToursPage = lazy(() => import('../pages/AdminToursPage'));
const AdminReservationsPage = lazy(() => import('../pages/AdminReservationsPage'));

export function AdminRoutes() {
  return (
    <>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/commissions"
        element={
          <AdminRoute>
            <CommissionConfigPage />
          </AdminRoute>
        }
      />

      {/* Email Campaign Management - Admin */}
      <Route
        path="/admin/email-campaigns"
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <EmailCampaignPage />
            </Suspense>
          </AdminRoute>
        }
      />

      {/* Admin Real Estate & Tourism CRUD Routes (Sprint 6) */}
      <Route
        path="/admin/properties"
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminPropertiesPage />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/tours"
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminToursPage />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reservations"
        element={
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminReservationsPage />
            </Suspense>
          </AdminRoute>
        }
      />
    </>
  );
}
