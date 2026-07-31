import { Link } from 'react-router-dom';
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
  UserPlus,
  PlusCircle,
  CalendarDays,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminDashboard, useTrainerDashboard, useMemberDashboard } from '@/hooks/useDashboard';
import { useAdminPayments, useGymClasses } from '@/hooks/useAdmin';
import { StatCard, Card, CardHeader, Badge, Button, Avatar } from '@/components/ui';
import { SkeletonStat, SkeletonTable } from '@/components/ui';
import { formatCurrency, formatDate } from '@/utils/formatters';

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
  const { data: paymentsData } = useAdminPayments({ limit: 5 });
  const { data: classesData } = useGymClasses();

  const recentPayments = paymentsData?.payments?.slice(0, 4) || [];
  const upcomingClasses = classesData?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of current operations, revenue, and attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/members">
            <Button size="sm" icon={UserPlus} className="!py-2 text-xs">
              Add Member
            </Button>
          </Link>
          <Link to="/dashboard/payments">
            <Button size="sm" variant="outline" icon={CreditCard} className="!py-2 text-xs">
              Record Payment
            </Button>
          </Link>
          <Link to="/dashboard/membership-plans">
            <Button size="sm" variant="outline" icon={PlusCircle} className="!py-2 text-xs">
              New Plan
            </Button>
          </Link>
        </div>
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
          <CardHeader title="Revenue Trend" subtitle="Monthly gross revenue accumulation" />
          <div className="bg-slate-50 rounded-lg h-48 flex items-center justify-center border border-slate-200">
            <p className="text-xs font-semibold text-slate-400">
              [Line Chart: Revenue over last 30 days]
            </p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Peak Attendance Hours" subtitle="Hourly check-ins distribution" />
          <div className="bg-slate-50 rounded-lg h-48 flex items-center justify-center border border-slate-200">
            <p className="text-xs font-semibold text-slate-400">
              [Bar Chart: Attendance by hour today]
            </p>
          </div>
        </Card>
      </div>

      {/* Widgets Grid: Recent Payments & Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Payments Table Widget */}
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Payments</h3>
              <p className="text-xs text-slate-500">Latest transactions</p>
            </div>
            <Link to="/dashboard/payments" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-xs text-slate-400 p-6 text-center">No recent payment records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Member</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.member ? `${p.member.firstName} ${p.member.lastName}` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={p.status === 'SUCCESS' ? 'success' : 'warning'}>{p.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(p.paidAt || p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Upcoming Classes Widget */}
        <Card className="!p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Classes</h3>
              <p className="text-xs text-slate-500">Scheduled group sessions</p>
            </div>
            <Link to="/dashboard/classes" className="text-xs font-semibold text-emerald-700 hover:underline">
              View All
            </Link>
          </div>
          {upcomingClasses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No upcoming classes scheduled.</p>
          ) : (
            <div className="space-y-2.5">
              {upcomingClasses.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-slate-500 text-[11px]">
                      Trainer: {c.trainer ? `${c.trainer.firstName} ${c.trainer.lastName}` : 'Unassigned'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-semibold text-emerald-700 block">
                      {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {c.bookings?.length || 0}/{c.capacity} slots
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
