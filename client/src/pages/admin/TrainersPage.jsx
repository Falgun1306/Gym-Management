import { useState } from 'react';
import { useTrainers, usePromoteTrainer, useUpdateTrainer, useRemoveTrainer } from '@/hooks/useAdmin';
import { Card, Badge, Button, Modal, SkeletonTable, Avatar } from '@/components/ui';
import { Plus, Edit, Trash2, GraduationCap, Search, Eye, Check } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

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

const EMPTY_PROMOTE = {
  username: '',
  specializations: ['GENERAL_FITNESS'],
  salary: 40000,
  experience: 2,
  bio: '',
  certifications: '',
  joiningDate: '',
};

const inputCls = 'w-full text-sm border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

export default function TrainersPage() {
  const [search, setSearch] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [editTrainer, setEditTrainer] = useState(null);
  const [promoteModal, setPromoteModal] = useState(false);

  const [promoteForm, setPromoteForm] = useState(EMPTY_PROMOTE);
  const [editForm, setEditForm] = useState({ specializations: ['GENERAL_FITNESS'], salary: '', experience: '' });

  const { data: trainers = [], isLoading } = useTrainers({ search });
  const promoteMutation = usePromoteTrainer();
  const updateMutation = useUpdateTrainer();
  const removeMutation = useRemoveTrainer();

  const togglePromoteSpec = (val) => {
    setPromoteForm((prev) => {
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

  const toggleEditSpec = (val) => {
    setEditForm((prev) => {
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

  const handlePromoteSubmit = (e) => {
    e.preventDefault();
    const payload = {
      username: promoteForm.username.trim(),
      specializations: promoteForm.specializations,
      specialization: promoteForm.specializations[0] || 'GENERAL_FITNESS',
      salary: parseFloat(promoteForm.salary) || 0,
      experience: parseInt(promoteForm.experience) || 0,
      bio: promoteForm.bio.trim() || null,
      certifications: promoteForm.certifications
        ? promoteForm.certifications.split(',').map((c) => c.trim()).filter(Boolean)
        : [],
      joiningDate: promoteForm.joiningDate || null,
    };
    promoteMutation.mutate(payload, {
      onSuccess: () => {
        setPromoteModal(false);
        setPromoteForm(EMPTY_PROMOTE);
      },
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editTrainer) return;
    updateMutation.mutate(
      {
        id: editTrainer.id,
        data: {
          specializations: editForm.specializations,
          specialization: editForm.specializations[0] || 'GENERAL_FITNESS',
          salary: parseFloat(editForm.salary) || 0,
          experience: parseInt(editForm.experience) || 0,
        },
      },
      { onSuccess: () => setEditTrainer(null) }
    );
  };

  const handleRemove = (id) => {
    if (confirm('Remove this trainer? Their role will revert to MEMBER.')) {
      removeMutation.mutate(id);
    }
  };

  const setP = (key, val) => setPromoteForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trainer Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage facility fitness trainers and multi-specializations.</p>
        </div>
        <Button onClick={() => setPromoteModal(true)} icon={Plus}>
          Promote Member to Trainer
        </Button>
      </div>

      {/* Search */}
      <Card className="!p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trainers by name or specialization…"
            className="w-full text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4"><SkeletonTable rows={5} columns={5} /></div>
        ) : trainers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No trainers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Trainer</th>
                  <th className="py-3 px-4">Specializations</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Monthly Salary</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trainers.map((t) => {
                  const specs = t.specializations?.length
                    ? t.specializations
                    : t.specialization
                    ? [t.specialization]
                    : ['GENERAL_FITNESS'];

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar firstName={t.firstName} lastName={t.lastName} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-900">{t.firstName} {t.lastName}</p>
                            <p className="text-xs text-slate-400">{t.user?.email || t.phone || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {specs.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full"
                            >
                              {s.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{t.experience ?? 1} yrs</td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-700">{formatCurrency(t.salary ?? 0)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedTrainer(t)} className="!p-1.5" title="View Details">
                            <Eye className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditTrainer(t);
                              setEditForm({
                                specializations: specs,
                                salary: t.salary || '',
                                experience: t.experience || '',
                              });
                            }}
                            className="!p-1.5"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRemove(t.id)} className="!p-1.5 hover:bg-rose-50" title="Remove">
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
        )}
      </Card>

      {/* Detail Modal */}
      {selectedTrainer && (
        <Modal open onClose={() => setSelectedTrainer(null)} title="Trainer Profile Details">
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <Avatar firstName={selectedTrainer.firstName} lastName={selectedTrainer.lastName} size="lg" />
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedTrainer.firstName} {selectedTrainer.lastName}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(selectedTrainer.specializations?.length
                    ? selectedTrainer.specializations
                    : [selectedTrainer.specialization || 'GENERAL_FITNESS']
                  ).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                      {s.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
              <p><strong>Username:</strong> {selectedTrainer.user?.username || '—'}</p>
              <p><strong>Email:</strong> {selectedTrainer.user?.email || '—'}</p>
              <p><strong>Experience:</strong> {selectedTrainer.experience ?? 1} years</p>
              <p><strong>Monthly Salary:</strong> <span className="font-semibold text-emerald-700">{formatCurrency(selectedTrainer.salary ?? 0)}</span></p>
              <p><strong>Rating:</strong> ⭐ {selectedTrainer.averageRating ?? 5.0} / 5</p>
              <p><strong>Bio:</strong> {selectedTrainer.bio || 'Not provided.'}</p>
              {selectedTrainer.certifications?.length > 0 && (
                <p><strong>Certifications:</strong> {selectedTrainer.certifications.join(', ')}</p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedTrainer(null)} variant="outline">Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editTrainer && (
        <Modal open onClose={() => setEditTrainer(null)} title="Update Trainer Details">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specializations <span className="text-slate-400 font-normal">(Select all that apply)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                {SPECIALIZATIONS.map((s) => {
                  const isChecked = editForm.specializations.includes(s.value);
                  return (
                    <label
                      key={s.value}
                      onClick={() => toggleEditSpec(s.value)}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary (₹)</label>
                <input type="number" value={editForm.salary} onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })} className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years)</label>
                <input type="number" value={editForm.experience} onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })} className={inputCls} required />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditTrainer(null)}>Cancel</Button>
              <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Promote Modal */}
      {promoteModal && (
        <Modal open onClose={() => { setPromoteModal(false); setPromoteForm(EMPTY_PROMOTE); }} title="Promote Member to Trainer">
          <form onSubmit={handlePromoteSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={promoteForm.username}
                onChange={(e) => setP('username', e.target.value)}
                placeholder="e.g. john_doe"
                className={inputCls}
                required
              />
            </div>

            {/* Specializations Multi-Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specializations <span className="text-rose-500">*</span> <span className="text-slate-400 font-normal">(Select multiple)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                {SPECIALIZATIONS.map((s) => {
                  const isChecked = promoteForm.specializations.includes(s.value);
                  return (
                    <label
                      key={s.value}
                      onClick={() => togglePromoteSpec(s.value)}
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

            {/* Salary + Experience side-by-side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base Salary (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={promoteForm.salary}
                  onChange={(e) => setP('salary', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Experience (Years) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={promoteForm.experience}
                  onChange={(e) => setP('experience', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={promoteForm.joiningDate}
                onChange={(e) => setP('joiningDate', e.target.value)}
                className={inputCls}
              />
              <p className="text-[11px] text-slate-400 mt-0.5">Leave blank to use today's date.</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bio / About</label>
              <textarea
                value={promoteForm.bio}
                onChange={(e) => setP('bio', e.target.value)}
                placeholder="Brief professional background…"
                rows={3}
                className={inputCls}
              />
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Certifications</label>
              <input
                type="text"
                value={promoteForm.certifications}
                onChange={(e) => setP('certifications', e.target.value)}
                placeholder="ACE CPT, NASM, CrossFit L2  (comma-separated)"
                className={inputCls}
              />
              <p className="text-[11px] text-slate-400 mt-0.5">Separate multiple certifications with commas.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setPromoteModal(false); setPromoteForm(EMPTY_PROMOTE); }}>Cancel</Button>
              <Button type="submit" loading={promoteMutation.isPending} icon={GraduationCap}>Promote User</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
