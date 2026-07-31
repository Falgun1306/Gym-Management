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

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

/**
 * TrainerProfilePage — Profile management and weekly schedule editor.
 *
 * Two sections:
 *  1. Profile info (bio, gender, specialization, certifications, phone)
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
      gender: profile?.gender || 'MALE',
      specialization: profile?.specialization || '',
      certifications: Array.isArray(profile?.certifications)
        ? profile.certifications.join(', ')
        : profile?.certifications || '',
      phone: profile?.phone || profile?.user?.phone || '',
      experience: profile?.experience || '',
    });
    setEditing(true);
  };

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
    const certsArray = typeof profileForm.certifications === 'string'
      ? profileForm.certifications.split(',').map((c) => c.trim()).filter(Boolean)
      : profileForm.certifications;

    profileMutation.mutate({
      bio: profileForm.bio,
      gender: profileForm.gender,
      profilePhoto: profile?.profilePhoto || null,
      certifications: certsArray,
    });
  };

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

  if (profileLoading || scheduleLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
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
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile & Availability</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your bio, certifications, and weekly working hours.
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
                label="Gender"
                options={GENDER_OPTIONS}
                value={profileForm.gender}
                onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
              />
              <Input
                label="Certifications (comma separated)"
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
              <InfoRow icon={User} label="Name" value={`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || profile?.user?.username || '—'} />
              <InfoRow icon={User} label="Gender" value={profile?.gender ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase() : '—'} />
              <InfoRow icon={Mail} label="Email" value={profile?.user?.email || '—'} />
              <InfoRow icon={Phone} label="Phone" value={profile?.phone || '—'} />
              <InfoRow icon={Briefcase} label="Experience" value={profile?.experience ? `${profile.experience} years` : '—'} />
            </div>
            <div className="space-y-4">
              <InfoRow icon={Award} label="Specialization" value={profile?.specialization ? TRAINER_SPECIALIZATION[profile.specialization] || profile.specialization : '—'} />
              <InfoRow
                icon={Award}
                label="Certifications"
                value={Array.isArray(profile?.certifications) ? profile.certifications.join(', ') || '—' : profile?.certifications || '—'}
              />
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
                key={slot.dayOfWeek}
                className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50"
              >
                <label className="flex items-center gap-2 min-w-[120px] cursor-pointer">
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
                  <span className="text-sm font-medium text-slate-700">{slot.dayName}</span>
                </label>

                {slot.isAvailable ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => {
                        const updated = [...scheduleForm];
                        updated[idx].startTime = e.target.value;
                        setScheduleForm(updated);
                      }}
                      className="!py-1 !px-2 text-xs"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => {
                        const updated = [...scheduleForm];
                        updated[idx].endTime = e.target.value;
                        setScheduleForm(updated);
                      }}
                      className="!py-1 !px-2 text-xs"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Unavailable</span>
                )}
              </div>
            ))}

            <div className="flex items-center gap-2 pt-3">
              <Button type="submit" loading={scheduleMutation.isPending} icon={Save}>
                Save Schedule
              </Button>
              <Button variant="outline" onClick={() => setEditingSchedule(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {scheduleDisplay.map((slot) => (
              <div
                key={slot.dayOfWeek}
                className={`p-3 rounded-xl border text-center transition-colors ${
                  slot.isAvailable
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <p className="text-xs font-bold text-slate-900 mb-1">{slot.dayName}</p>
                {slot.isAvailable ? (
                  <div className="space-y-0.5">
                    <Badge variant="success" size="sm">Available</Badge>
                    <p className="text-[11px] text-slate-600 font-medium mt-1">
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">Off</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Helper row component
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}
