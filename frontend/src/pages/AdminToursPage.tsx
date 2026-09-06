/**
 * @fileoverview AdminToursPage — Admin CRUD for tour packages.
 * Now delegates rendering to shared AdminCrudTable<T>, AdminFormModal, and AdminStatusBadge.
 *
 * @module pages/AdminToursPage
 */
import { useState, useEffect } from 'react';
import { Compass, MapPin, Clock, DollarSign } from 'lucide-react';
import { adminService } from '../services/api';
import { createCrudApi } from '../services/crud-api';
import AdminCrudTable from '../components/admin/AdminCrudTable';
import AdminFormModal from '../components/admin/AdminFormModal';
import AdminStatusBadge from '../components/admin/AdminStatusBadge';
import type { ColumnDef, FilterDef, StatusConfig } from '../components/admin/AdminCrudTableTypes';

// ============================================
// TYPES
// ============================================

type TourType = 'adventure' | 'cultural' | 'relaxation' | 'gastronomic' | 'ecotourism' | 'luxury';
type TourStatus = 'active' | 'inactive' | 'draft';

interface AdminTour {
  id: string;
  type: TourType;
  title: string;
  titleEn: string | null;
  description: string | null;
  destination: string;
  country: string;
  durationDays: number;
  price: number;
  currency: string;
  maxCapacity: number;
  minGroupSize: number;
  status: TourStatus;
  createdAt: string;
  updatedAt: string;
}

interface TourFormData {
  type: TourType;
  title: string;
  titleEn: string;
  description: string;
  destination: string;
  country: string;
  durationDays: string;
  price: string;
  currency: string;
  maxCapacity: string;
  minGroupSize: string;
  status: TourStatus;
}

// ============================================
// CONSTANTS
// ============================================

const TOUR_TYPES: { value: TourType; label: string }[] = [
  { value: 'adventure', label: 'Aventura' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'relaxation', label: 'Relajación' },
  { value: 'gastronomic', label: 'Gastronómico' },
  { value: 'ecotourism', label: 'Ecoturismo' },
  { value: 'luxury', label: 'Lujo' },
];

const TOUR_STATUSES: StatusConfig[] = [
  { value: 'active', label: 'Activo', color: 'text-emerald-700 bg-emerald-100' },
  { value: 'inactive', label: 'Inactivo', color: 'text-[var(--color-foreground-muted)] bg-[var(--color-secondary)]' },
  { value: 'draft', label: 'Borrador', color: 'text-amber-700 bg-amber-100' },
];

const EMPTY_FORM: TourFormData = {
  type: 'adventure',
  title: '',
  titleEn: '',
  description: '',
  destination: '',
  country: 'Colombia',
  durationDays: '',
  price: '',
  currency: 'USD',
  maxCapacity: '',
  minGroupSize: '',
  status: 'active',
};

const PAGE_LIMIT = 20;

// API adapter
const tourApi = createCrudApi<AdminTour>({
  list: (params) => adminService.getAdminTours(params),
  create: (data) => adminService.createTour(data),
  update: (id, data) => adminService.updateTour(id, data),
  delete: (id) => adminService.deleteTour(id),
  dataKey: 'data',
});

// ============================================
// COMPONENT
// ============================================

