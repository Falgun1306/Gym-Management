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
  X,
  Save,
  Trash2,
  Pencil,
  UserPlus,
  Clock,
  Flame,
} from 'lucide-react';

const MEAL_TYPES = ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack'];

/**
 * DietPlansPage — Diet plan builder and management.
 *
 * Features:
 *  - Plan list DataTable
 *  - Create/Edit plan modal with meal entries (name, calories, protein, carbs, fats)
 *  - Assign plan to member
 *  - Delete plan confirmation
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
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">{row.title || row.name}</p>
          <p className="text-xs text-slate-500 line-clamp-1">{row.description || '—'}</p>
        </div>
      ),
    },
    {
      key: 'calories',
      label: 'Daily Calories',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          {row.totalCalories || row.calories || '—'} kcal
        </div>
      ),
    },
    {
      key: 'macros',
      label: 'Macros (P/C/F)',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.protein || '—'}g / {row.carbs || '—'}g / {row.fats || '—'}g
        </span>
      ),
    },
    {
      key: 'meals',
      label: 'Meals',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.meals?.length || row.mealCount || 0}
        </span>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.duration || row.durationWeeks ? `${row.duration || row.durationWeeks} weeks` : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setAssignPlan(row); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            title="Assign to member"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditPlan(row); setShowBuilder(true); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
            title="Edit plan"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeletePlan(row); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
            title="Delete plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diet Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create macro-based nutrition plans and assign them to members.
          </p>
        </div>
        <Button
          onClick={() => { setEditPlan(null); setShowBuilder(true); }}
          icon={Plus}
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
          searchKeys={['title', 'name', 'description']}
          emptyMessage="No diet plans yet"
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
        description={`Delete "${deletePlan?.title || deletePlan?.name}"? This cannot be undone.`}
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
      title: plan.title || plan.name || '',
      description: plan.description || '',
      totalCalories: plan.totalCalories || plan.calories || '',
      protein: plan.protein || '',
      carbs: plan.carbs || '',
      fats: plan.fats || '',
      duration: plan.duration || plan.durationWeeks || '',
      meals: plan.meals?.length
        ? plan.meals.map((m) => ({
            name: m.name || m.mealType || '',
            description: m.description || '',
            calories: m.calories || '',
            protein: m.protein || '',
            carbs: m.carbs || '',
            fats: m.fats || '',
          }))
        : [emptyMealRow()],
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

    const payload = {
      title: form.title,
      description: form.description,
      totalCalories: form.totalCalories ? parseInt(form.totalCalories) : undefined,
      protein: form.protein ? parseInt(form.protein) : undefined,
      carbs: form.carbs ? parseInt(form.carbs) : undefined,
      fats: form.fats ? parseInt(form.fats) : undefined,
      duration: form.duration ? parseInt(form.duration) : undefined,
      meals: form.meals
        .filter((m) => m.name)
        .map((m) => ({
          name: m.name,
          description: m.description,
          calories: m.calories ? parseInt(m.calories) : undefined,
          protein: m.protein ? parseInt(m.protein) : undefined,
          carbs: m.carbs ? parseInt(m.carbs) : undefined,
          fats: m.fats ? parseInt(m.fats) : undefined,
        })),
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const addMeal = () => {
    setForm({ ...form, meals: [...form.meals, emptyMealRow()] });
  };

  const removeMeal = (idx) => {
    setForm({ ...form, meals: form.meals.filter((_, i) => i !== idx) });
  };

  const updateMealRow = (idx, field, value) => {
    const updated = [...form.meals];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, meals: updated });
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
      description="Build a macro-based nutrition plan with daily meals."
      size="xl"
      footer={
        <>
          <div className="flex-1 text-xs text-slate-500">
            {form.totalCalories ? `${form.totalCalories} kcal daily target` : 'Set daily calorie target'}
          </div>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={isPending} icon={Save}>
            {isEdit ? 'Update Plan' : 'Save Plan'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Plan meta */}
        <Input
          label="Plan Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Lean Bulk - 2500 kcal"
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Plan goals and dietary guidelines..."
          rows={2}
        />

        {/* Macro targets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            label="Daily Calories"
            type="number"
            value={form.totalCalories}
            onChange={(e) => setForm({ ...form, totalCalories: e.target.value })}
            placeholder="2500"
          />
          <Input
            label="Protein (g)"
            type="number"
            value={form.protein}
            onChange={(e) => setForm({ ...form, protein: e.target.value })}
            placeholder="150"
          />
          <Input
            label="Carbs (g)"
            type="number"
            value={form.carbs}
            onChange={(e) => setForm({ ...form, carbs: e.target.value })}
            placeholder="300"
          />
          <Input
            label="Fats (g)"
            type="number"
            value={form.fats}
            onChange={(e) => setForm({ ...form, fats: e.target.value })}
            placeholder="80"
          />
        </div>

        {/* Meal rows */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Meals</p>
          {form.meals.map((meal, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Meal #{idx + 1}</span>
                {form.meals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMeal(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  placeholder="Meal type..."
                  value={meal.name}
                  onChange={(e) => updateMealRow(idx, 'name', e.target.value)}
                  options={MEAL_TYPES.map((t) => ({ value: t, label: t }))}
                />
                <Input
                  placeholder="Description (e.g., Oatmeal with berries)"
                  value={meal.description}
                  onChange={(e) => updateMealRow(idx, 'description', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input
                  label="Calories"
                  type="number"
                  value={meal.calories}
                  onChange={(e) => updateMealRow(idx, 'calories', e.target.value)}
                  placeholder="500"
                />
                <Input
                  label="Protein (g)"
                  type="number"
                  value={meal.protein}
                  onChange={(e) => updateMealRow(idx, 'protein', e.target.value)}
                  placeholder="30"
                />
                <Input
                  label="Carbs (g)"
                  type="number"
                  value={meal.carbs}
                  onChange={(e) => updateMealRow(idx, 'carbs', e.target.value)}
                  placeholder="60"
                />
                <Input
                  label="Fats (g)"
                  type="number"
                  value={meal.fats}
                  onChange={(e) => updateMealRow(idx, 'fats', e.target.value)}
                  placeholder="15"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addMeal}
            className="w-full p-4 rounded-lg border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Meal
          </button>
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
    totalCalories: '',
    protein: '',
    carbs: '',
    fats: '',
    duration: '',
    meals: [emptyMealRow()],
  };
}

function emptyMealRow() {
  return { name: '', description: '', calories: '', protein: '', carbs: '', fats: '' };
}

// ─── Assign Plan Modal ──────────────────────────────────────────────────────

function AssignPlanModal({ plan, open, onClose, onSuccess }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const { data: membersRes } = useQuery({
    queryKey: queryKeys.trainers.members(),
    queryFn: () => getMyMembers(),
    enabled: open,
  });

  const members = membersRes?.data || [];

  const mutation = useMutation({
    mutationFn: () => assignDietPlan(plan.id, selectedMemberId),
    onSuccess: () => {
      toast.success('Diet plan assigned successfully');
      setSelectedMemberId('');
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Diet Plan"
      description={`Assign "${plan?.title || plan?.name}" to a member.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!selectedMemberId}
            icon={UserPlus}
          >
            Assign
          </Button>
        </>
      }
    >
      <Select
        label="Select Member"
        value={selectedMemberId}
        onChange={(e) => setSelectedMemberId(e.target.value)}
        placeholder="Choose a member..."
        options={members.map((m) => ({
          value: m.id || m.userId,
          label: m.user?.username || 'Member',
        }))}
      />
    </Modal>
  );
}
