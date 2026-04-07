import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TreeView from './pages/TreeView';
import Profile from './pages/Profile';
import TwoFactor from './pages/TwoFactor';
import AdminDashboard from './pages/AdminDashboard';
import CommissionConfigPage from './pages/CommissionConfigPage';
import PublicProfile from './pages/PublicProfile';
import LandingPages from './pages/LandingPages';
import CRM from './pages/CRM';
import LeaderboardPage from './pages/LeaderboardPage';
import AchievementsPage from './pages/AchievementsPage';
import NotFound from './pages/NotFound';
import Offline from './pages/Offline';
import OfflineBanner from './components/OfflineBanner';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, AdminRoute, PublicRoute, PublicProfileRoute } from './components/routes';
import { preloadData } from './lib/preload';
import { dashboardService, authService } from './services/api';

// Lazy loaded pages for e-commerce flows (checkout, orders)
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderProcessing = lazy(() => import('./pages/OrderProcessing'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const ProductLanding = lazy(() => import('./pages/ProductLanding'));
const RecoverCartPage = lazy(() => import('./pages/RecoverCartPage'));
const EmailCampaignPage = lazy(() => import('./pages/EmailCampaignPage'));

// Lazy loaded pages for Real Estate & Tourism (Sprint 5)
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const ToursPage = lazy(() => import('./pages/ToursPage'));
const TourDetailPage = lazy(() => import('./pages/TourDetailPage'));
const ReservationFlowPage = lazy(() => import('./pages/ReservationFlowPage'));
const MisReservasPage = lazy(() => import('./pages/MisReservasPage'));

// Lazy loaded admin pages for Real Estate & Tourism management (Sprint 6)
const AdminPropertiesPage = lazy(() => import('./pages/AdminPropertiesPage'));
const AdminToursPage = lazy(() => import('./pages/AdminToursPage'));
const AdminReservationsPage = lazy(() => import('./pages/AdminReservationsPage'));

/**
 * Loading fallback component for lazy loaded routes
 */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600">Cargando...</p>
      </div>
    </div>
  );
}

function App() {
  // Preload critical data on app init
  useEffect(() => {
    // Preload dashboard data
    preloadData('dashboard', () => dashboardService.getDashboard());
    // Preload current user data
    preloadData('currentUser', () => authService.getProfile());
  }, []);

  return (
    <AuthProvider>
      <OfflineBanner />
      <BrowserRouter>
        <Routes>
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
          {/* Home — Propiedades como landing principal */}
          <Route
            path="/"
            element={
              <AppLayout>
                <Suspense fallback={<PageLoader />}>
                  <PropertiesPage />
                </Suspense>
              </AppLayout>
            }
          />
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
          <Route
            path="/ref/:code"
            element={
              <PublicProfileRoute>
                <PublicProfile />
              </PublicProfileRoute>
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

          {/* E-Commerce Routes (checkout, orders) */}
          <Route
            path="/products"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductCatalog />
              </Suspense>
            }
          />
          <Route
            path="/checkout/:productId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <Checkout />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId/success"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <OrderSuccess />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* MercadoPago back_url routes — shown after MP Checkout Pro redirect */}
          <Route
            path="/order-processing"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrderProcessing />
              </Suspense>
            }
          />
          <Route
            path="/orders/success"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrderProcessing />
              </Suspense>
            }
          />
          <Route
            path="/orders/pending"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrderProcessing />
              </Suspense>
            }
          />

          {/* Wallet Digital Route */}
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <WalletPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Cart Recovery Route - Public (no auth, uses one-time token) */}
          <Route
            path="/recover-cart"
            element={
              <Suspense fallback={<PageLoader />}>
                <RecoverCartPage />
              </Suspense>
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

          {/* Error Pages */}
          <Route path="/404" element={<NotFound />} />
          <Route path="/offline" element={<Offline />} />

          {/* Product Landing Page - Public */}
          <Route
            path="/landing/product/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductLanding />
              </Suspense>
            }
          />

          {/* Catch-all: Redirect unknown routes to 404 */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </AuthProvider>
  );
}

export default App;
// Deploy trigger: mié 01 abr 2026 17:31:08 -05
// GPG test: mié 01 abr 2026 17:44:04 -05
// Deploy trigger: mié 01 abr 2026 18:35:55 -05
