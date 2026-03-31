/**
 * OfflineBanner - Banner shown when internet connection is lost
 *
 * @module components/OfflineBanner
 */
import { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Hide banner after going back online
      setTimeout(() => setIsVisible(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsVisible(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setIsOffline(true);
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
        <WifiOff className="w-5 h-5" />
        <span className="text-sm font-medium">
          {isOffline
            ? 'Sin conexión a internet. Algunas funciones pueden no estar disponibles.'
            : 'Conexión restaurada'}
        </span>
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 hover:bg-amber-600 rounded transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
