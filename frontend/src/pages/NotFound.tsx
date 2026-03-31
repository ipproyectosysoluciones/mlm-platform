/**
 * NotFound - Página 404 cuando la ruta no existe
 *
 * @module pages/NotFound
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[120px] lg:text-[180px] font-bold text-slate-200 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <span className="text-4xl lg:text-5xl font-bold text-white">!</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
            {t('notFound.title', 'Página no encontrada')}
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            {t('notFound.description', 'La página que buscas no existe o ha sido movida.')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            {t('notFound.goToDashboard', 'Ir al Dashboard')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('notFound.goBack', 'Volver')}
          </button>
        </div>
      </div>
    </div>
  );
}
