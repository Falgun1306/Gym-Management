import { useState } from 'react';
import {
  useMemberComplaints,
  useCreateComplaint,
  useMemberTrainerApplications,
  useApplyForTrainer,
} from '@/hooks/useMemberPortal';
import { Card, CardHeader, Badge, Button, Modal, SkeletonTable } from '@/components/ui';
import {
  MessageSquare,
  GraduationCap,
  Plus,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Check,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

const SPECIALIZATIONS = [
  { value: 'GENERAL_FITNESS', label: 'General Fitness' },
  { value: 'STRENGTH', label: 'Strength Training' },
  { value: 'BODYBUILDING', label: 'Bodybuilding' },
  { value: 'WEIGHT_LOSS', label: 'Weight Loss' },
  { value: 'CROSSFIT', label: 'CrossFit' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'POWERLIFTING', label: 'Powerlifting' },
  { value: 'FUNCTIONAL', label: 'Functional Training' },
];

export default function MemberSupportPage() {
  const [tab, setTab] = useState('complaints'); // 'complaints' | 'trainer-application'

  const { data: complaints = [], isLoading: complaintsLoading } = useMemberComplaints();
  const { data: applications = [], isLoading: appsLoading } = useMemberTrainerApplications();

  const [complaintModal, setComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ subject: '', category: 'Equipment', description: '' });

  const [trainerModal, setTrainerModal] = useState(false);
  const [trainerForm, setTrainerForm] = useState({
    experienceYears: 2,
    specializations: ['GENERAL_FITNESS'],
    certifications: '',
    bio: '',
    coverNote: '',
  });

  const createComplaintMutation = useCreateComplaint();
  const applyTrainerMutation = useApplyForTrainer();

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    createComplaintMutation.mutate(complaintForm, {
      onSuccess: () => {
        setComplaintModal(false);
        setComplaintForm({ subject: '', category: 'Equipment', description: '' });
      },
    });
  };

  const toggleTrainerSpec = (val) => {
    setTrainerForm((prev) => {
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

  const handleTrainerSubmit = (e) => {
    e.preventDefault();
    const certArray = trainerForm.certifications
      ? trainerForm.certifications.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    applyTrainerMutation.mutate(
      {
        experienceYears: parseInt(trainerForm.experienceYears) || 0,
        experience: parseInt(trainerForm.experienceYears) || 0,
        specializations: trainerForm.specializations,
        specialization: trainerForm.specializations[0] || 'GENERAL_FITNESS',
        certifications: certArray,
        bio: trainerForm.bio.trim(),
        coverNote: trainerForm.coverNote.trim() || undefined,
      },
      {
        onSuccess: () => {
          setTrainerModal(false);
          setTrainerForm({
            experienceYears: 2,
            specializations: ['GENERAL_FITNESS'],
            certifications: '',
            bio: '',
            coverNote: '',
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support & Applications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit facility feedback, log complaints, or apply to join our certified trainer team.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setTab('complaints')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'complaints' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Facility Complaints
          </button>
          <button
            onClick={() => setTab('trainer-application')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'trainer-application' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Apply for Trainer
          </button>
        </div>
      </div>

      {tab === 'complaints' ? (
        /* Complaints Tab */
        <Card>
          <CardHeader
            title="My Submitted Complaints & Tickets"
            subtitle="Log issues regarding facility, equipment, or service"
            action={
              <Button onClick={() => setComplaintModal(true)} icon={Plus} size="sm">
                New Ticket / Complaint
              </Button>
            }
          />
          {complaintsLoading ? (
            <SkeletonTable rows={4} columns={4} />
          ) : complaints.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No complaints logged yet. Everything running smoothly!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Subject</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Date Logged</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors text-xs">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.subject}</td>
                      <td className="py-3 px-4 text-slate-600">{c.category || 'General'}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(c.createdAt)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={c.status === 'RESOLVED' ? 'success' : c.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        /* Trainer Applications Tab */
        <Card>
          <CardHeader
            title="Trainer Application Status"
            subtitle="Apply to become a certified trainer at IronPeak Elite"
            action={
              <Button onClick={() => setTrainerModal(true)} icon={GraduationCap} size="sm">
                Apply to Become Trainer
              </Button>
            }
          />
          {appsLoading ? (
            <SkeletonTable rows={3} columns={5} />
          ) : applications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              You haven't submitted a trainer application yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Specialization(s)</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Experience</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Certifications</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Applied On</th>
                    <th className="text-left py-3 px-4 font-semibold text-[11px] uppercase text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors text-xs">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {(app.specializations || [app.specialization]).join(', ').replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{(app.experience != null ? app.experience : app.experienceYears) ?? 0} Years</td>
                      <td className="py-3 px-4 text-slate-600">
                        {app.certifications?.length ? app.certifications.join(', ') : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(app.createdAt)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={app.status === 'APPROVED' ? 'success' : app.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {app.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Submit Complaint Modal ── */}
      {complaintModal && (
        <Modal open={complaintModal} onClose={() => setComplaintModal(false)} title="Log Facility Complaint">
          <form onSubmit={handleComplaintSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
              <input
                type="text"
                value={complaintForm.subject}
                onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                placeholder="Brief summary of issue"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={complaintForm.category}
                onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              >
                <option value="Equipment">Equipment / Machines</option>
                <option value="Cleanliness">Hygiene & Cleanliness</option>
                <option value="Staff">Staff / Trainer Behavior</option>
                <option value="Services">Locker & Facility Services</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
              <textarea
                value={complaintForm.description}
                onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                placeholder="Provide detailed description of the issue..."
                rows={4}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setComplaintModal(false)}>Cancel</Button>
              <Button type="submit" loading={createComplaintMutation.isPending} icon={Send}>Submit Ticket</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Apply as Trainer Modal ── */}
      {trainerModal && (
        <Modal open={trainerModal} onClose={() => setTrainerModal(false)} title="Apply to Become a Trainer">
          <form onSubmit={handleTrainerSubmit} className="space-y-4 text-sm max-h-[80vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience *</label>
              <input
                type="number"
                min={0}
                max={40}
                value={trainerForm.experienceYears}
                onChange={(e) => setTrainerForm({ ...trainerForm, experienceYears: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Specializations *</label>
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                {SPECIALIZATIONS.map((s) => {
                  const isChecked = trainerForm.specializations.includes(s.value);
                  return (
                    <label
                      key={s.value}
                      onClick={() => toggleTrainerSpec(s.value)}
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Certifications (Optional)</label>
              <input
                type="text"
                value={trainerForm.certifications}
                onChange={(e) => setTrainerForm({ ...trainerForm, certifications: e.target.value })}
                placeholder="e.g. NASM-CPT, CPR/AED, CrossFit Level 1 (comma separated)"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bio / Background Experience Notes *</label>
              <textarea
                value={trainerForm.bio}
                onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
                placeholder="Describe your certifications, past training experience, and coaching approach..."
                rows={3}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Note / Application Message (Optional)</label>
              <textarea
                value={trainerForm.coverNote}
                onChange={(e) => setTrainerForm({ ...trainerForm, coverNote: e.target.value })}
                placeholder="Why would you like to join our facility as a certified trainer?"
                rows={3}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setTrainerModal(false)}>Cancel</Button>
              <Button type="submit" loading={applyTrainerMutation.isPending} icon={GraduationCap}>Submit Application</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
