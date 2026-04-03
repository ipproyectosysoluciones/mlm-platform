/**
 * @fileoverview Suspense boundary with Error handling
 * @description Error boundary wrapper with Suspense for async data loading
 *              Wrapper de error boundary con Suspense para carga async de datos
 * @module components/async/SuspenseBoundary
 */

import { Component, type ReactNode, Suspense } from 'react';

interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches React errors
 * Components for catching errors in the component tree
 */
class ErrorBoundary extends Component<
  { children: ReactNode; onError?: (e: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onError?: (e: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Algo salió mal</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Combined Suspense + Error Boundary component
 * Provides loading fallback and error handling for async components
 *
 * @example
 * <SuspenseBoundary fallback={<Skeleton />}>
 *   <AsyncDataComponent />
 * </SuspenseBoundary>
 */
export function SuspenseBoundary({
  children,
  fallback,
  onError,
}: SuspenseBoundaryProps): ReactNode {
  return (
    <ErrorBoundary onError={onError}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}

/**
 * Simple fallback skeleton for loading states
 */
export function LoadingSkeleton({ className = '' }: { className?: string }): ReactNode {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-4 bg-muted rounded w-5/6" />
    </div>
  );
}

/**
 * Card skeleton for loading card content
 */
export function CardSkeleton(): ReactNode {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-4">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table skeleton for loading table content
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }): ReactNode {
  return (
    <div className="rounded-md border">
      <div className="border-b p-4">
        <div className="h-5 bg-muted rounded w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b p-4 last:border-b-0 flex items-center gap-4">
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      ))}
    </div>
  );
}
