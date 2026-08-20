/**
 * @fileoverview Error routes - Error pages and catch-all
 * @description Route definitions for error pages (404, offline) and the catch-all redirect.
 *              Definiciones de rutas para páginas de error (404, offline) y el redirect catch-all.
 * @module routes/error.routes
 */

import { Route, Navigate } from 'react-router';
import NotFound from '../pages/NotFound';
import Offline from '../pages/Offline';

export const errorRoutes = (
  <>
    {/* Error Pages */}
    <Route path="/404" element={<NotFound />} />
    <Route path="/offline" element={<Offline />} />

    {/* Catch-all: Redirect unknown routes to 404 */}
    <Route path="*" element={<Navigate to="/404" replace />} />
  </>
);
