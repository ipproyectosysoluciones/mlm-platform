/**
 * @fileoverview Error Boundary — React class component for catching render errors
 * @description Catches JavaScript errors in the child component tree, logs them, and
 *              displays a fallback UI instead of a blank/black screen.
 *              Captura errores de JavaScript en el árbol de componentes hijos, los loguea,
 *              y muestra una UI de fallback en vez de una pantalla negra.
 * @module components/common/ErrorBoundary
 */

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

// ============================================
// Types / Tipos
// ============================================

/**
 * Props for ErrorBoundary component
 * Props del componente ErrorBoundary
 */
interface ErrorBoundaryProps {
  /** Child components to render / Componentes hijos a renderizar */
  children: ReactNode;
  /** Optional custom fallback UI / UI de fallback personalizada opcional */
  fallback?: ReactNode;
}

/**
 * State for ErrorBoundary component
 * Estado del componente ErrorBoundary
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught / Si se capturó un error */
  hasError: boolean;
  /** The caught error, if any / El error capturado, si existe */
  error: Error | null;
}

// ============================================
// Component / Componente
// ============================================

/**
 * React Error Boundary that prevents the entire app from crashing on render errors.
 * Shows a user-friendly fallback with a "Try Again" button.
 *
 * Error Boundary de React que previene que toda la app crashee por errores de render.
 * Muestra un fallback amigable con un botón de "Intentar de nuevo".
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error for debugging — in production this would go to Sentry
    // Logueamos el error para debug — en producción iría a Sentry
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-xl font-bold text-slate-900">Algo salió mal</h2>
            <p className="mb-1 text-sm text-slate-500">Something went wrong</p>

            {/* Error message (dev only) */}
            {this.state.error && (
              <p className="mt-3 mb-6 rounded-lg bg-slate-100 p-3 text-left font-mono text-xs text-slate-600 break-all">
                {this.state.error.message}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
              >
                Intentar de nuevo / Try again
              </button>
              <a href="/" className="text-sm text-slate-500 transition-colors hover:text-slate-700">
                Volver al inicio / Go home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
