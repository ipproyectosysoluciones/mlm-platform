/**
 * AdminRoute - Wrapper para rutas de administración
 *
 * Extiende la lógica de ProtectedRoute y verifica rol 'admin'.
 * Si no es admin → redirect /dashboard
 *
 * @module components/routes/AdminRoute
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../layout/AppLayout';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  // Check if user is admin
  if ((user as any)?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

export default AdminRoute;
