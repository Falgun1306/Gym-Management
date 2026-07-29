import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

// ── Placeholder pages (will be replaced in Phase 3+) ──

function LoginPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-3xl font-bold text-gradient">GymPulse</h1>
        <p className="text-surface-400">
          Phase 1 Foundation Complete — Login page coming in Phase 4.
        </p>
        <div className="flex items-center gap-2 justify-center text-sm text-surface-500">
          <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse-gentle" />
          All infrastructure modules loaded successfully
        </div>
      </div>
    </div>
  );
}

function DashboardPlaceholder() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen gradient-mesh p-8">
      <div className="glass-card p-8 max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gradient">Dashboard</h1>
        <p className="text-surface-400">
          Logged in as <span className="text-accent-400">{user?.username}</span> ({user?.role})
        </p>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPlaceholder />
        }
      />

      {/* Protected routes (placeholder) */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? <DashboardPlaceholder /> : <Navigate to="/login" replace />
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
