import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@/lib/queryKeys';
import { getMyMembers, getMemberAttendance, markMemberAttendance } from '@/services/trainerService';
import { Card, CardHeader, Button, Select, Badge, Avatar } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react';

/**
 * MemberAttendancePage — Select member → view attendance + mark attendance.
 *
 * Features:
 *  - Member selector dropdown
 *  - Attendance history list
 *  - Mark attendance button (check-in for today)
 */
export default function MemberAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // ── Fetch assigned members ──
  const { data: membersRes, isLoading: membersLoading } = useQuery({
    queryKey: queryKeys.trainers.members(),
    queryFn: () => getMyMembers(),
  });

  const members = membersRes?.data || [];

  // ── Fetch attendance for selected member ──
  const { data: attendanceRes, isLoading: attendanceLoading } = useQuery({
    queryKey: queryKeys.attendance.list({ memberId: selectedMemberId }),
    queryFn: () => getMemberAttendance(selectedMemberId),
    enabled: !!selectedMemberId,
  });

  const attendanceRecords = attendanceRes?.data || [];

  // ── Mark attendance mutation ──
  const markMutation = useMutation({
    mutationFn: () => markMemberAttendance(selectedMemberId, {
      date: new Date().toISOString(),
      status: 'PRESENT',
    }),
    onSuccess: () => {
      toast.success('Attendance marked successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.list({ memberId: selectedMemberId }) });
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedMember = members.find((m) => (m.id || m.userId) === selectedMemberId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Member Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track and mark attendance for your assigned members.
        </p>
      </div>

      {/* ── Member Selector ── */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <Select
            label="Select Member"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            placeholder="Choose a member..."
            options={members.map((m) => ({
              value: m.id || m.userId,
              label: m.user?.username || 'Member',
            }))}
            containerClassName="flex-1 min-w-[250px]"
          />
          {selectedMemberId && (
            <Button
              onClick={() => markMutation.mutate()}
              loading={markMutation.isPending}
              icon={UserCheck}
            >
              Mark Present Today
            </Button>
          )}
        </div>
      </Card>

      {/* ── Selected Member Info ── */}
      {selectedMember && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Avatar
              firstName={selectedMember.user?.username?.split(' ')[0]}
              lastName={selectedMember.user?.username?.split(' ')[1]}
              size="lg"
            />
            <div>
              <p className="text-base font-bold text-slate-900">{selectedMember.user?.username}</p>
              <p className="text-sm text-slate-500">{selectedMember.user?.email}</p>
            </div>
            <Badge status={selectedMember.membershipStatus || 'ACTIVE'} className="ml-auto" />
          </div>
        </Card>
      )}

      {/* ── Attendance Records ── */}
      {selectedMemberId && (
        <Card>
          <CardHeader
            title="Attendance History"
            subtitle={`${attendanceRecords.length} records found`}
          />
          {attendanceLoading ? (
            <SkeletonCard />
          ) : attendanceRecords.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendanceRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {record.status === 'PRESENT' || record.status === 'CHECKED_IN' ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-red-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(record.date || record.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {record.checkInTime
                          ? new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                          : new Date(record.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    status={record.status === 'PRESENT' || record.status === 'CHECKED_IN' ? 'ACTIVE' : 'EXPIRED'}
                    size="sm"
                  >
                    {record.status === 'PRESENT' || record.status === 'CHECKED_IN' ? 'Present' : record.status || 'Absent'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Empty State ── */}
      {!selectedMemberId && (
        <Card className="py-16 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-400">Select a member</p>
          <p className="text-sm text-slate-400 mt-1">Choose a member from the dropdown above to view and manage their attendance.</p>
        </Card>
      )}
    </div>
  );
}
