import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * RoleGuard — restricts access to specific user roles.
 *
 * @param {Object} props
 * @param {('ADMIN' | 'TRAINER' | 'MEMBER')[]} props.allowedRoles - Roles permitted to access children
 * @param {React.ReactNode} props.children
 *
 * If the user's role is not in allowedRoles, redirect to their own dashboard.
 */
export default function RoleGuard({ allowedRoles = [], children }) {
  const role = useAuthStore((s) => s.getRole());

  if (!role || !allowedRoles.includes(role)) {
    // Redirect to the user's own dashboard root
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
