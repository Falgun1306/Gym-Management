import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getClassBookings } from '@/services/trainerService';
import { DataTable, Card, Badge, Avatar } from '@/components/ui';
import { SkeletonTable } from '@/components/ui/Skeleton';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';

/**
 * ClassBookingsPage — View booked class sessions and attendee lists.
 *
 * Features:
 *  - DataTable of class bookings the trainer is assigned to
 *  - Class info: title, location, timing, capacity, attendees
 *  - Status badges for booking statuses
 */
export default function ClassBookingsPage() {
  // ── Fetch bookings ──
  const { data: bookingsRes, isLoading } = useQuery({
    queryKey: queryKeys.trainers.classBookings(),
    queryFn: () => getClassBookings(),
  });

  const bookings = bookingsRes?.data || [];

  // ── Table columns ──
  const columns = [
    {
      key: 'class',
      label: 'Class',
      sortable: true,
      render: (row) => {
        const cls = row.gymClass || row;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {cls.title || cls.name || 'Class'}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {cls.location || 'Studio'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (row) => {
        const cls = row.gymClass || row;
        const start = cls.startTime ? new Date(cls.startTime) : null;
        const end = cls.endTime ? new Date(cls.endTime) : null;
        return (
          <div className="text-sm text-slate-600">
            {start ? (
              <div className="space-y-0.5">
                <p className="font-medium">
                  {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {end && ` – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            ) : (
              '—'
            )}
          </div>
        );
      },
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (row) => {
        const cls = row.gymClass || row;
        const booked = cls.bookedCount || cls._count?.bookings || row.attendeeCount || 0;
        const max = cls.capacity || cls.maxCapacity || '—';
        return (
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-700 font-medium">
              {booked}/{max}
            </span>
          </div>
        );
      },
    },
    {
      key: 'member',
      label: 'Member',
      render: (row) => {
        if (!row.member && !row.user) return <span className="text-sm text-slate-400">—</span>;
        const memberUser = row.member?.user || row.user;
        return (
          <div className="flex items-center gap-2">
            <Avatar
              firstName={memberUser?.username?.split(' ')[0]}
              lastName={memberUser?.username?.split(' ')[1]}
              size="xs"
            />
            <span className="text-sm text-slate-700">{memberUser?.username || '—'}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge status={row.status || 'BOOKED'} size="sm">
          {row.status || 'Booked'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Class Bookings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View your class sessions and attendee lists.
        </p>
      </div>

      {/* ── Bookings Table ── */}
      {isLoading ? (
        <SkeletonTable />
      ) : (
        <DataTable
          columns={columns}
          data={bookings}
          searchable
          searchPlaceholder="Search classes..."
          searchKeys={['gymClass.title', 'gymClass.name', 'member.user.username']}
          emptyMessage="No class bookings found"
          emptyIcon={CalendarDays}
        />
      )}
    </div>
  );
}
