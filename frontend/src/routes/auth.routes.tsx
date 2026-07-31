/**
 * @fileoverview Auth routes - Authentication flows
 * @description Route definitions for authentication: login, register, 2FA verification,
 *              and the public profile / referral page.
 *              Definiciones de rutas de autenticación: login, registro, verificación 2FA
 *              y la página de perfil público / referidos.
 * @module routes/auth.routes
 */

import { Route } from 'react-router';
import { PublicRoute, PublicProfileRoute } from '../components/routes';
import Login from '../pages/Login';
import Register from '../pages/Register';
import TwoFactorLoginPage from '../pages/TwoFactorLoginPage';
import PublicProfile from '../pages/PublicProfile';

export function AuthRoutes() {
  return (
    <>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/login/2fa"
        element={
          <PublicRoute>
            <TwoFactorLoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/ref/:code"
        element={
          <PublicProfileRoute>
            <PublicProfile />
          </PublicProfileRoute>
        }
      />
    </>
  );
}
