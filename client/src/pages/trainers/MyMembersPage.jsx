import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@/lib/queryKeys';
import { getMyMembers, getMyMemberById, logMemberProgress, getMemberProgress } from '@/services/trainerService';
import { DataTable, Sheet, Card, CardHeader, Button, Input, Textarea, Avatar, Badge, Modal } from '@/components/ui';
import { SkeletonTable } from '@/components/ui/Skeleton';
import {
  Users,
  TrendingUp,
  Plus,
  Weight,
  Ruler,
  Activity,
  Calendar,
} from 'lucide-react';

/**
 * MyMembersPage — View assigned members, inspect detail, log progress with full body metrics.
 */
export default function MyMembersPage() {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState(null);
  const [progressModalMember, setProgressModalMember] = useState(null);

  // ── Fetch assigned members ──
  const { data: membersRes, isLoading } = useQuery({
    queryKey: queryKeys.trainers.members(),
    queryFn: () => getMyMembers(),
  });

  const members = membersRes?.data || [];

  // ── DataTable columns ──
  const columns = [
    {
      key: 'member',
      label: 'Member',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            firstName={row.firstName || row.user?.username?.split(' ')[0]}
            lastName={row.lastName || row.user?.username?.split(' ')[1]}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">
              {row.firstName && row.lastName ? `${row.firstName} ${row.lastName}` : row.user?.username || 'Member'}
            </p>
            <p className="text-xs text-slate-500">{row.user?.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (row) => (
        <span className="text-sm text-slate-600">{row.phone || '—'}</span>
      ),
    },
    {
      key: 'membershipStatus',
      label: 'Membership',
      render: (row) => {
        const activeMembership = row.memberships?.find((m) => ['ACTIVE', 'FROZEN', 'PENDING'].includes(m.status)) || row.memberships?.[0];
        
        if (!activeMembership) {
          return <Badge status="EXPIRED" size="sm">No Plan</Badge>;
        }

        return (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-slate-700 capitalize">
              {activeMembership.plan?.name || 'Unknown'}
            </span>
            <Badge status={activeMembership.status} size="sm">
              {activeMembership.status}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'gender',
      label: 'Gender',
      render: (row) => (
        <span className="text-sm text-slate-600 capitalize">{row.gender?.toLowerCase() || '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setProgressModalMember(row);
            }}
            icon={TrendingUp}
          >
            Log Progress
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Members</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View and manage your assigned members, inspect profiles, and log metrics.
        </p>
      </div>

      {/* ── Members Table ── */}
      {isLoading ? (
        <SkeletonTable />
      ) : (
        <DataTable
          columns={columns}
          data={members}
          searchable
          searchPlaceholder="Search members..."
          searchKeys={['firstName', 'lastName', 'user.username', 'user.email']}
          onRowClick={(row) => setSelectedMember(row)}
          emptyMessage="No members assigned to you yet"
          emptyIcon={Users}
        />
      )}

      {/* ── Member Detail Sheet ── */}
      <MemberDetailSheet
        member={selectedMember}
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        onLogProgress={() => {
          setProgressModalMember(selectedMember);
          setSelectedMember(null);
        }}
      />

      {/* ── Log Progress Modal ── */}
      <LogProgressModal
        member={progressModalMember}
        open={!!progressModalMember}
        onClose={() => setProgressModalMember(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.trainers.members() });
          if (selectedMember) {
            queryClient.invalidateQueries({ queryKey: queryKeys.progress.member(selectedMember.id) });
          }
          setProgressModalMember(null);
        }}
      />
    </div>
  );
}

// ─── Member Detail Sheet ────────────────────────────────────────────────────

function MemberDetailSheet({ member, open, onClose, onLogProgress }) {
  const memberId = member?.id;

  const { data: detailRes } = useQuery({
    queryKey: queryKeys.trainers.memberDetail(memberId),
    queryFn: () => getMyMemberById(memberId),
    enabled: !!memberId && open,
  });

  const { data: progressRes } = useQuery({
    queryKey: queryKeys.progress.member(memberId),
    queryFn: () => getMemberProgress(memberId),
    enabled: !!memberId && open,
  });

  const detail = detailRes?.data || member;
  const progressLogs = progressRes?.data || [];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={detail?.firstName ? `${detail.firstName} ${detail.lastName}` : detail?.user?.username || 'Member Detail'}
      description={detail?.user?.email}
      width="lg"
      footer={
        <Button onClick={onLogProgress} icon={TrendingUp}>
          Log Progress
        </Button>
      }
    >
      <div className="space-y-6">
        {/* ── Member Info Header ── */}
        <div className="flex items-center gap-4">
          <Avatar
            firstName={detail?.firstName || detail?.user?.username?.split(' ')[0]}
            lastName={detail?.lastName || detail?.user?.username?.split(' ')[1]}
            size="xl"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {detail?.firstName ? `${detail.firstName} ${detail.lastName}` : detail?.user?.username || '—'}
            </h3>
            <p className="text-sm text-slate-500">{detail?.user?.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">Phone: {detail?.phone || '—'}</p>
          </div>
        </div>

        {/* ── Quick Info Cards ── */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={Weight} label="Gender" value={detail?.gender || '—'} />
          <InfoCard icon={Ruler} label="DOB" value={detail?.dateOfBirth ? new Date(detail.dateOfBirth).toLocaleDateString() : '—'} />
          <InfoCard icon={Calendar} label="Joined" value={detail?.joinedAt ? new Date(detail.joinedAt).toLocaleDateString() : '—'} />
          <InfoCard icon={Activity} label="Emergency Contact" value={detail?.emergencyContact || '—'} />
        </div>

        {/* ── Active Memberships ── */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-2">Active Membership</h4>
          {detail?.memberships?.length ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm space-y-1">
              <div className="flex justify-between font-semibold text-slate-900">
                <span>{detail.memberships[0]?.plan?.name || 'Membership'}</span>
                <Badge variant={detail.memberships[0]?.status === 'ACTIVE' ? 'success' : detail.memberships[0]?.status === 'FROZEN' ? 'warning' : 'neutral'}>
                  {detail.memberships[0]?.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Valid: {new Date(detail.memberships[0]?.startDate).toLocaleDateString()} – {new Date(detail.memberships[0]?.endDate).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No active membership plan</p>
          )}
        </div>

        {/* ── Progress History ── */}
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Progress History</h4>
          {progressLogs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No progress logged yet</p>
          ) : (
            <div className="space-y-2">
              {progressLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">
                      {new Date(log.recordedAt || log.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-700">
                    {log.weight != null && <div>Weight: <strong>{log.weight} kg</strong></div>}
                    {log.chest != null && <div>Chest: <strong>{log.chest} in</strong></div>}
                    {log.waist != null && <div>Waist: <strong>{log.waist} in</strong></div>}
                    {log.arms != null && <div>Arms: <strong>{log.arms} in</strong></div>}
                    {log.thigh != null && <div>Thigh: <strong>{log.thigh} in</strong></div>}
                  </div>
                  {log.notes && (
                    <p className="text-xs text-slate-500 mt-1.5 italic">{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

// ─── Log Progress Modal ─────────────────────────────────────────────────────

function LogProgressModal({ member, open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    weight: '',
    chest: '',
    waist: '',
    arms: '',
    thigh: '',
    notes: '',
  });

  const memberId = member?.id;

  const mutation = useMutation({
    mutationFn: (data) => logMemberProgress(memberId, data),
    onSuccess: () => {
      toast.success('Progress logged successfully');
      setForm({ weight: '', chest: '', waist: '', arms: '', thigh: '', notes: '' });
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {};
    if (form.weight) payload.weight = parseFloat(form.weight);
    if (form.chest) payload.chest = parseFloat(form.chest);
    if (form.waist) payload.waist = parseFloat(form.waist);
    if (form.arms) payload.arms = parseFloat(form.arms);
    if (form.thigh) payload.thigh = parseFloat(form.thigh);
    if (form.notes) payload.notes = form.notes;
    mutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Member Progress"
      description={`Recording body metrics for ${member?.firstName ? `${member.firstName} ${member.lastName}` : member?.user?.username || 'member'}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={mutation.isPending} icon={Plus}>
            Log Metrics
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            icon={Weight}
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            placeholder="72.5"
          />
          <Input
            label="Chest (inches)"
            type="number"
            step="0.1"
            value={form.chest}
            onChange={(e) => setForm({ ...form, chest: e.target.value })}
            placeholder="40.0"
          />
          <Input
            label="Waist (inches)"
            type="number"
            step="0.1"
            value={form.waist}
            onChange={(e) => setForm({ ...form, waist: e.target.value })}
            placeholder="32.0"
          />
          <Input
            label="Arms (inches)"
            type="number"
            step="0.1"
            value={form.arms}
            onChange={(e) => setForm({ ...form, arms: e.target.value })}
            placeholder="15.5"
          />
          <Input
            label="Thigh (inches)"
            type="number"
            step="0.1"
            value={form.thigh}
            onChange={(e) => setForm({ ...form, thigh: e.target.value })}
            placeholder="24.0"
          />
        </div>
        <Textarea
          label="Notes & Observations"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Session notes, observations, recommendations..."
          rows={3}
        />
      </form>
    </Modal>
  );
}