export default function AdminToursPage() {
  // State
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<TourType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TourStatus | 'all'>('all');
  const [filterDestination, setFilterDestination] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TourFormData>(EMPTY_FORM);

  // Data loading
  useEffect(() => {
    loadTours();
  }, [page, filterType, filterStatus, filterDestination]);

  async function loadTours() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_LIMIT };
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterDestination.trim()) params.destination = filterDestination.trim();
      const response = await tourApi.list(params as any);
      setTours(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error('Error loading tours:', err);
      setError('Error al cargar los tours');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        type: formData.type,
        title: formData.title,
        titleEn: formData.titleEn || undefined,
        description: formData.description || undefined,
        destination: formData.destination,
        country: formData.country,
        durationDays: parseInt(formData.durationDays),
        price: parseFloat(formData.price),
        currency: formData.currency,
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : undefined,
        minGroupSize: formData.minGroupSize ? parseInt(formData.minGroupSize) : undefined,
        status: formData.status,
      };
      if (editingId) {
        await tourApi.update!(editingId, payload);
      } else {
        await tourApi.create!(payload);
      }
      closeModal();
      loadTours();
    } catch (err) {
      console.error('Error saving tour:', err);
      setError('Error al guardar el tour');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(tour: AdminTour) {
    setEditingId(tour.id);
    setFormData({
      type: tour.type,
      title: tour.title,
      titleEn: tour.titleEn || '',
      description: tour.description || '',
      destination: tour.destination,
      country: tour.country,
      durationDays: String(tour.durationDays),
      price: String(tour.price),
      currency: tour.currency,
      maxCapacity: tour.maxCapacity ? String(tour.maxCapacity) : '',
      minGroupSize: tour.minGroupSize ? String(tour.minGroupSize) : '',
      status: tour.status,
    });
    setShowForm(true);
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`¿Seguro que querés eliminar "${label}"? Esta acción no se puede deshacer.`))
      return;
    try {
      await tourApi.delete!(id);
      loadTours();
    } catch (err) {
      console.error('Error deleting tour:', err);
      setError('Error al eliminar el tour');
    }
  }

  async function handleToggleStatus(tour: AdminTour) {
    const newStatus: TourStatus = tour.status === 'active' ? 'inactive' : 'active';
    try {
      await adminService.updateTour(tour.id, { status: newStatus });
      loadTours();
    } catch (err) {
      console.error('Error toggling tour status:', err);
    }
  }

  function closeModal() {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  function getTypeLabel(type: TourType) {
    return TOUR_TYPES.find((t) => t.value === type)?.label ?? type;
  }

  // Columns
  const columns: ColumnDef<AdminTour>[] = [
    {
      key: 'title',
      header: 'Tour',
      render: (t) => (
        <div>
          <div className="font-medium text-[var(--color-foreground)] truncate max-w-[200px]" title={t.title}>
            {t.title}
          </div>
          {t.titleEn && (
            <div className="text-xs text-[var(--color-foreground-muted)] truncate max-w-[200px]">{t.titleEn}</div>
          )}
          <div className="text-xs text-[var(--color-foreground-muted)] mt-0.5">
            Grupos: {t.minGroupSize}–{t.maxCapacity} pers.
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (t) => <span className="text-[var(--color-foreground-muted)]">{getTypeLabel(t.type)}</span>,
    },
    {
      key: 'destination',
      header: 'Destino',
      render: (t) => (
        <div>
          <div className="flex items-center gap-1 text-[var(--color-foreground-muted)]">
            <MapPin className="w-3 h-3 shrink-0" />
            {t.destination}
          </div>
          <div className="text-xs text-[var(--color-foreground-muted)]">{t.country}</div>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duración',
      align: 'center',
      render: (t) => (
        <div className="flex items-center justify-center gap-1 text-[var(--color-foreground-muted)]">
          <Clock className="w-3 h-3" />
          {t.durationDays} día{t.durationDays !== 1 ? 's' : ''}
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Precio',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1 font-medium text-[var(--color-foreground)]">
          <DollarSign className="w-3 h-3 text-[var(--color-foreground-muted)]" />
          {Number(t.price).toLocaleString('es-CO')} {t.currency}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (t) => (
        <AdminStatusBadge
          value={t.status}
          config={TOUR_STATUSES}
          onClick={t.status !== 'draft' ? () => handleToggleStatus(t) : undefined}
          disabled={t.status === 'draft'}
        />
      ),
    },
  ];

  // Filters
  const filters: FilterDef[] = [
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      value: filterType,
      onChange: (v) => {
        setFilterType(v as TourType | 'all');
        setPage(1);
      },
      options: [
        { value: 'all', label: 'Todos los tipos' },
        ...TOUR_TYPES.map((t) => ({ value: t.value, label: t.label })),
      ],
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      value: filterStatus,
      onChange: (v) => {
        setFilterStatus(v as TourStatus | 'all');
        setPage(1);
      },
      options: [
        { value: 'all', label: 'Todos los estados' },
        ...TOUR_STATUSES.map((s) => ({ value: s.value, label: s.label })),
      ],
    },
    {
      key: 'destination',
      label: 'Destino',
      type: 'text',
      value: filterDestination,
      onChange: (v) => {
        setFilterDestination(v);
        setPage(1);
      },
      placeholder: 'Filtrar por destino...',
      className: 'min-w-[180px]',
    },
  ];

  return (
    <>
      <AdminCrudTable
        title="Tours"
        description="Gestión de paquetes turísticos"
        icon={<Compass className="w-5 h-5" />}
        accentColor="teal"
        columns={columns}
        filters={filters}
        data={tours}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onRefresh={loadTours}
        onCreate={() => setShowForm(true)}
        onEdit={handleEdit}
        onDelete={(id, label) => handleDelete(id, label)}
        getDeleteLabel={(t) => t.title}
        entityLabel="tour"
        entityLabelPlural="tours"
      />

      <AdminFormModal
        isOpen={showForm}
        onClose={closeModal}
        title={editingId ? 'Editar tour' : 'Nuevo tour'}
        saving={saving}
        onSubmit={handleSubmit}
      >
        {/* Tipo + Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as TourType })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {TOUR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Estado</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TourStatus })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {TOUR_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Título ES + EN */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            Título (ES) <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ej: Tour Cafetalero por el Eje Cafetero"
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Título (EN)</label>
          <input
            type="text"
            value={formData.titleEn}
            onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
            placeholder="Ej: Coffee Region Cultural Tour"
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Descripción del tour..."
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        {/* Destino + País */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Destino <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="Ej: Salento"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">País</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Colombia"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Duración + Precio + Moneda */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Duración (días) <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="number"
              min={1}
              value={formData.durationDays}
              onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
              placeholder="Ej: 3"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Precio <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Ej: 250"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Moneda</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="USD">USD</option>
              <option value="COP">COP</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Capacidad */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Mín. personas</label>
            <input
              type="number"
              min={1}
              value={formData.minGroupSize}
              onChange={(e) => setFormData({ ...formData, minGroupSize: e.target.value })}
              placeholder="Ej: 2"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Máx. personas</label>
            <input
              type="number"
              min={1}
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
              placeholder="Ej: 15"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Error in modal */}
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      </AdminFormModal>
    </>
  );
}
