/**
 * @fileoverview ErrorToast Component - Error notification
 * @description Toast notification component for displaying errors
 * @module components/ErrorToast
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Toast types
 */
type ToastType = 'error' | 'info' | 'success';

/**
 * ErrorToast props
 */
interface ErrorToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  className?: string;
}

/**
 * Type configuration mapping
 */
const typeConfig: Record<
  ToastType,
  {
    icon: React.ComponentType<{ className?: string }>;
    bgClass: string;
    borderClass: string;
    textClass: string;
    iconClass: string;
  }
> = {
  error: {
    icon: AlertCircle,
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    textClass: 'text-red-300',
    iconClass: 'text-red-400',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-300',
    iconClass: 'text-blue-400',
  },
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    textClass: 'text-green-300',
    iconClass: 'text-green-400',
  },
};

/**
 * ErrorToast component - Error notification toast
 * Componente de toast de error - Notificación de error tipo toast
 */
export function ErrorToast({
  message,
  type = 'error',
  isVisible,
  onClose,
  duration = 5000,
  className,
}: ErrorToastProps) {
  const { t } = useTranslation();
  const [isExiting, setIsExiting] = useState(false);

  const config = typeConfig[type];
  const Icon = config.icon;

  // Auto-dismiss timer
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  // Handle exit animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-md rounded-lg border p-4 shadow-lg',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        config.bgClass,
        config.borderClass,
        isExiting && 'animate-out slide-out-to-bottom-4 fade-out',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Icon className={cn('h-5 w-5 shrink-0', config.iconClass)} />

        {/* Message */}
        <p className={cn('flex-1 text-sm', config.textClass)}>{message}</p>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={cn(
            'shrink-0 rounded p-1 transition-colors',
            'hover:bg-white/10',
            'focus:outline-none focus:ring-2 focus:ring-purple-500'
          )}
          aria-label={t('common.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * ErrorToastContainer - Manages multiple toasts
 * Contenedor de ErrorToast - Gestiona múltiples toasts
 */
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ErrorToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  className?: string;
}

export function ErrorToastContainer({ toasts, onRemove, className }: ErrorToastContainerProps) {
  return (
    <div className={cn('fixed bottom-4 right-4 z-50 flex flex-col gap-2', className)}>
      {toasts.map((toast) => (
        <ErrorToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

export default ErrorToast;
