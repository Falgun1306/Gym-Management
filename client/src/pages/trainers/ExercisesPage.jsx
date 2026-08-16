import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@/lib/queryKeys';
import { listExercises, searchExercises, createExercise, updateExercise, deleteExercise } from '@/services/trainerService';
import { Card, Button, Input, Textarea, Select, Badge, Modal, ConfirmDialog } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { MUSCLE_GROUPS, EXERCISE_DIFFICULTY } from '@/utils/constants';
import {
  Search,
  Plus,
  Grid3X3,
  List,
  Pencil,
  Trash2,
  Dumbbell,
} from 'lucide-react';

/**
 * ExercisesPage — Exercise catalog with grid/list view, filters, search, and full CRUD.
 * 1:1 integration with backend exercise.controller.js.
 */
export default function ExercisesPage() {
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ muscleGroup: '', difficulty: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editExercise, setEditExercise] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch exercises ──
  const queryParams = {
    ...(searchQuery && { q: searchQuery }),
    ...(filters.muscleGroup && { muscleGroup: filters.muscleGroup }),
    ...(filters.difficulty && { difficulty: filters.difficulty }),
  };

  const { data: exercisesRes, isLoading } = useQuery({
    queryKey: queryKeys.exercises.list(queryParams),
    queryFn: () => searchQuery
      ? searchExercises(queryParams)
      : listExercises(queryParams),
  });

  const exercises = exercisesRes?.data || [];

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteExercise(id),
    onSuccess: () => {
      toast.success('Exercise deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Exercise Library</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage and curate training movements for member programs.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={Plus} className="w-full sm:w-auto text-xs sm:text-sm justify-center">
          New Exercise
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              icon={Search}
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            placeholder="All Muscle Groups"
            value={filters.muscleGroup}
            onChange={(e) => setFilters({ ...filters, muscleGroup: e.target.value })}
            options={[
              { value: '', label: 'All Muscle Groups' },
              ...Object.entries(MUSCLE_GROUPS).map(([value, label]) => ({ value, label })),
            ]}
            containerClassName="min-w-[160px]"
          />
          <Select
            placeholder="Any Difficulty"
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            options={[
              { value: '', label: 'Any Difficulty' },
              ...Object.entries(EXERCISE_DIFFICULTY).map(([value, obj]) => ({ value, label: obj.label })),
            ]}
            containerClassName="min-w-[140px]"
          />
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* ── Exercise Grid/List ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : exercises.length === 0 ? (
        <Card className="py-16 text-center">
          <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-400">No exercises found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or add a new exercise.</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onEdit={() => setEditExercise(ex)}
              onDelete={() => setDeleteTarget(ex)}
            />
          ))}
        </div>
      ) : (
        <Card className="divide-y divide-slate-100">
          {exercises.map((ex) => (
            <ExerciseListRow
              key={ex.id}
              exercise={ex}
              onEdit={() => setEditExercise(ex)}
              onDelete={() => setDeleteTarget(ex)}
            />
          ))}
        </Card>
      )}

      {/* ── Create Exercise Modal ── */}
      <CreateExerciseModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
          setShowCreateModal(false);
        }}
      />

      {/* ── Edit Exercise Modal ── */}
      <EditExerciseModal
        exercise={editExercise}
        open={!!editExercise}
        onClose={() => setEditExercise(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
          setEditExercise(null);
        }}
      />

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Delete Exercise"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Exercise Card (Grid View) ──────────────────────────────────────────────

