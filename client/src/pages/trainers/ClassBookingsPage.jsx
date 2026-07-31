import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getClassBookings } from '@/services/trainerService';
import { DataTable, Card, Badge, Avatar, Button, Sheet } from '@/components/ui';
import { SkeletonTable } from '@/components/ui/Skeleton';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Eye,
  UserCheck,
} from 'lucide-react';

/**
 * ClassBookingsPage — View scheduled gym classes created by Admin and their attendee lists.
 * Integrates directly with GymClass records and enrolled Member bookings.
 */
export default function ClassBookingsPage() {
  const [selectedClass, setSelectedClass] = useState(null);

  // ── Fetch scheduled classes ──
  const { data: classesRes, isLoading } = useQuery({
    queryKey: queryKeys.trainers.classBookings(),
    queryFn: () => getClassBookings(),
  });

  const rawData = classesRes?.data || [];
  // Normalize rawData to array of gym classes
  const classes = Array.isArray(rawData) ? rawData : [];

  // ── Table columns ──
  const columns = [
    {
      key: 'class',
      label: 'Class Name',
      sortable: true,
      render: (row, cellVal) => {
        const cls = row || cellVal || {};
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {cls.title || cls.name || 'Gym Class'}
              </p>
              <p className="text-xs text-slate-500 line-clamp-1">
                {cls.description || 'Group fitness session'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'schedule',
      label: 'Schedule & Time',
      render: (row, cellVal) => {
        const cls = row || cellVal || {};
        const start = cls.startTime ? new Date(cls.startTime) : null;
        const end = cls.endTime ? new Date(cls.endTime) : null;
        return (
          <div className="text-sm text-slate-600">
            {start ? (
              <div className="space-y-0.5">
                <p className="font-medium text-slate-800">
                  {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
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
      label: 'Enrollment',
      render: (row, cellVal) => {
        const cls = row || cellVal || {};
        const booked = cls._count?.bookings ?? cls.bookings?.length ?? 0;
        const max = cls.capacity || 20;
        const isFull = booked >= max;

        return (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-800">
              {booked} / {max}
            </span>
            <Badge variant={isFull ? 'danger' : 'success'} size="sm">
              {isFull ? 'FULL' : `${max - booked} left`}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'members',
      label: 'Enrolled Members',
      render: (row, cellVal) => {
        const cls = row || cellVal || {};
        const bookingsList = cls.bookings || [];

        if (bookingsList.length === 0) {
          return <span className="text-xs text-slate-400 italic">No bookings yet</span>;
        }

        return (
          <div className="flex items-center gap-1.5 flex-wrap max-w-[240px]">
            {bookingsList.slice(0, 3).map((b) => {
              const mUser = b.member?.user || {};
              const name = b.member?.firstName
                ? `${b.member.firstName} ${b.member.lastName || ''}`.trim()
                : mUser.username || 'Member';

              return (
                <span
                  key={b.id || b.memberId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {name}
                </span>
              );
            })}
            {bookingsList.length > 3 && (
              <span className="text-xs text-emerald-700 font-semibold">
                +{bookingsList.length - 3} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row, cellVal) => {
        const cls = row || cellVal || {};
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedClass(cls);
            }}
            icon={Eye}
          >
            Attendees ({cls._count?.bookings ?? cls.bookings?.length ?? 0})
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scheduled Gym Classes</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View scheduled sessions created by Admin and inspect enrolled attendees.
        </p>
      </div>

      {/* ── Classes & Bookings Table ── */}
      {isLoading ? (
        <SkeletonTable />
      ) : (
        <DataTable
          columns={columns}
          data={classes}
          searchable
          searchPlaceholder="Search classes by title or description..."
          searchKeys={['title', 'description', 'trainer.firstName', 'trainer.lastName']}
          onRowClick={(row) => setSelectedClass(row)}
          emptyMessage="No gym classes scheduled yet"
          emptyIcon={CalendarDays}
        />
      )}

      {/* ── Class Attendees Sheet ── */}
      <ClassAttendeesSheet
        gymClass={selectedClass}
        open={!!selectedClass}
        onClose={() => setSelectedClass(null)}
      />
    </div>
  );
}

// ─── Class Attendees Sheet ──────────────────────────────────────────────────

function ClassAttendeesSheet({ gymClass, open, onClose }) {
  if (!gymClass) return null;

  const bookings = gymClass.bookings || [];
  const start = gymClass.startTime ? new Date(gymClass.startTime) : null;
  const end = gymClass.endTime ? new Date(gymClass.endTime) : null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={gymClass.title || gymClass.name || 'Class Details'}
      description={`Enrolled Attendees (${bookings.length} / ${gymClass.capacity || 20})`}
      width="md"
    >
      <div className="space-y-6">
        {/* Class Overview */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Session Info</p>
          <p className="text-slate-700">{gymClass.description || 'Group fitness class session.'}</p>
          {start && (
            <div className="flex items-center gap-4 pt-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <span>{start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>
                  {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  {end && ` – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Attendee List */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center justify-between">
            <span>Enrolled Members</span>
            <span className="text-xs text-slate-500">{bookings.length} Total</span>
          </h4>

          {bookings.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-white text-slate-400 text-sm">
              No members have booked this class yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {bookings.map((b) => {
                const member = b.member || {};
                const mUser = member.user || {};

                return (
                  <div
                    key={b.id || b.memberId}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        firstName={member.firstName || mUser.username?.split(' ')[0]}
                        lastName={member.lastName || mUser.username?.split(' ')[1]}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {member.firstName
                            ? `${member.firstName} ${member.lastName || ''}`.trim()
                            : mUser.username || 'Member'}
                        </p>
                        <p className="text-xs text-slate-500">{mUser.email || member.phone || '—'}</p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm" icon={UserCheck}>
                      Enrolled
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
