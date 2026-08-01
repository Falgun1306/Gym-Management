import { useState } from 'react';
import {
  useMemberAttendance,
  useMemberQrCode,
  useMemberCheckIn,
  useMemberCheckOut,
} from '@/hooks/useMemberPortal';
import { Card, CardHeader, Badge, Button, Modal, SkeletonTable } from '@/components/ui';
import {
  QrCode,
  Calendar,
  Clock,
  CheckCircle2,
  LogOut as LogOutIcon,
  LogIn as LogInIcon,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function MyAttendancePage() {
  const { data: attendanceLogs = [], isLoading } = useMemberAttendance();
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const { data: qrData, isLoading: qrLoading, error: qrError, refetch: refetchQr } = useMemberQrCode(qrModalOpen);
  const checkInMutation = useMemberCheckIn();
  const checkOutMutation = useMemberCheckOut();

  const totalVisits = attendanceLogs.length;
  const activeCheckIn = attendanceLogs.find((a) => !a.checkOutTime && a.status === 'CHECKED_IN');

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'In Progress';
    const diffMs = new Date(checkOut) - new Date(checkIn);
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Attendance & Pass</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate digital QR check-in pass and track your facility visit history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeCheckIn ? (
            <Button
              variant="danger"
              onClick={() => checkOutMutation.mutate()}
              loading={checkOutMutation.isPending}
              icon={LogOutIcon}
            >
              Check Out Now
            </Button>
          ) : (
            <Button
              onClick={() => checkInMutation.mutate()}
              loading={checkInMutation.isPending}
              icon={LogInIcon}
            >
              Self Check-In
            </Button>
          )}
          <Button
            onClick={() => setQrModalOpen(true)}
            icon={QrCode}
            className="!bg-slate-900 !text-white hover:!bg-slate-800"
          >
            Digital QR Pass
          </Button>
        </div>
      </div>

      {/* ── Stat Badges ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Check-Ins</p>
              <p className="text-xl font-extrabold text-slate-900">{totalVisits} Visits</p>
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Status</p>
              <p className="text-sm font-bold text-slate-900">
                {activeCheckIn ? 'Checked In' : 'Checked Out'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Last Visit</p>
              <p className="text-sm font-bold text-slate-900">
                {attendanceLogs[0]?.checkInTime ? formatDate(attendanceLogs[0].checkInTime) : 'No visits yet'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Attendance Log Table ── */}
      <Card>
        <CardHeader title="Attendance Logs" subtitle="Detailed check-in/out records" />
        {isLoading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : attendanceLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No attendance logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Check-In Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Check-Out Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors text-xs">
                    <td className="py-3 px-4 font-semibold text-slate-800">{formatDate(log.checkInTime)}</td>
                    <td className="py-3 px-4 text-slate-700 font-mono">{formatTime(log.checkInTime)}</td>
                    <td className="py-3 px-4 text-slate-700 font-mono">{formatTime(log.checkOutTime)}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{calculateDuration(log.checkInTime, log.checkOutTime)}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          log.status === 'CHECKED_IN'
                            ? 'warning'
                            : log.status === 'AUTO_CLOSED'
                            ? 'neutral'
                            : 'success'
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── QR Code Entrance Pass Modal ── */}
      {qrModalOpen && (
        <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Digital Entrance QR Pass">
          <div className="text-center space-y-4 py-2">
            <p className="text-xs text-slate-500">
              Hold this QR code up to the front desk scanner for entrance.
            </p>

            <div className="bg-slate-900 p-6 rounded-2xl inline-block border border-slate-800">
              {qrLoading ? (
                <div className="w-48 h-48 bg-slate-800 rounded-lg animate-pulse flex items-center justify-center text-slate-500 text-xs">
                  Generating Pass...
                </div>
              ) : qrData?.qrCodeDataUrl || qrData?.qrCodeUrl || qrData?.token || qrData?.qrToken ? (
                <img
                  src={qrData.qrCodeDataUrl || qrData.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.token || qrData.qrToken)}`}
                  alt="Member QR Pass"
                  className="w-48 h-48 mx-auto rounded-lg bg-white p-2 shadow"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-800 rounded-lg flex flex-col items-center justify-center p-4 text-slate-400 text-xs text-center">
                  <p className="font-semibold text-rose-400 mb-1">QR Generation Issue</p>
                  <p className="text-[11px] text-slate-400">{qrError?.message || 'Failed to generate QR code'}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-emerald-500" /> Refreshes every 60 seconds
            </div>

            <div className="flex justify-center gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => refetchQr()} icon={RefreshCw}>
                Refresh
              </Button>
              <Button size="sm" onClick={() => setQrModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
