/**
 * @fileoverview E-commerce routes - Legacy e-commerce, wallet, cart recovery & product landing
 * @description Route definitions for legacy e-commerce (products, checkout, orders), MercadoPago
 *              and PayPal back_url routes, the crypto wallet (feature flagged), cart recovery
 *              and the public product landing page.
 *              Definiciones de rutas para e-commerce legacy (productos, checkout, órdenes), rutas
 *              back_url de MercadoPago y PayPal, la crypto wallet (detrás de feature flag),
 *              recuperación de carrito y la landing pública de producto.
 * @module routes/ecommerce.routes
 */

import { lazy, Suspense } from 'react';
import { Route } from 'react-router';
import { ProtectedRoute } from '../components/routes';
import PageLoader from '../components/common/PageLoader';
import { featureFlags } from '../utils/featureFlags';

// Lazy loaded pages for e-commerce (legacy — kept for /products route)
const ProductCatalog = lazy(() => import('../pages/ProductCatalog'));
const Checkout = lazy(() => import('../pages/Checkout'));
const OrderSuccess = lazy(() => import('../pages/OrderSuccess'));
const OrderProcessing = lazy(() => import('../pages/OrderProcessing'));
const WalletPage = lazy(() => import('../pages/WalletPage'));
const ProductLanding = lazy(() => import('../pages/ProductLanding'));
const RecoverCartPage = lazy(() => import('../pages/RecoverCartPage'));
const OrdersPage = lazy(() => import('../pages/orders/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/orders/OrderDetailPage'));

export function EcommerceRoutes() {
  return (
    <>
      {/* Legacy E-Commerce Routes — kept for backward compatibility */}
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
        path="/orders"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OrdersPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OrderDetailPage />
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

      {/* PayPal return URL routes — shown after PayPal redirect */}
      <Route
        path="/checkout/success"
        element={
          <Suspense fallback={<PageLoader />}>
            <OrderProcessing />
          </Suspense>
        }
      />
      <Route
        path="/checkout/cancel"
        element={
          <Suspense fallback={<PageLoader />}>
            <OrderProcessing />
          </Suspense>
        }
      />

      {/* Wallet Digital Route — hidden when crypto wallet feature is disabled */}
      {featureFlags.cryptoWallet && (
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
      )}

      {/* Cart Recovery Route - Public (no auth, uses one-time token) */}
      <Route
        path="/recover-cart"
        element={
          <Suspense fallback={<PageLoader />}>
            <RecoverCartPage />
          </Suspense>
        }
      />

      {/* Product Landing Page - Public */}
      <Route
        path="/landing/product/:id"
        element={
          <Suspense fallback={<PageLoader />}>
            <ProductLanding />
          </Suspense>
        }
      />
    </>
  );
}
