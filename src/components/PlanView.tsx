import React from 'react';
import { ArrowRight, CheckCircle2, Circle, Droplets, Utensils } from 'lucide-react';
import type {
  DailySummary,
  MealLog,
  ModuleTab,
  NutritionGoal,
  UserProfile,
} from '../types/health';
import { getTodayIso } from '../utils/dateUtils';
import { NutritionView } from './NutritionView';

interface PlanViewProps {
  profile: UserProfile;
  meals: MealLog[];
  summaries: DailySummary[];
  onAddMeal: (meal: Omit<MealLog, 'id' | 'userId'>) => Promise<void>;
  onDeleteMeal: (id: string) => Promise<void>;
  onAddWater: (amountMl: number, note?: string) => Promise<void>;
  onUpdateGoal: (goal: NutritionGoal, calorieTarget: number) => Promise<void>;
  onNavigate: (tab: ModuleTab) => void;
}

export function PlanView({
  profile,
  meals,
  summaries,
  onAddMeal,
  onDeleteMeal,
  onAddWater,
  onUpdateGoal,
  onNavigate,
}: PlanViewProps) {
  const todayIso = getTodayIso();
  const today = summaries.find((s) => s.date === todayIso);

  const planItems = [
    {
      id: 'pl-water',
      label: `Hydration (${today?.waterMl ?? 0} / ${profile.waterTargetMl} ml)`,
      done: (today?.waterMl ?? 0) >= profile.waterTargetMl,
      tab: 'water' as ModuleTab,
    },
    {
      id: 'pl-protein',
      label: `Protein (${today?.proteinG ?? 0} / ${profile.proteinTargetG} g)`,
      done: (today?.proteinG ?? 0) >= profile.proteinTargetG * 0.8,
      tab: 'nutrition' as ModuleTab,
    },
    {
      id: 'pl-dental',
      label: 'AM & PM Dental Routine',
      done: Boolean(today?.brushedAm && today?.brushedPm),
      tab: 'dental' as ModuleTab,
    },
    {
      id: 'pl-move',
      label: `Daily Activity (${today?.activityMinutes ?? 0} min)`,
      done: (today?.activityMinutes ?? 0) >= 25,
      tab: 'cardio' as ModuleTab,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#6D5CAE] dark:text-violet-300">
              Daily Plan &amp; Nourishment
            </p>
            <h2 className="font-display-serif text-2xl font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
              Pacing Today&apos;s Meals, Water &amp; Habits
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('water')}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-200"
            >
              <Droplets className="h-3.5 w-3.5" />
              Water History &amp; Orb
            </button>
            <button
              type="button"
              onClick={() => onNavigate('sleep')}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#E8DFD1] bg-[#FAF6EF] px-3.5 text-xs font-semibold text-[#1E1A16] hover:bg-[#FCE7D8]/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Utensils className="h-3.5 w-3.5 text-[#E05A2B]" />
              Evening Wind-Down
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {planItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.tab)}
              className="flex min-h-[54px] items-center justify-between gap-2 rounded-2xl border border-[#E8DFD1] bg-[#FAF6EF] px-4 py-3 text-left text-xs hover:border-[#E05A2B]/40 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#E05A2B]" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[#B8AC9B]" />
                )}
                <span className="truncate font-medium text-[#1E1A16] dark:text-slate-200">
                  {item.label}
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </button>
          ))}
        </div>
      </section>

      <NutritionView
        profile={profile}
        meals={meals}
        summaries={summaries}
        onAddMeal={onAddMeal}
        onDeleteMeal={onDeleteMeal}
        onAddWater={onAddWater}
        onUpdateGoal={onUpdateGoal}
      />
    </div>
  );
}
