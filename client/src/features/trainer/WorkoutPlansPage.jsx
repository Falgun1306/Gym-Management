import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@/lib/queryKeys';
import {
  getWorkoutPlans,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  assignWorkoutPlan,
  getMyMembers,
} from '@/services/trainerService';
import { DataTable, Card, CardHeader, Button, Input, Textarea, Select, Badge, Modal, ConfirmDialog } from '@/components/ui';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { MUSCLE_GROUPS } from '@/utils/constants';
import {
  Plus,
  Dumbbell,
  X,
  GripVertical,
  Save,
  Users,
  Trash2,
  Pencil,
  UserPlus,
  Clock,
  FileText,
} from 'lucide-react';

/**
 * WorkoutPlansPage — Workout plan builder and management.
 *
 * Matches the Workout Builder mockup:
 *  - Plan list DataTable
 *  - Create/Edit plan modal with exercise rows (sets, reps, weight/RPE, rest)
 *  - Assign plan to member modal
 *  - Delete plan confirmation
 */
export default function WorkoutPlansPage() {
  const queryClient = useQueryClient();

  const [showBuilder, setShowBuilder] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [deletePlan, setDeletePlan] = useState(null);
  const [assignPlan, setAssignPlan] = useState(null);

  // ── Fetch plans ──
  const { data: plansRes, isLoading } = useQuery({
    queryKey: queryKeys.workoutPlans.list(),
    queryFn: () => getWorkoutPlans(),
  });

  const plans = plansRes?.data || [];

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteWorkoutPlan(id),
    onSuccess: () => {
      toast.success('Workout plan deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.workoutPlans.all });
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
      key: 'duration',
      label: 'Duration',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {row.duration || row.durationWeeks ? `${row.duration || row.durationWeeks} weeks` : '—'}
        </div>
      ),
    },
    {
      key: 'difficulty',
      label: 'Level',
      render: (row) => row.difficulty ? (
        <Badge status={row.difficulty} size="sm" dot={false}>
          {row.difficulty}
        </Badge>
      ) : <span className="text-sm text-slate-400">—</span>,
    },
    {
      key: 'exercises',
      label: 'Exercises',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.exercises?.length || row.exerciseCount || 0}
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
          <h1 className="text-2xl font-bold text-slate-900">Workout Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Design, assign, and manage training protocols.
          </p>
        </div>
        <Button
          onClick={() => { setEditPlan(null); setShowBuilder(true); }}
          icon={Plus}
        >
          New Program
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
          searchPlaceholder="Search workout plans..."
          searchKeys={['title', 'name', 'description']}
          emptyMessage="No workout plans yet"
          emptyIcon={Dumbbell}
        />
      )}

      {/* ── Workout Builder Modal ── */}
      <WorkoutBuilderModal
        plan={editPlan}
        open={showBuilder}
        onClose={() => { setShowBuilder(false); setEditPlan(null); }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.workoutPlans.all });
          setShowBuilder(false);
          setEditPlan(null);
        }}
      />

      {/* ── Assign Plan Modal ── */}
      <AssignPlanModal
        plan={assignPlan}
        open={!!assignPlan}
        onClose={() => setAssignPlan(null)}
        assignFn={assignWorkoutPlan}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.workoutPlans.all });
          setAssignPlan(null);
        }}
      />

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deletePlan}
        onClose={() => setDeletePlan(null)}
        onConfirm={() => deleteMutation.mutate(deletePlan.id)}
        title="Delete Workout Plan"
        description={`Delete "${deletePlan?.title || deletePlan?.name}"? This cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Workout Builder Modal ──────────────────────────────────────────────────

function WorkoutBuilderModal({ plan, open, onClose, onSuccess }) {
  const isEdit = !!plan;

  const [form, setForm] = useState({
    title: '',
    description: '',
    duration: '',
    difficulty: '',
    exercises: [emptyExerciseRow()],
  });

  // Reset form when plan changes
  if (open && plan && form.title === '' && plan.title) {
    setForm({
      title: plan.title || plan.name || '',
      description: plan.description || '',
      duration: plan.duration || plan.durationWeeks || '',
      difficulty: plan.difficulty || '',
      exercises: plan.exercises?.length
        ? plan.exercises.map((ex) => ({
            exerciseId: ex.exerciseId || ex.id || '',
            name: ex.name || ex.exercise?.name || '',
            sets: ex.sets || '',
            reps: ex.reps || '',
            weight: ex.weight || '',
            rest: ex.rest || ex.restSeconds || '',
            notes: ex.notes || '',
          }))
        : [emptyExerciseRow()],
    });
  }

  // Reset when opening for new plan
  if (open && !plan && form.title !== '') {
    // Only reset if we had previous data
  }

  const createMutation = useMutation({
    mutationFn: (data) => createWorkoutPlan(data),
    onSuccess: () => {
      toast.success('Workout plan created');
      resetForm();
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateWorkoutPlan(plan.id, data),
    onSuccess: () => {
      toast.success('Workout plan updated');
      resetForm();
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      duration: '',
      difficulty: '',
      exercises: [emptyExerciseRow()],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Plan title is required');
      return;
    }
    const payload = {
      title: form.title,
      description: form.description,
      duration: form.duration ? parseInt(form.duration) : undefined,
      difficulty: form.difficulty || undefined,
      exercises: form.exercises
        .filter((ex) => ex.name || ex.exerciseId)
        .map((ex) => ({
          exerciseId: ex.exerciseId || undefined,
          name: ex.name,
          sets: ex.sets ? parseInt(ex.sets) : undefined,
          reps: ex.reps || undefined,
          weight: ex.weight || undefined,
          rest: ex.rest ? parseInt(ex.rest) : undefined,
          notes: ex.notes || undefined,
        })),
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const addExercise = () => {
    setForm({ ...form, exercises: [...form.exercises, emptyExerciseRow()] });
  };

  const removeExercise = (idx) => {
    setForm({
      ...form,
      exercises: form.exercises.filter((_, i) => i !== idx),
    });
  };

  const updateExerciseRow = (idx, field, value) => {
    const updated = [...form.exercises];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, exercises: updated });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={() => { resetForm(); onClose(); }}
      title={isEdit ? 'Edit Workout Plan' : 'New Workout Plan'}
      description="Design a structured training protocol with exercises."
      size="xl"
      footer={
        <>
          <div className="flex-1 text-xs text-slate-500">
            Est. {form.exercises.filter((e) => e.name).length} exercises
          </div>
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSubmit} loading={isPending} icon={Save}>
            {isEdit ? 'Update Plan' : 'Save Protocol'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Plan meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Plan Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Hypertrophy Phase 1 - Upper Body"
            containerClassName="md:col-span-2"
          />
          <div className="flex gap-3">
            <Input
              label="Duration (weeks)"
              type="number"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="8"
            />
          </div>
        </div>
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Program goals, notes..."
          rows={2}
        />

        {/* Exercise Rows */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Exercises</p>
          {form.exercises.map((ex, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <span className="text-xs font-semibold text-slate-500">#{idx + 1}</span>
                </div>
                {form.exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Input
                placeholder="Exercise name (e.g., Barbell Bench Press)"
                value={ex.name}
                onChange={(e) => updateExerciseRow(idx, 'name', e.target.value)}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input
                  label="Sets"
                  type="number"
                  value={ex.sets}
                  onChange={(e) => updateExerciseRow(idx, 'sets', e.target.value)}
                  placeholder="4"
                />
                <Input
                  label="Reps"
                  value={ex.reps}
                  onChange={(e) => updateExerciseRow(idx, 'reps', e.target.value)}
                  placeholder="8-10"
                />
                <Input
                  label="Weight/RPE"
                  value={ex.weight}
                  onChange={(e) => updateExerciseRow(idx, 'weight', e.target.value)}
                  placeholder="RPE 8"
                />
                <Input
                  label="Rest (sec)"
                  type="number"
                  value={ex.rest}
                  onChange={(e) => updateExerciseRow(idx, 'rest', e.target.value)}
                  placeholder="120"
                />
              </div>
              <Input
                placeholder="Add trainer notes (e.g., focus on eccentric phase)..."
                value={ex.notes || ''}
                onChange={(e) => updateExerciseRow(idx, 'notes', e.target.value)}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addExercise}
            className="w-full p-4 rounded-lg border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Exercise
          </button>
        </div>
      </form>
    </Modal>
  );
}

function emptyExerciseRow() {
  return { exerciseId: '', name: '', sets: '', reps: '', weight: '', rest: '', notes: '' };
}

// ─── Assign Plan Modal ──────────────────────────────────────────────────────

function AssignPlanModal({ plan, open, onClose, assignFn, onSuccess }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const { data: membersRes } = useQuery({
    queryKey: queryKeys.trainers.members(),
    queryFn: () => getMyMembers(),
    enabled: open,
  });

  const members = membersRes?.data || [];

  const mutation = useMutation({
    mutationFn: () => assignFn(plan.id, selectedMemberId),
    onSuccess: () => {
      toast.success('Plan assigned successfully');
      setSelectedMemberId('');
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Plan to Member"
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
