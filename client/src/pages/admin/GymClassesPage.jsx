import { useState } from 'react';
import { useGymClasses, useCreateGymClass, useUpdateGymClass, useDeleteGymClass, useTrainers, useBookClass, useCancelBooking } from '@/hooks/useAdmin';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, Badge, Button, Modal, SkeletonCard, Sheet } from '@/components/ui';
import { Plus, Calendar, Clock, Users, Trash2, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  { value: 'ALL', label: 'All Specializations / Categories' },
  { value: 'GENERAL_FITNESS', label: 'General Fitness' },
  { value: 'STRENGTH', label: 'Strength Training' },
  { value: 'BODYBUILDING', label: 'Bodybuilding' },
  { value: 'WEIGHT_LOSS', label: 'Weight Loss' },
  { value: 'CROSSFIT', label: 'Crossfit' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'POWERLIFTING', label: 'Powerlifting' },
  { value: 'FUNCTIONAL', label: 'Functional Training' },
];

export default function GymClassesPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'MEMBER';

  const [createModal, setCreateModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [selectedClassBookings, setSelectedClassBookings] = useState(null);

  const [form, setForm] = useState({
    title: '',
    name: '',
    specialization: 'ALL',
    description: '',
    trainerId: '',
    capacity: 20,
    startTime: '',
    endTime: '',
  });

  const { data: classes = [], isLoading } = useGymClasses();
  const { data: trainers = [] } = useTrainers();
  const createMutation = useCreateGymClass();
  const updateMutation = useUpdateGymClass();
  const deleteMutation = useDeleteGymClass();

  const bookMutation = useBookClass();
  const cancelMutation = useCancelBooking();

  // Filter trainers based on selected class specialization
  const filteredTrainers = trainers.filter((t) => {
    if (!form.specialization || form.specialization === 'ALL') return true;
    const specs = t.specializations?.length
      ? t.specializations
      : t.specialization
      ? [t.specialization]
      : [];
    return specs.includes(form.specialization);
  });

  const handleSpecializationChange = (spec) => {
    const isTrainerValid = filteredTrainers.some((t) => t.id === form.trainerId);
    setForm((prev) => ({
      ...prev,
      specialization: spec,
      trainerId: isTrainerValid ? prev.trainerId : '',
    }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const classTitle = (form.title || form.name).trim();
    
    const startDate = new Date(form.startTime);
    const [endHours, endMinutes] = form.endTime.split(':');
    const endDate = new Date(startDate);
    endDate.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0, 0);

    createMutation.mutate(
      {
        title: classTitle,
        name: classTitle,
        description: form.description,
        trainerId: form.trainerId,
        capacity: parseInt(form.capacity) || 20,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
      {
        onSuccess: () => {
          setCreateModal(false);
          setForm({ title: '', name: '', specialization: 'ALL', description: '', trainerId: '', capacity: 20, startTime: '', endTime: '' });
        },
      }
    );
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editClass) return;
    const classTitle = (form.title || form.name).trim();
    
    const startDate = new Date(form.startTime);
    const [endHours, endMinutes] = form.endTime.split(':');
    const endDate = new Date(startDate);
    endDate.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0, 0);

    updateMutation.mutate(
      {
        id: editClass.id,
        data: {
          title: classTitle,
          name: classTitle,
          description: form.description,
          trainerId: form.trainerId,
          capacity: parseInt(form.capacity) || 20,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      },
      {
        onSuccess: () => setEditClass(null),
      }
    );
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this gym class?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gym Classes & Schedules</h1>
          <p className="text-sm text-slate-500 mt-1">
            {role === 'ADMIN'
              ? 'Schedule group fitness sessions, manage trainers, and view enrollments.'
              : role === 'TRAINER'
              ? 'View scheduled gym classes and enrolled attendees.'
              : 'Explore scheduled fitness classes and book your sessions.'}
          </p>
        </div>
        {role === 'ADMIN' && (
          <Button onClick={() => setCreateModal(true)} icon={Plus}>
            Schedule New Class
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 text-sm">
          No scheduled gym classes found.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const bookingsList = cls.bookings || [];
            const bookedCount = cls._count?.bookings ?? bookingsList.length ?? 0;
            const isFull = bookedCount >= cls.capacity;

            // Check if logged in user has an active booking for this class
            const userBooking = bookingsList.find(
              (b) => b.member?.user?.username === user?.username || b.member?.userId === user?.id
            );
            const isBookedByMe = !!userBooking;

            return (
              <Card key={cls.id} className="relative p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{cls.title || cls.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Trainer: {cls.trainer ? `${cls.trainer.firstName} ${cls.trainer.lastName}` : 'Unassigned'}
                      </p>
                    </div>
                    <Badge variant={isBookedByMe ? 'success' : isFull ? 'danger' : 'info'}>
                      {isBookedByMe ? 'BOOKED' : isFull ? 'FULL' : `${cls.capacity - bookedCount} slots left`}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{cls.description || 'Group training session.'}</p>

                  <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>{formatDate(cls.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>
                        {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(cls.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-800">
                        {bookedCount} / {cls.capacity} Enrolled
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedClassBookings(cls)}
                    className="text-xs"
                  >
                    View Bookings ({bookedCount})
                  </Button>

                  {/* Member Action: Book or Cancel */}
                  {role === 'MEMBER' && (
                    <div>
                      {isBookedByMe ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelMutation.mutate(userBooking.id)}
                          loading={cancelMutation.isPending}
                          className="text-xs text-rose-600 hover:bg-rose-50"
                          icon={XCircle}
                        >
                          Cancel Booking
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isFull}
                          onClick={() => bookMutation.mutate(cls.id)}
                          loading={bookMutation.isPending}
                          className="text-xs"
                          icon={CheckCircle2}
                        >
                          {isFull ? 'Class Full' : 'Book Class'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Admin Actions: Edit or Delete */}
                  {role === 'ADMIN' && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditClass(cls);
                          const classTitle = cls.title || cls.name || '';
                          setForm({
                            title: classTitle,
                            name: classTitle,
                            specialization: 'ALL',
                            description: cls.description || '',
                            trainerId: cls.trainerId || '',
                            capacity: cls.capacity,
                            startTime: cls.startTime ? (() => {
                              const d = new Date(cls.startTime);
                              const offset = d.getTimezoneOffset() * 60000;
                              return new Date(d.getTime() - offset).toISOString().slice(0, 16);
                            })() : '',
                            endTime: cls.endTime ? new Date(cls.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
                          });
                        }}
                        className="!p-1.5"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(cls.id)} className="!p-1.5 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Class Modal */}
      {(createModal || editClass) && (
        <Modal
          open={createModal || !!editClass}
          onClose={() => { setCreateModal(false); setEditClass(null); }}
          title={editClass ? 'Edit Gym Class Schedule' : 'Schedule New Gym Class'}
        >
          <form onSubmit={editClass ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Title *</label>
              <input
                type="text"
                value={form.title || form.name}
                onChange={(e) => setForm({ ...form, title: e.target.value, name: e.target.value })}
                placeholder="e.g. HIIT Cardio Blitz, Vinyasa Yoga"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            {/* Specialization Filter & Trainer Select Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Category / Specialization
                </label>
                <select
                  value={form.specialization}
                  onChange={(e) => handleSpecializationChange(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Trainer * {filteredTrainers.length > 0 && <span className="text-[11px] text-emerald-600 font-normal">({filteredTrainers.length} qualified)</span>}
                </label>
                <select
                  value={form.trainerId}
                  onChange={(e) => setForm({ ...form, trainerId: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                >
                  <option value="">Select a Qualified Trainer...</option>
                  {filteredTrainers.map((t) => {
                    const specs = t.specializations?.length
                      ? t.specializations.map((s) => s.replace(/_/g, ' ')).join(', ')
                      : t.specialization?.replace(/_/g, ' ') || 'Fitness';

                    return (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({specs})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity (Seats) *</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20 h-20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setCreateModal(false); setEditClass(null); }}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editClass ? 'Save Changes' : 'Schedule Class'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bookings Drawer */}
      {selectedClassBookings && (
        <Sheet
          open={!!selectedClassBookings}
          onClose={() => setSelectedClassBookings(null)}
          title={`Enrolled Members — ${selectedClassBookings.title || selectedClassBookings.name}`}
        >
          <div className="space-y-4 pt-2">
            {selectedClassBookings.bookings?.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No bookings for this class yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedClassBookings.bookings.map((b) => (
                  <div key={b.id || b.memberId} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {b.member?.firstName
                          ? `${b.member.firstName} ${b.member.lastName || ''}`.trim()
                          : b.member?.user?.username || 'Member'}
                      </p>
                      <p className="text-slate-400">Booked: {b.createdAt ? formatDate(b.createdAt) : 'Enrolled'}</p>
                    </div>
                    <Badge variant={b.status === 'CANCELLED' ? 'danger' : 'success'}>
                      {b.status || 'ENROLLED'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}
