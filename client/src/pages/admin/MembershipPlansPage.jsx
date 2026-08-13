import { useState } from 'react';
import {
  useMembershipPlans,
  useCreateMembershipPlan,
  useUpdateMembershipPlan,
  useDeleteMembershipPlan,
  useAssignMembership,
} from '@/hooks/useAdmin';
import { useMembers } from '@/hooks/useMembers';
import { Card, Badge, Button, Modal, SkeletonCard } from '@/components/ui';
import { Plus, Edit2, Trash2, ShieldCheck, UserCheck } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function MembershipPlansPage() {
  const [createModal, setCreateModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [assignModal, setAssignModal] = useState(false);

  // durationMonths is what admin enters; we convert ×30 to days when submitting
  const [planForm, setPlanForm] = useState({ name: '', price: '', durationMonths: 1, description: '', providedTrainerType: 'COMMON' });
  const [assignForm, setAssignForm] = useState({
    memberId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const { data: plans = [], isLoading } = useMembershipPlans();
  const { data: membersRes } = useMembers({ limit: 100 });
  const memberList = membersRes?.members || (Array.isArray(membersRes) ? membersRes : []);

  const createMutation = useCreateMembershipPlan();
  const updateMutation = useUpdateMembershipPlan();
  const deleteMutation = useDeleteMembershipPlan();
  const assignMutation = useAssignMembership();

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const months = parseInt(planForm.durationMonths) || 1;
    createMutation.mutate(
      {
        name: planForm.name,
        price: parseFloat(planForm.price) || 0,
        durationMonths: months,
        durationInDays: months * 30,
        description: planForm.description,
        providedTrainerType: planForm.providedTrainerType,
      },
      {
        onSuccess: () => {
          setCreateModal(false);
          setPlanForm({ name: '', price: '', durationMonths: 1, description: '', providedTrainerType: 'COMMON' });
        },
      }
    );
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editPlan) return;
    const months = parseInt(planForm.durationMonths) || 1;
    updateMutation.mutate(
      {
        id: editPlan.id,
        data: {
          name: planForm.name,
          price: parseFloat(planForm.price) || 0,
          durationMonths: months,
          durationInDays: months * 30,
          description: planForm.description,
          providedTrainerType: planForm.providedTrainerType,
        },
      },
      {
        onSuccess: () => setEditPlan(null),
      }
    );
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    const targetMember = assignForm.memberId.trim();
    if (!targetMember || !assignForm.planId) return;

    assignMutation.mutate(
      {
        memberId: targetMember,
        username: targetMember,
        planId: assignForm.planId,
        startDate: assignForm.startDate,
      },
      {
        onSuccess: () => {
          setAssignModal(false);
          setAssignForm({ memberId: '', planId: '', startDate: new Date().toISOString().split('T')[0] });
        },
      }
    );
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this membership plan?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Membership Plans & Subscriptions</h1>
          <p className="text-sm text-slate-500 mt-1">Configure membership tiers, pricing, and active subscriptions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAssignModal(true)} icon={UserCheck}>
            Assign to Member
          </Button>
          <Button onClick={() => {
            setPlanForm({ name: '', price: '', durationMonths: 1, description: '' });
            setCreateModal(true);
          }} icon={Plus}>
            New Membership Plan
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : plans.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 text-sm">
          No membership plans found. Click "New Membership Plan" to create one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <div className="flex gap-2">
                    <Badge variant="info">
                      {Math.round((plan.durationInDays || plan.durationMonths * 30) / 30)} Month{Math.round((plan.durationInDays || plan.durationMonths * 30) / 30) !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant={plan.providedTrainerType === 'PERSONAL' ? 'purple' : 'slate'}>
                      {plan.providedTrainerType === 'PERSONAL' ? 'Personal Trainer' : 'Common Trainer'}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-900">{formatCurrency(plan.price)}</span>
                  <span className="text-xs text-slate-500 font-medium"> / total</span>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {plan._count?.memberships || 0} active members
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditPlan(plan);
                      setPlanForm({
                        name: plan.name,
                        price: plan.price,
                        durationMonths: plan.durationInDays ? Math.round(plan.durationInDays / 30) : plan.durationMonths,
                        description: plan.description || '',
                        providedTrainerType: plan.providedTrainerType || 'COMMON',
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      {createModal && (
        <Modal open={createModal} onClose={() => setCreateModal(false)} title="New Membership Plan">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
              <input
                type="text"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="e.g. Gold Monthly"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  placeholder="2999"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Months) *</label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={planForm.durationMonths}
                  onChange={(e) => setPlanForm({ ...planForm, durationMonths: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="Plan features and perks..."
                rows={3}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provided Trainer Type *</label>
              <select
                value={planForm.providedTrainerType}
                onChange={(e) => setPlanForm({ ...planForm, providedTrainerType: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              >
                <option value="COMMON">Common Trainer</option>
                <option value="PERSONAL">Personal Trainer</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button type="submit" loading={createMutation.isPending}>Create Plan</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Plan Modal */}
      {editPlan && (
        <Modal open={!!editPlan} onClose={() => setEditPlan(null)} title="Edit Membership Plan">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
              <input
                type="text"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Months) *</label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={planForm.durationMonths}
                  onChange={(e) => setPlanForm({ ...planForm, durationMonths: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                rows={3}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provided Trainer Type *</label>
              <select
                value={planForm.providedTrainerType}
                onChange={(e) => setPlanForm({ ...planForm, providedTrainerType: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              >
                <option value="COMMON">Common Trainer</option>
                <option value="PERSONAL">Personal Trainer</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditPlan(null)}>Cancel</Button>
              <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Membership Modal */}
      {assignModal && (
        <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Membership to Member">
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Member or Enter Username / Email *
              </label>

              {memberList.length > 0 && (
                <select
                  value={assignForm.memberId}
                  onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 mb-2 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="">Choose from existing members...</option>
                  {memberList.map((m) => {
                    const uName = m.user?.username || m.user?.email || m.firstName;
                    return (
                      <option key={m.id} value={uName}>
                        {m.firstName} {m.lastName} (@{uName})
                      </option>
                    );
                  })}
                </select>
              )}

              <input
                type="text"
                value={assignForm.memberId}
                onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
                placeholder="Or type Member Username, Email, or Member ID"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Membership Plan *</label>
              <select
                value={assignForm.planId}
                onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                required
              >
                <option value="">Select Plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.price)} ({Math.round((p.durationInDays || p.durationMonths * 30) / 30)} month{Math.round((p.durationInDays || p.durationMonths * 30) / 30) !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAssignModal(false)}>Cancel</Button>
              <Button type="submit" loading={assignMutation.isPending} icon={ShieldCheck}>
                Assign Subscription
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
