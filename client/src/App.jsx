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

// ── Trainer feature pages ──
import TrainerDashboard from '@/features/trainer/TrainerDashboard';
import TrainerProfilePage from '@/features/trainer/TrainerProfilePage';
import MyMembersPage from '@/features/trainer/MyMembersPage';
import ExercisesPage from '@/features/trainer/ExercisesPage';
import WorkoutPlansPage from '@/features/trainer/WorkoutPlansPage';
import DietPlansPage from '@/features/trainer/DietPlansPage';
import MemberAttendancePage from '@/features/trainer/MemberAttendancePage';
import ClassBookingsPage from '@/features/trainer/ClassBookingsPage';

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
 * TrainerDashboardRouter — shows trainer-specific dashboard for TRAINER role,
 * falls back to the generic DashboardHome for other roles.
 */
function DashboardRouter() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'TRAINER') return <TrainerDashboard />;
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

        {/* ── Trainer-only routes ── */}
        <Route element={<RoleGuard allowed={['TRAINER']} />}>
          <Route path="my-members" element={<MyMembersPage />} />
          <Route path="workout-plans" element={<WorkoutPlansPage />} />
          <Route path="diet-plans" element={<DietPlansPage />} />
          <Route path="exercises" element={<ExercisesPage />} />
          <Route path="my-schedule" element={<TrainerProfilePage />} />
          <Route path="attendance" element={<MemberAttendancePage />} />
          <Route path="class-bookings" element={<ClassBookingsPage />} />
          <Route path="profile" element={<TrainerProfilePage />} />
        </Route>

        {/* ── Admin-only routes (Phase 5+ placeholders) ── */}
        <Route path="members" element={<PlaceholderPage title="Members Management" />} />
        <Route path="trainers" element={<PlaceholderPage title="Staff / Trainers" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />

        {/* ── Shared routes ── */}
        <Route path="classes" element={<PlaceholderPage title="Gym Classes" />} />

        {/* ── Member routes (Phase 7+ placeholders) ── */}
        <Route path="my-membership" element={<PlaceholderPage title="My Membership" />} />
        <Route path="my-attendance" element={<PlaceholderPage title="My Attendance" />} />
        <Route path="my-workout" element={<PlaceholderPage title="My Workout Plan" />} />
        <Route path="my-diet" element={<PlaceholderPage title="My Diet Plan" />} />
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

/**
 * Temporary placeholder for routes that will be built in future phases.
 */
function PlaceholderPage({ title }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <p className="text-slate-400 text-sm">
          This page will be implemented in a future phase.
        </p>
      </div>
    </div>
  );
}

