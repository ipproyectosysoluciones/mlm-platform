/**
 * ProtectedRoute - Wrapper para rutas que requieren autenticación
 *
 * Si no está autenticado → redirect /login
 * Si está cargando → spinner
 *
 * @module components/routes/ProtectedRoute
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../layout/AppLayout';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

export default ProtectedRoute;
