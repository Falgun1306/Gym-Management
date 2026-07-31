import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getTrainerDashboard } from '@/services/dashboardService';
import { getMyMembers, getClassBookings } from '@/services/trainerService';
import { useAuthStore } from '@/store/useAuthStore';
import { StatCard, Card, CardHeader, Badge, Avatar } from '@/components/ui';
import { SkeletonStat, SkeletonCard } from '@/components/ui/Skeleton';
import {
  Users,
  Dumbbell,
  UtensilsCrossed,
  CalendarDays,
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * TrainerDashboard — Trainer portal landing page.
 *
 * Displays:
 *  - Stat cards (assigned members, today's workouts, active diets, today's classes)
 *  - Upcoming sessions list
 *  - Recent progress logs table
 *
 * Matches the Trainer Dashboard mockup design.
 */
export default function TrainerDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.username?.split(' ')[0] || 'Trainer';

  // ── Dashboard stats ──
  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: queryKeys.dashboard.trainer(),
    queryFn: getTrainerDashboard,
    staleTime: 30_000,
  });

  // ── Assigned members for sidebar context ──
  const { data: membersData } = useQuery({
    queryKey: queryKeys.trainers.members(),
    queryFn: () => getMyMembers({ limit: 5 }),
    staleTime: 60_000,
  });

  // ── Class bookings ──
  const { data: bookingsData } = useQuery({
    queryKey: queryKeys.trainers.classBookings(),
    queryFn: () => getClassBookings({ limit: 5 }),
    staleTime: 60_000,
  });

  const stats = dashData?.data;
  const members = membersData?.data || [];
  const bookings = bookingsData?.data || [];

  // ── Greeting based on time of day ──
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here is your daily overview for {today}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/workout-plans"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors shadow-xs"
          >
            <Dumbbell className="w-4 h-4" />
            Assign Workout
          </Link>
          <Link
            to="/dashboard/diet-plans"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <UtensilsCrossed className="w-4 h-4" />
            Assign Diet
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {dashLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Assigned Members"
            value={stats?.assignedMembers ?? '—'}
            icon={Users}
            iconBg="bg-slate-100 text-slate-700"
            trend={stats?.membersTrend}
            trendLabel="this month"
          />
          <StatCard
            title="Today's Workouts"
            value={stats?.todaysWorkouts ?? '—'}
            icon={Dumbbell}
            iconBg="bg-emerald-50 text-emerald-700"
            trend={stats?.workoutsTrend}
            trendLabel="vs avg"
          />
          <StatCard
            title="Active Diet Plans"
            value={stats?.activeDietPlans ?? '—'}
            icon={UtensilsCrossed}
            iconBg="bg-red-50 text-red-700"
            trend={stats?.dietTrend}
          />
          <StatCard
            title="Today's Classes"
            value={stats?.todaysClasses ?? '—'}
            icon={CalendarDays}
            iconBg="bg-indigo-50 text-indigo-700"
          />
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Weekly Activity Overview ── */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weekly Activity Overview"
            action={
              <span className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md border border-slate-200">
                This Week
              </span>
            }
          />
          <div className="h-56 flex items-end justify-between gap-2 px-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const heights = [55, 80, 70, 85, 72, 35, 60];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col gap-1" style={{ height: '180px', justifyContent: 'flex-end' }}>
                    <div
                      className="w-full bg-emerald-600 rounded-t-md transition-all duration-500"
                      style={{ height: `${heights[i]}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{day}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Upcoming Sessions ── */}
        <Card>
          <CardHeader
            title="Upcoming Sessions"
            action={
              <Link
                to="/dashboard/classes"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View All
              </Link>
            }
          />
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No upcoming sessions</p>
            ) : (
              bookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-xs font-bold text-slate-700 leading-none">
                      {booking.startTime
                        ? new Date(booking.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).split(' ')[0]
                        : '—'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">
                      {booking.startTime
                        ? new Date(booking.startTime).toLocaleTimeString('en-US', { hour12: true }).split(' ')[1]
                        : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {booking.gymClass?.title || booking.title || 'Session'}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{booking.gymClass?.location || booking.location || 'Studio'}</span>
                    </div>
                  </div>
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>
          <Link
            to="/dashboard/my-schedule"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Manage Schedule
          </Link>
        </Card>
      </div>

      {/* ── Recent Progress Logs ── */}
      <Card>
        <CardHeader
          title="Recent Progress Logs"
          action={
            <Link
              to="/dashboard/my-members"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View All Progress Logs <ArrowRight className="w-3 h-3" />
            </Link>
          }
        />
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {['Member', 'Goal', 'Latest Metric', 'Date Logged', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-slate-400">
                    No assigned members yet
                  </td>
                </tr>
              ) : (
                members.slice(0, 5).map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          firstName={member.user?.username?.split(' ')[0]}
                          lastName={member.user?.username?.split(' ')[1]}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-slate-900">
                          {member.user?.username || 'Member'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {member.goal || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {member.latestMetric || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">
                      {member.lastProgressDate
                        ? new Date(member.lastProgressDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-6 py-3">
                      <Badge status={member.progressStatus || 'ACTIVE'} size="sm">
                        {member.progressStatus === 'ON_TRACK' ? 'On Track' : member.progressStatus || 'Active'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
