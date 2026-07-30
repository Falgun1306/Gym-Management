import { useAuthStore } from '@/store/useAuthStore';

/**
 * DashboardHome — placeholder that redirects concept based on role.
 * Will be replaced with actual role-specific dashboards in Phase 4.
 */
export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'MEMBER';

  const greetings = {
    ADMIN: {
      title: 'Admin Dashboard',
      subtitle: 'Overview of current operations and metrics.',
    },
    TRAINER: {
      title: 'Trainer Dashboard',
      subtitle: 'Manage your members, schedules, and training plans.',
    },
    MEMBER: {
      title: 'Member Dashboard',
      subtitle: 'Track your fitness journey and membership.',
    },
  };

  const content = greetings[role] || greetings.MEMBER;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{content.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{content.subtitle}</p>
      </div>

      {/* Placeholder stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Total Members', 'Active Memberships', 'Today\'s Attendance', 'Monthly Revenue'].map(
          (label) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {label}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-2">—</p>
              <p className="text-xs text-slate-400 mt-1">Coming in Phase 4</p>
            </div>
          )
        )}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-2">
            Revenue Trend
          </h3>
          <div className="bg-slate-50 rounded-lg h-48 flex items-center justify-center">
            <p className="text-sm text-slate-400">
              [Chart placeholder — Phase 4]
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-2">
            Peak Attendance Hours
          </h3>
          <div className="bg-slate-50 rounded-lg h-48 flex items-center justify-center">
            <p className="text-sm text-slate-400">
              [Chart placeholder — Phase 4]
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
