import { lazy, Suspense } from 'react';
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
import NotFound from './pages/NotFound';
import Offline from './pages/Offline';
import OfflineBanner from './components/OfflineBanner';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, AdminRoute, PublicRoute, PublicProfileRoute } from './components/routes';

// Lazy loaded pages for streaming subscriptions e-commerce
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const ProductLanding = lazy(() => import('./pages/ProductLanding'));

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
          {/* Landing page - Product Catalog as home */}
          <Route
            path="/"
            element={
              <AppLayout>
                <Suspense fallback={<PageLoader />}>
                  <ProductCatalog />
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

          {/* Streaming Subscriptions E-Commerce Routes */}
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
