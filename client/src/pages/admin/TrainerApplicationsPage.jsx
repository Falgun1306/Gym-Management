import { useState } from 'react';
import { useTrainerApplications, useApproveTrainerApp, useRejectTrainerApp } from '@/hooks/useAdmin';
import { Card, Badge, Button, Modal, SkeletonTable, Avatar } from '@/components/ui';
import { CheckCircle, XCircle, FileText, Check } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

const SPECIALIZATIONS = [
  { value: 'GENERAL_FITNESS', label: 'General Fitness' },
  { value: 'STRENGTH', label: 'Strength Training' },
  { value: 'BODYBUILDING', label: 'Bodybuilding' },
  { value: 'WEIGHT_LOSS', label: 'Weight Loss' },
  { value: 'CROSSFIT', label: 'Crossfit' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'POWERLIFTING', label: 'Powerlifting' },
  { value: 'FUNCTIONAL', label: 'Functional Training' },
];

export default function TrainerApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedApp, setSelectedApp] = useState(null);
  const [approveModalApp, setApproveModalApp] = useState(null);
  const [rejectModalApp, setRejectModalApp] = useState(null);

  const [approveForm, setApproveForm] = useState({ salary: '45000', experience: 1, specializations: ['GENERAL_FITNESS'] });
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useTrainerApplications({ status: statusFilter });
  const approveMutation = useApproveTrainerApp();
  const rejectMutation = useRejectTrainerApp();

  const applications = Array.isArray(data) ? data : (data?.applications || []);

  const toggleApproveSpec = (val) => {
    setApproveForm((prev) => {
      const exists = prev.specializations.includes(val);
      let updated;
      if (exists) {
        updated = prev.specializations.filter((s) => s !== val);
        if (updated.length === 0) updated = ['GENERAL_FITNESS'];
      } else {
        updated = [...prev.specializations, val];
      }
      return { ...prev, specializations: updated };
    });
  };

  const handleApproveSubmit = (e) => {
    e.preventDefault();
    if (!approveModalApp) return;
    approveMutation.mutate(
      {
        id: approveModalApp.id,
        data: {
          salary: parseFloat(approveForm.salary) || 0,
          experience: parseInt(approveForm.experience) || 1,
          specializations: approveForm.specializations,
          specialization: approveForm.specializations[0] || 'GENERAL_FITNESS',
        },
      },
      {
        onSuccess: () => setApproveModalApp(null),
      }
    );
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectModalApp) return;
    rejectMutation.mutate(
      { id: rejectModalApp.id, rejectionReason: rejectReason, reason: rejectReason },
      {
        onSuccess: () => {
          setRejectModalApp(null);
          setRejectReason('');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trainer Applications</h1>
          <p className="text-sm text-slate-500 mt-1">Review and verify incoming trainer applications.</p>
        </div>
        <div className="flex items-center gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={4} columns={5} />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No {statusFilter.toLowerCase()} applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Applicant</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Specialization(s)</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Applied On</th>
                  <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => {
                  const mUser = app.user || {};
                  const member = mUser.member || {};
                  const specs = app.specializations?.length
                    ? app.specializations
                    : [app.specialization || 'GENERAL_FITNESS'];

                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            firstName={member.firstName || mUser.username?.split(' ')[0]}
                            lastName={member.lastName || mUser.username?.split(' ')[1]}
                            size="sm"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {member.firstName
                                ? `${member.firstName} ${member.lastName || ''}`.trim()
                                : mUser.username}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">{mUser.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {specs.map((s, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full"
                            >
                              {s.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">{formatDate(app.createdAt)}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            app.status === 'APPROVED' ? 'success' : app.status === 'REJECTED' ? 'danger' : 'warning'
                          }
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedApp(app)}
                            className="!p-1.5"
                            title="View Details"
                          >
                            <FileText className="w-4 h-4 text-slate-600" />
                          </Button>

                          {app.status === 'PENDING' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setApproveModalApp(app);
                                  setApproveForm({
                                    salary: '45000',
                                    experience: (app.experience != null ? app.experience : app.experienceYears) || 2,
                                    specializations: specs,
                                  });
                                }}
                                className="!py-1 !px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRejectModalApp(app)}
                                className="!py-1 !px-2.5 text-xs text-rose-600 hover:bg-rose-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {selectedApp && (
        <Modal open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Details">
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-200 text-xs">
              <p><strong>Username:</strong> {selectedApp.user?.username}</p>
              <p><strong>Email:</strong> {selectedApp.user?.email}</p>
              <p>
                <strong>Gender:</strong>{' '}
                <span className="capitalize">
                  {selectedApp.user?.member?.gender
                    ? selectedApp.user.member.gender.charAt(0) + selectedApp.user.member.gender.slice(1).toLowerCase()
                    : '—'}
                </span>
              </p>
              <p>
                <strong>Specializations:</strong>{' '}
                {(selectedApp.specializations?.length
                  ? selectedApp.specializations
                  : [selectedApp.specialization || 'GENERAL_FITNESS']
                )
                  .map((s) => s.replace(/_/g, ' '))
                  .join(', ')}
              </p>
              <p><strong>Experience:</strong> {(selectedApp.experience != null ? selectedApp.experience : selectedApp.experienceYears) ?? 0} years</p>
              <p><strong>Certifications:</strong> {selectedApp.certifications?.length ? selectedApp.certifications.join(', ') : 'None listed'}</p>
              <p><strong>Bio / Experience Notes:</strong> {selectedApp.bio || 'None provided'}</p>
              {selectedApp.coverNote && (
                <p><strong>Cover Note / Message:</strong> {selectedApp.coverNote}</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Approve Modal */}
      {approveModalApp && (
        <Modal open={!!approveModalApp} onClose={() => setApproveModalApp(null)} title="Approve Trainer Profile">
          <form onSubmit={handleApproveSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Promoting <strong>{approveModalApp.user?.username}</strong> to active Trainer. Set starting details below.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specializations <span className="text-slate-400 font-normal">(Select multiple)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                {SPECIALIZATIONS.map((s) => {
                  const isChecked = approveForm.specializations.includes(s.value);
                  return (
                    <label
                      key={s.value}
                      onClick={() => toggleApproveSpec(s.value)}
                      className={`flex items-center gap-1.5 p-1.5 rounded-md border text-xs cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{s.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Starting Salary (₹)</label>
                <input
                  type="number"
                  value={approveForm.salary}
                  onChange={(e) => setApproveForm({ ...approveForm, salary: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  value={approveForm.experience}
                  onChange={(e) => setApproveForm({ ...approveForm, experience: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setApproveModalApp(null)}>Cancel</Button>
              <Button type="submit" loading={approveMutation.isPending} icon={CheckCircle}>Confirm Approval</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalApp && (
        <Modal open={!!rejectModalApp} onClose={() => setRejectModalApp(null)} title="Reject Application">
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Rejecting application for <strong>{rejectModalApp.user?.username}</strong>. Please provide a reason.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejecting..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20 h-24"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setRejectModalApp(null)}>Cancel</Button>
              <Button type="submit" variant="danger" loading={rejectMutation.isPending} icon={XCircle}>
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
