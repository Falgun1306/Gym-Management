import { useState, useEffect } from 'react';
import { useAdminProfile, useUpdateAdminProfile } from '@/hooks/useAdmin';
import { Card, Button, Avatar } from '@/components/ui';
import { User, Mail, Shield, Save } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminSettingsPage() {
  const { data: profile, isLoading } = useAdminProfile();
  const updateMutation = useUpdateAdminProfile();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const [form, setForm] = useState({ username: '', email: '' });

  useEffect(() => {
    if (profile) {
      setForm({ username: profile.username || '', email: profile.email || '' });
    }
  }, [profile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form, {
      onSuccess: (res) => {
        if (res.data) {
          setAuth(token, { ...profile, ...res.data });
        }
      },
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your administrative credentials and email address.</p>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded" />
            <div className="h-10 bg-slate-200 rounded" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <Avatar firstName={form.username?.[0] || 'A'} size="lg" className="!bg-emerald-700 !text-white" />
              <div>
                <p className="text-base font-bold text-slate-900">{profile?.username}</p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Facility Administrator</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" loading={updateMutation.isPending} icon={Save}>
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
