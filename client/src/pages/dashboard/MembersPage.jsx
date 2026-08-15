import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  UserCheck,
  Play,
  Eye,
  UserMinus,
  Activity,
  User,
} from 'lucide-react';
import { useMembers, useMember, useUpdateMember, useDeleteMember } from '@/hooks/useMembers';
import { useTrainers, useAssignTrainer, useRemoveTrainerFromMember, useUnfreezeMembership } from '@/hooks/useAdmin';
import { registerUser } from '@/services/authService';
import { queryKeys } from '@/lib/queryKeys';
import { Badge, Avatar, Card, Sheet, Button, Modal } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import toast from 'react-hot-toast';
import { formatPhone, formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';

/**
 * MembersPage — Complete Admin Member Management.
 * Implements full support for:
 *  - GET /members (list, search, status filter, pagination)
 *  - GET /members/:id (get member details by ID in sheet)
 *  - PATCH /members/:id (update member profile metrics: name, phone, gender, address, dob, height, weight, emergency contact)
 *  - DELETE /members/:id (delete member profile)
 *  - PATCH /members/:memberId/assign-trainer (assign qualified trainer to member)
 *  - PATCH /members/:memberId/remove-trainer (remove assigned trainer from member)
 */

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'FROZEN', label: 'Frozen' },
];

