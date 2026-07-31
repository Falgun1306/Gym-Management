import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@/lib/queryKeys';
import { getMyProfile, updateMyProfile, getMySchedule, updateMySchedule } from '@/services/trainerService';
import { Card, CardHeader, Button, Input, Textarea, Select, Badge } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { TRAINER_SPECIALIZATION, DAYS_OF_WEEK } from '@/utils/constants';
import {
  User,
  Save,
  Phone,
  Mail,
  Award,
  Clock,
  Calendar,
  Briefcase,
} from 'lucide-react';

/**
 * TrainerProfilePage — Profile management and weekly schedule editor.
 *
 * Two sections:
 *  1. Profile info (bio, specialization, certifications, phone)
 *  2. Weekly schedule grid (available time slots per day)
 */
export default function TrainerProfilePage() {
  const queryClient = useQueryClient();

  // ── Profile data ──
  const { data: profileRes, isLoading: profileLoading } = useQuery({
    queryKey: queryKeys.trainers.detail('me'),
    queryFn: getMyProfile,
  });

  // ── Schedule data ──
  const { data: scheduleRes, isLoading: scheduleLoading } = useQuery({
    queryKey: queryKeys.trainers.schedule(),
    queryFn: getMySchedule,
  });

  const profile = profileRes?.data;
  const schedule = scheduleRes?.data;

  // ── Profile edit state ──
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState(null);

  // ── Schedule edit state ──
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(null);

  // Start editing profile
  const startProfileEdit = () => {
    setProfileForm({
      bio: profile?.bio || '',
      specialization: profile?.specialization || '',
      certifications: profile?.certifications || '',
      phone: profile?.phone || profile?.user?.phone || '',
      experience: profile?.experience || '',
      salary: profile?.salary || '',
    });
    setEditing(true);
  };

  // Start editing schedule
  const startScheduleEdit = () => {
    setScheduleForm(
      schedule || DAYS_OF_WEEK.map((day) => ({
        day,
        isAvailable: false,
        startTime: '09:00',
        endTime: '17:00',
      }))
    );
    setEditingSchedule(true);
  };

  // ── Mutations ──
  const profileMutation = useMutation({
    mutationFn: (data) => updateMyProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.detail('me') });
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const scheduleMutation = useMutation({
    mutationFn: (data) => updateMySchedule(data),
    onSuccess: () => {
      toast.success('Schedule updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.schedule() });
      setEditingSchedule(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    profileMutation.mutate(profileForm);
  };

  const handleScheduleSave = (e) => {
    e.preventDefault();
    scheduleMutation.mutate({ schedule: scheduleForm });
  };

  if (profileLoading || scheduleLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile & Availability</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your profile information and working hours.
        </p>
      </div>

      {/* ── Profile Section ── */}
      <Card>
        <CardHeader
          title="Personal Information"
          action={
            !editing ? (
              <Button variant="outline" size="sm" onClick={startProfileEdit}>
                Edit Profile
              </Button>
            ) : null
          }
        />

        {editing ? (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Specialization"
                value={profileForm.specialization}
                onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                options={Object.entries(TRAINER_SPECIALIZATION).map(([value, label]) => ({ value, label }))}
                placeholder="Select specialization"
              />
              <Input
                label="Phone"
                icon={Phone}
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Experience (years)"
                type="number"
                icon={Briefcase}
                value={profileForm.experience}
                onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                placeholder="5"
              />
              <Input
                label="Certifications"
                icon={Award}
                value={profileForm.certifications}
                onChange={(e) => setProfileForm({ ...profileForm, certifications: e.target.value })}
                placeholder="NASM, ACE, ISSA..."
              />
            </div>
            <Textarea
              label="Bio"
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              placeholder="Tell your clients about yourself, your training philosophy, and experience..."
              rows={4}
            />
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" loading={profileMutation.isPending} icon={Save}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoRow icon={User} label="Name" value={profile?.user?.username || '—'} />
              <InfoRow icon={Mail} label="Email" value={profile?.user?.email || '—'} />
              <InfoRow icon={Phone} label="Phone" value={profile?.phone || profile?.user?.phone || '—'} />
              <InfoRow icon={Briefcase} label="Experience" value={profile?.experience ? `${profile.experience} years` : '—'} />
            </div>
            <div className="space-y-4">
              <InfoRow icon={Award} label="Specialization" value={profile?.specialization ? TRAINER_SPECIALIZATION[profile.specialization] || profile.specialization : '—'} />
              <InfoRow icon={Award} label="Certifications" value={profile?.certifications || '—'} />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Bio</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {profile?.bio || 'No bio added yet.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── Schedule Section ── */}
      <Card>
        <CardHeader
          title="Weekly Schedule"
          subtitle="Set your available working hours for each day."
          action={
            !editingSchedule ? (
              <Button variant="outline" size="sm" onClick={startScheduleEdit} icon={Calendar}>
                Edit Schedule
              </Button>
            ) : null
          }
        />

        {editingSchedule ? (
          <form onSubmit={handleScheduleSave} className="space-y-3">
            {(scheduleForm || []).map((slot, idx) => (
              <div
                key={slot.day}
                className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50"
              >
                <label className="flex items-center gap-2 min-w-[120px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.isAvailable}
                    onChange={(e) => {
                      const updated = [...scheduleForm];
                      updated[idx] = { ...updated[idx], isAvailable: e.target.checked };
                      setScheduleForm(updated);
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{slot.day}</span>
                </label>
                {slot.isAvailable && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.startTime || '09:00'}
                      onChange={(e) => {
                        const updated = [...scheduleForm];
                        updated[idx] = { ...updated[idx], startTime: e.target.value };
                        setScheduleForm(updated);
                      }}
                      className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <span className="text-slate-400 text-sm">to</span>
                    <input
                      type="time"
                      value={slot.endTime || '17:00'}
                      onChange={(e) => {
                        const updated = [...scheduleForm];
                        updated[idx] = { ...updated[idx], endTime: e.target.value };
                        setScheduleForm(updated);
                      }}
                      className="px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                )}
                {!slot.isAvailable && (
                  <span className="text-xs text-slate-400 italic">Day off</span>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" loading={scheduleMutation.isPending} icon={Save}>
                Save Schedule
              </Button>
              <Button variant="outline" onClick={() => setEditingSchedule(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(schedule) ? schedule : DAYS_OF_WEEK.map((day) => ({ day, isAvailable: false }))).map((slot) => (
              <div
                key={slot.day}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
              >
                <span className="text-sm font-medium text-slate-700 min-w-[100px]">{slot.day}</span>
                {slot.isAvailable ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-sm text-slate-600">
                      {slot.startTime || '09:00'} – {slot.endTime || '17:00'}
                    </span>
                    <Badge variant="active" size="sm" dot={false}>Available</Badge>
                  </div>
                ) : (
                  <Badge variant="cancelled" size="sm" dot={false}>Day Off</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/** Small helper row for read-only profile info */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
