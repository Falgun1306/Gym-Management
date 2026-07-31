import { useState } from 'react';
import { useMembershipPlans, useCreateMembershipPlan, useUpdateMembershipPlan, useDeleteMembershipPlan, useAssignMembership } from '@/hooks/useAdmin';
import { Card, Badge, Button, Modal, SkeletonCard } from '@/components/ui';
import { Plus, Edit2, Trash2, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export default function MembershipPlansPage() {
  const [createModal, setCreateModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [assignModal, setAssignModal] = useState(false);

  // durationMonths is what admin enters; we convert ×30 to days when submitting
  const [planForm, setPlanForm] = useState({ name: '', price: '', durationMonths: 1, description: '' });
  const [assignForm, setAssignForm] = useState({ memberId: '', planId: '', startDate: new Date().toISOString().split('T')[0] });

  const { data: plans = [], isLoading } = useMembershipPlans();
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
      },
      {
        onSuccess: () => {
          setCreateModal(false);
          setPlanForm({ name: '', price: '', durationMonths: 1, description: '' });
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
        },
      },
      {
        onSuccess: () => setEditPlan(null),
      }
    );
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    assignMutation.mutate(assignForm, {
      onSuccess: () => {
        setAssignModal(false);
        setAssignForm({ memberId: '', planId: '', startDate: new Date().toISOString().split('T')[0] });
      },
    });
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
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 text-sm">
          No membership plans found. Click "New Membership Plan" to create one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const months = plan.durationMonths || Math.round((plan.durationInDays || 30) / 30) || 1;
            return (
              <Card key={plan.id} className="relative flex flex-col justify-between p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{months} Month{months !== 1 ? 's' : ''} Access</p>
                    </div>
                    <Badge variant="success">Active Plan</Badge>
                  </div>
                  <div className="pt-2">
                    <span className="text-3xl font-extrabold text-slate-900">{formatCurrency(plan.price)}</span>
                    <span className="text-xs text-slate-400 font-medium"> / {months} month{months !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">{plan.description || 'Full facility access & fitness perks included.'}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {plan._count?.memberships || 0} active members
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditPlan(plan);
                        setPlanForm({
                          name: plan.name,
                          price: plan.price,
                          durationMonths: months,
                          description: plan.description || '',
                        });
                      }}
                      className="!p-1.5"
                    >
                      <Edit2 className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                      className="!p-1.5 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {(createModal || editPlan) && (
        <Modal
          open={createModal || !!editPlan}
          onClose={() => {
            setCreateModal(false);
            setEditPlan(null);
          }}
          title={editPlan ? 'Edit Membership Plan' : 'Create New Membership Plan'}
        >
          <form onSubmit={editPlan ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Tier Name</label>
              <input
                type="text"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="e.g. Gold Tier, VIP Monthly"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={planForm.price}
                  onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                  placeholder="2999"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Months)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={planForm.durationMonths}
                  onChange={(e) => setPlanForm({ ...planForm, durationMonths: e.target.value })}
                  placeholder="e.g. 1, 3, 6, 12"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Perks</label>
              <textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                placeholder="List perks, locker room access, pool access..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20 h-20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setCreateModal(false); setEditPlan(null); }}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editPlan ? 'Save Changes' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Membership Modal */}
      {assignModal && (
        <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Membership to Member">
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Member UUID</label>
              <input
                type="text"
                value={assignForm.memberId}
                onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
                placeholder="Enter exact Member UUID"
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Membership Plan</label>
              <select
                value={assignForm.planId}
                onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
                required
              >
                <option value="">Select Plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.price)} ({Math.round(p.durationInDays / 30)} month{Math.round(p.durationInDays / 30) !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500/20"
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
