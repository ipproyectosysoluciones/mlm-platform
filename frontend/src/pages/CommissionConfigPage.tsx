import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  DollarSign,
  Layers,
} from 'lucide-react';
import { adminService } from '../services/api';
import type { CommissionConfig, BusinessType, CommissionLevel } from '../types';

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'suscripcion', label: 'Suscripción' },
  { value: 'producto', label: 'Producto' },
  { value: 'membresia', label: 'Membresía' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'otro', label: 'Otro' },
];

const COMMISSION_LEVELS: { value: CommissionLevel; label: string }[] = [
  { value: 'direct', label: 'Directo' },
  { value: 'level_1', label: 'Nivel 1' },
  { value: 'level_2', label: 'Nivel 2' },
  { value: 'level_3', label: 'Nivel 3' },
  { value: 'level_4', label: 'Nivel 4' },
];

export default function CommissionConfigPage() {
  const [configs, setConfigs] = useState<CommissionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    businessType: 'producto' as BusinessType,
    customBusinessName: '',
    level: 'direct' as CommissionLevel,
    percentage: 0.1,
  });
  const [filterBusinessType, setFilterBusinessType] = useState<BusinessType | 'all'>('all');

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    try {
      const response = await adminService.getCommissionConfigs();
      setConfigs(response.data || []);
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await adminService.updateCommissionConfig(editingId, {
          percentage: formData.percentage,
        });
      } else {
        await adminService.createCommissionConfig({
          businessType: formData.businessType,
          customBusinessName: formData.customBusinessName || undefined,
          level: formData.level,
          percentage: formData.percentage,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        businessType: 'producto',
        customBusinessName: '',
        level: 'direct',
        percentage: 0.1,
      });
      loadConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  async function handleToggleActive(config: CommissionConfig) {
    try {
      await adminService.updateCommissionConfig(config.id, {
        isActive: !config.isActive,
      });
      loadConfigs();
    } catch (error) {
      console.error('Error toggling config:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta configuración?')) return;
    try {
      await adminService.deleteCommissionConfig(id);
      loadConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
    }
  }

  function handleEdit(config: CommissionConfig) {
    setEditingId(config.id);
    setFormData({
      businessType: config.businessType,
      customBusinessName: config.customBusinessName || '',
      level: config.level,
      percentage: config.percentage,
    });
    setShowForm(true);
  }

  const filteredConfigs = configs.filter((config) => {
    if (filterBusinessType === 'all') return true;
    return config.businessType === filterBusinessType;
  });

  // Group configs by business type for display
  const groupedConfigs = filteredConfigs.reduce(
    (acc, config) => {
      const key = config.businessType;
      if (!acc[key]) acc[key] = [];
      acc[key].push(config);
      return acc;
    },
    {} as Record<string, CommissionConfig[]>
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Configuración de Comisiones</h1>
            <p className="text-slate-500 text-sm">
              Gestiona las tasas de comisión por tipo de negocio
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-4 items-center">
          <select
            value={filterBusinessType}
            onChange={(e) => setFilterBusinessType(e.target.value as BusinessType | 'all')}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todos los tipos</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadConfigs}
            className="p-2 hover:bg-slate-100 rounded-lg"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                businessType: 'producto',
                customBusinessName: '',
                level: 'direct',
                percentage: 0.1,
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Configuración
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Configuración' : 'Nueva Configuración'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tipo de Negocio
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) =>
                        setFormData({ ...formData, businessType: e.target.value as BusinessType })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.businessType === 'otro' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nombre del Negocio
                      </label>
                      <input
                        type="text"
                        value={formData.customBusinessName}
                        onChange={(e) =>
                          setFormData({ ...formData, customBusinessName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Ej: Curso online"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nivel de Comisión
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({ ...formData, level: e.target.value as CommissionLevel })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {COMMISSION_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Porcentaje (0-1)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={formData.percentage}
                    onChange={(e) =>
                      setFormData({ ...formData, percentage: parseFloat(e.target.value) })
                    }
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={formData.percentage}
                    onChange={(e) =>
                      setFormData({ ...formData, percentage: parseFloat(e.target.value) })
                    }
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Equivalente a: {(formData.percentage * 100).toFixed(1)}%
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Config Cards by Business Type */}
      <div className="space-y-6">
        {Object.entries(groupedConfigs).map(([businessType, typeConfigs]) => (
          <div key={businessType} className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-900">
                  {BUSINESS_TYPES.find((b) => b.value === businessType)?.label || businessType}
                </h3>
              </div>
              <span className="text-sm text-slate-500">{typeConfigs.length} configuraciones</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                      Nivel
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                      Porcentaje
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {typeConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">
                        {COMMISSION_LEVELS.find((l) => l.value === config.level)?.label ||
                          config.level}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {(config.percentage * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(config)}
                          className={`flex items-center gap-1 text-sm ${
                            config.isActive ? 'text-green-600' : 'text-slate-400'
                          }`}
                        >
                          {config.isActive ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                          {config.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(config)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-600"
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
          </div>
        ))}
      </div>

      {filteredConfigs.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-slate-500">No hay configuraciones de comisiones</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-emerald-600 hover:underline"
          >
            Crear primera configuración
          </button>
        </div>
      )}
    </div>
  );
}
