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
  FileText,
  Calendar,
  ArrowRight,
} from 'lucide-react';

/**
 * MyMembersPage — View assigned members, inspect detail, log progress.
 *
 * Features:
 *  - DataTable of assigned members
 *  - Detail Sheet with member info + recent progress
 *  - Log Progress modal with form (weight, body fat, notes)
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
            firstName={row.user?.username?.split(' ')[0]}
            lastName={row.user?.username?.split(' ')[1]}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">{row.user?.username || '—'}</p>
            <p className="text-xs text-slate-500">{row.user?.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (row) => (
        <span className="text-sm text-slate-600">{row.phone || row.user?.phone || '—'}</span>
      ),
    },
    {
      key: 'membershipStatus',
      label: 'Status',
      render: (row) => (
        <Badge status={row.membershipStatus || 'ACTIVE'} size="sm" />
      ),
    },
    {
      key: 'goal',
      label: 'Goal',
      render: (row) => (
        <span className="text-sm text-slate-600">{row.goal || '—'}</span>
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
          View and manage your assigned members and their progress.
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
          searchKeys={['user.username', 'user.email']}
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
          setProgressModalMember(null);
        }}
      />
    </div>
  );
}

// ─── Member Detail Sheet ────────────────────────────────────────────────────

function MemberDetailSheet({ member, open, onClose, onLogProgress }) {
  const memberId = member?.id || member?.userId;

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
      title={detail?.user?.username || 'Member Detail'}
      description={detail?.user?.email}
      width="lg"
      footer={
        <Button onClick={onLogProgress} icon={TrendingUp}>
          Log Progress
        </Button>
      }
    >
      <div className="space-y-6">
        {/* ── Member Info ── */}
        <div className="flex items-center gap-4">
          <Avatar
            firstName={detail?.user?.username?.split(' ')[0]}
            lastName={detail?.user?.username?.split(' ')[1]}
            size="xl"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {detail?.user?.username || '—'}
            </h3>
            <p className="text-sm text-slate-500">{detail?.user?.email}</p>
            <Badge status={detail?.membershipStatus || 'ACTIVE'} size="sm" className="mt-1" />
          </div>
        </div>

        {/* ── Quick Info Cards ── */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={Weight} label="Weight" value={detail?.weight ? `${detail.weight} kg` : '—'} />
          <InfoCard icon={Ruler} label="Height" value={detail?.height ? `${detail.height} cm` : '—'} />
          <InfoCard icon={Activity} label="Goal" value={detail?.goal || '—'} />
          <InfoCard icon={Calendar} label="Joined" value={detail?.createdAt ? new Date(detail.createdAt).toLocaleDateString() : '—'} />
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
                      {new Date(log.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {log.weight && <span className="text-slate-700">Weight: <strong>{log.weight} kg</strong></span>}
                    {log.bodyFat && <span className="text-slate-700">Body Fat: <strong>{log.bodyFat}%</strong></span>}
                  </div>
                  {log.notes && (
                    <p className="text-xs text-slate-500 mt-1">{log.notes}</p>
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
  const [form, setForm] = useState({ weight: '', bodyFat: '', notes: '' });
  const memberId = member?.id || member?.userId;

  const mutation = useMutation({
    mutationFn: (data) => logMemberProgress(memberId, data),
    onSuccess: () => {
      toast.success('Progress logged successfully');
      setForm({ weight: '', bodyFat: '', notes: '' });
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {};
    if (form.weight) payload.weight = parseFloat(form.weight);
    if (form.bodyFat) payload.bodyFat = parseFloat(form.bodyFat);
    if (form.notes) payload.notes = form.notes;
    mutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Member Progress"
      description={`Recording metrics for ${member?.user?.username || 'member'}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={mutation.isPending} icon={Plus}>
            Log Progress
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
            label="Body Fat (%)"
            type="number"
            step="0.1"
            icon={Activity}
            value={form.bodyFat}
            onChange={(e) => setForm({ ...form, bodyFat: e.target.value })}
            placeholder="15.0"
          />
        </div>
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Session notes, observations, recommendations..."
          rows={3}
        />
      </form>
    </Modal>
  );
}
