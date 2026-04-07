/**
 * @fileoverview AdminToursPage — Admin CRUD for tour packages
 * @description Full administration page for managing Nexo Real tour packages.
 *              Includes paginated listing, filters by type/status/destination,
 *              create/edit modal, status toggle, and delete confirmation.
 *
 *              Página de administración completa para gestionar paquetes turísticos de Nexo Real.
 *              Incluye listado paginado, filtros por tipo/estado/destino,
 *              modal de creación/edición, toggle de estado y confirmación de eliminación.
 *
 * @module pages/AdminToursPage
 * @author MLM Development Team
 *
 * @example
 * // English: Access via /admin/tours (AdminRoute required)
 * // Español: Acceder vía /admin/tours (requiere AdminRoute)
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  MapPin,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { adminService } from '../services/api';

// ============================================
// TYPES
// ============================================

/** Tour type options / Tipos de tour */
type TourType = 'adventure' | 'cultural' | 'relaxation' | 'gastronomic' | 'ecotourism' | 'luxury';

/** Tour status options / Estados de tour */
type TourStatus = 'active' | 'inactive' | 'draft';

/**
 * TourPackage data shape returned from backend
 * Forma de datos de paquete turístico devuelta por el backend
 */
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

/**
 * Form data for create/edit modal
 * Datos del formulario para modal de creación/edición
 */
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

const TOUR_STATUSES: { value: TourStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Activo', color: 'text-emerald-700 bg-emerald-100' },
  { value: 'inactive', label: 'Inactivo', color: 'text-slate-600 bg-slate-100' },
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

// ============================================
// COMPONENT
// ============================================

/**
 * AdminToursPage — Admin CRUD for tour packages
 * AdminToursPage — CRUD de paquetes turísticos para admin
 */
export default function AdminToursPage() {
  // ── State ──────────────────────────────────
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination / Paginación
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters / Filtros
  const [filterType, setFilterType] = useState<TourType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TourStatus | 'all'>('all');
  const [filterDestination, setFilterDestination] = useState('');

  // Modal / Modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TourFormData>(EMPTY_FORM);

  // ── Effects ───────────────────────────────
  useEffect(() => {
    loadTours();
  }, [page, filterType, filterStatus, filterDestination]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data loading ──────────────────────────

  /**
   * Load tour packages from API with current filters
   * Cargar paquetes turísticos desde la API con los filtros actuales
   */
  async function loadTours() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_LIMIT };
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterDestination.trim()) params.destination = filterDestination.trim();

      const response = await adminService.getAdminTours(params);
      setTours(response.data || []);
      setTotal(response.total || response.data?.length || 0);
    } catch (err) {
      console.error('Error loading tours:', err);
      setError('Error al cargar los tours');
    } finally {
      setLoading(false);
    }
  }

  // ── Handlers ─────────────────────────────

  /**
   * Submit create or edit form
   * Enviar formulario de creación o edición
   */
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
        await adminService.updateTour(editingId, payload);
      } else {
        await adminService.createTour(payload);
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

  /**
   * Open edit modal with existing tour data
   * Abrir modal de edición con datos de tour existente
   */
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

  /**
   * Delete tour package with confirmation
   * Eliminar paquete turístico con confirmación
   */
  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Seguro que querés eliminar "${title}"? Esta acción no se puede deshacer.`))
      return;
    try {
      await adminService.deleteTour(id);
      loadTours();
    } catch (err) {
      console.error('Error deleting tour:', err);
      setError('Error al eliminar el tour');
    }
  }

  /**
   * Quick status toggle (active ↔ inactive)
   * Toggle rápido de estado (active ↔ inactive)
   */
  async function handleToggleStatus(tour: AdminTour) {
    const newStatus: TourStatus = tour.status === 'active' ? 'inactive' : 'active';
    try {
      await adminService.updateTour(tour.id, { status: newStatus });
      loadTours();
    } catch (err) {
      console.error('Error toggling tour status:', err);
    }
  }

  /**
   * Close and reset modal
   * Cerrar y resetear modal
   */
  function closeModal() {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError(null);
  }

  // ── Helpers ───────────────────────────────

  /**
   * Get status badge color class
   * Obtener clase de color del badge de estado
   */
  function getStatusColor(status: TourStatus) {
    return TOUR_STATUSES.find((s) => s.value === status)?.color ?? 'text-slate-700 bg-slate-100';
  }

  /**
   * Get status label
   * Obtener etiqueta de estado
   */
  function getStatusLabel(status: TourStatus) {
    return TOUR_STATUSES.find((s) => s.value === status)?.label ?? status;
  }

  /**
   * Get type label
   * Obtener etiqueta de tipo
   */
  function getTypeLabel(type: TourType) {
    return TOUR_TYPES.find((t) => t.value === type)?.label ?? type;
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
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <Compass className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Tours</h1>
            <p className="text-sm text-slate-500">Gestión de paquetes turísticos</p>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={loadTours}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo tour
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
            setFilterType(e.target.value as TourType | 'all');
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">Todos los tipos</option>
          {TOUR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as TourStatus | 'all');
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">Todos los estados</option>
          {TOUR_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={filterDestination}
          onChange={(e) => {
            setFilterDestination(e.target.value);
            setPage(1);
          }}
          placeholder="Filtrar por destino..."
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[180px]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        ) : tours.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Compass className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No hay tours</p>
            <p className="text-sm">Cambiá los filtros o creá un nuevo tour</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Tour</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Destino</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Duración</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Precio</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div
                        className="font-medium text-slate-900 truncate max-w-[200px]"
                        title={tour.title}
                      >
                        {tour.title}
                      </div>
                      {tour.titleEn && (
                        <div className="text-xs text-slate-400 truncate max-w-[200px]">
                          {tour.titleEn}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-0.5">
                        Grupos: {tour.minGroupSize}–{tour.maxCapacity} pers.
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{getTypeLabel(tour.type)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {tour.destination}
                      </div>
                      <div className="text-xs text-slate-400">{tour.country}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3" />
                        {tour.durationDays} día{tour.durationDays !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-3 h-3 text-slate-400" />
                        {Number(tour.price).toLocaleString('es-CO')} {tour.currency}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(tour)}
                        disabled={tour.status === 'draft'}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(tour.status)} hover:opacity-80 transition-opacity disabled:cursor-default`}
                        title={
                          tour.status === 'active'
                            ? 'Click para desactivar'
                            : tour.status === 'inactive'
                              ? 'Click para activar'
                              : 'Borrador — editar para publicar'
                        }
                      >
                        {getStatusLabel(tour.status)}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(tour)}
                          className="p-1.5 hover:bg-teal-50 text-teal-600 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tour.id, tour.title)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
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
        {!loading && tours.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">
              {total} tour{total !== 1 ? 's' : ''} — página {page} de {totalPages}
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

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Editar tour' : 'Nuevo tour'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Tipo + Estado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TourType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {TOUR_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as TourStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título (ES) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Tour Cafetalero por el Eje Cafetero"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título (EN)</label>
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="Ej: Coffee Region Cultural Tour"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Descripción del tour..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* Destino + País */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Destino <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="Ej: Salento"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Colombia"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Duración + Precio + Moneda */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Duración (días) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    placeholder="Ej: 3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mín. personas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.minGroupSize}
                    onChange={(e) => setFormData({ ...formData, minGroupSize: e.target.value })}
                    placeholder="Ej: 2"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Máx. personas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                    placeholder="Ej: 15"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingId ? 'Guardar cambios' : 'Crear tour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
