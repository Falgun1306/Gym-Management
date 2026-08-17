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
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Overview of current operations, revenue, and attendance.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <Link to="/dashboard/members" className="col-span-1">
            <Button size="sm" icon={UserPlus} className="w-full !py-2 text-xs">
              Add Member
            </Button>
          </Link>
          <Link to="/dashboard/payments" className="col-span-1">
            <Button size="sm" variant="outline" icon={CreditCard} className="w-full !py-2 text-xs">
              Record
            </Button>
          </Link>
          <Link to="/dashboard/membership-plans" className="col-span-2 sm:col-span-1">
            <Button size="sm" variant="outline" icon={PlusCircle} className="w-full !py-2 text-xs">
              New Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid — 2x2 on Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
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
                  ? `${Math.min(100, Math.round(((data.activeMembers ?? data.activeMemberships) / data.totalMembers) * 100))}% active rate`
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
              className="col-span-2 sm:col-span-1 lg:col-span-1"
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
              className="col-span-2 sm:col-span-1 lg:col-span-1"
            />
          </>
        )}
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Revenue Trend" subtitle="Monthly gross revenue accumulation" />
          <div className="bg-slate-50 rounded-lg h-44 sm:h-48 flex items-center justify-center border border-slate-200 p-4 text-center">
            <p className="text-xs font-semibold text-slate-400">
              [Line Chart: Monthly revenue accumulation]
            </p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Peak Attendance Hours" subtitle="Hourly check-ins distribution" />
          <div className="bg-slate-50 rounded-lg h-44 sm:h-48 flex items-center justify-center border border-slate-200 p-4 text-center">
            <p className="text-xs font-semibold text-slate-400">
              [Bar Chart: Hourly check-ins distribution]
            </p>
          </div>
        </Card>
      </div>

      {/* Widgets Grid: Recent Payments & Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Payments Table Widget */}
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
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
            <div className="divide-y divide-slate-100">
              {recentPayments.map((p) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">
                      {p.member ? `${p.member.firstName} ${p.member.lastName}` : 'N/A'}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatDate(p.paidAt || p.createdAt)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{formatCurrency(p.amount)}</p>
                    <Badge variant={p.status === 'SUCCESS' ? 'success' : 'warning'}>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Classes Widget */}
        <Card className="!p-3.5 sm:!p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Classes</h3>
              <p className="text-xs text-slate-500">Scheduled group sessions</p>
            </div>
            <Link to="/dashboard/gym-classes" className="text-xs font-semibold text-emerald-700 hover:underline">
              View All
            </Link>
          </div>
          {upcomingClasses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No upcoming classes scheduled.</p>
          ) : (
            <div className="space-y-2.5">
              {upcomingClasses.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
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
  const trainerName = data?.trainerProfile?.firstName || 'Trainer';

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── Page Header & Quick Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Trainer Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Welcome back, {trainerName}! 💪
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage member training protocols, view assigned classes, and track daily progress.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Link to="/dashboard/workout-plans" className="w-full">
            <Button size="sm" icon={Dumbbell} className="w-full !py-2 text-xs justify-center">
              Assign Workout
            </Button>
          </Link>
          <Link to="/dashboard/diet-plans" className="w-full">
            <Button size="sm" variant="outline" icon={UtensilsCrossed} className="w-full !py-2 text-xs justify-center">
              Assign Diet
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 2x2 Stat Cards on Mobile / 4-Col on Desktop ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : isError ? (
          <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            Failed to load dashboard metrics. Please refresh.
          </div>
        ) : (
          <>
            <StatCard
              title="Assigned Members"
              value={data?.assignedMembersCount?.toLocaleString() ?? '—'}
              icon={Users}
              iconBg="bg-blue-50 text-blue-600"
              subtitle="Active clients"
            />
            <StatCard
              title="Active Workouts"
              value={data?.workoutPlansCount?.toLocaleString() ?? '—'}
              icon={Dumbbell}
              iconBg="bg-emerald-50 text-emerald-600"
              subtitle="Assigned plans"
            />
            <StatCard
              title="Active Diets"
              value={data?.dietPlansCount?.toLocaleString() ?? '—'}
              icon={UtensilsCrossed}
              iconBg="bg-amber-50 text-amber-600"
              subtitle="Macro plans"
            />
            <StatCard
              title="Assigned Classes"
              value={data?.gymClassesCount?.toLocaleString() ?? '—'}
              icon={Activity}
              iconBg="bg-violet-50 text-violet-600"
              subtitle="Group sessions"
            />
          </>
        )}
      </div>

      {/* ── Quick Navigation Cards (Mobile-optimized) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/dashboard/my-members" className="group">
          <Card className="p-3.5 sm:p-4 text-center hover:border-emerald-500/50 hover:shadow-md transition-all">
            <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">My Members</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Log metrics & view list</p>
          </Card>
        </Link>
        <Link to="/dashboard/workout-plans" className="group">
          <Card className="p-3.5 sm:p-4 text-center hover:border-emerald-500/50 hover:shadow-md transition-all">
            <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Dumbbell className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Workout Plans</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Program builder</p>
          </Card>
        </Link>
        <Link to="/dashboard/diet-plans" className="group">
          <Card className="p-3.5 sm:p-4 text-center hover:border-emerald-500/50 hover:shadow-md transition-all">
            <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Diet Plans</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Nutrition templates</p>
          </Card>
        </Link>
        <Link to="/dashboard/exercises" className="group">
          <Card className="p-3.5 sm:p-4 text-center hover:border-emerald-500/50 hover:shadow-md transition-all">
            <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Exercise Library</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Movement catalog</p>
          </Card>
        </Link>
      </div>

      {/* ── Schedule & Progress Widgets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Sessions</h3>
              <p className="text-xs text-slate-500">Your scheduled group training classes</p>
            </div>
            <Link to="/dashboard/class-bookings" className="text-xs font-semibold text-emerald-700 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900">Cardio & Group Conditioning</p>
              <p className="text-[11px] text-slate-500">Studio Room B • Fitness Zone</p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="font-mono font-bold text-emerald-700 block">02:52 PM</span>
              <Badge variant="info">12 Enrolled</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Client Progress Logs</h3>
              <p className="text-xs text-slate-500">Recent body composition updates</p>
            </div>
            <Link to="/dashboard/my-members" className="text-xs font-semibold text-emerald-700 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-6 text-center text-slate-400 text-xs">
            No new progress metrics recorded today. Click <span className="font-semibold text-emerald-700">"My Members"</span> to log body measurements.
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Member Dashboard ─────────────────────────────────────────────────────────

function MemberDashboard() {
  const { data, isLoading, isError } = useMemberDashboard();

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Green Welcome Banner matching mobileUI/member dashboard.png */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-700/50 border border-emerald-500/30 text-emerald-200">
            ★ Member Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Welcome back, {data?.memberProfile?.firstName || 'Member'}! 💪
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            Track your fitness goals, access your workout & diet plans, and check in effortlessly.
          </p>
          <div className="pt-1">
            <Link to="/dashboard/my-attendance">
              <Button size="sm" className="!bg-emerald-400 hover:!bg-emerald-300 !text-slate-950 font-bold !py-2 text-xs shadow">
                Digital QR Entrance Pass
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2x2 Stat Cards on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                  : 'No active plan'
              }
            />
            <StatCard
              title="Total Visits"
              value={data?.totalVisits?.toLocaleString() ?? '—'}
              icon={Footprints}
              iconBg="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Workouts"
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

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900">Active Membership Plan</h3>
            <Link to="/dashboard/my-membership" className="text-xs font-semibold text-emerald-700 hover:underline">
              Manage
            </Link>
          </div>
          {data?.activeMembership ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-slate-900">{data.activeMembership.plan?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Expires:</span>
                <span className="font-semibold text-emerald-700">
                  {new Date(data.activeMembership.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-2">No active membership found.</p>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900">Assigned Fitness Guide</h3>
            <Link to="/dashboard/my-support" className="text-xs font-semibold text-emerald-700 hover:underline">
              Contact
            </Link>
          </div>
          <p className="text-xs text-slate-500">
            Connect with certified trainers for workout & diet guidance.
          </p>
        </Card>
      </div>
    </div>
  );
}
