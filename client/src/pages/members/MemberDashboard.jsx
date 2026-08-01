import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useMemberProfile,
  useMemberDashboard,
  useMemberQrCode,
  useMemberCheckIn,
  useMemberCheckOut,
  useFreezeMembership,
  useUnfreezeMembership,
} from '@/hooks/useMemberPortal';
import { Card, CardHeader, Badge, Button, Modal, Avatar, SkeletonCard } from '@/components/ui';
import CompleteProfileForm from '@/components/members/CompleteProfileForm';
import {
  QrCode,
  Calendar,
  Dumbbell,
  UtensilsCrossed,
  UserCheck,
  CreditCard,
  Flame,
  ChevronRight,
  Sparkles,
  Clock,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Phone,
  Mail,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

/**
 * MemberDashboard — Main overview page for logged-in Members.
 * Displays:
 *  1. Profile Completion Form (if member profile is missing or incomplete after login)
 *  2. Welcome Banner & Active Membership Pass
 *  3. QR Code Entrance Pass modal (Real-time JWT token generation)
 *  4. Assigned Trainer Info Card
 *  5. Quick Stat Cards (Check-ins, Active Plan, Workout, Diet Macros)
 *  6. Today's Workout & Diet Plan Summary
 *  7. Upcoming Booked Gym Classes
 */
export default function MemberDashboard() {
  const { user } = useAuthStore();
  const {
    data: memberProfile,
    isLoading: isProfileLoading,
    isSuccess: isProfileSuccess,
    refetch: refetchProfile,
  } = useMemberProfile();

  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = useMemberDashboard();

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeDays, setFreezeDays] = useState(7);
  const [freezeReason, setFreezeReason] = useState('');

  const { data: qrData, isLoading: qrLoading, error: qrError, refetch: refetchQr } = useMemberQrCode(qrModalOpen);
  const checkInMutation = useMemberCheckIn();
  const checkOutMutation = useMemberCheckOut();
  const freezeMutation = useFreezeMembership();
  const unfreezeMutation = useUnfreezeMembership();

  const isLoading = isProfileLoading || isDashboardLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Profile is incomplete ONLY when:
  // 1. The query succeeded but returned null (404 was caught and returned null)
  // 2. The query succeeded but member has no firstName (auto-created empty shell)
  const needsProfileSetup =
    isProfileSuccess && (memberProfile === null || !memberProfile?.firstName);

  if (needsProfileSetup) {
    return (
      <CompleteProfileForm
        existingProfile={memberProfile}
        onComplete={() => {
          refetchProfile();
          refetchDashboard();
        }}
      />
    );
  }

  if (isDashboardError && !needsProfileSetup) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Failed to load member dashboard</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Please check your connection and try again.</p>
        <Button
          onClick={() => {
            refetchProfile();
            refetchDashboard();
          }}
          size="sm"
        >
          Retry
        </Button>
      </div>
    );
  }

  const profile = memberProfile || dashboard?.memberProfile || dashboard?.profile;
  const membership = dashboard?.activeMembership || dashboard?.membership;
  const trainer = profile?.trainer || dashboard?.memberProfile?.trainer || dashboard?.trainer;
  const stats = {
    totalCheckIns: dashboard?.totalVisits ?? 0,
    monthlyCheckIns: dashboard?.totalVisits ?? 0,
  };
  const todayWorkout = dashboard?.todayWorkout;
  const todayDiet = dashboard?.todayDiet;
  const upcomingClasses = dashboard?.upcomingClasses || [];

  const isActive = membership?.status === 'ACTIVE';
  const isFrozen = membership?.status === 'FROZEN';

  const handleFreezeSubmit = (e) => {
    e.preventDefault();
    if (!membership?.id) return;
    freezeMutation.mutate(
      { membershipId: membership.id, durationDays: parseInt(freezeDays), reason: freezeReason },
      { onSuccess: () => setFreezeModalOpen(false) }
    );
  };

  const handleUnfreezeSubmit = () => {
    if (!membership?.id) return;
    unfreezeMutation.mutate(membership.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Welcome Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Member Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.firstName || user?.username}! 💪
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Track your fitness goals, access your workout & diet plans, and check in effortlessly.
            </p>
          </div>

          {/* Digital QR Entrance Pass Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-all transform hover:scale-[1.02]"
            >
              <QrCode className="w-5 h-5" /> Digital QR Entrance Pass
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Membership Card & Actions Bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Membership Status Pass */}
        <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-emerald-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Membership Plan</p>
                <h3 className="text-lg font-bold text-slate-900">
                  {membership?.plan?.name || membership?.planName || 'Standard Membership'}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? 'success' : isFrozen ? 'warning' : 'neutral'}>
                {membership?.status || 'INACTIVE'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Days Remaining</p>
              <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
                {membership?.daysRemaining ??
                  (membership?.endDate
                    ? Math.max(0, Math.ceil((new Date(membership.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
                    : 0)}{' '}
                Days
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Start Date</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {membership?.startDate ? formatDate(membership.startDate) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Expiry Date</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {membership?.endDate ? formatDate(membership.endDate) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Total Visits</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {stats?.totalCheckIns ?? 0} Visits
              </p>
            </div>
          </div>

          {/* Freeze / Pause Controls */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Need to take a break? You can pause your active subscription anytime.
            </span>
            {isFrozen ? (
              <Button
                size="sm"
                onClick={handleUnfreezeSubmit}
                loading={unfreezeMutation.isPending}
                icon={Play}
                className="!py-1.5 !px-3"
              >
                Unfreeze Membership
              </Button>
            ) : isActive ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFreezeModalOpen(true)}
                icon={Pause}
                className="!py-1.5 !px-3"
              >
                Pause Membership
              </Button>
            ) : null}
          </div>
        </Card>

        {/* Card 2: Assigned Trainer Card */}
        <Card className="bg-white border-slate-200">
          <CardHeader title="Assigned Trainer" subtitle="Your personal fitness guide" />
          {trainer ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <Avatar firstName={trainer.firstName} lastName={trainer.lastName} size="lg" />
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {trainer.firstName} {trainer.lastName}
                  </h4>
                  <p className="text-xs text-emerald-700 font-semibold">
                    {trainer.specialization ? trainer.specialization.replace(/_/g, ' ') : 'Fitness Trainer'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {trainer.experience != null ? `${trainer.experience} Years Experience` : 'Qualified Fitness Coach'}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 text-slate-600 border border-slate-100">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {trainer.phone || 'Contact at front desk'}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {trainer.email || trainer.user?.email || '—'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs space-y-2">
              <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No trainer assigned yet.</p>
              <p className="text-[11px] text-slate-400">Ask facility staff to assign a qualified trainer.</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Stat Badges Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Attendance</p>
              <p className="text-lg font-extrabold text-slate-900">{stats?.totalCheckIns ?? 0} Visits</p>
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Workout Plans</p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {dashboard?.assignedWorkoutsCount ? `${dashboard.assignedWorkoutsCount} Assigned` : 'Active Routine'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Diet Plans</p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {dashboard?.assignedDietsCount ? `${dashboard.assignedDietsCount} Assigned` : 'Nutrition Plan'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Notifications</p>
              <p className="text-lg font-extrabold text-slate-900">{dashboard?.unreadNotificationsCount ?? 0} Unread</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Today's Workout & Diet Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workout Plan Summary */}
        <Card>
          <CardHeader
            title="Assigned Workout Plan"
            subtitle="Your current exercise program"
            action={
              <Link to="/dashboard/my-workout" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                View Full Workout <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          {todayWorkout ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm">{todayWorkout.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{todayWorkout.description || 'Target Muscle Groups & Exercises'}</p>
              </div>
              <div className="space-y-2">
                {(todayWorkout.exercises || []).slice(0, 3).map((ex, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                        {i + 1}
                      </div>
                      <span className="font-semibold text-slate-800">{ex.exerciseName || ex.name}</span>
                    </div>
                    <span className="text-slate-500 font-medium">
                      {ex.sets} Sets × {ex.reps} Reps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Dumbbell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>No active workout plan assigned.</p>
              <Link to="/dashboard/my-workout" className="text-emerald-700 font-medium hover:underline mt-1 inline-block">
                Check Workout Portal
              </Link>
            </div>
          )}
        </Card>

        {/* Diet Plan Summary */}
        <Card>
          <CardHeader
            title="Assigned Diet Plan"
            subtitle="Daily macronutrient target"
            action={
              <Link to="/dashboard/my-diet" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                View Full Diet <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          {todayDiet ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm">{todayDiet.title}</h4>
                  <span className="text-xs font-bold text-emerald-700">{todayDiet.targetCalories || 2200} kcal/day</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Protein</p>
                  <p className="text-sm font-extrabold text-emerald-800 mt-1">{todayDiet.proteinGrams || 150}g</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Carbs</p>
                  <p className="text-sm font-extrabold text-blue-800 mt-1">{todayDiet.carbsGrams || 200}g</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Fats</p>
                  <p className="text-sm font-extrabold text-amber-800 mt-1">{todayDiet.fatsGrams || 65}g</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>No active diet plan assigned.</p>
              <Link to="/dashboard/my-diet" className="text-emerald-700 font-medium hover:underline mt-1 inline-block">
                Check Diet Portal
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* ── Digital QR Code Entrance Pass Modal ── */}
      {qrModalOpen && (
        <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Digital Entrance QR Pass">
          <div className="text-center space-y-4 py-2">
            <p className="text-xs text-slate-500">
              Scan this QR code at the facility entrance scanner for instant check-in.
            </p>

            <div className="bg-slate-900 p-6 rounded-2xl inline-block shadow-inner border border-slate-800">
              {qrLoading ? (
                <div className="w-48 h-48 bg-slate-800 rounded-lg animate-pulse flex items-center justify-center text-slate-500 text-xs">
                  Generating Pass...
                </div>
              ) : qrData?.qrCodeDataUrl || qrData?.qrCodeUrl || qrData?.token || qrData?.qrToken ? (
                <img
                  src={qrData.qrCodeDataUrl || qrData.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.token || qrData.qrToken)}`}
                  alt="Member Entrance QR"
                  className="w-48 h-48 mx-auto rounded-lg shadow bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-800 rounded-lg flex flex-col items-center justify-center p-4 text-slate-400 text-xs text-center">
                  <p className="font-semibold text-rose-400 mb-1">QR Generation Issue</p>
                  <p className="text-[11px] text-slate-400">{qrError?.message || 'Failed to load QR code'}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-emerald-500" /> Pass refreshes automatically
            </div>

            <div className="flex justify-center gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => refetchQr()} icon={RefreshCw}>
                Refresh Pass
              </Button>
              <Button size="sm" onClick={() => setQrModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Pause Membership Modal ── */}
      {freezeModalOpen && (
        <Modal open={freezeModalOpen} onClose={() => setFreezeModalOpen(false)} title="Pause Active Membership">
          <form onSubmit={handleFreezeSubmit} className="space-y-4 text-sm">
            <p className="text-xs text-slate-600">
              Pause your subscription for a selected period (7 to 28 days). Your expiration date will be extended accordingly.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pause Duration *</label>
              <select
                value={freezeDays}
                onChange={(e) => setFreezeDays(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              >
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={21}>21 Days (3 Weeks)</option>
                <option value={28}>28 Days (4 Weeks)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Pause</label>
              <input
                type="text"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="e.g. Travel, Injury, Personal Leave"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFreezeModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={freezeMutation.isPending} icon={Pause}>Confirm Pause</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
