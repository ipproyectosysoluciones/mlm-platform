/**
 * @fileoverview AdminPropertiesPage — Admin CRUD for real estate properties
 * @description Full administration page for managing Nexo Real properties.
 *              Includes paginated listing, filters by type/status/city,
 *              create/edit modal, status toggle, and delete confirmation.
 *
 *              Página de administración completa para gestionar propiedades de Nexo Real.
 *              Incluye listado paginado, filtros por tipo/estado/ciudad,
 *              modal de creación/edición, toggle de estado y confirmación de eliminación.
 *
 * @module pages/AdminPropertiesPage
 * @author MLM Development Team
 *
 * @example
 * // English: Access via /admin/properties (AdminRoute required)
 * // Español: Acceder vía /admin/properties (requiere AdminRoute)
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
  Building2,
  MapPin,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminService } from '../services/api';

// ============================================
// TYPES
// ============================================

/** Property type options / Tipos de propiedad */
type PropertyType = 'rental' | 'sale' | 'management';

/** Property status options / Estados de propiedad */
type PropertyStatus = 'available' | 'rented' | 'sold' | 'paused';

/**
 * Property data shape returned from backend
 * Forma de datos de propiedad devuelta por el backend
 */
interface AdminProperty {
  id: string;
  type: PropertyType;
  title: string;
  titleEn: string | null;
  description: string | null;
  price: number;
  currency: string;
  priceNegotiable: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  address: string;
  city: string;
  country: string;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for create/edit modal
 * Datos del formulario para modal de creación/edición
 */
interface PropertyFormData {
  type: PropertyType;
  title: string;
  titleEn: string;
  description: string;
  price: string;
  currency: string;
  priceNegotiable: boolean;
  bedrooms: string;
  bathrooms: string;
  areaM2: string;
  address: string;
  city: string;
  country: string;
  status: PropertyStatus;
}

// ============================================
// CONSTANTS
// ============================================

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'rental', label: 'Alquiler' },
  { value: 'sale', label: 'Venta' },
  { value: 'management', label: 'Gestión' },
];

const PROPERTY_STATUSES: { value: PropertyStatus; label: string; color: string }[] = [
  { value: 'available', label: 'Disponible', color: 'text-emerald-700 bg-emerald-100' },
  { value: 'rented', label: 'Alquilado', color: 'text-blue-700 bg-blue-100' },
  { value: 'sold', label: 'Vendido', color: 'text-purple-700 bg-purple-100' },
  { value: 'paused', label: 'Pausado', color: 'text-amber-700 bg-amber-100' },
];

const EMPTY_FORM: PropertyFormData = {
  type: 'rental',
  title: '',
  titleEn: '',
  description: '',
  price: '',
  currency: 'COP',
  priceNegotiable: false,
  bedrooms: '',
  bathrooms: '',
  areaM2: '',
  address: '',
  city: '',
  country: 'Colombia',
  status: 'available',
};

const PAGE_LIMIT = 20;

// ============================================
// COMPONENT
// ============================================

/**
 * AdminPropertiesPage — Admin CRUD for properties
 * AdminPropertiesPage — CRUD de propiedades para admin
 */
