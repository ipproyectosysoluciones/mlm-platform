/**
 * Offline - Página mostrada cuando no hay conexión a internet
 *
 * @module pages/Offline
 */
import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';

export default function Offline() {
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        {/* Animated WiFi/Offline Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 lg:w-40 lg:h-40 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <WifiOff className="w-16 h-16 lg:w-20 lg:h-20 text-white" />
          </div>
          {/* Animated rings */}
          <div className="absolute inset-0 w-32 h-32 lg:w-40 lg:h-40 mx-auto border-4 border-amber-200 rounded-full animate-ping opacity-20" />
          <div
            className="absolute inset-4 lg:inset-6 border-4 border-amber-200 rounded-full animate-ping opacity-30"
            style={{ animationDelay: '0.5s' }}
          />
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
            {t('offline.title', 'Sin conexión a internet')}
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            {t(
              'offline.description',
              'Parece que perdiste la conexión. Verificá tu conexión a internet e intentá de nuevo.'
            )}
          </p>
          <p className="text-slate-400 text-sm">
            {t(
              'offline.hint',
              'También podés verificar si el WiFi está activado o si hay algún problema con tu conexión de datos.'
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            {t('offline.retry', 'Reintentar')}
          </button>
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('offline.goBack', 'Volver')}
          </button>
        </div>
      </div>
    </div>
  );
}
