import React, { useState } from 'react';
import {
  Clock,
  Users,
  Wrench,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  BarChart3,
  Dumbbell,
  Search,
  ShieldAlert,
} from 'lucide-react';
import {
  useTrainerTimeSlotOverview,
  useCreateTimeSlotAdvisory,
  useDeleteTimeSlotAdvisory,
} from '@/hooks/useTimeSlots';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';

const DAYS_MAP = [
  { value: -1, label: 'All Days (Overview)' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export default function TimeSlotsPage() {
  const [selectedDay, setSelectedDay] = useState(-1);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [searchMember, setSearchMember] = useState('');

  const { data: res, isLoading } = useTrainerTimeSlotOverview({ dayOfWeek: selectedDay });
  const createAdvisoryMutation = useCreateTimeSlotAdvisory();
  const deleteAdvisoryMutation = useDeleteTimeSlotAdvisory();

  const slotWindows = res?.data?.slotWindows || [];
  const totalActiveSlots = res?.data?.totalActiveSlots || 0;
  const totalEquipmentUnits = res?.data?.totalEquipmentUnits || 0;
  const equipmentByCategory = res?.data?.equipmentByCategory || [];
  const advisories = res?.data?.advisories || [];

  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState(false);
  const [advisoryFormData, setAdvisoryFormData] = useState({
    startTime: '07:00',
    endTime: '08:00',
    dayOfWeek: -1,
    title: '',
    description: '',
    maxCapacity: 30,
  });

  const handleCreateAdvisory = (e) => {
    e.preventDefault();
    createAdvisoryMutation.mutate(advisoryFormData, {
      onSuccess: () => {
        setIsAdvisoryModalOpen(false);
        setAdvisoryFormData({
          startTime: '07:00',
          endTime: '08:00',
          dayOfWeek: -1,
          title: '',
          description: '',
          maxCapacity: 30,
        });
      },
    });
  };

  const handleDeleteAdvisory = (id) => {
    if (window.confirm('Delete this space advisory notice?')) {
      deleteAdvisoryMutation.mutate(id);
    }
  };

  const getOccupancyBadge = (level) => {
    switch (level) {
      case 'PEAK':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Peak Rush</Badge>;
      case 'MODERATE':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Moderate</Badge>;
      default:
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Light Traffic</Badge>;
    }
  };

  const getEquipmentAvailabilityBadge = (status) => {
    switch (status) {
      case 'CONGESTED':
        return <span className="text-xs font-bold text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> High Equipment Strain</span>;
      case 'MEDIUM':
        return <span className="text-xs font-semibold text-amber-600">Moderate Equipment Load</span>;
      default:
        return <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> High Availability</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Filter slots if searching member
  const filteredSlotWindows = slotWindows.map((window) => {
    if (!searchMember.trim()) return window;
    const matched = window.members.filter((m) =>
      m.memberName.toLowerCase().includes(searchMember.toLowerCase())
    );
    return { ...window, members: matched, memberCount: matched.length };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" /> Gym Capacity & Equipment Intelligence
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Time Slots & Gym Space Management
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Monitor member attendance schedules, equipment demand ratios, and post facility advisories to manage peak gym capacity efficiently.
          </p>
        </div>
        <Button
          onClick={() => setIsAdvisoryModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 shrink-0 flex items-center gap-2 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" /> Post Space Advisory
        </Button>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Live Currently Checked-In Members (Attending Gym Session Right Now) */}
        <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping inline-block" /> Live Attending Floor
              </div>
              <h3 className="text-3xl font-black text-emerald-950 mt-1">{res?.data?.totalLiveCheckedIn || 0}</h3>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Currently Checked-In Members</p>
            </div>
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Member Slots</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalActiveSlots}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Slot Preferences Set</p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Gym Equipment</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalEquipmentUnits} units</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Available Equipment</p>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Space Advisories</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{advisories.length} Active</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Trainer Alerts</p>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Space Advisories Notice Board ── */}
      {advisories.length > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Active Facility & Equipment Advisories
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {advisories.map((advisory) => (
              <div key={advisory.id} className="bg-white border border-amber-200 rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{advisory.title}</span>
                    <Badge className="bg-amber-100 text-amber-800 text-[10px]">{advisory.startTime} - {advisory.endTime}</Badge>
                  </div>
                  {advisory.description && <p className="text-xs text-slate-600 mt-1">{advisory.description}</p>}
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Logged by Trainer {advisory.trainer?.firstName} {advisory.trainer?.lastName}</p>
                </div>
                <button
                  onClick={() => handleDeleteAdvisory(advisory.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                  title="Remove Advisory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Filters & Search Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(parseInt(e.target.value))}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {DAYS_MAP.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search member schedule..."
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            className="bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none w-full"
          />
        </div>
      </div>

      {/* ── Time Slots Occupancy Matrix ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSlotWindows.map((slot, idx) => (
          <Card
            key={idx}
            className={`border-slate-200 transition-all duration-200 overflow-hidden ${
              selectedSlotIndex === idx ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:shadow-md'
            }`}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" /> {slot.label}
                </h3>
              </div>
              {getOccupancyBadge(slot.occupancyLevel)}
            </div>

            <CardContent className="p-4 space-y-4">
              {/* Progress & Equipment Ratio */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                  <span>Scheduled: <strong className="text-slate-900">{slot.memberCount}</strong></span>
                  <span>Live Checked In: <strong className="text-emerald-700 font-bold">{slot.liveCheckedInCount}</strong></span>
                  <span>Equip. Ratio: <strong className="text-slate-900">{slot.equipmentRatio} units/member</strong></span>
                </div>

                {/* Crowding Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      slot.occupancyLevel === 'PEAK'
                        ? 'bg-rose-500'
                        : slot.occupancyLevel === 'MODERATE'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (Math.max(slot.memberCount, slot.liveCheckedInCount) / 25) * 100)}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  {getEquipmentAvailabilityBadge(slot.equipmentAvailability)}
                  {slot.liveCheckedInCount > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping inline-block" /> {slot.liveCheckedInCount} Active Now
                    </span>
                  )}
                </div>
              </div>

              {/* Members List in Slot */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Attendees ({slot.members.length})
                </span>

                {slot.members.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No members scheduled for this slot window.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {slot.members.map((m) => (
                      <div
                        key={m.slotId}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                          m.isCheckedInLive
                            ? 'bg-emerald-50/90 border border-emerald-300 font-semibold text-emerald-950 shadow-xs'
                            : m.isMyClient
                            ? 'bg-slate-100 border border-slate-200 font-semibold text-slate-900'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium flex items-center gap-1.5">
                            {m.memberName}
                          </p>
                          <p className="text-[10px] text-slate-400">Trainer: {m.trainerName}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {m.isCheckedInLive && (
                            <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 animate-pulse">ON GYM FLOOR</Badge>
                          )}
                          {m.isMyClient && (
                            <Badge className="bg-slate-700 text-white text-[9px] px-1.5 py-0.5">My PT</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Gym Equipment Breakdown Section ── */}
      <Card className="border-slate-200 bg-white p-6">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-emerald-600" /> Active Gym Equipment Inventory & Allocation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {equipmentByCategory.map((cat, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 text-sm">{cat.category}</span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {cat.totalQuantity} Units
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                {cat.items.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                    <span>{eq.name}</span>
                    <span className="font-semibold text-slate-900">{eq.quantity} qty</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Post Space Advisory Modal ── */}
      {isAdvisoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Post Gym Space / Equipment Advisory</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inform members and trainers about space reservations or peak slot alerts.
                </p>
              </div>
              <button
                onClick={() => setIsAdvisoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdvisory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Advisory Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Treadmills Reserved for PT Class, Heavy Rush Alert"
                  value={advisoryFormData.title}
                  onChange={(e) => setAdvisoryFormData({ ...advisoryFormData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Time (HH:mm)
                  </label>
                  <input
                    type="time"
                    required
                    value={advisoryFormData.startTime}
                    onChange={(e) => setAdvisoryFormData({ ...advisoryFormData, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Time (HH:mm)
                  </label>
                  <input
                    type="time"
                    required
                    value={advisoryFormData.endTime}
                    onChange={(e) => setAdvisoryFormData({ ...advisoryFormData, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Details / Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. 4 treadmills will be occupied for personal training group cardio."
                  value={advisoryFormData.description}
                  onChange={(e) => setAdvisoryFormData({ ...advisoryFormData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdvisoryModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={createAdvisoryMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md"
                >
                  {createAdvisoryMutation.isPending ? 'Posting...' : 'Post Advisory'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
