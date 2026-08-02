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
  listExercises,
} from '@/services/trainerService';
import { DataTable, Card, Button, Input, Textarea, Select, Badge, Modal, ConfirmDialog } from '@/components/ui';
import { SkeletonTable } from '@/components/ui/Skeleton';
import {
  Plus,
  Dumbbell,
  X,
  GripVertical,
  Save,
  Trash2,
  Pencil,
  UserPlus,
} from 'lucide-react';

/**
 * WorkoutPlansPage — Workout plan builder and management.
 * 1:1 integration with backend workout.controller.js.
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
      key: 'exercises',
      label: 'Exercises',
      render: (row) => (
        <span className="text-sm text-slate-600 font-medium">
          {row.exercises?.length || 0} exercises
        </span>
      ),
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (row) => {
        // Deduplicate members from assignments
        const memberMap = new Map();
        (row.assignments || []).forEach((a) => {
          if (a.member && !memberMap.has(a.member.id)) {
            memberMap.set(a.member.id, a.member);
          }
        });
        const assignedMembers = Array.from(memberMap.values());

        if (assignedMembers.length === 0) {
          return (
            <span className="text-xs text-slate-400 italic">Not assigned</span>
          );
        }

        const displayLimit = 3;
        const shown = assignedMembers.slice(0, displayLimit);
        const remaining = assignedMembers.length - displayLimit;

        return (
          <div className="flex flex-wrap gap-1 items-center">
            {shown.map((m) => {
              const name = m.firstName && m.lastName
                ? `${m.firstName} ${m.lastName}`
                : m.user?.username || 'Member';
              return (
                <Badge
                  key={m.id}
                  variant="info"
                  className="text-xs"
                  title={`@${m.user?.username || ''}`}
                >
                  {name}
                </Badge>
              );
            })}
            {remaining > 0 && (
              <span className="text-xs text-slate-500 font-medium ml-0.5">
                +{remaining} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setAssignPlan(row); }}
            className="text-emerald-700 hover:bg-emerald-50"
            icon={UserPlus}
          >
            Assign
          </Button>
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
          searchKeys={['title', 'description']}
          emptyMessage="No workout plans created yet"
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
        description={`Delete "${deletePlan?.title}"? This cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Workout Builder Modal ──────────────────────────────────────────────────

function WorkoutBuilderModal({ plan, open, onClose, onSuccess }) {
  const isEdit = !!plan;

  // Fetch exercise library
  const { data: exercisesRes } = useQuery({
    queryKey: queryKeys.exercises.list(),
    queryFn: () => listExercises(),
    enabled: open,
  });

  const availableExercises = exercisesRes?.data || [];

  const [form, setForm] = useState(emptyWorkoutForm());

  if (open && plan && !form._loaded) {
    setForm({
      _loaded: true,
      title: plan.title || '',
      description: plan.description || '',
      exercises: plan.exercises?.length
        ? plan.exercises.map((ex) => ({
            exerciseId: ex.exerciseId || '',
            sets: ex.sets || '4',
            reps: ex.reps || '10',
            weight: ex.weight || '',
            restSeconds: ex.restSeconds || '60',
          }))
        : [emptyExerciseRow(availableExercises[0]?.id)],
    });
  }

  const createMutation = useMutation({
    mutationFn: (data) => createWorkoutPlan(data),
    onSuccess: () => {
      toast.success('Workout plan created');
      setForm(emptyWorkoutForm());
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateWorkoutPlan(plan.id, data),
    onSuccess: () => {
      toast.success('Workout plan updated');
      setForm(emptyWorkoutForm());
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

    if (isEdit) {
      updateMutation.mutate({
        title: form.title.trim(),
        description: form.description,
      });
      return;
    }

    const validExercises = form.exercises.filter((ex) => ex.exerciseId && ex.sets && ex.reps);
    if (validExercises.length === 0) {
      toast.error('At least one exercise with sets and reps is required');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      exercises: validExercises.map((ex, index) => ({
        exerciseId: ex.exerciseId,
        sets: parseInt(ex.sets),
        reps: parseInt(ex.reps),
        weight: ex.weight ? parseFloat(ex.weight) : null,
        restSeconds: ex.restSeconds ? parseInt(ex.restSeconds) : null,
        orderIndex: index,
      })),
    };

    createMutation.mutate(payload);
  };

  const addExercise = () => {
    const firstExId = availableExercises[0]?.id || '';
    setForm({ ...form, exercises: [...form.exercises, emptyExerciseRow(firstExId)] });
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

  const handleClose = () => {
    setForm(emptyWorkoutForm());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Workout Plan' : 'New Workout Plan'}
      description="Design a structured training protocol with exercises from library."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={isPending} icon={Save}>
            {isEdit ? 'Update Plan' : 'Save Protocol'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Plan Title *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Hypertrophy Phase 1 - Upper Body"
          required
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Program goals, guidelines, notes..."
          rows={2}
        />

        {/* Exercise Rows */}
        {!isEdit && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Select Exercises</p>
            {form.exercises.map((ex, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-slate-300" />
                    <span className="text-xs font-semibold text-slate-500">Exercise #{idx + 1}</span>
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

                <Select
                  label="Movement"
                  value={ex.exerciseId}
                  onChange={(e) => updateExerciseRow(idx, 'exerciseId', e.target.value)}
                  options={availableExercises.map((eItem) => ({
                    value: eItem.id,
                    label: `${eItem.name} (${eItem.muscleGroup || 'General'})`,
                  }))}
                  placeholder="Select exercise..."
                  required
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input
                    label="Sets *"
                    type="number"
                    value={ex.sets}
                    onChange={(e) => updateExerciseRow(idx, 'sets', e.target.value)}
                    placeholder="4"
                    required
                  />
                  <Input
                    label="Reps *"
                    type="number"
                    value={ex.reps}
                    onChange={(e) => updateExerciseRow(idx, 'reps', e.target.value)}
                    placeholder="10"
                    required
                  />
                  <Input
                    label="Target Weight (kg)"
                    type="number"
                    step="0.5"
                    value={ex.weight}
                    onChange={(e) => updateExerciseRow(idx, 'weight', e.target.value)}
                    placeholder="60"
                  />
                  <Input
                    label="Rest (seconds)"
                    type="number"
                    value={ex.restSeconds}
                    onChange={(e) => updateExerciseRow(idx, 'restSeconds', e.target.value)}
                    placeholder="60"
                  />
                </div>
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
        )}
      </form>
    </Modal>
  );
}

function emptyWorkoutForm() {
  return {
    _loaded: false,
    title: '',
    description: '',
    exercises: [emptyExerciseRow('')],
  };
}

function emptyExerciseRow(firstId = '') {
  return { exerciseId: firstId, sets: '4', reps: '10', weight: '', restSeconds: '60' };
}

// ─── Assign Plan Modal ──────────────────────────────────────────────────────

function AssignPlanModal({ plan, open, onClose, assignFn, onSuccess }) {
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
    mutationFn: () => assignFn(plan.id, targetIdentifier),
    onSuccess: () => {
      toast.success('Workout plan assigned to member successfully');
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
      title="Assign Workout Plan"
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
            Assign Protocol
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
