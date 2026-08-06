import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@/lib/queryKeys';
import {
  getMySchedule,
  updateMySchedule,
  getTimeOffs,
  createTimeOff,
  deleteTimeOff,
} from '@/services/trainerService';
import { Card, CardHeader, Button, Input, Badge } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { DAYS_OF_WEEK } from '@/utils/constants';
import { Save, Calendar, CalendarClock, Plus, Trash2, Palmtree } from 'lucide-react';

/**
 * TrainerSchedulePage — Real-life weekly schedule availability and time-off editor.
 */
export default function TrainerSchedulePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' | 'timeoff'

  // ── Queries ──
  const { data: scheduleRes, isLoading: scheduleLoading } = useQuery({
    queryKey: queryKeys.trainers.schedule(),
    queryFn: getMySchedule,
  });

  const { data: timeOffRes, isLoading: timeOffLoading } = useQuery({
    queryKey: ['trainer-time-off'],
    queryFn: getTimeOffs,
  });

  const schedule = scheduleRes?.data || [];
  const timeOffs = timeOffRes?.data || [];

  // ── Weekly Shifts State ──
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(null);

  const startScheduleEdit = () => {
    // Group existing slots by day
    const grouped = DAYS_OF_WEEK.map((dayName, dayIndex) => {
      const existingShifts = schedule.filter((s) => s.dayOfWeek === dayIndex);
      return {
        dayOfWeek: dayIndex,
        dayName,
        isAvailable: existingShifts.some(s => s.isAvailable),
        shifts: existingShifts.length > 0 
          ? existingShifts.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
          : [{ startTime: '09:00', endTime: '17:00' }],
      };
    });
    setScheduleForm(grouped);
    setEditingSchedule(true);
  };

  const addShift = (dayIndex) => {
    const updated = [...scheduleForm];
    updated[dayIndex].shifts.push({ startTime: '09:00', endTime: '17:00' });
    setScheduleForm(updated);
  };

  const removeShift = (dayIndex, shiftIndex) => {
    const updated = [...scheduleForm];
    updated[dayIndex].shifts.splice(shiftIndex, 1);
    setScheduleForm(updated);
  };

  const updateShift = (dayIndex, shiftIndex, field, value) => {
    const updated = [...scheduleForm];
    updated[dayIndex].shifts[shiftIndex][field] = value;
    setScheduleForm(updated);
  };

  const toggleDayAvailable = (dayIndex, checked) => {
    const updated = [...scheduleForm];
    updated[dayIndex].isAvailable = checked;
    if (checked && updated[dayIndex].shifts.length === 0) {
      updated[dayIndex].shifts.push({ startTime: '09:00', endTime: '17:00' });
    }
    setScheduleForm(updated);
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
    const slotsPayload = [];
    scheduleForm.forEach((day) => {
      if (day.isAvailable) {
        day.shifts.forEach((shift) => {
          slotsPayload.push({
            dayOfWeek: day.dayOfWeek,
            startTime: shift.startTime,
            endTime: shift.endTime,
            isAvailable: true,
          });
        });
      }
    });
    
    // If empty payload, it will clear everything. Ensure it sends something if needed,
    // though our backend allows empty array (actually it throws if empty in the backend, let's send at least a dummy or handle empty).
    if (slotsPayload.length === 0) {
      toast.error('You must have at least one active shift in the week');
      return;
    }

    scheduleMutation.mutate({ slots: slotsPayload });
  };

  // ── Time Off State ──
  const [addingTimeOff, setAddingTimeOff] = useState(false);
  const [timeOffForm, setTimeOffForm] = useState({ startDate: '', endDate: '', reason: '' });

  const timeOffMutation = useMutation({
    mutationFn: (data) => createTimeOff(data),
    onSuccess: () => {
      toast.success('Time off successfully scheduled');
      queryClient.invalidateQueries({ queryKey: ['trainer-time-off'] });
      setAddingTimeOff(false);
      setTimeOffForm({ startDate: '', endDate: '', reason: '' });
    },
    onError: (err) => toast.error(err.message || 'Failed to create time off'),
  });

  const deleteTimeOffMutation = useMutation({
    mutationFn: (id) => deleteTimeOff(id),
    onSuccess: () => {
      toast.success('Time off cancelled');
      queryClient.invalidateQueries({ queryKey: ['trainer-time-off'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel time off'),
  });

  const handleTimeOffSave = (e) => {
    e.preventDefault();
    timeOffMutation.mutate(timeOffForm);
  };

  if (scheduleLoading || timeOffLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarClock className="w-7 h-7 text-emerald-600" />
          Manage Schedule & Time-Off
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your standard weekly shifts and manage your upcoming personal days or vacations.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'shifts'
              ? 'text-emerald-700 border-emerald-600 bg-emerald-50/50'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          Weekly Shifts
        </button>
        <button
          onClick={() => setActiveTab('timeoff')}
          className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'timeoff'
              ? 'text-emerald-700 border-emerald-600 bg-emerald-50/50'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          Upcoming Time-Off
        </button>
      </div>

      {/* ── Weekly Shifts Tab ── */}
      {activeTab === 'shifts' && (
        <Card className="shadow-md border-slate-200/80 animate-fade-in">
          <CardHeader
            title="Weekly Shifts Grid"
            subtitle="Define multiple time blocks (e.g., Morning and Evening shifts) for each working day."
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
              <form onSubmit={handleScheduleSave} className="space-y-4">
                {scheduleForm.map((day, dIdx) => (
                  <div
                    key={day.dayOfWeek}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-3 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={day.isAvailable}
                          onChange={(e) => toggleDayAvailable(dIdx, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{day.dayName}</span>
                      </label>
                      {day.isAvailable && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addShift(dIdx)}
                          icon={Plus}
                          className="!text-emerald-600 hover:!bg-emerald-100"
                        >
                          Add Shift
                        </Button>
                      )}
                    </div>

                    {day.isAvailable ? (
                      <div className="space-y-2 pl-7">
                        {day.shifts.map((shift, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100 shadow-sm w-fit">
                            <Input
                              type="time"
                              value={shift.startTime}
                              onChange={(e) => updateShift(dIdx, sIdx, 'startTime', e.target.value)}
                              className="!py-1 !px-2 text-xs font-semibold !w-28"
                              required
                            />
                            <span className="text-slate-400 font-bold text-xs">to</span>
                            <Input
                              type="time"
                              value={shift.endTime}
                              onChange={(e) => updateShift(dIdx, sIdx, 'endTime', e.target.value)}
                              className="!py-1 !px-2 text-xs font-semibold !w-28"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => removeShift(dIdx, sIdx)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Remove Shift"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {day.shifts.length === 0 && (
                          <p className="text-xs text-amber-600 italic font-medium">Click "Add Shift" to set working hours.</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic pl-7">
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
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                  const dayShifts = schedule.filter((s) => s.dayOfWeek === dayIndex);
                  const isAvailable = dayShifts.length > 0 && dayShifts.some(s => s.isAvailable);

                  return (
                    <div key={dayIndex} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white">
                      <div className="w-32 font-bold text-slate-800 shrink-0 flex items-center gap-2">
                        {dayName}
                        {isAvailable ? (
                          <Badge variant="success" size="sm" className="!px-1.5 !py-0.5 text-[10px]">Active</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm" className="!px-1.5 !py-0.5 text-[10px]">Off</Badge>
                        )}
                      </div>

                      <div className="flex-1 flex flex-wrap gap-2">
                        {isAvailable ? (
                          dayShifts.map((shift, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-2">
                              <CalendarClock className="w-3.5 h-3.5 text-emerald-500" />
                              {shift.startTime} - {shift.endTime}
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400 italic">Not scheduled to work</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Time Off Tab ── */}
      {activeTab === 'timeoff' && (
        <Card className="shadow-md border-slate-200/80 animate-fade-in">
          <CardHeader
            title="Time-Off & Exceptions"
            subtitle="Schedule vacations, sick leaves, and personal days. Members cannot book sessions with you during these dates."
            action={
              !addingTimeOff ? (
                <Button variant="outline" size="sm" onClick={() => setAddingTimeOff(true)} icon={Palmtree}>
                  Add Time Off
                </Button>
              ) : null
            }
          />

          <div className="p-6 pt-2">
            {addingTimeOff && (
              <form onSubmit={handleTimeOffSave} className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-4">
                <h4 className="text-sm font-bold text-emerald-900 mb-2">Schedule Time Off</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={timeOffForm.startDate}
                    onChange={(e) => setTimeOffForm({ ...timeOffForm, startDate: e.target.value })}
                    required
                  />
                  <Input
                    label="End Date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={timeOffForm.endDate}
                    onChange={(e) => setTimeOffForm({ ...timeOffForm, endDate: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Reason / Notes (Optional)"
                  placeholder="e.g., Vacation, Doctor Appointment"
                  value={timeOffForm.reason}
                  onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="ghost" type="button" onClick={() => setAddingTimeOff(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={timeOffMutation.isPending} icon={Save} className="!bg-emerald-600 !text-white hover:!bg-emerald-700">
                    Confirm Time Off
                  </Button>
                </div>
              </form>
            )}

            {timeOffs.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Palmtree className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No time-off scheduled.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeOffs.map((to) => {
                  const start = new Date(to.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const end = new Date(to.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div key={to.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                          <Palmtree className="w-5 h-5 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {start === end ? start : `${start} - ${end}`}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {to.reason || 'Personal Time Off'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this time-off?')) {
                            deleteTimeOffMutation.mutate(to.id);
                          }
                        }}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
