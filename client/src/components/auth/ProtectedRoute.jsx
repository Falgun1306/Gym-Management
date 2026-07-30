import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * ProtectedRoute — wraps authenticated routes.
 *
 * Checks:
 *  1. isAuthenticated from Zustand store
 *  2. Token is not expired (via isTokenValid())
 *
 * If either check fails → redirect to /login with the intended location preserved.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isTokenValid, logout } = useAuthStore();
  const location = useLocation();

  // Not authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token expired → auto-logout
  if (!isTokenValid()) {
    logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
