/**
 * @fileoverview OrderProcessing Page - MercadoPago post-redirect landing
 * @description Landing page shown after MercadoPago Checkout Pro redirect.
 *              Reads `collection_status`, `payment_id`, and `external_reference`
 *              query params sent by MercadoPago in the back_urls.
 * @module pages/OrderProcessing
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Check, Clock, XCircle, AlertCircle, Loader2, Home, ShoppingBag } from 'lucide-react';
import { cn } from '../utils/cn';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type MPStatus = 'approved' | 'pending' | 'rejected' | 'failure' | 'unknown';

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  containerClass: string;
  iconClass: string;
  badgeClass: string;
}

// ──────────────────────────────────────────────
// Status config map
// ──────────────────────────────────────────────

function getStatusConfig(status: MPStatus): StatusConfig {
  switch (status) {
    case 'approved':
      return {
        icon: <Check className="h-10 w-10 text-white" />,
        title: '¡Pago exitoso!',
        description:
          'Tu pago fue procesado correctamente. En breve recibirás la confirmación de tu orden.',
        containerClass: 'border-green-500/30 bg-green-500/10',
        iconClass: 'bg-green-500',
        badgeClass: 'bg-green-500/20 text-green-400',
      };
    case 'pending':
      return {
        icon: <Clock className="h-10 w-10 text-white" />,
        title: 'Procesando tu pago...',
        description:
          'Tu pago está siendo procesado. Te notificaremos cuando se confirme. Esto puede tardar unos minutos.',
        containerClass: 'border-yellow-500/30 bg-yellow-500/10',
        iconClass: 'bg-yellow-500',
        badgeClass: 'bg-yellow-500/20 text-yellow-400',
      };
    case 'rejected':
    case 'failure':
      return {
        icon: <XCircle className="h-10 w-10 text-white" />,
        title: 'Pago rechazado',
        description:
          'Tu pago no pudo ser procesado. Por favor verificá tu método de pago e intentá de nuevo.',
        containerClass: 'border-red-500/30 bg-red-500/10',
        iconClass: 'bg-red-500',
        badgeClass: 'bg-red-500/20 text-red-400',
      };
    default:
      return {
        icon: <AlertCircle className="h-10 w-10 text-white" />,
        title: 'Estado desconocido',
        description:
          'No pudimos determinar el estado de tu pago. Revisá tu historial de órdenes o contactá soporte.',
        containerClass: 'border-slate-500/30 bg-slate-700/50',
        iconClass: 'bg-slate-500',
        badgeClass: 'bg-slate-500/20 text-slate-400',
      };
  }
}

// ──────────────────────────────────────────────
// Spinning loader used for "pending" state
// ──────────────────────────────────────────────

function PendingSpinner() {
  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
      <p className="text-xs text-slate-400">Actualizando en tiempo real...</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

/**
 * OrderProcessing page — shown after MercadoPago redirects back to the app.
 *
 * MercadoPago sends these query params in the back_urls:
 *   - collection_status  → 'approved' | 'pending' | 'rejected' | 'null'
 *   - payment_id         → MP payment ID (numeric string)
 *   - external_reference → value set during preference creation (userId)
 *
 * The backend webhook already handles Order creation on approval.
 * This page is purely informational — it shows the result to the user.
 */
export default function OrderProcessing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // MercadoPago sends `collection_status`; we also support a generic `status` param
  // for routes like /orders/success and /orders/pending.
  const collectionStatus = searchParams.get('collection_status');
  const genericStatus = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  // Resolve final status from params
  const rawStatus: string = collectionStatus ?? genericStatus ?? inferStatusFromPath() ?? 'unknown';

  /**
   * Infer status from current pathname for named routes:
   * /orders/success → approved, /orders/pending → pending
   * /checkout/success → approved (PayPal return URL)
   * /checkout/cancel → rejected (PayPal cancel URL)
   *
   * Infiere el estado desde el pathname actual para rutas nombradas:
   * /checkout/success → approved (URL de retorno de PayPal)
   * /checkout/cancel → rejected (URL de cancelación de PayPal)
   */
  function inferStatusFromPath(): string | null {
    const path = window.location.pathname;
    if (path.includes('/checkout/success')) return 'approved';
    if (path.includes('/checkout/cancel')) return 'rejected';
    if (path.includes('/orders/success')) return 'approved';
    if (path.includes('/orders/pending')) return 'pending';
    return null;
  }

  const status: MPStatus = (['approved', 'pending', 'rejected', 'failure'] as const).includes(
    rawStatus as any
  )
    ? (rawStatus as MPStatus)
    : 'unknown';

  // If no params at all and no path hint → redirect to home
  useEffect(() => {
    if (!collectionStatus && !genericStatus && !inferStatusFromPath()) {
      navigate('/', { replace: true });
    }
  }, [collectionStatus, genericStatus, navigate]);

  const config = getStatusConfig(status);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Status Card */}
        <div className={cn('overflow-hidden rounded-2xl border shadow-2xl', config.containerClass)}>
          {/* Icon Header */}
          <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-6 text-center">
            {/* Status Icon */}
            <div className="relative">
              {/* Outer ring */}
              <div
                className={cn(
                  'absolute inset-0 rounded-full opacity-30',
                  config.iconClass.replace('bg-', 'border-4 border-')
                )}
              />
              {/* Pulsing ring for pending */}
              {status === 'pending' && (
                <div
                  className={cn(
                    'absolute inset-0 animate-ping rounded-full opacity-20',
                    config.iconClass
                  )}
                />
              )}
              {/* Icon Circle */}
              <div
                className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-full',
                  config.iconClass
                )}
              >
                {config.icon}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white">{config.title}</h1>

            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed">{config.description}</p>

            {/* Pending spinner */}
            {status === 'pending' && <PendingSpinner />}
          </div>

          {/* Payment Details */}
          {(paymentId || externalReference) && (
            <div className="border-t border-slate-700/50 px-6 py-4">
              <div className="flex flex-col gap-2">
                {paymentId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">ID de pago</span>
                    <span className="font-mono text-slate-200">{paymentId}</span>
                  </div>
                )}
                {externalReference && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Referencia</span>
                    <span className="font-mono text-slate-200">{externalReference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-center px-6 pb-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                config.badgeClass
              )}
            >
              {rawStatus}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 px-6 pb-8 pt-4">
            {/* Show "retry" only on failure */}
            {(status === 'rejected' || status === 'failure') && (
              <Link
                to="/products"
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold',
                  'bg-red-600 text-white transition-all hover:bg-red-500',
                  'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800'
                )}
              >
                <ShoppingBag className="h-5 w-5" />
                Intentar de nuevo
              </Link>
            )}

            {/* Dashboard link */}
            <Link
              to="/dashboard"
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold',
                status === 'approved'
                  ? 'bg-purple-600 text-white transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25'
                  : 'border border-slate-600 text-white transition-colors hover:bg-slate-800'
              )}
            >
              <Home className="h-5 w-5" />
              Ir al Dashboard
            </Link>

            {/* Products link (secondary, always visible) */}
            {status !== 'rejected' && status !== 'failure' && (
              <Link
                to="/products"
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold',
                  'border border-slate-600 text-white transition-colors hover:bg-slate-800'
                )}
              >
                <ShoppingBag className="h-5 w-5" />
                Ver productos
              </Link>
            )}
          </div>
        </div>

        {/* Help text */}
        <p className="mt-4 text-center text-xs text-slate-500">
          ¿Tenés algún problema? Contactá a soporte con tu ID de pago.
        </p>
      </div>
    </div>
  );
}
