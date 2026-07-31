import { useState, useMemo, useCallback } from 'react';
import { Search, Filter, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMembers, useMember } from '@/hooks/useMembers';
import { Badge, Avatar, Card, Sheet, Button } from '@/components/ui';
import { SkeletonTable } from '@/components/ui';
import { formatPhone, formatDate, getInitials, formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';

/**
 * MembersPage — Admin members management matching members.png mockup.
 * Features: search, filter by membership status, paginated table, member detail sheet.
 */

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'FROZEN', label: 'Frozen' },
];

const STATUS_BADGE_MAP = {
  ACTIVE: 'success',
  EXPIRED: 'danger',
  CANCELLED: 'warning',
  SUSPENDED: 'danger',
  FROZEN: 'info',
};

export default function MembersPage() {
  // ── Local filter state ──
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [membershipStatus, setMembershipStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // ── Selected member for detail sheet ──
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // ── Debounce search ──
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

  // ── Query params ──
  const params = useMemo(() => {
    const p = { page, limit };
    if (debouncedSearch) p.search = debouncedSearch;
    if (membershipStatus) p.membershipStatus = membershipStatus;
    return p;
  }, [page, limit, debouncedSearch, membershipStatus]);

  // ── Fetch members ──
  const { data, isLoading, isError } = useMembers(params);
  const members = data?.members ?? [];
  const pagination = data?.pagination ?? { page: 1, total: 0, totalPages: 1 };

  // ── Fetch selected member detail ──
  const { data: memberDetail, isLoading: detailLoading } = useMember(selectedMemberId);

  // ── Pagination helpers ──
  const startItem = (pagination.page - 1) * limit + 1;
  const endItem = Math.min(pagination.page * limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Members</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage facility members, memberships, and status.
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search members, ID, or phone..."
              className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400
                pl-10 pr-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600
                hover:border-slate-400 transition-all"
            />
          </div>

          {/* Status filter */}
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

      {/* Members Table */}
      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} columns={5} />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600">Failed to load members. Please try again.</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">No members found.</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
                      Member
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => {
                    const activeMembership = member.memberships?.[0];
                    const membershipPlan = activeMembership?.plan?.name ?? 'No Plan';
                    const membershipStatus = activeMembership?.status ?? 'EXPIRED';

                    return (
                      <tr
                        key={member.id}
                        onClick={() => setSelectedMemberId(member.id)}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-slate-50',
                          selectedMemberId === member.id && 'bg-emerald-50/50'
                        )}
                      >
                        {/* Member name + ID */}
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

                        {/* Contact */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatPhone(member.phone)}
                        </td>

                        {/* Membership plan */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {membershipPlan}
                        </td>

                        {/* Assigned trainer */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {member.trainer
                            ? `${member.trainer.firstName} ${member.trainer.lastName?.[0] ?? ''}.`
                            : <span className="text-slate-400 italic">Unassigned</span>
                          }
                        </td>

                        {/* Status badge */}
                        <td className="py-3.5 px-4">
                          <Badge variant={STATUS_BADGE_MAP[membershipStatus] || 'neutral'}>
                            {membershipStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
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

      {/* ── Member Detail Sheet ── */}
      <Sheet
        open={!!selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
        title="Member Profile"
        size="md"
      >
        {detailLoading ? (
          <div className="space-y-4 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        ) : memberDetail ? (
          <MemberDetailPanel member={memberDetail} />
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">
            Select a member to view details.
          </p>
        )}
      </Sheet>
    </div>
  );
}

// ── Member Detail Panel (shown in Sheet) ─────────────────────────────────────

function MemberDetailPanel({ member }) {
  const activeMembership = member.memberships?.[0];
  const trainerName = member.trainer
    ? `${member.trainer.firstName} ${member.trainer.lastName}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <span className="text-xs text-slate-400 font-mono">
              ID: #MM-{member.id?.slice(-4)?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Membership Info */}
      {activeMembership && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Membership
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {activeMembership.plan?.name ?? '—'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Next Billing
            </p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {formatDate(activeMembership.endDate)}
            </p>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Contact Information
        </h4>
        <div className="space-y-2">
          {member.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-slate-400">📞</span>
              {formatPhone(member.phone)}
            </div>
          )}
          {member.user?.email && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="text-slate-400">✉️</span>
              {member.user.email}
            </div>
          )}
        </div>
      </div>

      {/* Assigned Trainer */}
      {trainerName && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Assigned Trainer
          </h4>
          <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
            <Avatar
              firstName={member.trainer.firstName}
              lastName={member.trainer.lastName}
              size="sm"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">{trainerName}</p>
              {member.trainer.specialization && (
                <p className="text-xs text-slate-500">{member.trainer.specialization}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {member.payments?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Recent Payments
          </h4>
          <div className="space-y-1.5">
            {member.payments.slice(0, 3).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(payment.paidAt)}</p>
                </div>
                <Badge
                  variant={
                    payment.status === 'SUCCESS'
                      ? 'success'
                      : payment.status === 'PENDING'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {payment.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <Button variant="outline" className="flex-1">
          Message
        </Button>
        <Button className="flex-1">
          Edit Profile
        </Button>
      </div>
    </div>
  );
}