export default function AdminPropertiesPage() {
  // ── State ──────────────────────────────────
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination / Paginación
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters / Filtros
  const [filterType, setFilterType] = useState<PropertyType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<PropertyStatus | 'all'>('all');
  const [filterCity, setFilterCity] = useState('');

  // Modal / Modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(EMPTY_FORM);

  // ── Effects ───────────────────────────────
  useEffect(() => {
    loadProperties();
  }, [page, filterType, filterStatus, filterCity]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data loading ──────────────────────────

  /**
   * Load properties from API with current filters
   * Cargar propiedades desde la API con los filtros actuales
   */
  async function loadProperties() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_LIMIT };
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCity.trim()) params.city = filterCity.trim();

      const response = await adminService.getAdminProperties(params);
      setProperties(response.data || []);
      setTotal(response.total || response.data?.length || 0);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Error al cargar las propiedades');
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
        price: parseFloat(formData.price),
        currency: formData.currency,
        priceNegotiable: formData.priceNegotiable,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        areaM2: formData.areaM2 ? parseFloat(formData.areaM2) : undefined,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        status: formData.status,
      };

      if (editingId) {
        await adminService.updateProperty(editingId, payload);
      } else {
        await adminService.createProperty(payload);
      }

      closeModal();
      loadProperties();
    } catch (err) {
      console.error('Error saving property:', err);
      setError('Error al guardar la propiedad');
    } finally {
      setSaving(false);
    }
  }

  /**
   * Open edit modal with existing property data
   * Abrir modal de edición con datos de propiedad existente
   */
  function handleEdit(property: AdminProperty) {
    setEditingId(property.id);
    setFormData({
      type: property.type,
      title: property.title,
      titleEn: property.titleEn || '',
      description: property.description || '',
      price: String(property.price),
      currency: property.currency,
      priceNegotiable: property.priceNegotiable,
      bedrooms: property.bedrooms != null ? String(property.bedrooms) : '',
      bathrooms: property.bathrooms != null ? String(property.bathrooms) : '',
      areaM2: property.areaM2 != null ? String(property.areaM2) : '',
      address: property.address,
      city: property.city,
      country: property.country,
      status: property.status,
    });
    setShowForm(true);
  }

  /**
   * Delete property with confirmation
   * Eliminar propiedad con confirmación
   */
  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Seguro que querés eliminar "${title}"? Esta acción no se puede deshacer.`))
      return;
    try {
      await adminService.deleteProperty(id);
      loadProperties();
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Error al eliminar la propiedad');
    }
  }

  /**
   * Quick status toggle (available ↔ paused)
   * Toggle rápido de estado (available ↔ paused)
   */
  async function handleToggleStatus(property: AdminProperty) {
    const newStatus: PropertyStatus = property.status === 'available' ? 'paused' : 'available';
    try {
      await adminService.updateProperty(property.id, { status: newStatus });
      loadProperties();
    } catch (err) {
      console.error('Error toggling status:', err);
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
  function getStatusColor(status: PropertyStatus) {
    return (
      PROPERTY_STATUSES.find((s) => s.value === status)?.color ?? 'text-slate-700 bg-slate-100'
    );
  }

  /**
   * Get status label
   * Obtener etiqueta de estado
   */
  function getStatusLabel(status: PropertyStatus) {
    return PROPERTY_STATUSES.find((s) => s.value === status)?.label ?? status;
  }

  /**
   * Get type label
   * Obtener etiqueta de tipo
   */
  function getTypeLabel(type: PropertyType) {
    return PROPERTY_TYPES.find((t) => t.value === type)?.label ?? type;
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
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Propiedades</h1>
            <p className="text-sm text-slate-500">Gestión de propiedades inmobiliarias</p>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={loadProperties}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva propiedad
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
            setFilterType(e.target.value as PropertyType | 'all');
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los tipos</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as PropertyStatus | 'all');
            setPage(1);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          {PROPERTY_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={filterCity}
          onChange={(e) => {
            setFilterCity(e.target.value);
            setPage(1);
          }}
          placeholder="Filtrar por ciudad..."
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Building2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No hay propiedades</p>
            <p className="text-sm">Cambiá los filtros o creá una nueva propiedad</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Propiedad</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Ciudad</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Precio</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div
                        className="font-medium text-slate-900 truncate max-w-[220px]"
                        title={property.title}
                      >
                        {property.title}
                      </div>
                      {property.titleEn && (
                        <div className="text-xs text-slate-400 truncate max-w-[220px]">
                          {property.titleEn}
                        </div>
                      )}
                      {(property.bedrooms != null || property.areaM2 != null) && (
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          {property.bedrooms != null && <span>{property.bedrooms} hab.</span>}
                          {property.bathrooms != null && <span>{property.bathrooms} baños</span>}
                          {property.areaM2 != null && <span>{property.areaM2} m²</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{getTypeLabel(property.type)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {property.city}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-3 h-3 text-slate-400" />
                        {Number(property.price).toLocaleString('es-CO')} {property.currency}
                      </div>
                      {property.priceNegotiable && (
                        <div className="text-xs text-slate-400 text-right">Negociable</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(property)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(property.status)} hover:opacity-80 transition-opacity`}
                        title={
                          property.status === 'available'
                            ? 'Click para pausar'
                            : property.status === 'paused'
                              ? 'Click para activar'
                              : 'Estado no togglable'
                        }
                        disabled={property.status === 'rented' || property.status === 'sold'}
                      >
                        {getStatusLabel(property.status)}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(property)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(property.id, property.title)}
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
        {!loading && properties.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">
              {total} propiedad{total !== 1 ? 'es' : ''} — página {page} de {totalPages}
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
                {editingId ? 'Editar propiedad' : 'Nueva propiedad'}
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
              {/* Row: tipo + estado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as PropertyType })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PROPERTY_TYPES.map((t) => (
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
                      setFormData({ ...formData, status: e.target.value as PropertyStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PROPERTY_STATUSES.map((s) => (
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
                  placeholder="Ej: Apartamento moderno en Chapinero"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título (EN)</label>
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="Ej: Modern apartment in Chapinero"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Descripción de la propiedad..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Precio + moneda */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
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
                    placeholder="Ej: 1500000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Habitaciones + baños + área */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Habitaciones
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    placeholder="Ej: 3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Baños</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    placeholder="Ej: 2"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Área (m²)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.areaM2}
                    onChange={(e) => setFormData({ ...formData, areaM2: e.target.value })}
                    placeholder="Ej: 85"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dirección + ciudad + país */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej: Cra 7 # 32-16"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ciudad <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ej: Bogotá"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Colombia"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Precio negociable */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.priceNegotiable}
                  onChange={(e) => setFormData({ ...formData, priceNegotiable: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                />
                <span className="text-sm text-slate-700">Precio negociable</span>
              </label>

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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingId ? 'Guardar cambios' : 'Crear propiedad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
