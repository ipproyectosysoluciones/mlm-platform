/**
 * Feature flags for the application.
 * Flags de funcionalidad de la aplicación.
 *
 * Controlled via VITE_FEATURE_* environment variables.
 * Controlados vía variables de entorno VITE_FEATURE_*.
 *
 * @module utils/featureFlags
 */
export const featureFlags = {
  /** Crypto wallet feature (balance, withdrawals, wallet payment) / Funcionalidad de crypto wallet */
  cryptoWallet: import.meta.env.VITE_FEATURE_CRYPTO_WALLET === 'true',
} as const;
