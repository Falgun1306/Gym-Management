import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * RoleGuard — restricts access to specific user roles.
 *
 * Can be used in two ways:
 *  1. Wrapping children:    <RoleGuard allowedRoles={['ADMIN']}><Page /></RoleGuard>
 *  2. As a layout route:    <Route element={<RoleGuard allowed={['TRAINER']} />}>
 *
 * If the user's role is not permitted, redirect to their own dashboard.
 */
export default function RoleGuard({ allowedRoles, allowed, children }) {
  const role = useAuthStore((s) => s.getRole());
  const roles = allowedRoles || allowed || [];

  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If used as a layout route (no children), render Outlet
  return children || <Outlet />;
}
