import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

// ── Auth pages ──
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// ── Error pages ──
import NotFoundPage from '@/pages/NotFoundPage';

// ── Layouts ──
import DashboardLayout from '@/components/layouts/DashboardLayout';

// ── Auth guards ──
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';

// ── Dashboard pages ──
import DashboardHome from '@/pages/dashboard/DashboardHome';
import MembersPage from '@/pages/dashboard/MembersPage';

// ── Admin pages ──
import TrainersPage from '@/pages/admin/TrainersPage';
import TrainerApplicationsPage from '@/pages/admin/TrainerApplicationsPage';
import MembershipPlansPage from '@/pages/admin/MembershipPlansPage';
import CouponsPage from '@/pages/admin/CouponsPage';
import GymClassesPage from '@/pages/admin/GymClassesPage';
import PaymentsPage from '@/pages/admin/PaymentsPage';
import EquipmentPage from '@/pages/admin/EquipmentPage';
import ComplaintsPage from '@/pages/admin/ComplaintsPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';

// ── Trainer pages ──
import TrainerDashboard from '@/pages/trainers/TrainerDashboard';
import TrainerProfilePage from '@/pages/trainers/TrainerProfilePage';
import ProfilePage from '@/pages/ProfilePage';
import NotificationsPage from '@/pages/shared/NotificationsPage';
import MyMembersPage from '@/pages/trainers/MyMembersPage';
import ExercisesPage from '@/pages/trainers/ExercisesPage';
import WorkoutPlansPage from '@/pages/trainers/WorkoutPlansPage';
import DietPlansPage from '@/pages/trainers/DietPlansPage';
import MemberAttendancePage from '@/pages/trainers/MemberAttendancePage';
import ClassBookingsPage from '@/pages/trainers/ClassBookingsPage';
import TimeSlotsPage from '@/pages/trainers/TimeSlotsPage';

// ── Member Portal pages ──
import MemberDashboard from '@/pages/members/MemberDashboard';
import MyMembershipPage from '@/pages/members/MyMembershipPage';
import MyAttendancePage from '@/pages/members/MyAttendancePage';
import MyWorkoutPage from '@/pages/members/MyWorkoutPage';
import MyDietPage from '@/pages/members/MyDietPage';
import MyProgressPage from '@/pages/members/MyProgressPage';
import MemberClassesPage from '@/pages/members/MemberClassesPage';
import MemberSupportPage from '@/pages/members/MemberSupportPage';
import MyTimeSlotsPage from '@/pages/members/MyTimeSlotsPage';

// ── Dev tools ──
import ComponentShowcase from '@/pages/ComponentShowcase';

/**
 * GuestRoute — redirects authenticated users to /dashboard.
 */
function GuestRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * DashboardRouter — shows role-specific dashboard for TRAINER or MEMBER roles,
 * falls back to Admin DashboardHome for ADMIN role.
 */
