import { useState } from 'react';
import {
  useMemberGymClasses,
  useBookGymClass,
  useCancelGymClass,
  useMemberProfile,
} from '@/hooks/useMemberPortal';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, Badge, Button, SkeletonCard } from '@/components/ui';
import {
  CalendarDays,
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle,
  XCircle,
  Search,
  BookmarkCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

function formatClassTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

export default function MemberClassesPage() {
  const { user } = useAuthStore();
  const { data: memberProfile } = useMemberProfile();
  const [tab, setTab] = useState('browse'); // 'browse' | 'my-bookings'
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useMemberGymClasses({ search });
  const bookMutation = useBookGymClass();
  const cancelMutation = useCancelGymClass();

  const gymClasses = data?.classes || (Array.isArray(data) ? data : []);

  // Compute all active bookings for the logged-in member across all classes
  const myBookingsList = gymClasses.flatMap((cls) => {
    const bookings = cls.bookings || [];
    return bookings
      .filter(
        (b) =>
          b.status !== 'CANCELLED' &&
          (b.member?.user?.username === user?.username ||
            b.member?.userId === user?.id ||
            b.memberId === memberProfile?.id)
      )
      .map((b) => ({ ...b, gymClass: cls }));
  });

  const handleBook = (classId) => {
    bookMutation.mutate(classId, {
      onSuccess: () => refetch(),
    });
  };

  const handleCancel = (bookingId) => {
    if (confirm('Are you sure you want to cancel your class reservation?')) {
      cancelMutation.mutate(bookingId, {
        onSuccess: () => refetch(),
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gym Classes & Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse upcoming fitness sessions created by administration, reserve your spot, and manage bookings.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setTab('browse')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'browse'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Browse Classes
          </button>
          <button
            onClick={() => setTab('my-bookings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'my-bookings'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
            My Bookings ({myBookingsList.length})
          </button>
        </div>
      </div>

      {tab === 'browse' ? (
        <>
          {/* Search bar */}
          <Card className="!p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search classes by name, trainer, or specialization..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </Card>

          {/* Classes Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : gymClasses.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 text-sm">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              No scheduled gym classes found. Check back soon for new sessions!
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gymClasses.map((cls) => {
                const bookingsList = cls.bookings || [];
                const bookedCount = cls._count?.bookings ?? bookingsList.filter((b) => b.status !== 'CANCELLED').length ?? 0;
                const capacity = cls.capacity || 20;
                const isFull = bookedCount >= capacity;

                // Check if currently logged in member has a booking for this class
                const userBooking = bookingsList.find(
                  (b) =>
                    b.status !== 'CANCELLED' &&
                    (b.member?.user?.username === user?.username ||
                      b.member?.userId === user?.id ||
                      b.memberId === memberProfile?.id)
                );
                const isBookedByMe = Boolean(userBooking);

                const trainerName = cls.trainer
                  ? `${cls.trainer.firstName} ${cls.trainer.lastName}`
                  : 'Assigned Trainer';

                const category = cls.trainer?.specialization
                  ? cls.trainer.specialization.replace(/_/g, ' ')
                  : 'GENERAL FITNESS';

                return (
                  <Card key={cls.id} className="hover:shadow-md transition-all border-slate-200 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            {category}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-base mt-1">
                            {cls.title || cls.name || 'Gym Class'}
                          </h3>
                        </div>
                        <Badge variant={isBookedByMe ? 'success' : isFull ? 'danger' : 'info'}>
                          {isBookedByMe ? 'RESERVED' : isFull ? 'FULL' : `${capacity - bookedCount} left`}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {cls.description || 'Group training session led by certified fitness trainer.'}
                      </p>

                      <div className="py-2 space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <p className="flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Trainer: <strong className="text-slate-800">{trainerName}</strong></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Date: <strong className="text-slate-800">{formatDate(cls.startTime)}</strong></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Time: <strong className="text-slate-800">{formatClassTime(cls.startTime)} - {formatClassTime(cls.endTime)}</strong></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Capacity: <strong className="text-slate-800">{bookedCount} / {capacity} Enrolled</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                      {isBookedByMe ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancelMutation.isPending}
                          loading={cancelMutation.isPending}
                          onClick={() => handleCancel(userBooking.id)}
                          className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                          icon={XCircle}
                        >
                          Cancel Reservation
                        </Button>
                      ) : isFull ? (
                        <Button size="sm" disabled className="w-full">
                          Class Fully Booked
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={bookMutation.isPending}
                          loading={bookMutation.isPending}
                          onClick={() => handleBook(cls.id)}
                          className="w-full"
                          icon={CheckCircle}
                        >
                          Book Spot
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* My Bookings Tab */
        <Card>
          <CardHeader title="My Reserved Class Bookings" subtitle="Manage your active class reservations" />
          {myBookingsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <BookmarkCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              You haven't reserved any class spots yet. Browse available classes above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Class Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Trainer</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myBookingsList.map((b) => {
                    const cls = b.gymClass;
                    const trainerName = cls?.trainer
                      ? `${cls.trainer.firstName} ${cls.trainer.lastName}`
                      : 'Assigned Trainer';

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors text-xs">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {cls?.title || cls?.name || 'Gym Class'}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{trainerName}</td>
                        <td className="py-3 px-4 text-slate-600">{formatDate(cls?.startTime)}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatClassTime(cls?.startTime)} - {formatClassTime(cls?.endTime)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="success">RESERVED</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(b.id)}
                            loading={cancelMutation.isPending}
                            className="text-rose-600 hover:bg-rose-50 !py-1 !px-2.5 text-xs"
                            icon={XCircle}
                          >
                            Cancel Spot
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
