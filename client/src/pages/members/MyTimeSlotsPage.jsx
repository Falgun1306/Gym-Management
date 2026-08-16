import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  BellRing,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserCheck,
  Dumbbell,
  Users,
} from 'lucide-react';
import {
  useMyTimeSlots,
  useSetMyTimeSlot,
  useUpdateMyTimeSlot,
  useDeleteMyTimeSlot,
} from '@/hooks/useTimeSlots';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';

const DAYS_MAP = [
  { value: -1, label: 'Everyday (Daily)' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export default function MyTimeSlotsPage() {
  const { data: res, isLoading } = useMyTimeSlots();
  const setSlotMutation = useSetMyTimeSlot();
  const updateSlotMutation = useUpdateMyTimeSlot();
  const deleteSlotMutation = useDeleteMyTimeSlot();

  const timeSlots = res?.data?.timeSlots || [];
  const trainer = res?.data?.trainer;
  const presetSlots = res?.data?.presetSlots || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);

  const [formData, setFormData] = useState({
    dayOfWeek: -1,
    startTime: '07:00',
    endTime: '08:00',
    notes: '',
  });

  const handleOpenAddModal = () => {
    setEditingSlotId(null);
    setFormData({
      dayOfWeek: -1,
      startTime: '07:00',
      endTime: '08:00',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot) => {
    setEditingSlotId(slot.id);
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      notes: slot.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSelectPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      startTime: preset.startTime,
      endTime: preset.endTime,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSlotId) {
      updateSlotMutation.mutate(
        { slotId: editingSlotId, data: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      setSlotMutation.mutate(formData, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleDelete = (slotId) => {
    if (window.confirm('Are you sure you want to remove this time slot?')) {
      deleteSlotMutation.mutate(slotId);
    }
  };

  const getDayLabel = (dayVal) => {
    const found = DAYS_MAP.find((d) => d.value === dayVal);
    return found ? found.label : 'Daily';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" /> Gym Attendance & Availability
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            My Workout Time Slots
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Specify when you train at IronPeak Elite so your personal trainer and facility managers can ensure equipment availability and optimal space for your sessions.
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 shrink-0 flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" /> Add Time Slot
        </Button>
      </div>

      {/* ── Trainer Notification Alert Banner ── */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shrink-0">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Trainer Notification System Active
              </h3>
              <Badge className="bg-emerald-600 text-green text-[10px] font-bold uppercase tracking-wider">
                Real-time Sync
              </Badge>
            </div>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              Whenever you create or update your time slot, <span className="font-bold text-slate-900">all gym trainers</span> will receive instant notifications so they can manage equipment and schedule workout sessions according to your availability.
            </p>
          </div>
        </div>
        {trainer && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white/80 border border-emerald-200 rounded-lg px-3 py-2 shadow-xs shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Assigned: {trainer.firstName} {trainer.lastName}
          </div>
        )}
      </div>

      {/* ── Time Slots Grid / Empty State ── */}
      {timeSlots.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 p-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Time Slots Configured</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
            You haven't set your preferred workout time slot yet. Add your availability so your trainer can manage equipment and peak gym capacity!
          </p>
          <Button
            onClick={handleOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg shadow-md"
          >
            Set Preferred Time Slot
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {timeSlots.map((slot) => (
            <Card
              key={slot.id}
              className="group hover:shadow-lg transition-all duration-200 border-slate-200 overflow-hidden relative"
            >
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50 uppercase tracking-wide">
                      <Calendar className="w-3 h-3" /> {getDayLabel(slot.dayOfWeek)}
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight flex items-center gap-2">
                      {slot.startTime} <span className="text-slate-400 font-normal text-lg">–</span> {slot.endTime}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(slot)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Slot"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {slot.notes && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 text-xs text-slate-600 flex items-start gap-2">
                    <Dumbbell className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-700">Workout Focus:</strong> {slot.notes}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Trainer Notified
                  </span>
                  <span>Active Preference</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Preset Availability Information Card ── */}
      <Card className="border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-emerald-500" /> Standard Gym Operating Hours & Peak Times
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="font-bold text-emerald-900 block mb-0.5">Early Morning (6 AM - 8 AM)</span>
            <p className="text-emerald-700">Optimal for cardio & heavy lifting. Moderate crowd.</p>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="font-bold text-amber-900 block mb-0.5">Evening Peak (5 PM - 8 PM)</span>
            <p className="text-amber-700">High equipment demand. Reserve slots early!</p>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="font-bold text-blue-900 block mb-0.5">Mid-Day (10 AM - 4 PM)</span>
            <p className="text-blue-700">Light traffic. High equipment availability.</p>
          </div>
          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
            <span className="font-bold text-purple-900 block mb-0.5">Late Night (8 PM - 10 PM)</span>
            <p className="text-purple-700">Quiet atmosphere & personal training focus.</p>
          </div>
        </div>
      </Card>

      {/* ── Add / Edit Slot Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {editingSlotId ? 'Edit Time Slot' : 'Set Workout Time Slot'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your trainer will be automatically notified upon saving.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Predefined Slot Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Predefined Time Slot *
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                  {presetSlots.map((preset, idx) => {
                    const isSelected =
                      formData.startTime === preset.startTime && formData.endTime === preset.endTime;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span>{preset.label}</span>
                        </div>
                        {isSelected && (
                          <span className="text-emerald-600 font-bold text-xs">Selected ✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day of Week Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Repeat / Day of Week
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {DAYS_MAP.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Workout Focus / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Workout Focus / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Strength Training, Leg Day, Morning Cardio"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={setSlotMutation.isPending || updateSlotMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md"
                >
                  {setSlotMutation.isPending || updateSlotMutation.isPending
                    ? 'Saving...'
                    : editingSlotId
                    ? 'Update Slot'
                    : 'Save & Notify Trainer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
