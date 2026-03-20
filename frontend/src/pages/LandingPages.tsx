import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Edit, Trash2, Eye, MousePointerClick } from 'lucide-react';
import { LandingPageBuilder } from '../components/LandingPage/LandingPageBuilder';
import { landingPageService } from '../services/landingPageService';
import type { LandingPage, LandingPageStats } from '../services/landingPageService';

export default function LandingPages() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [stats, setStats] = useState<LandingPageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pagesData, statsData] = await Promise.all([
        landingPageService.getMyPages(),
        landingPageService.getStats(),
      ]);
      setPages(pagesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading landing pages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePage = () => {
    setEditingPage(null);
    setShowBuilder(true);
  };

  const handleEditPage = (page: LandingPage) => {
    setEditingPage(page);
    setShowBuilder(true);
  };

  const handleSavePage = (_page: LandingPage) => {
    setShowBuilder(false);
    setEditingPage(null);
    loadData();
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta landing page?')) return;

    try {
      await landingPageService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting landing page:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (showBuilder) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <LandingPageBuilder
          existingPage={editingPage || undefined}
          onSave={handleSavePage}
          onCancel={() => {
            setShowBuilder(false);
            setEditingPage(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landing Pages</h1>
          <p className="text-gray-500 mt-1">Crea páginas de captura para tus campañas</p>
        </div>
        <button
          onClick={handleCreatePage}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Landing Page
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalPages}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Activas</p>
            <p className="text-2xl font-bold text-green-600">{stats.activePages}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Visitas</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Conversiones</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalConversions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Tasa Conv.</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.conversionRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {pages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes landing pages</h3>
          <p className="text-gray-500 mb-6">
            Crea tu primera landing page para empezar a captar leads
          </p>
          <button
            onClick={handleCreatePage}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Crear Landing Page
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                page.isActive ? 'border-transparent' : 'border-gray-200 opacity-75'
              }`}
            >
              <div
                className="h-32 flex items-center justify-center"
                style={{
                  backgroundColor: page.content.backgroundColor,
                  color: page.content.textColor,
                }}
              >
                <span className="text-lg font-bold px-4 text-center">{page.content.headline}</span>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{page.title}</h3>
                  {!page.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      Inactiva
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-3">/landing/{page.slug}</p>

                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {page.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="w-4 h-4" />
                    {page.conversions}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(`/landing/${page.slug}`, '_blank')}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleEditPage(page)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeletePage(page.id)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
