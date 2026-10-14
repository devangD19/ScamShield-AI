import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/index.js';

/**
 * Route guard: the application pages need a signed-in user, because
 * analyses, history and dashboard statistics belong to an account.
 * Signed-out visitors are sent to /login and returned here afterwards.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const session = useSession();

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children ?? <Outlet />;
}
