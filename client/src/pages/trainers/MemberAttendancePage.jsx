import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@/lib/queryKeys';
import { getMyMembers, getMemberAttendance, markMemberAttendance, scanQrCode } from '@/services/trainerService';
import { Card, CardHeader, Button, Select, Badge, Avatar } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import QrScanner from '@/components/ui/QrScanner';
import {
  UserCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  QrCode,
  ScanLine,
  LogIn,
  LogOut,
} from 'lucide-react';

/**
 * MemberAttendancePage — Select member → view attendance + mark attendance.
 *
 * Features:
 *  - Member selector dropdown
 *  - Attendance history list
 *  - Mark attendance button (manual check-in for today)
 *  - Built-in camera QR scanner for check-in/check-out via QR code
 */
export default function MemberAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);

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

  // ── Manual mark attendance mutation ──
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

  // ── QR scan mutation ──
  const qrScanMutation = useMutation({
    mutationFn: (qrToken) => scanQrCode(qrToken),
    onSuccess: (res) => {
      // Backend now returns { ...attendance, action, memberName }
      const action = res?.data?.action;
      const memberName = res?.data?.memberName || 'Member';
      const result = {
        action,
        memberName,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setLastScanResult(result);
      setShowScanner(false);

      if (action === 'CHECK_IN') {
        toast.success(`✅ ${memberName} checked in!`, { duration: 4000 });
      } else if (action === 'CHECK_OUT') {
        toast.success(`👋 ${memberName} checked out!`, { duration: 4000 });
      } else {
        toast.success(`QR scanned for ${memberName}`, { duration: 4000 });
      }

      // Refresh attendance list if member is currently selected
      if (selectedMemberId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.attendance.list({ memberId: selectedMemberId }) });
      }
    },
    onError: (err) => {
      setShowScanner(false);
      toast.error(err?.message || 'QR scan failed. Please try again.');
    },
  });

  // ── QR scan handler (called by QrScanner component) ──
  const handleQrScan = (decodedText) => {
    if (qrScanMutation.isPending) return; // prevent double scan
    qrScanMutation.mutate(decodedText);
  };

  const selectedMember = members.find((m) => (m.id || m.userId) === selectedMemberId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Member Attendance</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track and mark attendance for your assigned members.
          </p>
        </div>
        {/* QR Scan Button */}
        <Button
          onClick={() => setShowScanner(true)}
          icon={QrCode}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
        >
          Scan QR Code
        </Button>
      </div>

      {/* ── Last Scan Result Banner ── */}
      {lastScanResult && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            lastScanResult.action === 'CHECK_IN'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {lastScanResult.action === 'CHECK_IN' ? (
            <LogIn className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <LogOut className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <span>
            <strong>{lastScanResult.memberName}</strong>{' '}
            {lastScanResult.action === 'CHECK_IN' ? 'checked in' : 'checked out'} at{' '}
            {lastScanResult.time}
          </span>
          <button
            onClick={() => setLastScanResult(null)}
            className="ml-auto text-xs underline opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

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
              label: `${m.firstName || ''} ${m.lastName || ''} (@${m.user?.username || 'Member'})`.trim(),
            }))}
            containerClassName="flex-1 min-w-[250px]"
          />
          {selectedMemberId && (
            <Button
              onClick={() => markMutation.mutate()}
              loading={markMutation.isPending}
              icon={UserCheck}
              variant="outline"
            >
              Mark Present Manually
            </Button>
          )}
        </div>
      </Card>

      {/* ── Selected Member Info ── */}
      {selectedMember && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Avatar
              firstName={selectedMember.firstName}
              lastName={selectedMember.lastName}
              size="lg"
            />
            <div>
              <p className="text-base font-bold text-slate-900">
                {selectedMember.firstName} {selectedMember.lastName}
              </p>
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
              {attendanceRecords.map((record) => {
                return (
                  <div key={record.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {record.checkIn ? (
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
                          {new Date(record.date || record.checkIn || record.createdAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {record.checkIn
                            ? `In: ${new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                            : '—'}
                          {record.checkOut && (
                            <span> · Out: {new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                          {record.checkInMethod === 'QR_CODE' && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-violet-100 text-violet-700 rounded text-[9px] font-semibold ml-1">
                              <ScanLine className="w-2.5 h-2.5" /> QR
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={record.checkIn && !record.checkOut ? 'warning' : record.checkOut ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {record.checkIn && !record.checkOut ? 'Checked In' : record.checkOut ? 'Completed' : 'Absent'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── Empty State ── */}
      {!selectedMemberId && !membersLoading && (
        <Card className="py-16 text-center">
          <div className="space-y-3">
            <div className="flex justify-center gap-4">
              <Users className="w-10 h-10 text-slate-300" />
              <QrCode className="w-10 h-10 text-emerald-300" />
            </div>
            <p className="text-base font-semibold text-slate-400">Select a member or scan a QR code</p>
            <p className="text-sm text-slate-400">
              Use the <strong>Scan QR Code</strong> button to instantly check in members via camera, or choose a member manually below.
            </p>
          </div>
        </Card>
      )}

      {/* ── QR Scanner Modal ── */}
      {showScanner && (
        <QrScanner
          onScan={handleQrScan}
          onError={(err) => console.error('QR Scanner error:', err)}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
