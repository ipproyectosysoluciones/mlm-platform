/**
 * PublicProfileRoute - Wrapper para ruta de perfil público (/ref/:code)
 *
 * Ruta pública que no requiere autenticación.
 * El componente PublicProfile lee el código de referencia via useParams.
 *
 * @module components/routes/PublicProfileRoute
 */

interface PublicProfileRouteProps {
  children: React.ReactNode;
}

export function PublicProfileRoute({ children }: PublicProfileRouteProps) {
  return <>{children}</>;
}

export default PublicProfileRoute;