function DashboardRouter() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'TRAINER') return <TrainerDashboard />;
  if (role === 'MEMBER') return <MemberDashboard />;
  return <DashboardHome />;
}

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      {/* ── Public / Auth Routes ── */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ── Protected Dashboard Routes ── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard home — role-aware */}
        <Route index element={<DashboardRouter />} />

        {/* ── Admin-only routes ── */}
        <Route path="members" element={<RoleGuard allowedRoles={['ADMIN']}><MembersPage /></RoleGuard>} />
        <Route path="trainers" element={<RoleGuard allowedRoles={['ADMIN']}><TrainersPage /></RoleGuard>} />
        <Route path="trainer-applications" element={<RoleGuard allowedRoles={['ADMIN']}><TrainerApplicationsPage /></RoleGuard>} />
        <Route path="membership-plans" element={<RoleGuard allowedRoles={['ADMIN']}><MembershipPlansPage /></RoleGuard>} />
        <Route path="coupons" element={<RoleGuard allowedRoles={['ADMIN']}><CouponsPage /></RoleGuard>} />
        <Route path="payments" element={<RoleGuard allowedRoles={['ADMIN']}><PaymentsPage /></RoleGuard>} />
        <Route path="equipment" element={<RoleGuard allowedRoles={['ADMIN']}><EquipmentPage /></RoleGuard>} />
        <Route path="complaints" element={<RoleGuard allowedRoles={['ADMIN']}><ComplaintsPage /></RoleGuard>} />
        <Route path="reports" element={<RoleGuard allowedRoles={['ADMIN']}><ReportsPage /></RoleGuard>} />
        <Route path="gym-classes" element={<RoleGuard allowedRoles={['ADMIN']}><GymClassesPage /></RoleGuard>} />
        <Route path="settings" element={<RoleGuard allowedRoles={['ADMIN', 'TRAINER', 'MEMBER']}><AdminSettingsPage /></RoleGuard>} />

        {/* ── Trainer-only routes ── */}
        <Route path="my-members" element={<RoleGuard allowedRoles={['TRAINER']}><MyMembersPage /></RoleGuard>} />
        <Route path="workout-plans" element={<RoleGuard allowedRoles={['TRAINER']}><WorkoutPlansPage /></RoleGuard>} />
        <Route path="diet-plans" element={<RoleGuard allowedRoles={['TRAINER']}><DietPlansPage /></RoleGuard>} />
        <Route path="exercises" element={<RoleGuard allowedRoles={['TRAINER']}><ExercisesPage /></RoleGuard>} />
        <Route path="my-schedule" element={<RoleGuard allowedRoles={['TRAINER']}><TrainerProfilePage /></RoleGuard>} />
        <Route path="attendance" element={<RoleGuard allowedRoles={['TRAINER']}><MemberAttendancePage /></RoleGuard>} />
        <Route path="class-bookings" element={<RoleGuard allowedRoles={['TRAINER']}><ClassBookingsPage /></RoleGuard>} />
        <Route path="profile" element={<RoleGuard allowedRoles={['ADMIN', 'TRAINER', 'MEMBER']}><ProfilePage /></RoleGuard>} />
        <Route path="notifications" element={<RoleGuard allowedRoles={['ADMIN', 'TRAINER', 'MEMBER']}><NotificationsPage /></RoleGuard>} />

        {/* ── Trainer & Admin Time Slot Management ── */}
        <Route path="time-slots" element={<RoleGuard allowedRoles={['ADMIN', 'TRAINER']}><TimeSlotsPage /></RoleGuard>} />

        {/* ── Member Portal routes ── */}
        <Route path="my-membership" element={<RoleGuard allowedRoles={['MEMBER']}><MyMembershipPage /></RoleGuard>} />
        <Route path="my-time-slot" element={<RoleGuard allowedRoles={['MEMBER']}><MyTimeSlotsPage /></RoleGuard>} />
        <Route path="my-attendance" element={<RoleGuard allowedRoles={['MEMBER']}><MyAttendancePage /></RoleGuard>} />
        <Route path="my-workout" element={<RoleGuard allowedRoles={['MEMBER']}><MyWorkoutPage /></RoleGuard>} />
        <Route path="my-diet" element={<RoleGuard allowedRoles={['MEMBER']}><MyDietPage /></RoleGuard>} />
        <Route path="my-progress" element={<RoleGuard allowedRoles={['MEMBER']}><MyProgressPage /></RoleGuard>} />
        <Route path="classes" element={<RoleGuard allowedRoles={['MEMBER']}><MemberClassesPage /></RoleGuard>} />
        <Route path="my-support" element={<RoleGuard allowedRoles={['MEMBER']}><MemberSupportPage /></RoleGuard>} />
      </Route>

      {/* ── Dev Tools ── */}
      <Route path="/components" element={<ComponentShowcase />} />

      {/* ── Root redirect ── */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />

      {/* ── 404 Catch-all ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
