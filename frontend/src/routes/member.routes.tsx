/**
 * @fileoverview Member routes - Authenticated user pages
 * @description Route definitions for authenticated member pages: dashboard, tree, CRM,
 *              leaderboard, achievements, profile, 2FA and landing pages management.
 *              Definiciones de rutas para páginas de miembros autenticados: dashboard, árbol,
 *              CRM, leaderboard, logros, perfil, 2FA y gestión de landing pages.
 * @module routes/member.routes
 */

import { Route } from 'react-router';
import { ProtectedRoute } from '../components/routes';
import Dashboard from '../pages/Dashboard';
import TreeView from '../pages/TreeView';
import Profile from '../pages/Profile';
import TwoFactor from '../pages/TwoFactor';
import LandingPages from '../pages/LandingPages';
import CRM from '../pages/CRM';
import LeaderboardPage from '../pages/LeaderboardPage';
import AchievementsPage from '../pages/AchievementsPage';

export function MemberRoutes() {
  return (
    <>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tree"
        element={
          <ProtectedRoute>
            <TreeView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm"
        element={
          <ProtectedRoute>
            <CRM />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <ProtectedRoute>
            <AchievementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/2fa"
        element={
          <ProtectedRoute>
            <TwoFactor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/landing-pages"
        element={
          <ProtectedRoute>
            <LandingPages />
          </ProtectedRoute>
        }
      />
    </>
  );
}
