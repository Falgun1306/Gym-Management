import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCreateMemberProfile, useUpdateMemberProfile } from '@/hooks/useMemberPortal';
import { Card, Button } from '@/components/ui';
import { UserCheck, Sparkles, Phone, User, Calendar, Activity, ShieldAlert, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

/**
 * CompleteProfileForm — Rendered when a user logs in and their member profile
 * is missing or incomplete. Allows them to fill out physical metrics and contact info
 * to become an active Member of IronPeak Elite.
 */
export default function CompleteProfileForm({ existingProfile, onComplete }) {
  const { user } = useAuthStore();
  const createMutation = useCreateMemberProfile();
  const updateMutation = useUpdateMemberProfile();

  const [form, setForm] = useState({
    firstName: existingProfile?.firstName || user?.username || '',
    lastName: existingProfile?.lastName || '',
    phone: existingProfile?.phone && !existingProfile.phone.startsWith('+1') ? existingProfile.phone : '',
    gender: existingProfile?.gender || 'MALE',
    dob: existingProfile?.dob ? new Date(existingProfile.dob).toISOString().split('T')[0] : '',
    height: existingProfile?.height || '',
    weight: existingProfile?.weight || '',
    address: existingProfile?.address || '',
    emergencyContactName: existingProfile?.emergencyContactName || '',
    emergencyContactPhone: existingProfile?.emergencyContactPhone || '',
    medicalNotes: existingProfile?.medicalNotes || '',
    referralCode: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      toast.error('First name, last name, and phone number are required.');
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
      dob: form.dob || undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      address: form.address.trim() || undefined,
      emergencyContactName: form.emergencyContactName.trim() || undefined,
      emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
      medicalNotes: form.medicalNotes.trim() || undefined,
      referralCode: form.referralCode.trim() || undefined,
    };

    if (existingProfile) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          if (onComplete) onComplete();
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          if (onComplete) onComplete();
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-3">
          <Sparkles className="w-3.5 h-3.5" /> One Final Step
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Complete Your Member Profile
        </h1>
        <p className="text-slate-300 text-sm max-w-lg mx-auto mt-2">
          Please fill out your personal information and physical metrics to access your custom fitness plans, facility QR pass, and class bookings.
        </p>
      </div>

      <Card className="!p-6 sm:!p-8 bg-white border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" /> Basic Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="John"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Doe"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none bg-white"
                required
              >
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 pt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" /> Physical Profile & Metrics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="e.g. 175"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="e.g. 70"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full street address..."
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
            />
          </div>

          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 pt-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600" /> Emergency Contact & Health
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={form.emergencyContactName}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                placeholder="Parent / Spouse name"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                value={form.emergencyContactPhone}
                onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Notes / Health Considerations</label>
            <textarea
              value={form.medicalNotes}
              onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
              placeholder="Any past injuries, asthma, heart conditions, or allergies..."
              rows={3}
              className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
            />
          </div>

          {!existingProfile && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-emerald-600" /> Referral Code (Optional)
              </label>
              <input
                type="text"
                value={form.referralCode}
                onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                placeholder="e.g. REF-ABC123"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-mono"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              loading={isPending}
              icon={UserCheck}
              className="w-full sm:w-auto !py-3 !px-6"
            >
              Complete Profile & Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
