/**
 * @fileoverview RecoverCartPage - Cart recovery page for abandoned cart email links
 * @description Handles the full recovery flow: parse token from URL, preview cart,
 *              confirm recovery, and redirect to checkout.
 *              Maneja el flujo completo de recuperación: parsear token de URL, vista previa,
 *              confirmar recuperación y redirigir al checkout.
 * @module pages/RecoverCartPage
 * @author Nexo Real Development Team
 */

import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, AlertTriangle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { CartPreview } from '../components/Cart/CartPreview';
import { useCartRecovery } from '../stores/cartStore';
import { Button } from '../components/ui/button';

// ============================================
// Component / Componente
// ============================================

/**
 * RecoverCartPage - Full-page cart recovery from email token
 * Página de recuperación de carrito completa desde token de email
 */
export function RecoverCartPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const {
    recoveryCart,
    recoveryError,
    isLoadingRecovery,
    isRecovering,
    previewRecoveryCart,
    confirmRecovery,
    clearRecovery,
  } = useCartRecovery();

  // On mount, preview the cart if token is present
  // Al montar, cargar vista previa si hay token
  useEffect(() => {
    if (token) {
      previewRecoveryCart(token);
    }

    return () => {
      clearRecovery();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /**
   * Handle recovery confirmation → mark token as used, redirect to checkout
   * Manejar confirmación de recuperación → marcar token como usado, redirigir a checkout
   */
  const handleProceedToCheckout = async () => {
    if (!token) return;

    try {
      await confirmRecovery(token);
      navigate('/products', { replace: true });
    } catch {
      // Error is already captured in the store
    }
  };

  /**
   * Handle retry
   * Manejar reintento
   */
  const handleRetry = () => {
    if (token) {
      previewRecoveryCart(token);
    }
  };

  // ==========================================
  // No Token State / Estado sin token
  // ==========================================

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 mb-6">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Missing Recovery Token</h1>
          <p className="text-slate-400 mb-6">
            This page requires a valid recovery token. Please use the link from your email.
          </p>
          <Button onClick={() => navigate('/products')}>
            Browse Products
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // Loading State / Estado de carga
  // ==========================================

  if (isLoadingRecovery) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
          <p className="text-slate-400">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Error State / Estado de error
  // ==========================================

  if (recoveryError) {
    // Determine error type for user-friendly messages
    const isExpired =
      recoveryError.toLowerCase().includes('expired') ||
      recoveryError.toLowerCase().includes('410');
    const isUsed =
      recoveryError.toLowerCase().includes('used') ||
      recoveryError.toLowerCase().includes('already');
    const isNotFound = recoveryError.toLowerCase().includes('not found');

    let errorTitle = 'Recovery Failed';
    let errorDescription = recoveryError;

    if (isExpired) {
      errorTitle = 'Link Expired';
      errorDescription = 'This recovery link has expired. Recovery links are valid for 7 days.';
    } else if (isUsed) {
      errorTitle = 'Link Already Used';
      errorDescription =
        'This recovery link has already been used. Each link can only be used once.';
    } else if (isNotFound) {
      errorTitle = 'Cart Not Found';
      errorDescription = "We couldn't find the cart associated with this link.";
    }

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 mb-6">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">{errorTitle}</h1>
          <p className="text-slate-400 mb-6">{errorDescription}</p>
          <div className="flex items-center justify-center gap-3">
            {!isExpired && !isUsed && (
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button onClick={() => navigate('/products')}>
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Success State — Cart Preview / Vista previa
  // ==========================================

  if (!recoveryCart) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 mb-6">
            <ShoppingCart className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Welcome Back!</h1>
          <p className="text-slate-400">
            We saved your cart for you. Review your items below and continue shopping.
          </p>
        </div>

        {/* Cart Preview */}
        <CartPreview cart={recoveryCart} className="mb-6" />

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleProceedToCheckout}
            disabled={isRecovering}
            className="w-full py-3.5 text-base"
            aria-label="Proceed to checkout with recovered cart"
          >
            {isRecovering ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Restoring Cart...
              </>
            ) : (
              <>
                Proceed to Checkout
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>

          <Button variant="outline" onClick={() => navigate('/products')} className="w-full">
            Continue Browsing
          </Button>
        </div>

        {/* Recovery Error (if confirmation fails) */}
        {recoveryError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {recoveryError}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecoverCartPage;
