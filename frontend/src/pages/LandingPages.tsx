import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ExternalLink, Edit, Trash2, Eye, MousePointerClick } from 'lucide-react';
import { LandingPageBuilder } from '../components/LandingPage/LandingPageBuilder';
import { landingPageService } from '../services/landingPageService';
import type { LandingPage, LandingPageStats } from '../services/landingPageService';

export default function LandingPages() {
  const { t } = useTranslation();
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
    if (!confirm(t('landingPages.confirmDelete'))) return;

    try {
      await landingPageService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting landing page:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('landingPages.title')}</h1>
          <p className="text-slate-500 text-sm">{t('landingPages.subtitle')}</p>
        </div>
        <button
          onClick={handleCreatePage}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          {t('landingPages.newLanding')}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500">{t('landingPages.total')}</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalPages}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-sm text-emerald-600">{t('landingPages.active')}</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.activePages}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-600">{t('landingPages.views')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-sm text-purple-600">{t('landingPages.conversions')}</p>
            <p className="text-2xl font-bold text-purple-600">{stats.totalConversions}</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4">
            <p className="text-sm text-slate-400">{t('landingPages.conversionRate')}</p>
            <p className="text-2xl font-bold text-white">{stats.conversionRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {pages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {t('landingPages.noLandingPages')}
          </h3>
          <p className="text-slate-500 mb-6">{t('landingPages.createFirst')}</p>
          <button
            onClick={handleCreatePage}
            className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600"
          >
            <Plus className="w-4 h-4" />
            {t('landingPages.createButton')}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${
                page.isActive ? '' : 'opacity-75'
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
                  <h3 className="font-medium text-slate-900">{page.title}</h3>
                  {!page.isActive && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                      {t('landingPages.inactive')}
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-500 mb-3 font-mono">/landing/{page.slug}</p>

                <div className="flex gap-4 text-sm text-slate-500 mb-4">
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
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('landingPages.view')}
                  </button>
                  <button
                    onClick={() => handleEditPage(page)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                  >
                    <Edit className="w-4 h-4" />
                    {t('landingPages.edit')}
                  </button>
                  <button
                    onClick={() => handleDeletePage(page.id)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
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
