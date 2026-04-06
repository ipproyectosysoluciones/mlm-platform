import { useState, useEffect } from 'react';
import { TemplateSelector } from './TemplateSelector';
import { landingPageService } from '../../services/landingPageService';
import type {
  LandingPage,
  LandingPageContent,
  LandingPageTemplate,
} from '../../services/landingPageService';

interface LandingPageBuilderProps {
  existingPage?: LandingPage;
  onSave?: (page: LandingPage) => void;
  onCancel?: () => void;
}

const defaultContent: LandingPageContent = {
  headline: 'Transforma tu Futuro Financiero',
  subheadline: 'Únete a nuestra red de emprendedores y construye tu propio negocio',
  ctaText: 'Comenzar Ahora',
  ctaColor: '#4F46E5',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  showReferralCode: true,
  showStats: true,
};

export function LandingPageBuilder({ existingPage, onSave, onCancel }: LandingPageBuilderProps) {
  const [title, setTitle] = useState(existingPage?.title || '');
  const [slug, setSlug] = useState(existingPage?.slug || '');
  const [template, setTemplate] = useState<LandingPageTemplate>(existingPage?.template || 'hero');
  const [content, setContent] = useState<LandingPageContent>(
    existingPage?.content || defaultContent
  );
  const [metaTitle, setMetaTitle] = useState(existingPage?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(existingPage?.metaDescription || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (title && !existingPage) {
      const autoSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      setSlug(autoSlug);
    }
  }, [title, existingPage]);

  const updateContent = (key: keyof LandingPageContent, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let page: LandingPage;

      if (existingPage) {
        page = (await landingPageService.update(existingPage.id, {
          title,
          template,
          content,
          metaTitle,
          metaDescription,
        }))!;
      } else {
        page = await landingPageService.create({
          title,
          slug: slug || undefined,
          template,
          content,
          metaTitle,
          metaDescription,
        });
      }

      onSave?.(page);
    } catch (err) {
      console.error('Error saving landing page:', err);
      setError('Error al guardar la landing page');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {existingPage ? 'Editar Landing Page' : 'Crear Landing Page'}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showPreview ? 'Editar' : 'Vista Previa'}
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="p-6">
          <LandingPagePreview template={template} content={content} slug={slug} />
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Mi Landing Page"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
              <div className="flex items-center">
                <span className="text-gray-500 text-sm mr-1">/landing/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="mi-landing"
                  disabled={!!existingPage}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Plantilla</label>
            <TemplateSelector selected={template} onSelect={setTemplate} />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Contenido</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input
                  type="text"
                  value={content.headline}
                  onChange={(e) => updateContent('headline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                <textarea
                  value={content.subheadline}
                  onChange={(e) => updateContent('subheadline', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={content.ctaText}
                    onChange={(e) => updateContent('ctaText', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color del Botón
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={content.ctaColor}
                      onChange={(e) => updateContent('ctaColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={content.ctaColor}
                      onChange={(e) => updateContent('ctaColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color de Fondo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={content.backgroundColor}
                      onChange={(e) => updateContent('backgroundColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={content.backgroundColor}
                      onChange={(e) => updateContent('backgroundColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color de Texto
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={content.textColor}
                      onChange={(e) => updateContent('textColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={content.textColor}
                      onChange={(e) => updateContent('textColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={content.showReferralCode}
                    onChange={(e) => updateContent('showReferralCode', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Mostrar código de referido</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={content.showStats}
                    onChange={(e) => updateContent('showStats', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Mostrar estadísticas</span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Título</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={title}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Descripción
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Descripción para motores de búsqueda"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : existingPage ? 'Guardar Cambios' : 'Crear Landing Page'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface LandingPagePreviewProps {
  template: LandingPageTemplate;
  content: LandingPageContent;
  slug: string;
}

function LandingPagePreview({ template, content, slug }: LandingPagePreviewProps) {
  const bgStyle = {
    backgroundColor: content.backgroundColor,
    color: content.textColor,
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 text-center text-xs text-gray-500">
          yoursite.com/landing/{slug || 'my-landing'}
        </div>
      </div>
      <div className="p-8 min-h-[400px]" style={bgStyle}>
        <div className={`max-w-lg mx-auto text-center ${template === 'hero' ? 'pt-16' : ''}`}>
          {template === 'video' && (
            <div className="aspect-video bg-gray-900 rounded-lg mb-6 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          <h1 className="text-3xl font-bold mb-4" style={{ color: content.textColor }}>
            {content.headline}
          </h1>
          <p className="text-lg opacity-80 mb-8" style={{ color: content.textColor }}>
            {content.subheadline}
          </p>

          {content.showStats && (
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-sm opacity-70">Afiliados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">$1M+</div>
                <div className="text-sm opacity-70">Comisiones</div>
              </div>
            </div>
          )}

          <button
            className="px-8 py-3 rounded-lg font-semibold text-white transition-transform hover:scale-105"
            style={{ backgroundColor: content.ctaColor }}
          >
            {content.ctaText}
          </button>

          {content.showReferralCode && (
            <div className="mt-6 text-sm opacity-70">
              Código de referido: <span className="font-mono font-bold">NEXO-XXXX</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
