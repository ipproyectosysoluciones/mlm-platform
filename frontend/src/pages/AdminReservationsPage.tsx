/**
 * @fileoverview AdminReservationsPage — Admin view for reservations.
 * Now delegates rendering to shared AdminCrudTable<T>, AdminStatusBadge,
 * and AdminNotesModal.
 *
 * NOTE: Reservations is a booking engine (login required), NOT a symmetric CRUD.
 * No create/edit/delete — only confirm, cancel, and notes/status updates.
 *
 * @module pages/AdminReservationsPage
 */
import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, User, CheckCircle, XCircle, FileText } from 'lucide-react';
import { adminService } from '../services/api';
import { createCrudApi } from '../services/crud-api';
import AdminCrudTable from '../components/admin/AdminCrudTable';
import AdminNotesModal from '../components/admin/AdminNotesModal';
import AdminStatusBadge from '../components/admin/AdminStatusBadge';
import type { ColumnDef, FilterDef, StatusConfig } from '../components/admin/AdminCrudTableTypes';

// ============================================
// TYPES
// ============================================

type ReservationType = 'property' | 'tour';
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

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

const RESERVATION_STATUSES: StatusConfig[] = [
  { value: 'pending', label: 'Pendiente', color: 'text-amber-700 bg-amber-100' },
  { value: 'confirmed', label: 'Confirmada', color: 'text-emerald-700 bg-emerald-100' },
  { value: 'cancelled', label: 'Cancelada', color: 'text-red-700 bg-red-100' },
  { value: 'completed', label: 'Completada', color: 'text-blue-700 bg-blue-100' },
  { value: 'no_show', label: 'No se presentó', color: 'text-slate-600 bg-slate-100' },
];

const RESERVATION_STATUS_OPTIONS = RESERVATION_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}));

const PAYMENT_STATUSES: StatusConfig[] = [
  { value: 'pending', label: 'Pendiente', color: 'text-amber-700 bg-amber-50' },
  { value: 'paid', label: 'Pagado', color: 'text-emerald-700 bg-emerald-50' },
  { value: 'refunded', label: 'Reembolsado', color: 'text-purple-700 bg-purple-50' },
  { value: 'failed', label: 'Fallido', color: 'text-red-700 bg-red-50' },
];

const PAGE_LIMIT = 20;

// API adapter — no create/update/delete for reservations (booking engine)
const reservationApi = createCrudApi<AdminReservation>({
  list: (params) => adminService.getAdminReservations(params),
  dataKey: 'data',
});

// ============================================
// HELPERS
// ============================================

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ============================================
// COMPONENT
// ============================================

