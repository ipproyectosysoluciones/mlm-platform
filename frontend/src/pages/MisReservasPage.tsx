/**
 * @fileoverview MisReservasPage - User's reservation list with cancellation support
 * @description Displays paginated list of user's reservations with status badges and cancel action.
 *               Muestra listado paginado de reservas del usuario con badges de estado y acción de cancelar.
 * @module pages/MisReservasPage
 * @author Nexo Real Development Team
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  MapPin,
  Compass,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { useMyReservations } from '../stores/reservationStore';
import type { Reservation, ReservationStatus } from '../services/reservationService';
import { cn } from '../lib/utils';

// ============================================
// Constants / Constantes
// ============================================

/** Limit per page / Límite por página */
const PAGE_LIMIT = 8;

// ============================================
// Helpers / Utilidades
// ============================================

/**
 * Returns a human-readable label and color class for a reservation status
 * Devuelve etiqueta legible y clase de color para un estado de reserva
 */
function getStatusConfig(status: ReservationStatus): {
  label: string;
  className: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case 'pending':
      return {
        label: 'Pendiente',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Clock className="w-3.5 h-3.5" />,
      };
    case 'confirmed':
      return {
        label: 'Confirmada',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    case 'cancelled':
      return {
        label: 'Cancelada',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: <XCircle className="w-3.5 h-3.5" />,
      };
    case 'completed':
      return {
        label: 'Completada',
        className: 'bg-slate-50 text-slate-600 border-slate-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    default:
      return {
        label: status,
        className: 'bg-slate-50 text-slate-600 border-slate-200',
        icon: null,
      };
  }
}

/**
 * Format a date string to a locale-friendly display
 * Formatea una cadena de fecha para visualización amigable
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ============================================
// Reservation Card / Tarjeta de reserva
// ============================================

interface ReservationCardProps {
  /** Reservation data / Datos de la reserva */
  reservation: Reservation;
  /** Whether a cancellation is in progress / Si hay una cancelación en progreso */
  isCancelling: boolean;
  /** Handler to cancel this specific reservation / Handler para cancelar esta reserva */
  onCancel: (id: string) => void;
}

/**
 * Displays a single reservation with its details and cancel action
 * Muestra una reserva individual con sus detalles y acción de cancelar
 */
