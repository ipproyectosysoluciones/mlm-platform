/**
 * @fileoverview PageLoader - Loading fallback for lazy loaded routes
 * @description Full-screen spinner used as Suspense fallback while lazy pages load.
 *              Pantalla completa con spinner usada como fallback de Suspense mientras cargan páginas lazy.
 * @module components/common/PageLoader
 */

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600">Cargando...</p>
      </div>
    </div>
  );
}

export default PageLoader;
