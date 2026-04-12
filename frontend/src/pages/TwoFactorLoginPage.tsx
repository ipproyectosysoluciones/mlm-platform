/**
 * TwoFactorLoginPage — TOTP code entry during login for 2FA-enabled users.
 * Reads tempToken from sessionStorage (set by Login.tsx), verifies the code,
 * fetches user data, and completes the login flow.
 *
 * Página de ingreso de código TOTP durante el login para usuarios con 2FA habilitado.
 * Lee el tempToken de sessionStorage (seteado por Login.tsx), verifica el código,
 * obtiene los datos del usuario, y completa el flujo de login.
 *
 * @module pages/TwoFactorLoginPage
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { twoFactorService } from '../services/twoFactorService';
import { TWO_FA_TEMP_TOKEN_KEY, TWO_FA_USER_ID_KEY } from '../types';

/** Maximum number of failed TOTP attempts before lockout / Número máximo de intentos fallidos */
const MAX_ATTEMPTS = 5;

/**
 * Two-factor authentication login page component.
 * Guards against missing tempToken and handles TOTP verification flow.
 *
 * Componente de página de login 2FA.
 * Protege contra tempToken faltante y maneja el flujo de verificación TOTP.
 */
export default function TwoFactorLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);

  // Guard: redirect if no tempToken in sessionStorage
  useEffect(() => {
    const tempToken = sessionStorage.getItem(TWO_FA_TEMP_TOKEN_KEY);
    if (!tempToken) {
      navigate('/login');
    }
  }, [navigate]);

  /**
   * Handles TOTP code form submission.
   * Verifies code, fetches user, completes login, clears sessionStorage.
   *
   * Maneja el envío del formulario de código TOTP.
   * Verifica código, obtiene usuario, completa login, limpia sessionStorage.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    setError('');
    setIsLoading(true);

    const tempToken = sessionStorage.getItem(TWO_FA_TEMP_TOKEN_KEY);
    if (!tempToken) {
      navigate('/login');
      return;
    }

    try {
      // Step 1: Verify TOTP code with tempToken
      await twoFactorService.verifyLogin(code, tempToken);

      // Step 2: Fetch user data with the same tempToken
      const user = await twoFactorService.getUserWithToken(tempToken);

      // Step 3: Complete login flow
      login(tempToken, user);

      // Step 4: Clear 2FA sessionStorage data
      sessionStorage.removeItem(TWO_FA_TEMP_TOKEN_KEY);
      sessionStorage.removeItem(TWO_FA_USER_ID_KEY);

      // Step 5: Navigate to dashboard
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };

      // Expired token (401) → redirect to login
      if (axiosErr.response?.status === 401) {
        sessionStorage.removeItem(TWO_FA_TEMP_TOKEN_KEY);
        sessionStorage.removeItem(TWO_FA_USER_ID_KEY);
        navigate('/login');
        return;
      }

      // Invalid code → increment attempts
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLockedOut(true);
        setError('');
      } else {
        const message = axiosErr.response?.data?.message || t('twoFactor.loginInvalidCode');
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('twoFactor.loginTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('twoFactor.loginSubtitle')}</p>
        </div>

        {/* Error message / Mensaje de error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">{error}</div>
        )}

        {/* Lockout message */}
        {isLockedOut && (
          <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm text-center">
            {t('twoFactor.loginLockedOut')}
          </div>
        )}

        {/* TOTP code form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              {t('twoFactor.loginEnterCode')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl tracking-[0.5em] font-mono ring-offset-background placeholder:text-muted-foreground placeholder:text-sm placeholder:tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="000000"
              disabled={isLockedOut}
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isLockedOut}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('twoFactor.loginVerify')}
          </button>
        </form>

        {/* Recovery hint */}
        <p className="text-xs text-center text-muted-foreground">
          {t('twoFactor.loginRecoveryHint')}
        </p>
      </div>
    </div>
  );
}