function ReservationCard({ reservation, isCancelling, onCancel }: ReservationCardProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const statusConfig = getStatusConfig(reservation.status);

  const isProperty = Boolean(reservation.propertyId && reservation.property);
  const title = isProperty
    ? (reservation.property?.title ?? 'Propiedad')
    : (reservation.tourPackage?.title ?? 'Tour');
  const subtitle = isProperty
    ? `${reservation.property?.city ?? ''}`
    : `${reservation.tourPackage?.destination ?? ''}`;

  const canCancel = reservation.status === 'pending' || reservation.status === 'confirmed';

  const handleCancelClick = () => {
    if (confirmingCancel) {
      onCancel(reservation.id);
      setConfirmingCancel(false);
    } else {
      setConfirmingCancel(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            {isProperty ? (
              <MapPin className="w-5 h-5 text-emerald-500" />
            ) : (
              <Compass className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate leading-tight">{title}</p>
            {subtitle && (
              <p className="text-sm text-slate-500 truncate leading-tight mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium shrink-0',
            statusConfig.className
          )}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-sm">
        {isProperty && (
          <>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Check-in</p>
              <p className="font-medium text-slate-700">{formatDate(reservation.checkIn)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Check-out</p>
              <p className="font-medium text-slate-700">{formatDate(reservation.checkOut)}</p>
            </div>
          </>
        )}
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Personas</p>
          <p className="font-medium text-slate-700">{reservation.guests}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Total</p>
          <p className="font-semibold text-slate-800">
            {reservation.currency}{' '}
            {reservation.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Creada</p>
          <p className="font-medium text-slate-700">{formatDate(reservation.createdAt)}</p>
        </div>
      </div>

      {/* ID row */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400 font-mono truncate">#{reservation.id}</span>

        {canCancel && (
          <button
            onClick={handleCancelClick}
            disabled={isCancelling}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0',
              confirmingCancel
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'border border-red-200 text-red-600 hover:bg-red-50'
            )}
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Cancelando...
              </>
            ) : confirmingCancel ? (
              <>
                <Ban className="w-3.5 h-3.5" />
                ¿Confirmar cancelación?
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                Cancelar
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Skeleton loader / Skeleton de carga
// ============================================

/**
 * Skeleton placeholder card while loading
 * Tarjeta placeholder skeleton mientras carga
 */
function ReservationCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
        <div className="w-20 h-6 bg-slate-100 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
      <div className="h-3 bg-slate-100 rounded w-1/3" />
    </div>
  );
}

// ============================================
// Empty state / Estado vacío
// ============================================

/**
 * Empty state when user has no reservations
 * Estado vacío cuando el usuario no tiene reservas
 */
interface EmptyStateProps {
  /** Whether a status filter is active / Si hay un filtro de estado activo */
  hasFilter: boolean;
  onClear: () => void;
}

function EmptyState({ hasFilter, onClear }: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <CalendarDays className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">
        {hasFilter ? 'No hay reservas con ese filtro' : 'No tenés reservas todavía'}
      </h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        {hasFilter
          ? 'Probá con otro filtro o limpiá la búsqueda para ver todas.'
          : 'Explorá propiedades y tours disponibles para hacer tu primera reserva.'}
      </p>
      {hasFilter ? (
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Limpiar filtro
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/properties')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Ver propiedades
          </button>
          <button
            onClick={() => navigate('/tours')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Compass className="w-4 h-4" />
            Ver tours
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Page / Página principal
// ============================================

/**
 * MisReservasPage component — authenticated user's reservation list
 * Componente MisReservasPage — listado de reservas del usuario autenticado
 */
export default function MisReservasPage() {
  const {
    myReservations,
    reservationsPagination,
    isFetchingReservations,
    reservationsError,
    isCancelling,
    cancelError,
    fetchMyReservations,
    cancelReservation,
  } = useMyReservations();

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('');

  // Fetch on mount and whenever page / filter changes
  useEffect(() => {
    fetchMyReservations({
      page: currentPage,
      limit: PAGE_LIMIT,
      status: statusFilter || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  const handleCancel = async (id: string) => {
    try {
      await cancelReservation(id);
    } catch {
      // error is stored in store — displayed below
    }
  };

  const handleStatusChange = (value: ReservationStatus | '') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const totalPages = reservationsPagination?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Mis reservas</h1>
          <p className="text-slate-500 mt-1">Gestioná tus reservas de propiedades y tours.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              { value: '', label: 'Todas' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'confirmed', label: 'Confirmadas' },
              { value: 'cancelled', label: 'Canceladas' },
              { value: 'completed', label: 'Completadas' },
            ] as { value: ReservationStatus | ''; label: string }[]
          ).map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                statusFilter === option.value
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Cancel error global banner */}
        {cancelError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {cancelError}
          </div>
        )}

        {/* Content */}
        {isFetchingReservations ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <ReservationCardSkeleton key={i} />
            ))}
          </div>
        ) : reservationsError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-slate-600 font-medium mb-1">Error al cargar las reservas</p>
            <p className="text-sm text-slate-500 mb-4">{reservationsError}</p>
            <button
              onClick={() =>
                fetchMyReservations({
                  page: currentPage,
                  limit: PAGE_LIMIT,
                  status: statusFilter || undefined,
                })
              }
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        ) : myReservations.length === 0 ? (
          <EmptyState hasFilter={Boolean(statusFilter)} onClear={() => handleStatusChange('')} />
        ) : (
          <>
            {/* Reservation grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  isCancelling={isCancelling}
                  onCancel={handleCancel}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <p className="text-sm text-slate-500">
                  Página {currentPage} de {totalPages}
                  {reservationsPagination && (
                    <span className="ml-1 text-slate-400">
                      ({reservationsPagination.total} reservas)
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
