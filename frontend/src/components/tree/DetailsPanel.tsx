/**
 * DetailsPanel - Panel lateral de detalles del usuario
 * DetailsPanel - Side panel for user details
 *
 * Muestra información extendida del usuario seleccionado en el árbol.
 * Shows extended information of the selected user in the tree.
 *
 * Phase 3: Panel de detalles para Visual Tree UI.
 * Phase 3: Details panel for Visual Tree UI.
 *
 * @module components/tree/DetailsPanel
 */
import { useEffect } from 'react';
import { X, User, Mail, MapPin, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserDetails } from '../../types';

interface DetailsPanelProps {
  /** Datos del usuario */
  user: UserDetails | null;
  /** Si está cargando */
  isLoading?: boolean;
  /** Callback al cerrar */
  onClose: () => void;
  /** Callback para ver subtree */
  onViewSubtree?: (userId: string) => void;
  /** Idioma */
  language?: 'en' | 'es';
}

export default function DetailsPanel({
  user,
  isLoading = false,
  onClose,
  onViewSubtree,
  language = 'en',
}: DetailsPanelProps) {
  // Translation hook not currently used but available for i18n
  useTranslation();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isLeft = user?.position === 'left';

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-80 bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-out
          flex flex-col
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="details-title" className="text-lg font-semibold text-gray-900">
            {language === 'es' ? 'Detalles del Usuario' : 'User Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={language === 'es' ? 'Cerrar panel' : 'Close panel'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            // Loading state
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm text-gray-500">
                {language === 'es' ? 'Cargando...' : 'Loading...'}
              </p>
            </div>
          ) : user ? (
            // User details
            <div className="space-y-6">
              {/* Avatar and name */}
              <div className="flex items-center gap-4">
                <div
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center
                    text-2xl font-bold text-white
                    ${isLeft ? 'bg-blue-500' : 'bg-purple-500'}
                  `}
                >
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                  <span
                    className={`
                      inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${isLeft ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                    `}
                  >
                    {isLeft
                      ? language === 'es'
                        ? 'Izquierda'
                        : 'Left'
                      : language === 'es'
                        ? 'Derecha'
                        : 'Right'}
                  </span>
                </div>
              </div>

              {/* Info list */}
              <div className="space-y-4">
                <InfoRow
                  icon={<Mail className="w-4 h-4" />}
                  label={language === 'es' ? 'Email' : 'Email'}
                  value={user.email}
                />
                <InfoRow
                  icon={<User className="w-4 h-4" />}
                  label={language === 'es' ? 'Nivel' : 'Level'}
                  value={`${user.level}`}
                />
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label={language === 'es' ? 'Posición' : 'Position'}
                  value={
                    <span className={isLeft ? 'text-blue-600' : 'text-purple-600'}>
                      {isLeft
                        ? language === 'es'
                          ? 'Pierna Izquierda'
                          : 'Left Leg'
                        : language === 'es'
                          ? 'Pierna Derecha'
                          : 'Right Leg'}
                    </span>
                  }
                />
                <InfoRow
                  icon={<User className="w-4 h-4" />}
                  label={language === 'es' ? 'Estado' : 'Status'}
                  value={
                    <span
                      className={`
                        px-2 py-0.5 rounded text-xs font-medium
                        ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }
                      `}
                    >
                      {user.status === 'active'
                        ? language === 'es'
                          ? 'Activo'
                          : 'Active'
                        : language === 'es'
                          ? 'Inactivo'
                          : 'Inactive'}
                    </span>
                  }
                />
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label={language === 'es' ? 'Código de referido' : 'Referral Code'}
                  value={user.referralCode}
                />
              </div>

              {/* Stats section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {language === 'es' ? 'Estadísticas del Árbol' : 'Tree Statistics'}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label={language === 'es' ? 'Izq.' : 'Left'}
                    value={user.stats.leftCount}
                    color="blue"
                  />
                  <StatCard
                    label={language === 'es' ? 'Der.' : 'Right'}
                    value={user.stats.rightCount}
                    color="purple"
                  />
                  <StatCard
                    label={language === 'es' ? 'Total' : 'Total'}
                    value={user.stats.totalDownline}
                    color="gray"
                  />
                </div>
              </div>

              {/* Stats section - already has the tree stats */}
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <User className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm">
                {language === 'es' ? 'Seleccioná un usuario' : 'Select a user'}
              </p>
            </div>
          )}
        </div>

        {/* Footer with action */}
        {user && onViewSubtree && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => onViewSubtree(user.id)}
              className="
                w-full flex items-center justify-center gap-2
                bg-indigo-600 text-white py-2.5 px-4 rounded-lg
                hover:bg-indigo-700 transition-colors
                font-medium
              "
            >
              <span>{language === 'es' ? 'Ver Subárbol' : 'View Subtree'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Info row subcomponent
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

// Stat card subcomponent
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'purple' | 'gray';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-50 text-gray-700',
  };

  return (
    <div className={`text-center p-3 rounded-lg ${colorClasses[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
