/**
 * Feature flags for the application.
 * Flags de funcionalidad de la aplicación.
 *
 * Controlled via VITE_FEATURE_* environment variables.
 * Controlados vía variables de entorno VITE_FEATURE_*.
 *
 * Enablement path:
 * - Development: set VITE_FEATURE_CRYPTO_WALLET=true in .env.local
 * - CI/E2E: set VITE_FEATURE_CRYPTO_WALLET=true in frontend/.env.test
 * - Production: leave absent/false to keep legacy behavior (flags OFF by default)
 *
 * @module utils/featureFlags
 */
export const featureFlags = {
  /** Crypto wallet feature (balance, withdrawals, wallet payment) / Funcionalidad de crypto wallet */
  cryptoWallet: import.meta.env.VITE_FEATURE_CRYPTO_WALLET === 'true',
} as const;
