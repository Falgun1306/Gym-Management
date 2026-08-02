import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@/lib/queryKeys';
import { getMySchedule, updateMySchedule } from '@/services/trainerService';
import { Card, CardHeader, Button, Input, Badge } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { DAYS_OF_WEEK } from '@/utils/constants';
import { Save, Calendar, CalendarClock } from 'lucide-react';

/**
 * TrainerSchedulePage (formerly TrainerProfilePage) — Weekly schedule availability editor.
 */
export default function TrainerSchedulePage() {
  const queryClient = useQueryClient();

  // ── Schedule data ──
  const { data: scheduleRes, isLoading } = useQuery({
    queryKey: queryKeys.trainers.schedule(),
    queryFn: getMySchedule,
  });

  const schedule = scheduleRes?.data;

  // ── Schedule edit state ──
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(null);

  // Start editing schedule
  const startScheduleEdit = () => {
    const existingList = Array.isArray(schedule) ? schedule : [];
    const defaultSlots = DAYS_OF_WEEK.map((dayName, dayIndex) => {
      const match = existingList.find((s) => s.dayOfWeek === dayIndex);
      return {
        dayOfWeek: dayIndex,
        dayName,
        isAvailable: match ? match.isAvailable : false,
        startTime: match?.startTime || '09:00',
        endTime: match?.endTime || '17:00',
      };
    });
    setScheduleForm(defaultSlots);
    setEditingSchedule(true);
  };

  const scheduleMutation = useMutation({
    mutationFn: (data) => updateMySchedule(data),
    onSuccess: () => {
      toast.success('Schedule updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.schedule() });
      setEditingSchedule(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to update schedule'),
  });

  const handleScheduleSave = (e) => {
    e.preventDefault();
    const slotsPayload = scheduleForm.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime || '09:00',
      endTime: s.endTime || '17:00',
      isAvailable: !!s.isAvailable,
    }));
    scheduleMutation.mutate({ slots: slotsPayload });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
      </div>
    );
  }

  // Map backend schedule to 7 days
  const scheduleDisplay = DAYS_OF_WEEK.map((dayName, dayIndex) => {
    const match = Array.isArray(schedule) ? schedule.find((s) => s.dayOfWeek === dayIndex) : null;
    return {
      dayOfWeek: dayIndex,
      dayName,
      isAvailable: match ? match.isAvailable : false,
      startTime: match?.startTime || '09:00',
      endTime: match?.endTime || '17:00',
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarClock className="w-7 h-7 text-emerald-600" />
          My Weekly Schedule & Availability
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your available working hours for training sessions, member appointments, and gym classes.
        </p>
      </div>

      {/* ── Schedule Section ── */}
      <Card className="shadow-md border-slate-200/80">
        <CardHeader
          title="Working Hours Grid"
          subtitle="Set your active working windows for each day of the week."
          action={
            !editingSchedule ? (
              <Button variant="outline" size="sm" onClick={startScheduleEdit} icon={Calendar}>
                Edit Schedule
              </Button>
            ) : null
          }
        />

        <div className="p-6 pt-2">
          {editingSchedule ? (
            <form onSubmit={handleScheduleSave} className="space-y-3">
              {(scheduleForm || []).map((slot, idx) => (
                <div
                  key={slot.dayOfWeek}
                  className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <label className="flex items-center gap-3 min-w-[140px] cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={slot.isAvailable}
                      onChange={(e) => {
                        const updated = [...scheduleForm];
                        updated[idx].isAvailable = e.target.checked;
                        setScheduleForm(updated);
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{slot.dayName}</span>
                  </label>

                  {slot.isAvailable ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const updated = [...scheduleForm];
                          updated[idx].startTime = e.target.value;
                          setScheduleForm(updated);
                        }}
                        className="!py-1.5 !px-2.5 text-xs font-semibold !w-32 bg-white shadow-sm"
                      />
                      <span className="text-slate-400 font-bold">to</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const updated = [...scheduleForm];
                          updated[idx].endTime = e.target.value;
                          setScheduleForm(updated);
                        }}
                        className="!py-1.5 !px-2.5 text-xs font-semibold !w-32 bg-white shadow-sm"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold italic bg-slate-100 px-3 py-1 rounded-full">
                      Unavailable / Off
                    </span>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setEditingSchedule(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={scheduleMutation.isPending} icon={Save} className="!bg-emerald-600 !text-white hover:!bg-emerald-700 shadow-md">
                  Save Schedule
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {scheduleDisplay.map((slot) => (
                <div
                  key={slot.dayOfWeek}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    slot.isAvailable
                      ? 'bg-gradient-to-b from-emerald-50/60 to-white border-emerald-200/80 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200/60 opacity-60'
                  }`}
                >
                  <p className="text-xs font-extrabold text-slate-900 mb-2">{slot.dayName}</p>
                  {slot.isAvailable ? (
                    <div className="space-y-1.5">
                      <Badge variant="success" size="sm" className="font-bold px-2.5 py-0.5 shadow-xs">
                        Available
                      </Badge>
                      <p className="text-[11px] text-slate-700 font-bold tracking-tight bg-white py-1 px-1.5 rounded-lg border border-slate-100 shadow-xs mt-2">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                  ) : (
                    <div className="py-3">
                      <p className="text-xs text-slate-400 font-bold">Off</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
