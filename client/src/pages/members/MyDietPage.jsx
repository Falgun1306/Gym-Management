import { useState } from 'react';
import { useMemberDietPlans } from '@/hooks/useMemberPortal';
import { Card, CardHeader, Badge, SkeletonCard } from '@/components/ui';
import { UtensilsCrossed, Flame, User, Info, CheckCircle2, Coffee, Sun, Sunset, Moon } from 'lucide-react';

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  snack: Sunset,
  dinner: Moon,
};

export default function MyDietPage() {
  const { data: rawDietData = [], isLoading } = useMemberDietPlans();
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const rawList = Array.isArray(rawDietData) ? rawDietData : [];

  let currentPlan = null;
  let meals = [];

  if (rawList.length > 0) {
    const firstItem = rawList[selectedPlanIndex] || rawList[0];

    // Check if item is a DietAssignment object (has .dietPlan property)
    if (firstItem.dietPlan) {
      const dp = firstItem.dietPlan;
      currentPlan = {
        title: dp.title || 'Personalized Diet Plan',
        description: dp.description || 'Nutritional guidelines assigned by your trainer.',
        targetCalories: dp.calories || 2200,
        proteinGrams: dp.protein || 150,
        carbsGrams: dp.carbs || 200,
        fatsGrams: dp.fats || 65,
        durationDays: firstItem.durationDays || dp.durationDays,
        trainer: firstItem.trainer,
      };
      meals = dp.meals || dp.items || [];
    } else {
      currentPlan = firstItem;
      meals = firstItem.meals || firstItem.items || [];
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Nutrition & Diet Plan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalized meal plan and macronutrient targets assigned by your trainer.
          </p>
        </div>

        {rawList.length > 1 && (
          <select
            value={selectedPlanIndex}
            onChange={(e) => setSelectedPlanIndex(parseInt(e.target.value))}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-emerald-500/20"
          >
            {rawList.map((plan, idx) => (
              <option key={plan.id || idx} value={idx}>
                {plan.dietPlan?.title || plan.title || `Diet Plan ${idx + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {currentPlan ? (
        <>
          {/* ── Plan Summary & Macro Banner ── */}
          <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <Badge variant="success" className="mb-1">ACTIVE NUTRITION</Badge>
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

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {currentPlan.description}
            </p>

            {/* Macro Goals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-center">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Daily Target</p>
                <p className="text-lg font-extrabold text-emerald-400 mt-1">
                  {currentPlan.targetCalories} kcal
                </p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Protein</p>
                <p className="text-lg font-extrabold text-emerald-300 mt-1">
                  {currentPlan.proteinGrams}g
                </p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Carbs</p>
                <p className="text-lg font-extrabold text-blue-300 mt-1">
                  {currentPlan.carbsGrams}g
                </p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Fats</p>
                <p className="text-lg font-extrabold text-amber-300 mt-1">
                  {currentPlan.fatsGrams}g
                </p>
              </div>
            </div>
          </Card>

          {/* ── Meals Breakdown Grid ── */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Daily Meal Schedule</h3>

            {meals.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 text-xs">
                No specific meal items listed for this diet plan yet. Follow the macronutrient targets above for daily nutrition.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meals.map((meal, i) => {
                  const mealTypeLower = (meal.mealType || meal.type || 'meal').toLowerCase();
                  const IconComp = MEAL_ICONS[mealTypeLower] || UtensilsCrossed;

                  return (
                    <Card key={meal.id || i} className="hover:border-emerald-200 transition-all">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm capitalize">
                              {meal.mealType || meal.title || `Meal ${i + 1}`}
                            </h4>
                            <p className="text-xs text-slate-400">{meal.timeSlot || 'Scheduled Time'}</p>
                          </div>
                        </div>

                        {meal.calories && (
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            {meal.calories} kcal
                          </span>
                        )}
                      </div>

                      <div className="py-3 space-y-2 text-xs text-slate-700">
                        <p className="font-semibold text-slate-900">{meal.foodItems || meal.description || 'Nutritious meal'}</p>
                        {meal.quantity && (
                          <p className="text-slate-500"><strong>Quantity:</strong> {meal.quantity}</p>
                        )}
                      </div>

                      {(meal.protein || meal.carbs || meal.fat) && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-[11px]">
                          <span className="text-slate-600 font-medium">P: <strong>{meal.protein || 0}g</strong></span>
                          <span className="text-slate-600 font-medium">C: <strong>{meal.carbs || 0}g</strong></span>
                          <span className="text-slate-600 font-medium">F: <strong>{meal.fat || 0}g</strong></span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <Card className="p-12 text-center text-slate-400 text-sm">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Active Diet Plan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Your trainer has not assigned a diet plan yet. Reach out to your trainer for nutrition guidance.
          </p>
        </Card>
      )}
    </div>
  );
}
