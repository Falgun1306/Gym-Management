import { useState } from 'react';
import { useMemberWorkoutPlans } from '@/hooks/useMemberPortal';
import { Card, CardHeader, Badge, SkeletonCard } from '@/components/ui';
import { Dumbbell, Target, Layers, Repeat, Clock, Info, User, CheckCircle2, FileText, Calendar } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function MyWorkoutPage() {
  const { data: rawWorkoutData = [], isLoading } = useMemberWorkoutPlans();
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const rawList = Array.isArray(rawWorkoutData) ? rawWorkoutData : [];

  let currentPlan = null;
  let exercises = [];

  if (rawList.length > 0) {
    const firstItem = rawList[0];

    // Case 1: Backend returned an array of WorkoutAssignment objects (each has .exercise property)
    if (firstItem.exercise || firstItem.sets !== undefined) {
      const trainer = firstItem.trainer;
      currentPlan = {
        title: 'Assigned Workout Routine',
        description: 'Personalized exercise assignments created specifically for you by your trainer.',
        trainer,
      };

      exercises = rawList.map((item) => ({
        id: item.id,
        name: item.exercise?.name || item.exerciseName || 'Exercise',
        muscleGroup: item.exercise?.muscleGroup || item.exercise?.category || 'STRENGTH',
        description: item.exercise?.description || item.notes || null,
        equipment: item.exercise?.equipment || 'Standard Equipment',
        sets: item.sets,
        reps: item.reps,
        weight: item.weight ? `${item.weight} kg` : null,
        restTime: item.restSeconds ? `${item.restSeconds}s` : '60s',
        assignedDate: item.assignedDate,
        notes: item.notes,
      }));
    } else {
      // Case 2: Backend returned an array of WorkoutPlan objects
      const planObj = rawList[selectedPlanIndex] || firstItem;
      currentPlan = planObj;
      const rawExs = planObj.exercises || planObj.routine || [];
      exercises = rawExs.map((ex) => ({
        id: ex.id,
        name: ex.exercise?.name || ex.exerciseName || ex.name || 'Exercise',
        muscleGroup: ex.exercise?.muscleGroup || ex.targetMuscleGroup || ex.exercise?.category || 'STRENGTH',
        description: ex.exercise?.description || ex.description || ex.notes || null,
        equipment: ex.exercise?.equipment || ex.equipment || null,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight ? `${ex.weight} kg` : null,
        restTime: ex.restSeconds ? `${ex.restSeconds}s` : ex.restTime || '60s',
        notes: ex.notes,
      }));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Workout Routine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Customized exercise program assigned to you by your certified trainer.
          </p>
        </div>

        {rawList.length > 1 && !rawList[0]?.exercise && (
          <select
            value={selectedPlanIndex}
            onChange={(e) => setSelectedPlanIndex(parseInt(e.target.value))}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-emerald-500/20"
          >
            {rawList.map((plan, idx) => (
              <option key={plan.id || idx} value={idx}>
                {plan.title || `Workout Plan ${idx + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {currentPlan ? (
        <>
          {/* ── Plan Summary Header Card ── */}
          <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="success" className="mb-1">ACTIVE ROUTINE</Badge>
                  <h2 className="text-xl font-extrabold text-white">{currentPlan.title}</h2>
                </div>
              </div>

              {currentPlan.trainer && (
                <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-300 font-medium">
                    Assigned by <strong className="text-white">{currentPlan.trainer.firstName} {currentPlan.trainer.lastName}</strong>
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-4 leading-relaxed">
              {currentPlan.description}
            </p>
          </Card>

          {/* ── Exercises Grid ── */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" /> Assigned Exercises ({exercises.length})
            </h3>

            {exercises.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 text-xs">
                No exercises found for this plan.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {exercises.map((ex, i) => (
                  <Card key={ex.id || i} className="hover:border-emerald-200 hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-xs border border-emerald-100">
                            #{i + 1}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-base">{ex.name}</h4>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                              {ex.muscleGroup.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {ex.equipment && (
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full shrink-0">
                            {ex.equipment}
                          </span>
                        )}
                      </div>

                      {/* Full Exercise Description / Instructions */}
                      {ex.description && (
                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" /> Exercise Description & Guide
                          </div>
                          <p>{ex.description}</p>
                        </div>
                      )}

                      {/* Training Targets */}
                      <div className="grid grid-cols-4 gap-2 py-2 text-center text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Sets</p>
                          <p className="font-extrabold text-slate-900 mt-0.5">{ex.sets || 3}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Reps</p>
                          <p className="font-extrabold text-slate-900 mt-0.5">{ex.reps || 12}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Weight</p>
                          <p className="font-bold text-slate-800 mt-0.5">{ex.weight || 'Free'}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Rest</p>
                          <p className="font-bold text-slate-800 mt-0.5">{ex.restTime}</p>
                        </div>
                      </div>
                    </div>

                    {ex.notes && (
                      <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span><strong>Trainer Note:</strong> {ex.notes}</span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-sm">
          <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Active Workout Plan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Your trainer has not assigned a workout plan yet. Reach out to your trainer to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
