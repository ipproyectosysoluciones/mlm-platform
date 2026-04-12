/**
 * Login Page - Diseño split con branding Nexo Real (inmobiliaria/turismo).
 * Panel izquierdo con imagen de fondo y quote, panel derecho con formulario.
 *
 * Login Page - Split layout with Nexo Real branding (real estate/tourism).
 * Left panel with background image and quote, right panel with form.
 *
 * @module pages/Login
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { authService } from '../services/api';
import { is2FARequired, TWO_FA_TEMP_TOKEN_KEY, TWO_FA_USER_ID_KEY } from '../types';

/**
 * Login page component with Nexo Real brand identity.
 * Componente de página de login con identidad visual de Nexo Real.
 */
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      if (is2FARequired(response)) {
        sessionStorage.setItem(TWO_FA_TEMP_TOKEN_KEY, response.tempToken);
        sessionStorage.setItem(TWO_FA_USER_ID_KEY, response.userId);
        navigate('/login/2fa');
        return;
      }
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left panel — Nexo Real branding */}
      <div className="relative hidden h-full flex-col bg-slate-900 p-10 text-white lg:flex overflow-hidden">
        {/* Gradient overlay representing real estate / Overlay degradado que representa inmobiliaria */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-teal-900/60 to-slate-900" />
        {/* Decorative grid pattern / Patrón de grilla decorativo */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <Link to="/" className="relative z-20 flex items-center gap-3 text-lg font-medium">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold">Nexo Real</span>
        </Link>

        {/* Subtitle / Subtítulo */}
        <p className="relative z-20 mt-2 text-sm text-emerald-300">{t('auth.loginSubtitle')}</p>

        {/* Quote */}
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-3">
            <p className="text-lg leading-relaxed text-slate-100">{t('auth.loginQuote')}</p>
            <footer className="text-sm text-emerald-300 font-medium">
              — {t('auth.loginQuoteAuthor')}
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {/* Header */}
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{t('auth.welcome')}</h1>
            <p className="text-sm text-muted-foreground">{t('auth.signInSubtitle')}</p>
          </div>

          {/* Error message / Mensaje de error */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">{error}</div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="nombre@ejemplo.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.signIn')}
            </button>
          </form>

          {/* Register link / Enlace de registro */}
          <p className="px-8 text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="underline underline-offset-4 hover:text-primary">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