const STATUS_BADGE_MAP = {
  ACTIVE: 'success',
  EXPIRED: 'danger',
  CANCELLED: 'warning',
  FROZEN: 'danger',
};

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [membershipStatus, setMembershipStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [addMemberModal, setAddMemberModal] = useState(false);

  const debounceTimerRef = useState(null);
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);

    if (debounceTimerRef[0]) clearTimeout(debounceTimerRef[0]);
    debounceTimerRef[0] = setTimeout(() => {
      setDebouncedSearch(value.trim());
    }, 400);
  }, [debounceTimerRef]);

  const params = useMemo(() => {
    const p = { page, limit };
    if (debouncedSearch) p.search = debouncedSearch;
    if (membershipStatus) p.membershipStatus = membershipStatus;
    return p;
  }, [page, limit, debouncedSearch, membershipStatus]);

  const { data, isLoading, isError } = useMembers(params);
  const members = data?.members ?? [];
  const pagination = data?.pagination ?? { page: 1, total: 0, totalPages: 1 };

  const { data: memberDetail, isLoading: detailLoading } = useMember(selectedMemberId);
  const deleteMemberMutation = useDeleteMember();

  const startItem = (pagination.page - 1) * limit + 1;
  const endItem = Math.min(pagination.page * limit, pagination.total);

  const handleDeleteMemberQuick = (e, member) => {
    e.stopPropagation();
    if (confirm(`Permanently delete member record for ${member.firstName} ${member.lastName}?`)) {
      deleteMemberMutation.mutate(member.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Members Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage facility members, memberships, assigned trainers, and profiles.
          </p>
        </div>
        <Button onClick={() => setAddMemberModal(true)} icon={UserPlus}>
          Add Member
        </Button>
      </div>

      {/* ── Filters & Search ── */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search members by name, ID, or phone..."
              className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400
                pl-10 pr-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600
                hover:border-slate-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={membershipStatus}
              onChange={(e) => {
                setMembershipStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white text-slate-700
                px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600
                hover:border-slate-400 transition-all min-w-[140px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ── Members Table ── */}
      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} columns={7} />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-rose-600">Failed to load members. Please try again.</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">No members found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                      Member
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                      Gender
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                      Contact
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                      Membership
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                      Assigned Trainer
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => {
                    const activeMembership = member.memberships?.[0];
                    const membershipPlan = activeMembership?.plan?.name ?? 'No Plan';
                    const memberStatus = activeMembership?.status ?? 'EXPIRED';
                    const formattedGender = member.gender ? member.gender.charAt(0) + member.gender.slice(1).toLowerCase() : '—';

                    return (
                      <tr
                        key={member.id}
                        onClick={() => setSelectedMemberId(member.id)}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-slate-50',
                          selectedMemberId === member.id && 'bg-emerald-50/50'
                        )}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              firstName={member.firstName}
                              lastName={member.lastName}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-xs text-slate-400 font-mono">
                                ID: #MM-{member.id?.slice(-4)?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 capitalize">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            {formattedGender}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {formatPhone(member.phone)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {membershipPlan}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {member.trainer ? (
                            <span className="font-medium text-slate-800">
                              {member.trainer.firstName} {member.trainer.lastName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={STATUS_BADGE_MAP[memberStatus] || 'neutral'}>
                            {memberStatus}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMemberId(member.id);
                              }}
                              className="!p-1.5"
                              title="View Details & Controls"
                            >
                              <Eye className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteMemberQuick(e, member)}
                              className="!p-1.5 hover:bg-rose-50"
                              title="Delete Member"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination Bar ── */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/30">
              <p className="text-xs text-slate-500 font-medium">
                Showing {startItem}–{endItem} of {pagination.total} members
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-slate-700 px-2">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ── Member Detail Drawer ── */}
      <Sheet
        open={!!selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
        title="Member Profile & Controls"
        size="md"
      >
        {detailLoading ? (
          <div className="space-y-4 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        ) : memberDetail ? (
          <MemberDetailPanel
            member={memberDetail}
            onCloseSheet={() => setSelectedMemberId(null)}
          />
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">
            Select a member to view details.
          </p>
        )}
      </Sheet>

      {/* ── Add Member Modal ── */}
      {addMemberModal && (
        <AddMemberModal open={addMemberModal} onClose={() => setAddMemberModal(false)} />
      )}
    </div>
  );
}

// ─── Add Member Modal ────────────────────────────────────────────────────────

function AddMemberModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ username: '', email: '', gender: 'MALE', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await registerUser(form);
      toast.success(res.message || 'Member registered successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to register member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Register New Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              required
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} icon={UserPlus}>Create Member Account</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Member Detail Panel ─────────────────────────────────────────────────────

function MemberDetailPanel({ member, onCloseSheet }) {
  const [editModal, setEditModal] = useState(false);
  const [assignTrainerModal, setAssignTrainerModal] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState(member.trainerId || '');

  const [editForm, setEditForm] = useState({
    firstName: member.firstName || '',
    lastName: member.lastName || '',
    phone: member.phone || '',
    gender: member.gender || 'MALE',
    address: member.address || '',
    dob: member.dob ? new Date(member.dob).toISOString().split('T')[0] : '',
    height: member.height || '',
    weight: member.weight || '',
    emergencyContact: member.emergencyContact || '',
  });

  // Re-sync form state when member changes
  useEffect(() => {
    setEditForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      phone: member.phone || '',
      gender: member.gender || 'MALE',
      address: member.address || '',
      dob: member.dob ? new Date(member.dob).toISOString().split('T')[0] : '',
      height: member.height || '',
      weight: member.weight || '',
      emergencyContact: member.emergencyContact || '',
    });
    setSelectedTrainerId(member.trainerId || '');
  }, [member]);

  const { data: trainers = [] } = useTrainers();
  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();
  const assignTrainerMutation = useAssignTrainer();
  const removeTrainerMutation = useRemoveTrainerFromMember();
  const unfreezeMutation = useUnfreezeMembership();

  const activeMembership = member.memberships?.[0];
  const trainerName = member.trainer
    ? `${member.trainer.firstName} ${member.trainer.lastName}`
    : null;
  const formattedGender = member.gender ? member.gender.charAt(0) + member.gender.slice(1).toLowerCase() : '—';

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateMemberMutation.mutate(
      { id: member.id, data: editForm },
      { onSuccess: () => setEditModal(false) }
    );
  };

  const handleAssignTrainerSubmit = (e) => {
    e.preventDefault();
    if (!selectedTrainerId) return;
    assignTrainerMutation.mutate(
      { memberId: member.id, trainerId: selectedTrainerId },
      { onSuccess: () => setAssignTrainerModal(false) }
    );
  };

  const handleRemoveTrainer = () => {
    if (confirm('Remove assigned trainer from this member?')) {
      removeTrainerMutation.mutate(member.id);
    }
  };

  const handleUnfreeze = () => {
    if (activeMembership && confirm('Unfreeze this member\'s subscription?')) {
      unfreezeMutation.mutate(activeMembership.id);
    }
  };

  const handleDeleteMember = () => {
    if (confirm(`Permanently delete member record for ${member.firstName} ${member.lastName}?`)) {
      deleteMemberMutation.mutate(member.id, {
        onSuccess: () => onCloseSheet(),
      });
    }
  };

  return (
    <div className="space-y-6 text-sm">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <Avatar firstName={member.firstName} lastName={member.lastName} size="lg" />
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {member.firstName} {member.lastName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={activeMembership?.status === 'ACTIVE' ? 'success' : 'neutral'}>
              {activeMembership?.status || 'No Membership'}
            </Badge>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
              {formattedGender}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ID: #MM-{member.id?.slice(-4)?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Membership Info */}
      {activeMembership && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Membership Plan
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {activeMembership.plan?.name ?? '—'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Expiry Date
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {formatDate(activeMembership.endDate)}
            </p>
          </div>
        </div>
      )}

      {/* Frozen Alert */}
      {activeMembership?.status === 'FROZEN' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <span className="text-xs text-amber-800 font-medium">Membership is currently frozen</span>
          <Button
            size="sm"
            onClick={handleUnfreeze}
            loading={unfreezeMutation.isPending}
            icon={Play}
            className="!py-1 !px-2.5 text-xs"
          >
            Unfreeze
          </Button>
        </div>
      )}

      {/* Contact Details */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Contact Details
        </h4>
        <div className="space-y-1 text-slate-700">
          <p><strong>Phone:</strong> {formatPhone(member.phone)}</p>
          <p><strong>Email:</strong> {member.user?.email || '—'}</p>
          <p><strong>Username:</strong> @{member.user?.username || '—'}</p>
          <p><strong>Address:</strong> {member.address || '—'}</p>
          <p><strong>Emergency Contact:</strong> {member.emergencyContact || '—'}</p>
        </div>
      </div>

      {/* Physical Profile & Metrics */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Physical Profile & Metrics
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <p className="text-[10px] text-slate-400 font-medium">Gender</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5 capitalize">{formattedGender}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <p className="text-[10px] text-slate-400 font-medium">Height</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{member.height ? `${member.height} cm` : '—'}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <p className="text-[10px] text-slate-400 font-medium">Weight</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{member.weight ? `${member.weight} kg` : '—'}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
            <p className="text-[10px] text-slate-400 font-medium">DOB</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{member.dob ? formatDate(member.dob) : '—'}</p>
          </div>
        </div>
      </div>

      {/* Assigned Trainer Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Assigned Trainer
          </h4>
          {member.trainerId ? (
            <button
              onClick={handleRemoveTrainer}
              className="text-xs text-rose-600 hover:underline font-medium flex items-center gap-1"
            >
              <UserMinus className="w-3 h-3" />
              Remove Trainer
            </button>
          ) : (
            <button
              onClick={() => setAssignTrainerModal(true)}
              className="text-xs text-emerald-700 hover:underline font-medium flex items-center gap-1"
            >
              <UserCheck className="w-3 h-3" />
              Assign Trainer
            </button>
          )}
        </div>
        {trainerName ? (
          <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="flex items-center gap-3">
              <Avatar firstName={member.trainer.firstName} lastName={member.trainer.lastName} size="sm" />
              <div>
                <p className="text-sm font-medium text-slate-900">{trainerName}</p>
                <p className="text-xs text-slate-500">{member.trainer.specialization}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setAssignTrainerModal(true)}>
              Change
            </Button>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400 text-center">
            No trainer assigned to this member.
          </div>
        )}
      </div>

      {/* Profile Actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={() => setEditModal(true)} className="flex-1" icon={Edit3}>
          Edit Profile
        </Button>
        <Button variant="danger" onClick={handleDeleteMember} loading={deleteMemberMutation.isPending} className="flex-1" icon={Trash2}>
          Delete Member
        </Button>
      </div>

      {/* Edit Profile Modal */}
      {editModal && (
        <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Member Profile">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={editForm.height}
                  onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. 175"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={editForm.weight}
                  onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. 70"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                value={editForm.emergencyContact}
                onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="e.g. Jane Doe (+123456789)"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditModal(false)}>Cancel</Button>
              <Button type="submit" loading={updateMemberMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Trainer Modal */}
      {assignTrainerModal && (
        <Modal open={assignTrainerModal} onClose={() => setAssignTrainerModal(false)} title="Assign Trainer to Member">
          <form onSubmit={handleAssignTrainerSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Qualified Trainer *</label>
              <select
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              >
                <option value="">Select Trainer...</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.specialization})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAssignTrainerModal(false)}>Cancel</Button>
              <Button type="submit" loading={assignTrainerMutation.isPending} icon={UserCheck}>
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
