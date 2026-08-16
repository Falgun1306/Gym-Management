import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@/lib/queryKeys';
import {
  getDietPlans,
  createDietPlan,
  updateDietPlan,
  deleteDietPlan,
  assignDietPlan,
  getMyMembers,
} from '@/services/trainerService';
import { DataTable, Card, Button, Input, Textarea, Select, Badge, Modal, ConfirmDialog } from '@/components/ui';
import { SkeletonTable } from '@/components/ui/Skeleton';
import {
  Plus,
  UtensilsCrossed,
  Save,
  Trash2,
  Pencil,
  UserPlus,
  Flame,
  Calendar,
} from 'lucide-react';

/**
 * DietPlansPage — Macro-based diet plan management and member assignment.
 * 1:1 integration with backend diet.controller.js & diet.service.js.
 */
export default function DietPlansPage() {
  const queryClient = useQueryClient();

  const [showBuilder, setShowBuilder] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [deletePlan, setDeletePlan] = useState(null);
  const [assignPlan, setAssignPlan] = useState(null);

  // ── Fetch plans ──
  const { data: plansRes, isLoading } = useQuery({
    queryKey: queryKeys.dietPlans.list(),
    queryFn: () => getDietPlans(),
  });

  const plans = plansRes?.data || [];

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDietPlan(id),
    onSuccess: () => {
      toast.success('Diet plan deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.dietPlans.all });
      setDeletePlan(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Table columns ──
  const columns = [
    {
      key: 'title',
      label: 'Plan Name',
      sortable: true,
      render: (row, val) => {
        const item = (row && typeof row === 'object' && ('title' in row || 'id' in row)) ? row : (val || {});
        return (
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.title || item.name || '—'}</p>
            <p className="text-xs text-slate-500 line-clamp-1">{item.description || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'calories',
      label: 'Target Calories',
      render: (row, val) => {
        const item = (row && typeof row === 'object' && ('calories' in row || 'id' in row)) ? row : (val || {});
        return (
          <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            {item.calories ? `${item.calories} kcal` : '—'}
          </div>
        );
      },
    },
    {
      key: 'macros',
      label: 'Macros (P / C / F)',
      render: (row, val) => {
        const item = (row && typeof row === 'object' && ('protein' in row || 'id' in row)) ? row : (val || {});
        return (
          <span className="text-sm text-slate-600">
            {item.protein ?? '—'}g / {item.carbs ?? '—'}g / {item.fats ?? '—'}g
          </span>
        );
      },
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (row, val) => {
        const item = (row && typeof row === 'object' && ('durationDays' in row || 'id' in row)) ? row : (val || {});
        return (
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {item.durationDays ? `${item.durationDays} Days` : '—'}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row, val) => {
        const item = (row && typeof row === 'object' && ('id' in row || 'title' in row)) ? row : (val || {});
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setAssignPlan(item); }}
              className="text-emerald-700 hover:bg-emerald-50"
              icon={UserPlus}
            >
              Assign
            </Button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditPlan(item); setShowBuilder(true); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
              title="Edit plan"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletePlan(item); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
              title="Delete plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Diet Plans</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create macro-based nutrition plans and assign them to members.
          </p>
        </div>
        <Button
          onClick={() => { setEditPlan(null); setShowBuilder(true); }}
          icon={Plus}
          className="w-full sm:w-auto text-xs sm:text-sm justify-center"
        >
          New Diet Plan
        </Button>
      </div>

      {/* ── Plans Table ── */}
      {isLoading ? (
        <SkeletonTable />
      ) : (
        <DataTable
          columns={columns}
          data={plans}
          searchable
          searchPlaceholder="Search diet plans..."
          searchKeys={['title', 'description']}
          emptyMessage="No diet plans created yet"
          emptyIcon={UtensilsCrossed}
        />
      )}

      {/* ── Diet Builder Modal ── */}
      <DietBuilderModal
        plan={editPlan}
        open={showBuilder}
        onClose={() => { setShowBuilder(false); setEditPlan(null); }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.dietPlans.all });
          setShowBuilder(false);
          setEditPlan(null);
        }}
      />

      {/* ── Assign Plan Modal ── */}
      <AssignPlanModal
        plan={assignPlan}
        open={!!assignPlan}
        onClose={() => setAssignPlan(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.dietPlans.all });
          setAssignPlan(null);
        }}
      />

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deletePlan}
        onClose={() => setDeletePlan(null)}
        onConfirm={() => deleteMutation.mutate(deletePlan.id)}
        title="Delete Diet Plan"
        description={`Delete "${deletePlan?.title}"? This cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Diet Builder Modal ─────────────────────────────────────────────────────

function DietBuilderModal({ plan, open, onClose, onSuccess }) {
  const isEdit = !!plan;
  const [form, setForm] = useState(emptyDietForm());

  // Populate form when editing
  if (open && plan && !form._loaded) {
    setForm({
      _loaded: true,
      title: plan.title || '',
      description: plan.description || '',
      calories: plan.calories || '',
      protein: plan.protein || '',
      carbs: plan.carbs || '',
      fats: plan.fats || '',
      durationDays: plan.durationDays || '30',
    });
  }

  const createMutation = useMutation({
    mutationFn: (data) => createDietPlan(data),
    onSuccess: () => {
      toast.success('Diet plan created');
      setForm(emptyDietForm());
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateDietPlan(plan.id, data),
    onSuccess: () => {
      toast.success('Diet plan updated');
      setForm(emptyDietForm());
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Plan title is required');
      return;
    }
    if (!form.durationDays) {
      toast.error('Duration days is required');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      calories: form.calories ? parseInt(form.calories) : null,
      protein: form.protein ? parseFloat(form.protein) : null,
      carbs: form.carbs ? parseFloat(form.carbs) : null,
      fats: form.fats ? parseFloat(form.fats) : null,
      durationDays: parseInt(form.durationDays) || 30,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    setForm(emptyDietForm());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Diet Plan' : 'New Diet Plan'}
      description="Build a macro-based nutrition plan."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={isPending} icon={Save}>
            {isEdit ? 'Update Plan' : 'Save Plan'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Plan Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Lean Bulk - 2500 kcal"
            containerClassName="md:col-span-2"
            required
          />
          <Input
            label="Duration (Days) *"
            type="number"
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            placeholder="30"
            required
          />
        </div>
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Plan goals and dietary guidelines..."
          rows={2}
        />

        {/* Macro targets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <Input
            label="Daily Calories (kcal)"
            type="number"
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })}
            placeholder="2500"
          />
          <Input
            label="Protein (g)"
            type="number"
            step="0.1"
            value={form.protein}
            onChange={(e) => setForm({ ...form, protein: e.target.value })}
            placeholder="150"
          />
          <Input
            label="Carbs (g)"
            type="number"
            step="0.1"
            value={form.carbs}
            onChange={(e) => setForm({ ...form, carbs: e.target.value })}
            placeholder="300"
          />
          <Input
            label="Fats (g)"
            type="number"
            step="0.1"
            value={form.fats}
            onChange={(e) => setForm({ ...form, fats: e.target.value })}
            placeholder="80"
          />
        </div>
      </form>
    </Modal>
  );
}

function emptyDietForm() {
  return {
    _loaded: false,
    title: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    durationDays: '30',
  };
}

// ─── Assign Plan Modal ──────────────────────────────────────────────────────

function AssignPlanModal({ plan, open, onClose, onSuccess }) {
  const [selectedMember, setSelectedMember] = useState('');
  const [customUsername, setCustomUsername] = useState('');

  const { data: membersRes } = useQuery({
    queryKey: queryKeys.trainers.members(),
    queryFn: () => getMyMembers(),
    enabled: open,
  });

  const members = membersRes?.data || [];

  const targetIdentifier = selectedMember === 'CUSTOM' ? customUsername.trim() : selectedMember;

  const mutation = useMutation({
    mutationFn: () => assignDietPlan(plan.id, targetIdentifier),
    onSuccess: () => {
      toast.success('Diet plan assigned successfully');
      setSelectedMember('');
      setCustomUsername('');
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Diet Plan"
      description={`Assign "${plan?.title}" to an assigned member using member's username.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!targetIdentifier}
            icon={UserPlus}
          >
            Assign Plan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Select Member (by Username)"
          value={selectedMember}
          onChange={(e) => {
            setSelectedMember(e.target.value);
            if (e.target.value !== 'CUSTOM') {
              setCustomUsername('');
            }
          }}
          placeholder="Choose an assigned member..."
          options={[
            ...members.map((m) => {
              const uname = m.user?.username || m.firstName || 'member';
              const nameStr = m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : '';
              return {
                value: m.user?.username || m.id,
                label: `@${uname} ${nameStr ? `(${nameStr})` : ''}`,
              };
            }),
            { value: 'CUSTOM', label: '+ Enter Username Manually' },
          ]}
        />

        {selectedMember === 'CUSTOM' && (
          <Input
            label="Member Username *"
            value={customUsername}
            onChange={(e) => setCustomUsername(e.target.value)}
            placeholder="Enter member's exact username..."
            required
          />
        )}
      </div>
    </Modal>
  );
}