function ExerciseCard({ exercise, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all group">
      <div className="h-40 bg-slate-100 flex items-center justify-center relative">
        <Dumbbell className="w-10 h-10 text-slate-300" />
        <button
          onClick={onEdit}
          className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">
          {exercise.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2">
          {exercise.description || 'No description available.'}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {exercise.muscleGroup && (
            <Badge variant="active" size="sm" dot={false}>
              {MUSCLE_GROUPS[exercise.muscleGroup] || exercise.muscleGroup}
            </Badge>
          )}
          {exercise.difficulty && (
            <Badge status={exercise.difficulty} size="sm" dot={false}>
              {EXERCISE_DIFFICULTY[exercise.difficulty]?.label || exercise.difficulty}
            </Badge>
          )}
        </div>
        {exercise.equipment && (
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Dumbbell className="w-3 h-3" /> {exercise.equipment}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Exercise List Row ──────────────────────────────────────────────────────

function ExerciseListRow({ exercise, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
        <Dumbbell className="w-5 h-5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">{exercise.name}</p>
        <p className="text-xs text-slate-500 truncate">{exercise.description || '—'}</p>
      </div>
      <div className="flex items-center gap-2">
        {exercise.muscleGroup && (
          <Badge variant="active" size="sm" dot={false}>
            {MUSCLE_GROUPS[exercise.muscleGroup] || exercise.muscleGroup}
          </Badge>
        )}
        {exercise.difficulty && (
          <Badge status={exercise.difficulty} size="sm" dot={false}>
            {EXERCISE_DIFFICULTY[exercise.difficulty]?.label || exercise.difficulty}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Create Exercise Modal ──────────────────────────────────────────────────

function CreateExerciseModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    category: 'STRENGTH',
    muscleGroup: 'CHEST',
    difficulty: 'BEGINNER',
    equipment: '',
    description: '',
    instructions: '',
  });

  const mutation = useMutation({
    mutationFn: (data) => createExercise(data),
    onSuccess: () => {
      toast.success('Exercise created successfully');
      setForm({
        name: '',
        category: 'STRENGTH',
        muscleGroup: 'CHEST',
        difficulty: 'BEGINNER',
        equipment: '',
        description: '',
        instructions: '',
      });
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Exercise name is required');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Exercise"
      description="Add a new training movement to the exercise library."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={mutation.isPending} icon={Plus}>
            Create Exercise
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Exercise Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Incline Dumbbell Press"
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Muscle Group *"
            value={form.muscleGroup}
            onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
            options={Object.entries(MUSCLE_GROUPS).map(([value, label]) => ({ value, label }))}
            required
          />
          <Select
            label="Difficulty *"
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            options={Object.entries(EXERCISE_DIFFICULTY).map(([value, obj]) => ({ value, label: obj.label }))}
            required
          />
          <Input
            label="Equipment"
            value={form.equipment}
            onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            placeholder="Dumbbell, Barbell..."
          />
        </div>
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of the exercise movement..."
          rows={2}
        />
        <Textarea
          label="Instructions"
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          placeholder="Step-by-step performance cues..."
          rows={3}
        />
      </form>
    </Modal>
  );
}

// ─── Edit Exercise Modal ────────────────────────────────────────────────────

function EditExerciseModal({ exercise, open, onClose, onSuccess }) {
  const [form, setForm] = useState({});

  if (exercise && form.name === undefined) {
    setForm({
      name: exercise.name || '',
      description: exercise.description || '',
      muscleGroup: exercise.muscleGroup || 'CHEST',
      difficulty: exercise.difficulty || 'BEGINNER',
      equipment: exercise.equipment || '',
      instructions: exercise.instructions || '',
    });
  }

  const mutation = useMutation({
    mutationFn: (data) => updateExercise(exercise.id, data),
    onSuccess: () => {
      toast.success('Exercise updated');
      setForm({});
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const handleClose = () => {
    setForm({});
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Exercise"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Exercise Name"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Barbell Bench Press"
        />
        <Textarea
          label="Description"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the exercise..."
          rows={2}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Muscle Group"
            value={form.muscleGroup || ''}
            onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
            options={Object.entries(MUSCLE_GROUPS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Difficulty"
            value={form.difficulty || ''}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            options={Object.entries(EXERCISE_DIFFICULTY).map(([value, obj]) => ({ value, label: obj.label }))}
          />
          <Input
            label="Equipment"
            value={form.equipment || ''}
            onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            placeholder="Barbell, Dumbbell..."
          />
        </div>
        <Textarea
          label="Instructions"
          value={form.instructions || ''}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          placeholder="Step-by-step instructions..."
          rows={3}
        />
      </form>
    </Modal>
  );
}
