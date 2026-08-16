import { useState } from 'react';
import {
  useMemberAttendance,
  useMemberDashboard,
} from '@/hooks/useMemberPortal';
import { Card, CardHeader, Badge, Button, Modal, SkeletonTable } from '@/components/ui';
import AttendanceCalendar from '@/components/ui/AttendanceCalendar';
import MemberQrModal from '@/components/members/MemberQrModal';
import {
  QrCode,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  RefreshCw,
  ScanLine,
  CalendarDays,
  List,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';


export default function MyAttendancePage() {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const { data: attendanceLogs = [], isLoading } = useMemberAttendance();
  const { data: dashboard } = useMemberDashboard();
  
  const activeMembership = dashboard?.activeMembership || dashboard?.membership;
  const isFrozen = activeMembership?.status === 'FROZEN';

  const totalVisits = attendanceLogs.length;

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLogDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
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
            Generate your digital QR check-in pass and track your gym visit history.
          </p>
        </div>

        <Button
          onClick={() => setQrModalOpen(true)}
          icon={QrCode}
          disabled={isFrozen}
          title={isFrozen ? 'QR generation disabled while membership is frozen' : ''}
          className={`!bg-slate-900 !text-white hover:!bg-slate-800 ${isFrozen ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Digital QR Pass
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Visits</p>
              <p className="text-xl font-extrabold text-slate-900">{totalVisits}</p>
            </div>
          </div>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-5 h-5" />

            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">This Week</p>
              <p className="text-sm font-bold text-slate-900">
                {attendanceLogs.filter((a) => {
                  const d = new Date(a.checkIn);
                  const now = new Date();
                  const weekAgo = new Date(now);
                  weekAgo.setDate(now.getDate() - 7);
                  return d >= weekAgo;
                }).length} visits
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
                {attendanceLogs[0]?.checkIn ? formatLogDate(attendanceLogs[0].checkIn) : 'No visits yet'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── View Mode Toggle ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Attendance History</h2>
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
        </div>
      </div>

      {/* ── Calendar View ── */}
      {viewMode === 'calendar' && (
        <AttendanceCalendar
          attendanceLogs={attendanceLogs}
          membershipStart={activeMembership?.startDate}
          membershipEnd={activeMembership?.endDate}
        />
      )}

      {/* ── Attendance Log Table (List View) ── */}
      {viewMode === 'list' && (
      <Card>
        <CardHeader title="Attendance Logs" subtitle="Your check-in / check-out history" />
        {isLoading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : attendanceLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No attendance records yet. Check in to see your history.
          </div>
        ) : (
          <>
            {/* Mobile Card List View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100 bg-white">
              {attendanceLogs.map((log) => {
                const isQr = log.checkInMethod === 'QR_CODE';
                const isCheckedIn = log.checkIn && !log.checkOut;
                const duration = calculateDuration(log.checkIn, log.checkOut);
                return (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <p className="text-sm font-bold text-slate-900">{formatLogDate(log.checkIn)}</p>
                      {isCheckedIn ? (
                        <Badge variant="warning">Checked In</Badge>
                      ) : log.checkOut ? (
                        <Badge variant="success">Completed</Badge>
                      ) : (
                        <Badge variant="neutral">Recorded</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-slate-400">Check-In / Out</p>
                        <p className="font-mono text-slate-700">{formatTime(log.checkIn)} – {formatTime(log.checkOut)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-semibold text-slate-400">Duration & Method</p>
                        <p className="font-semibold text-slate-800">
                          {isCheckedIn ? <span className="text-amber-600">In Progress</span> : duration || '—'}
                        </p>
                        <div className="mt-0.5">
                          {isQr ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-[10px] font-semibold">
                              <ScanLine className="w-3 h-3" /> QR
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-semibold">
                              Manual
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Check-In</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Check-Out</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Duration</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Method</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceLogs.map((log) => {
                    const isQr = log.checkInMethod === 'QR_CODE';
                    const isCheckedIn = log.checkIn && !log.checkOut;
                    const duration = calculateDuration(log.checkIn, log.checkOut);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors text-xs">
                        <td className="py-3 px-4 font-semibold text-slate-800">{formatLogDate(log.checkIn)}</td>
                        <td className="py-3 px-4 text-slate-700 font-mono">{formatTime(log.checkIn)}</td>
                        <td className="py-3 px-4 text-slate-700 font-mono">{formatTime(log.checkOut)}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {isCheckedIn ? (
                            <span className="text-amber-600 font-semibold">In Progress</span>
                          ) : duration ? (
                            duration
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          {isQr ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-[10px] font-semibold">
                              <ScanLine className="w-3 h-3" /> QR Scan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-semibold">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isCheckedIn ? (
                            <Badge variant="warning">Checked In</Badge>
                          ) : log.checkOut ? (
                            <Badge variant="success">Completed</Badge>
                          ) : (
                            <Badge variant="neutral">Recorded</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
      )}

      {/* ── QR Code Entrance Pass Modal ── */}
      <MemberQrModal open={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  );
}
