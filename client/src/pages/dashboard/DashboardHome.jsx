import {
  Users,
  ShieldCheck,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  Dumbbell,
  UtensilsCrossed,
  Activity,
  Bell,
  Footprints,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminDashboard, useTrainerDashboard, useMemberDashboard } from '@/hooks/useDashboard';
import { StatCard, Card, CardHeader } from '@/components/ui';
import { SkeletonStat } from '@/components/ui';
import { formatCurrency } from '@/utils/formatters';

/**
 * DashboardHome — role-aware dashboard with real API data.
 * Matches admin dashboard.png / trainer dashboard.png / member dashboard.png
 */
export default function DashboardHome() {
  const role = useAuthStore((s) => s.user?.role);

  switch (role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'TRAINER':
      return <TrainerDashboard />;
    case 'MEMBER':
      return <MemberDashboard />;
    default:
      return <AdminDashboard />;
  }
}

// ── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard() {
  const { data, isLoading, isError } = useAdminDashboard();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of current operations and metrics.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonStat key={i} />)
        ) : isError ? (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            Failed to load dashboard data. Please try again.
          </div>
        ) : (
          <>
            <StatCard
              title="Total Members"
              value={data?.totalMembers?.toLocaleString() ?? '—'}
              icon={Users}
              iconBg="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Active Memberships"
              value={data?.activeMemberships?.toLocaleString() ?? '—'}
              icon={ShieldCheck}
              iconBg="bg-emerald-50 text-emerald-600"
              subtitle={
                data?.totalMembers
                  ? `${Math.round((data.activeMemberships / data.totalMembers) * 100)}% active rate`
                  : undefined
              }
            />
            <StatCard
              title="Trainers"
              value={data?.totalTrainers?.toLocaleString() ?? '—'}
              icon={GraduationCap}
              iconBg="bg-violet-50 text-violet-600"
            />
            <StatCard
              title="Today's Attendance"
              value={data?.attendanceToday?.toLocaleString() ?? '—'}
              icon={CalendarCheck}
              iconBg="bg-cyan-50 text-cyan-600"
            />
            <StatCard
              title="Monthly Revenue"
              value={data?.monthlyRevenue != null ? formatCurrency(data.monthlyRevenue) : '—'}
              icon={CreditCard}
              iconBg="bg-amber-50 text-amber-600"
            />
            <StatCard
              title="Pending Payments"
              value={data?.pendingPayments?.toLocaleString() ?? '—'}
              icon={AlertTriangle}
              iconBg={
                data?.pendingPayments > 0
                  ? 'bg-red-50 text-red-600'
                  : 'bg-slate-100 text-slate-500'
              }
              subtitle={data?.pendingPayments > 0 ? 'Requires attention' : undefined}
            />
          </>
        )}
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Revenue Trend" />
          <div className="bg-slate-50 rounded-lg h-48 flex items-center justify-center">
            <p className="text-sm text-slate-400">
              [Line Chart: Revenue over last 30 days]
            </p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Peak Attendance Hours" />
          <div className="bg-slate-50 rounded-lg h-48 flex items-center justify-center">
            <p className="text-sm text-slate-400">
              [Bar Chart: Attendance by hour today]
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Trainer Dashboard ────────────────────────────────────────────────────────

function TrainerDashboard() {
  const { data, isLoading, isError } = useTrainerDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trainer Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {data?.trainerProfile
            ? `Welcome back, ${data.trainerProfile.firstName || 'Trainer'}`
            : 'Manage your members, schedules, and training plans.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : isError ? (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            Failed to load dashboard data.
          </div>
        ) : (
          <>
            <StatCard
              title="Assigned Members"
              value={data?.assignedMembersCount?.toLocaleString() ?? '—'}
              icon={Users}
              iconBg="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Workout Plans"
              value={data?.workoutPlansCount?.toLocaleString() ?? '—'}
              icon={Dumbbell}
              iconBg="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              title="Diet Plans"
              value={data?.dietPlansCount?.toLocaleString() ?? '—'}
              icon={UtensilsCrossed}
              iconBg="bg-amber-50 text-amber-600"
            />
            <StatCard
              title="Gym Classes"
              value={data?.gymClassesCount?.toLocaleString() ?? '—'}
              icon={Activity}
              iconBg="bg-violet-50 text-violet-600"
            />
          </>
        )}
      </div>
    </div>
  );
}

// ── Member Dashboard ─────────────────────────────────────────────────────────

function MemberDashboard() {
  const { data, isLoading, isError } = useMemberDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Member Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {data?.memberProfile
            ? `Welcome back, ${data.memberProfile.firstName || 'Member'}`
            : 'Track your fitness journey and membership.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : isError ? (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            Failed to load dashboard data.
          </div>
        ) : (
          <>
            <StatCard
              title="Membership"
              value={data?.activeMembership?.plan?.name ?? 'No Plan'}
              icon={ShieldCheck}
              iconBg="bg-emerald-50 text-emerald-600"
              subtitle={
                data?.activeMembership
                  ? `Active • Expires ${new Date(data.activeMembership.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
                  : 'No active membership'
              }
            />
            <StatCard
              title="Total Visits"
              value={data?.totalVisits?.toLocaleString() ?? '—'}
              icon={Footprints}
              iconBg="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Assigned Workouts"
              value={data?.assignedWorkoutsCount?.toLocaleString() ?? '—'}
              icon={Dumbbell}
              iconBg="bg-violet-50 text-violet-600"
            />
            <StatCard
              title="Notifications"
              value={data?.unreadNotificationsCount?.toLocaleString() ?? '—'}
              icon={Bell}
              iconBg={
                data?.unreadNotificationsCount > 0
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-slate-100 text-slate-500'
              }
              subtitle={data?.unreadNotificationsCount > 0 ? 'Unread' : 'All caught up'}
            />
          </>
        )}
      </div>
    </div>
  );
}
