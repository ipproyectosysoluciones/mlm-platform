/**
 * @fileoverview AdminPropertiesPage — Admin CRUD for real estate properties.
 * Now delegates rendering to shared AdminCrudTable<T>, AdminFormModal, and AdminStatusBadge.
 *
 * @module pages/AdminPropertiesPage
 */
import { useState, useEffect } from 'react';
import { Building2, DollarSign, MapPin } from 'lucide-react';
import { adminService } from '../services/api';
import { createCrudApi } from '../services/crud-api';
import AdminCrudTable from '../components/admin/AdminCrudTable';
import AdminFormModal from '../components/admin/AdminFormModal';
import AdminStatusBadge from '../components/admin/AdminStatusBadge';
import type { ColumnDef, FilterDef } from '../components/admin/AdminCrudTableTypes';
import type { StatusConfig } from '../components/admin/AdminCrudTableTypes';

// ============================================
// TYPES
// ============================================

type PropertyType = 'rental' | 'sale' | 'management';
type PropertyStatus = 'available' | 'rented' | 'sold' | 'paused';

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

const PROPERTY_STATUSES: StatusConfig[] = [
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

// API adapter
const propertyApi = createCrudApi<AdminProperty>({
  list: (params) => adminService.getAdminProperties(params),
  create: (data) => adminService.createProperty(data),
  update: (id, data) => adminService.updateProperty(id, data),
  delete: (id) => adminService.deleteProperty(id),
  toggleStatus: (id) => adminService.updateProperty(id, { status: 'available' }),
  dataKey: 'properties',
});

// ============================================
// COMPONENT
// ============================================

export default function AdminPropertiesPage() {
  // State
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState<PropertyType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<PropertyStatus | 'all'>('all');
  const [filterCity, setFilterCity] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(EMPTY_FORM);

  // Data loading
  useEffect(() => {
    loadProperties();
  }, [page, filterType, filterStatus, filterCity]);

  async function loadProperties() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_LIMIT };
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCity.trim()) params.city = filterCity.trim();
      const response = await propertyApi.list(params as any);
      setProperties(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Error al cargar las propiedades');
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
        await propertyApi.update!(editingId, payload);
      } else {
        await propertyApi.create!(payload);
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

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que querés eliminar esta propiedad? Esta acción no se puede deshacer.'))
      return;
    try {
      await propertyApi.delete!(id);
      loadProperties();
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Error al eliminar la propiedad');
    }
  }

  async function handleToggleStatus(property: AdminProperty) {
    const newStatus: PropertyStatus = property.status === 'available' ? 'paused' : 'available';
    try {
      await adminService.updateProperty(property.id, { status: newStatus });
      loadProperties();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  }

  function closeModal() {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // Columns
  const columns: ColumnDef<AdminProperty>[] = [
    {
      key: 'title',
      header: 'Propiedad',
      render: (p) => (
        <div>
          <div className="font-medium text-slate-900 truncate max-w-[220px]" title={p.title}>
            {p.title}
          </div>
          {p.titleEn && (
            <div className="text-xs text-slate-400 truncate max-w-[220px]">{p.titleEn}</div>
          )}
          {(p.bedrooms != null || p.areaM2 != null) && (
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              {p.bedrooms != null && <span>{p.bedrooms} hab.</span>}
              {p.bathrooms != null && <span>{p.bathrooms} baños</span>}
              {p.areaM2 != null && <span>{p.areaM2} m²</span>}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (p) => (
        <span className="text-slate-600">
          {PROPERTY_TYPES.find((t) => t.value === p.type)?.label ?? p.type}
        </span>
      ),
    },
    {
      key: 'city',
      header: 'Ciudad',
      render: (p) => (
        <div className="flex items-center gap-1 text-slate-600">
          <MapPin className="w-3 h-3 shrink-0" />
          {p.city}
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Precio',
      align: 'right',
      render: (p) => (
        <div>
          <div className="flex items-center justify-end gap-1 font-medium text-slate-900">
            <DollarSign className="w-3 h-3 text-slate-400" />
            {Number(p.price).toLocaleString('es-CO')} {p.currency}
          </div>
          {p.priceNegotiable && <div className="text-xs text-slate-400 text-right">Negociable</div>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (p) => (
        <AdminStatusBadge
          value={p.status}
          config={PROPERTY_STATUSES}
          onClick={
            p.status !== 'rented' && p.status !== 'sold' ? () => handleToggleStatus(p) : undefined
          }
          disabled={p.status === 'rented' || p.status === 'sold'}
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
        setFilterType(v as PropertyType | 'all');
        setPage(1);
      },
      options: [
        { value: 'all', label: 'Todos los tipos' },
        ...PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label })),
      ],
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      value: filterStatus,
      onChange: (v) => {
        setFilterStatus(v as PropertyStatus | 'all');
        setPage(1);
      },
      options: [
        { value: 'all', label: 'Todos los estados' },
        ...PROPERTY_STATUSES.map((s) => ({ value: s.value, label: s.label })),
      ],
    },
    {
      key: 'city',
      label: 'Ciudad',
      type: 'text',
      value: filterCity,
      onChange: (v) => {
        setFilterCity(v);
        setPage(1);
      },
      placeholder: 'Filtrar por ciudad...',
      className: 'min-w-[180px]',
    },
  ];

  return (
    <>
      <AdminCrudTable
        title="Propiedades"
        description="Gestión de propiedades inmobiliarias"
        icon={<Building2 className="w-5 h-5" />}
        accentColor="blue"
        columns={columns}
        filters={filters}
        data={properties}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onRefresh={loadProperties}
        onCreate={() => setShowForm(true)}
        onEdit={handleEdit}
        onDelete={(id) => handleDelete(id)}
        entityLabel="propiedad"
        entityLabelPlural="propiedades"
      />

      <AdminFormModal
        isOpen={showForm}
        onClose={closeModal}
        title={editingId ? 'Editar propiedad' : 'Nueva propiedad'}
        saving={saving}
        onSubmit={handleSubmit}
      >
        {/* Tipo + Estado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as PropertyType })}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Habitaciones</label>
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

        {/* Error in modal */}
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      </AdminFormModal>
    </>
  );
}