export default function AdminReservationsPage() {
  // State
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<ReservationType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'all'>('all');
  const [filterUserId, setFilterUserId] = useState('');

  // Notes modal
  const [notesModal, setNotesModal] = useState<{
    reservation: AdminReservation;
  } | null>(null);

  // Data loading
  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_LIMIT };
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterUserId.trim()) params.userId = filterUserId.trim();
      const response = await reservationApi.list(params as any);
      setReservations(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error('Error loading reservations:', err);
      setError('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterStatus, filterUserId]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Actions
  async function handleConfirm(id: string) {
    try {
      await adminService.confirmReservation(id);
      loadReservations();
    } catch (err) {
      console.error('Error confirming reservation:', err);
      setError('Error al confirmar la reserva');
    }
  }

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

  async function handleSaveNotes(status: string, adminNotes: string) {
    if (!notesModal) return;
    setSaving(true);
    try {
      await adminService.updateReservationStatus(
        notesModal.reservation.id,
        status,
        adminNotes || undefined
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // Columns
  const columns: ColumnDef<AdminReservation>[] = [
    {
      key: 'guest',
      header: 'Huésped',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <div>
            <div className="font-medium text-slate-900">{r.guestName}</div>
            <div className="text-xs text-slate-400">{r.guestEmail}</div>
            {r.guestPhone && <div className="text-xs text-slate-400">{r.guestPhone}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (r) => (
        <div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              r.type === 'property' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'
            }`}
          >
            {r.type === 'property' ? 'Propiedad' : 'Tour'}
          </span>
          {r.groupSize > 1 && (
            <div className="text-xs text-slate-400 mt-1">{r.groupSize} pers.</div>
          )}
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Fechas',
      render: (r) => (
        <div className="text-slate-600">
          {r.type === 'property' ? (
            <div className="text-xs space-y-0.5">
              <div>Entrada: {formatDate(r.checkIn)}</div>
              <div>Salida: {formatDate(r.checkOut)}</div>
            </div>
          ) : (
            <div className="text-xs">
              <div>Fecha: {formatDate(r.tourDate)}</div>
            </div>
          )}
          <div className="text-xs text-slate-400 mt-1">Creada: {formatDate(r.createdAt)}</div>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (r) => (
        <span className="font-medium text-slate-900">
          {Number(r.totalPrice).toLocaleString('es-CO')} {r.currency}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Pago',
      align: 'center',
      render: (r) => <AdminStatusBadge value={r.paymentStatus} config={PAYMENT_STATUSES} />,
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (r) => (
        <div>
          <AdminStatusBadge value={r.status} config={RESERVATION_STATUSES} />
          {r.adminNotes && (
            <div
              className="text-xs text-slate-400 mt-1 max-w-[120px] truncate"
              title={r.adminNotes}
            >
              📝 {r.adminNotes}
            </div>
          )}
        </div>
      ),
    },
  ];

  // Custom actions renderer
  function renderActions(reservation: AdminReservation) {
    return (
      <div className="flex items-center justify-center gap-1">
        {reservation.status === 'pending' && (
          <button
            onClick={() => handleConfirm(reservation.id)}
            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
            title="Confirmar reserva"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
          <button
            onClick={() => handleCancel(reservation.id, reservation.guestName)}
            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
            title="Cancelar reserva"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setNotesModal({ reservation })}
          className="p-1.5 hover:bg-violet-50 text-violet-600 rounded-lg transition-colors"
          title="Notas y estado"
        >
          <FileText className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Filters
  const filters: FilterDef[] = [
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      value: filterType,
      onChange: (v) => {
        setFilterType(v as ReservationType | 'all');
        setPage(1);
      },
      options: [
        { value: 'all', label: 'Todos los tipos' },
        { value: 'property', label: 'Propiedad' },
        { value: 'tour', label: 'Tour' },
      ],
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      value: filterStatus,
      onChange: (v) => {
        setFilterStatus(v as ReservationStatus | 'all');
        setPage(1);
      },
      options: [
        { value: 'all', label: 'Todos los estados' },
        ...RESERVATION_STATUSES.map((s) => ({ value: s.value, label: s.label })),
      ],
    },
    {
      key: 'userId',
      label: 'Usuario',
      type: 'text',
      value: filterUserId,
      onChange: (v) => {
        setFilterUserId(v);
        setPage(1);
      },
      placeholder: 'Filtrar por User ID...',
      className: 'min-w-[200px]',
    },
  ];

  return (
    <>
      <AdminCrudTable
        title="Reservas"
        description="Gestión de reservas de propiedades y tours"
        icon={<CalendarDays className="w-5 h-5" />}
        accentColor="violet"
        columns={columns}
        filters={filters}
        data={reservations}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onRefresh={loadReservations}
        renderActions={renderActions}
        entityLabel="reserva"
        entityLabelPlural="reservas"
      />

      {notesModal && (
        <AdminNotesModal
          isOpen={true}
          onClose={() => setNotesModal(null)}
          title={`Reserva — ${notesModal.reservation.guestName}`}
          currentStatus={notesModal.reservation.status}
          statusOptions={RESERVATION_STATUS_OPTIONS}
          currentNotes={notesModal.reservation.notes || ''}
          onSave={handleSaveNotes}
        />
      )}
    </>
  );
}
