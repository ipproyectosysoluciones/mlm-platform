/**
 * @fileoverview MercadoPagoConnectCard - vendor MercadoPago OAuth connection card
 * @description Shows the vendor's MercadoPago connection state (never / connected /
 *              expired / disconnected) with Conectar / Reconectar / Desconectar actions.
 *              Backed by the MercadoPago OAuth endpoints (FE-1 / B11).
 * @module components/vendor/MercadoPagoConnectCard
 */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Link2, RefreshCw, Unlink, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

type MPConnectionState = 'never' | 'connected' | 'expired' | 'disconnected';

interface MPStatusPayload {
  status?: string;
  mpUserId?: string | null;
  country?: string | null;
  connectedAt?: string | null;
  expiresAt?: string | null;
}

/**
 * Derives the card state from the OAuth status payload
 * @param payload - Response from GET /payment/mercadopago/oauth/status
 * @returns The card state to render
 */
function deriveState(payload: MPStatusPayload): MPConnectionState {
  if (!payload.status || payload.status === 'never') {
    return 'never';
  }
  if (payload.status === 'connected') {
    const expiresAt = payload.expiresAt ? new Date(payload.expiresAt).getTime() : null;
    if (expiresAt !== null && expiresAt <= Date.now()) {
      return 'expired';
    }
    return 'connected';
  }
  return 'disconnected';
}

/**
 * Vendor MercadoPago connection card
 * Muestra el estado de conexión de MercadoPago del vendor
 */
export function MercadoPagoConnectCard() {
  const { t } = useTranslation();
  const [state, setState] = useState<MPConnectionState>('never');
  const [info, setInfo] = useState<MPStatusPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAction, setIsAction] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const response = await api.get('/payment/mercadopago/oauth/status');
      const payload: MPStatusPayload = response.data?.data ?? {};
      setInfo(payload);
      setState(deriveState(payload));
    } catch {
      // API unavailable — show the connect action instead of blocking the dashboard
      setState('never');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    setIsAction(true);
    try {
      const response = await api.get('/payment/mercadopago/oauth/authorize');
      const url: string | undefined = response.data?.data?.url;
      if (url) {
        // Full page redirect to MercadoPago's hosted OAuth authorization
        window.location.href = url;
      }
    } catch {
      // Navigation failure keeps the card in place for a retry
    } finally {
      setIsAction(false);
    }
  };

  const handleDisconnect = async () => {
    setIsAction(true);
    try {
      await api.post('/payment/mercadopago/oauth/disconnect');
      await loadStatus();
    } catch {
      // Keep current state on failure
    } finally {
      setIsAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
        <span className="text-sm text-[var(--color-foreground-muted)]">{t('common.loading')}</span>
      </div>
    );
  }

  const isExpired = state === 'expired';
  const isConnected = state === 'connected';
  const showConnect = state === 'never' || state === 'disconnected';

  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
          {isConnected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : isExpired ? (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          ) : (
            <Link2 className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {isConnected
              ? t('vendor.mpConnect.connectedTitle')
              : isExpired
                ? t('vendor.mpConnect.expiredTitle')
                : t('vendor.mpConnect.title')}
          </h2>
          <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
            {isConnected
              ? t('vendor.mpConnect.connectedSubtitle')
              : isExpired
                ? t('vendor.mpConnect.expiredSubtitle')
                : t('vendor.mpConnect.subtitle')}
          </p>

          {isConnected && info?.mpUserId && (
            <p className="text-xs text-[var(--color-foreground-muted)] mt-2">
              {t('vendor.mpConnect.accountId')}: {info.mpUserId}
            </p>
          )}
          {isConnected && info?.expiresAt && (
            <p className="text-xs text-[var(--color-foreground-muted)] mt-1">
              {t('vendor.mpConnect.expiresAt')}: {new Date(info.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {showConnect && (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={isAction}
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Link2 className="w-4 h-4" />
            {t('vendor.mpConnect.connect')}
          </button>
        )}

        {isConnected && (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={isAction}
            className="inline-flex items-center gap-2 bg-[var(--color-card)] text-white text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-[var(--color-card)] transition-colors disabled:opacity-60"
          >
            <RefreshCw className="w-4 h-4" />
            {t('vendor.mpConnect.reconnect')}
          </button>
        )}

        {isExpired && (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={isAction}
            className="inline-flex items-center gap-2 bg-amber-500 text-white text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-60"
          >
            <RefreshCw className="w-4 h-4" />
            {t('vendor.mpConnect.reconnect')}
          </button>
        )}

        {isConnected && (
          <button
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={isAction}
            className="inline-flex items-center gap-2 border border-[var(--color-border)] text-[var(--color-foreground-muted)] text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-60"
          >
            <Unlink className="w-4 h-4" />
            {t('vendor.mpConnect.disconnect')}
          </button>
        )}
      </div>
    </div>
  );
}

export default MercadoPagoConnectCard;
