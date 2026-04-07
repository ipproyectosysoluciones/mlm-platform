/**
 * @fileoverview AdminReservationsPage — Admin view for reservations (properties + tours)
 * @description Administration page for managing all reservations in Nexo Real.
 *              Supports filtering by type, status, and user; pagination; status updates
 *              (confirm/cancel/custom); and admin notes per reservation.
 *
 *              Página de administración para gestionar todas las reservas de Nexo Real.
 *              Soporta filtros por tipo, estado y usuario; paginación; actualización de estado
 *              (confirmar/cancelar/personalizado) y notas admin por reserva.
 *
 * @module pages/AdminReservationsPage
 * @author MLM Development Team
 *
 * @example
 * // English: Access via /admin/reservations (AdminRoute required)
 * // Español: Acceder vía /admin/reservations (requiere AdminRoute)
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  X,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Save,
  User,
} from 'lucide-react';
import { adminService } from '../services/api';

// ============================================
// TYPES
// ============================================

/** Reservation type options / Tipos de reserva */
type ReservationType = 'property' | 'tour';

/** Reservation status options / Estados de reserva */
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

/** Payment status options / Estados de pago */
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

/**
 * Reservation data shape returned from backend
 * Forma de datos de reserva devuelta por el backend
 */
interface AdminReservation {
  id: string;
  type: ReservationType;
  status: ReservationStatus;
  userId: string;
  vendorId: string | null;
  propertyId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  tourPackageId: string | null;
  tourDate: string | null;
  groupSize: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  totalPrice: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentId: string | null;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CONSTANTS
// ============================================

const RESERVATION_STATUSES: {
  value: ReservationStatus;
  label: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'pending',
    label: 'Pendiente',
    color: 'text-amber-700 bg-amber-100',
    icon: <Clock className="w-3 h-3" />,
  },
  {
    value: 'confirmed',
    label: 'Confirmada',
    color: 'text-emerald-700 bg-emerald-100',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  {
    value: 'cancelled',
    label: 'Cancelada',
    color: 'text-red-700 bg-red-100',
    icon: <XCircle className="w-3 h-3" />,
  },
  {
    value: 'completed',
    label: 'Completada',
    color: 'text-blue-700 bg-blue-100',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  {
    value: 'no_show',
    label: 'No se presentó',
    color: 'text-slate-600 bg-slate-100',
    icon: <XCircle className="w-3 h-3" />,
  },
];

const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendiente', color: 'text-amber-700 bg-amber-50' },
  { value: 'paid', label: 'Pagado', color: 'text-emerald-700 bg-emerald-50' },
  { value: 'refunded', label: 'Reembolsado', color: 'text-purple-700 bg-purple-50' },
  { value: 'failed', label: 'Fallido', color: 'text-red-700 bg-red-50' },
];

const PAGE_LIMIT = 20;

// ============================================
// COMPONENT
// ============================================

/**
 * AdminReservationsPage — Admin view for all reservations
 * AdminReservationsPage — Vista admin de todas las reservas
 */
export default function AdminReservationsPage() {
  // ── State ──────────────────────────────────
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination / Paginación
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters / Filtros
  const [filterType, setFilterType] = useState<ReservationType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'all'>('all');
  const [filterUserId, setFilterUserId] = useState('');

  // Notes modal / Modal de notas
  const [notesModal, setNotesModal] = useState<{
    id: string;
    guestName: string;
    notes: string | null;
    adminNotes: string;
    newStatus: ReservationStatus;
  } | null>(null);

  // ── Effects ───────────────────────────────
  useEffect(() => {
    loadReservations();
  }, [page, filterType, filterStatus, filterUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data loading ──────────────────────────

  /**
   * Load reservations from API with current filters
   * Cargar reservas desde la API con los filtros actuales
   */
  async function loadReservations() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_LIMIT };
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterUserId.trim()) params.userId = filterUserId.trim();

      const response = await adminService.getAdminReservations(params);
      setReservations(response.data || []);
      setTotal(response.total || response.data?.length || 0);
    } catch (err) {
      console.error('Error loading reservations:', err);
      setError('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  }

  // ── Handlers ─────────────────────────────

  /**
   * Quick confirm a reservation
   * Confirmar una reserva rápidamente
   */
  async function handleConfirm(id: string) {
    try {
      await adminService.confirmReservation(id);
      loadReservations();
    } catch (err) {
      console.error('Error confirming reservation:', err);
      setError('Error al confirmar la reserva');
    }
  }

  /**
   * Quick cancel a reservation
   * Cancelar una reserva rápidamente
   */
  async function handleCancel(id: string, guestName: string) {
    if (!confirm(`¿Cancelar la reserva de "${guestName}"?`)) return;
    try {
      await adminService.cancelReservation(id);
      loadReservations();
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      setError('Error al cancelar la reserva');
    }
  }

  /**
   * Open notes/status modal for a reservation
   * Abrir modal de notas/estado para una reserva
   */
  function openNotesModal(reservation: AdminReservation) {
    setNotesModal({
      id: reservation.id,
      guestName: reservation.guestName,
      notes: reservation.notes,
      adminNotes: reservation.adminNotes || '',
      newStatus: reservation.status,
    });
  }

  /**
   * Save admin notes and status update
   * Guardar notas admin y actualización de estado
   */
  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    if (!notesModal) return;
    setSaving(true);
    try {
      await adminService.updateReservationStatus(
        notesModal.id,
        notesModal.newStatus,
        notesModal.adminNotes || undefined
      );
      setNotesModal(null);
      loadReservations();
    } catch (err) {
      console.error('Error updating reservation:', err);
      setError('Error al actualizar la reserva');
    } finally {
      setSaving(false);
    }
  }

  // ── Helpers ───────────────────────────────

  /**
   * Get status badge color class
   * Obtener clase de color del badge de estado
   */
  function getStatusColor(status: ReservationStatus) {
    return (
      RESERVATION_STATUSES.find((s) => s.value === status)?.color ?? 'text-slate-700 bg-slate-100'
    );
  }

  /**
   * Get status label
   * Obtener etiqueta de estado
   */
  function getStatusLabel(status: ReservationStatus) {
    return RESERVATION_STATUSES.find((s) => s.value === status)?.label ?? status;
  }

  /**
   * Get payment status badge
   * Obtener badge de estado de pago
   */
  function getPaymentBadge(status: PaymentStatus) {
    const found = PAYMENT_STATUSES.find((p) => p.value === status);
    return found ?? { label: status, color: 'text-slate-700 bg-slate-50' };
  }

  /**
   * Format date for display
   * Formatear fecha para mostrar
   */
  function formatDate(date: string | null) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // ── Render ────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reservas</h1>
            <p className="text-sm text-slate-500">Gestión de reservas de propiedades y tours</p>
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={loadReservations}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <X className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as ReservationType | 'all');
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">Todos los tipos</option>
          <option value="property">Propiedad</option>
          <option value="tour">Tour</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as ReservationStatus | 'all');
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">Todos los estados</option>
          {RESERVATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={filterUserId}
          onChange={(e) => {
            setFilterUserId(e.target.value);
            setPage(1);
          }}
          placeholder="Filtrar por User ID..."
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-w-[200px]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <CalendarDays className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No hay reservas</p>
            <p className="text-sm">Cambiá los filtros para ver otras reservas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Huésped</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Fechas</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Pago</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    {/* Guest info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{res.guestName}</div>
                          <div className="text-xs text-slate-400">{res.guestEmail}</div>
                          {res.guestPhone && (
                            <div className="text-xs text-slate-400">{res.guestPhone}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 text-slate-600">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          res.type === 'property'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        {res.type === 'property' ? 'Propiedad' : 'Tour'}
                      </span>
                      {res.groupSize > 1 && (
                        <div className="text-xs text-slate-400 mt-1">{res.groupSize} pers.</div>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3 text-slate-600">
                      {res.type === 'property' ? (
                        <div className="text-xs space-y-0.5">
                          <div>Entrada: {formatDate(res.checkIn)}</div>
                          <div>Salida: {formatDate(res.checkOut)}</div>
                        </div>
                      ) : (
                        <div className="text-xs">
                          <div>Fecha: {formatDate(res.tourDate)}</div>
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-1">
                        Creada: {formatDate(res.createdAt)}
                      </div>
                    </td>

                    {/* Total price */}
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {Number(res.totalPrice).toLocaleString('es-CO')} {res.currency}
                    </td>

                    {/* Payment status */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPaymentBadge(res.paymentStatus).color}`}
                      >
                        {getPaymentBadge(res.paymentStatus).label}
                      </span>
                    </td>

                    {/* Reservation status */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getStatusColor(res.status)}`}
                      >
                        {getStatusLabel(res.status)}
                      </span>
                      {res.adminNotes && (
                        <div
                          className="text-xs text-slate-400 mt-1 max-w-[120px] truncate"
                          title={res.adminNotes}
                        >
                          📝 {res.adminNotes}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Confirm — only for pending */}
                        {res.status === 'pending' && (
                          <button
                            onClick={() => handleConfirm(res.id)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                            title="Confirmar reserva"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancel — pending or confirmed */}
                        {(res.status === 'pending' || res.status === 'confirmed') && (
                          <button
                            onClick={() => handleCancel(res.id, res.guestName)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Cancelar reserva"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Notes / status update — always */}
                        <button
                          onClick={() => openNotesModal(res)}
                          className="p-1.5 hover:bg-violet-50 text-violet-600 rounded-lg transition-colors"
                          title="Notas y estado"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && reservations.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">
              {total} reserva{total !== 1 ? 's' : ''} — página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes / Status modal */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Reserva — {notesModal.guestName}</h2>
              <button
                onClick={() => setNotesModal(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="p-6 space-y-4">
              {/* Guest notes (read-only) */}
              {notesModal.notes && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notas del huésped
                  </label>
                  <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    {notesModal.notes}
                  </p>
                </div>
              )}

              {/* New status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select
                  value={notesModal.newStatus}
                  onChange={(e) =>
                    setNotesModal({ ...notesModal, newStatus: e.target.value as ReservationStatus })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {RESERVATION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Admin notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notas admin (internas)
                </label>
                <textarea
                  value={notesModal.adminNotes}
                  onChange={(e) => setNotesModal({ ...notesModal, adminNotes: e.target.value })}
                  rows={4}
                  placeholder="Notas internas sobre esta reserva..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNotesModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
