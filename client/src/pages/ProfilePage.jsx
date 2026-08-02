import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { queryKeys } from '@/lib/queryKeys';
import { getAdminProfile, updateAdminProfile } from '@/services/adminService';
import { getMyProfile as getTrainerProfile, updateMyProfile as updateTrainerProfile } from '@/services/trainerService';
import { getMyProfile as getMemberProfile } from '@/services/memberPortalService';
import { useUpdateMemberProfile } from '@/hooks/useMemberPortal';
import { Card, CardHeader, Button, Input, Textarea, Select, Badge, Avatar } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { TRAINER_SPECIALIZATION } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import {
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Award,
  Briefcase,
  HeartPulse,
  MapPin,
  Save,
  Activity,
  UserCheck,
  Star,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

/**
 * ProfilePage — Common profile display and editor for Admin, Trainer, and Member.
 * Dynamically presents only the required, highly-relevant information for the specific role.
 */
export default function ProfilePage() {
  const { user } = useAuthStore();
  const role = user?.role || 'MEMBER';
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  // ── 1. Fetch data based on role ──
  const { data: res, isLoading, error } = useQuery({
    queryKey: ['profile', role, user?.id],
    queryFn: async () => {
      if (role === 'ADMIN') return await getAdminProfile();
      if (role === 'TRAINER') return await getTrainerProfile();
      return await getMemberProfile();
    },
    retry: false,
  });

  const profile = res?.data || {};

  // ── 2. Role-specific mutations ──
  const adminMutation = useMutation({
    mutationFn: (data) => updateAdminProfile(data),
    onSuccess: () => {
      toast.success('Admin profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to update profile'),
  });

  const trainerMutation = useMutation({
    mutationFn: (data) => updateTrainerProfile(data),
    onSuccess: () => {
      toast.success('Trainer profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.detail('me') });
      setEditing(false);
    },
    onError: (err) => toast.error(err.message || 'Failed to update profile'),
  });

  const memberUpdateMutation = useUpdateMemberProfile();

  // ── 3. Start edit handler ──
  const handleStartEdit = () => {
    if (role === 'ADMIN') {
      setForm({
        username: profile.username || user?.username || '',
        email: profile.email || user?.email || '',
      });
    } else if (role === 'TRAINER') {
      setForm({
        bio: profile.bio || '',
        gender: profile.gender || 'MALE',
        certifications: Array.isArray(profile.certifications)
          ? profile.certifications.join(', ')
          : profile.certifications || '',
      });
    } else {
      // MEMBER
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        gender: profile.gender || 'MALE',
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
        address: profile.address || '',
        height: profile.height || '',
        weight: profile.weight || '',
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || '',
        medicalNotes: profile.medicalNotes || '',
      });
    }
    setEditing(true);
  };

  // ── 4. Save handler ──
  const handleSave = (e) => {
    e.preventDefault();
    if (role === 'ADMIN') {
      adminMutation.mutate({
        username: form.username.trim(),
        email: form.email.trim(),
      });
    } else if (role === 'TRAINER') {
      const certsArray = typeof form.certifications === 'string'
        ? form.certifications.split(',').map((c) => c.trim()).filter(Boolean)
        : form.certifications;
      trainerMutation.mutate({
        bio: form.bio,
        gender: form.gender,
        certifications: certsArray,
      });
    } else {
      // MEMBER
      memberUpdateMutation.mutate(
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          gender: form.gender,
          dob: form.dob || undefined,
          address: form.address?.trim() || undefined,
          height: form.height ? parseFloat(form.height) : undefined,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          emergencyContactName: form.emergencyContactName?.trim() || undefined,
          emergencyContactPhone: form.emergencyContactPhone?.trim() || undefined,
          medicalNotes: form.medicalNotes?.trim() || undefined,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setEditing(false);
          },
        }
      );
    }
  };

  const isSaving = adminMutation.isPending || trainerMutation.isPending || memberUpdateMutation.isPending;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <SkeletonCard />
      </div>
    );
  }

  // Calculate Display Name & Role Badge Label
  const getDisplayName = () => {
    if (role === 'ADMIN') return profile.username || user?.username || 'Administrator';
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    return fullName || user?.username || 'User Profile';
  };

  const getRoleBadge = () => {
    if (role === 'ADMIN') return { label: 'Facility Administrator', variant: 'purple', icon: ShieldCheck };
    if (role === 'TRAINER') return { label: 'Certified Elite Trainer', variant: 'success', icon: Award };
    return { label: 'Gym Member', variant: 'info', icon: UserCheck };
  };

  const badgeInfo = getRoleBadge();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ── Profile Header Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <User className="w-72 h-72 text-emerald-400" />
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          <div className="p-1 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shrink-0">
            <Avatar
              firstName={getDisplayName()[0]}
              lastName=""
              size="xl"
              className="!w-20 !h-20 !text-2xl !bg-slate-900 !text-white font-extrabold rounded-xl"
            />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {getDisplayName()}
                </h1>
                <p className="text-slate-400 text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  {profile.email || profile.user?.email || user?.email || '—'}
                </p>
              </div>

              {!editing && (
                <Button
                  onClick={handleStartEdit}
                  variant="outline"
                  size="sm"
                  className="!border-emerald-500/50 !text-emerald-300 hover:!bg-emerald-500/20 shadow-sm self-center sm:self-start"
                >
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <badgeInfo.icon className="w-3.5 h-3.5" />
                {badgeInfo.label}
              </span>

              {role === 'TRAINER' && profile.averageRating !== undefined && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  {profile.averageRating.toFixed(1)} Rating ({profile.totalReviews || 0} reviews)
                </span>
              )}

              <span className="text-xs text-slate-400 font-medium px-2 py-0.5">
                Member since {formatDate(profile.joinedAt || profile.createdAt || user?.createdAt || new Date())}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Content Area ── */}
      <Card className="shadow-md border-slate-200/80">
        <CardHeader
          title={editing ? `Editing ${badgeInfo.label} Information` : `${role === 'ADMIN' ? 'Account' : role === 'TRAINER' ? 'Trainer' : 'Personal'} Details`}
          subtitle={editing ? 'Update your information below and save your changes.' : 'Your verified profile information visible across the gym portal.'}
          icon={User}
        />

        <div className="p-6 pt-2">
          {editing ? (
            /* ── EDIT FORM ── */
            <form onSubmit={handleSave} className="space-y-6">
              {role === 'ADMIN' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              )}

              {role === 'TRAINER' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Gender"
                      options={GENDER_OPTIONS}
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    />
                    <Input
                      label="Certifications (comma separated)"
                      icon={Award}
                      value={form.certifications}
                      onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                      placeholder="e.g. NASM-CPT, ACE, Yoga Alliance..."
                    />
                  </div>
                  <Textarea
                    label="Professional Bio & Training Philosophy"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Describe your specialties, coaching approach, and accomplishments..."
                    rows={4}
                  />
                </>
              )}

              {role === 'MEMBER' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="First Name"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                    <Input
                      label="Phone Number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      label="Gender"
                      options={GENDER_OPTIONS}
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    />
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    />
                    <Input
                      label="Address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="City, State"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Height (inches)"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 69.5"
                      value={form.height}
                      onChange={(e) => setForm({ ...form, height: e.target.value })}
                    />
                    <Input
                      label="Weight (kg)"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 74.5"
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-rose-500" /> Emergency & Medical Record
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="Emergency Contact Name"
                        value={form.emergencyContactName}
                        onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                        placeholder="Family member or spouse name"
                      />
                      <Input
                        label="Emergency Contact Phone"
                        value={form.emergencyContactPhone}
                        onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                        placeholder="Emergency contact phone"
                      />
                    </div>
                    <Textarea
                      label="Medical Notes & Considerations (Optional)"
                      value={form.medicalNotes}
                      onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
                      placeholder="Any injuries, surgeries, or medical conditions your trainer should know..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isSaving} icon={Save} className="!bg-emerald-600 !text-white hover:!bg-emerald-700 shadow-md">
                  Save Profile
                </Button>
              </div>
            </form>
          ) : (
            /* ── READ ONLY PROFILE VIEW ── */
            <div className="space-y-6">
              {role === 'ADMIN' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                  <InfoRow icon={User} label="Admin Username" value={profile.username || user?.username || '—'} />
                  <InfoRow icon={Mail} label="Email Address" value={profile.email || user?.email || '—'} />
                  <InfoRow icon={ShieldCheck} label="Access Privilege" value="Full Facility & Database Management" />
                  <InfoRow icon={Calendar} label="Account Registered" value={formatDate(profile.createdAt || user?.createdAt || new Date())} />
                </div>
              )}

              {role === 'TRAINER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                  <div className="space-y-5">
                    <InfoRow icon={User} label="Full Name" value={`${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user?.username || '—'} />
                    <InfoRow icon={Phone} label="Contact Phone" value={profile.phone || '—'} />
                    <InfoRow icon={User} label="Gender" value={profile.gender ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase() : '—'} />
                    <InfoRow icon={Briefcase} label="Professional Experience" value={profile.experience ? `${profile.experience} Years Coaching` : 'Not specified'} />
                  </div>

                  <div className="space-y-5">
                    <InfoRow
                      icon={Award}
                      label="Primary Specialization"
                      value={profile.specialization ? TRAINER_SPECIALIZATION[profile.specialization] || profile.specialization : 'General Fitness'}
                    />
                    <InfoRow
                      icon={Award}
                      label="Certifications"
                      value={Array.isArray(profile.certifications) ? profile.certifications.join(', ') || 'None reported' : profile.certifications || 'None reported'}
                    />
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Trainer Bio
                      </p>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed min-h-[80px]">
                        {profile.bio ? profile.bio : <span className="text-slate-400 italic">No bio written yet. Click Edit Profile to add your bio!</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {role === 'MEMBER' && (
                <div className="space-y-6 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoRow icon={User} label="Full Name" value={`${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user?.username || '—'} />
                    <InfoRow icon={Phone} label="Phone Number" value={profile.phone || '—'} />
                    <InfoRow icon={User} label="Gender" value={profile.gender ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase() : '—'} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InfoRow icon={Calendar} label="Date of Birth" value={profile.dob ? formatDate(profile.dob) : '—'} />
                    <InfoRow icon={MapPin} label="Address" value={profile.address || '—'} />
                    <InfoRow icon={Activity} label="Height & Weight" value={`${profile.height ? `${profile.height} inches` : '—'} / ${profile.weight ? `${profile.weight} kg` : '—'}`} />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <HeartPulse className="w-5 h-5 text-rose-600" />
                        <span>Emergency & Medical Considerations</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                          <span className="font-semibold text-slate-400 block uppercase text-[10px] mb-1">Emergency Contact</span>
                          <span className="text-slate-800 font-bold text-sm">
                            {profile.emergencyContactName ? `${profile.emergencyContactName} (${profile.emergencyContactPhone || 'No phone'})` : 'None specified'}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                          <span className="font-semibold text-slate-400 block uppercase text-[10px] mb-1">Medical Notes</span>
                          <span className="text-slate-700 text-sm">
                            {profile.medicalNotes || <span className="italic text-slate-400">No reported medical conditions or injuries</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Reusable styled info row
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
