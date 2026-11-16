import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Award,
  Brain,
  Calendar,
  CheckCircle2,
  Circle,
  Droplets,
  HeartPulse,
  Moon,
  Pill,
  RefreshCw,
  Smile,
  Sparkles,
  Utensils,
} from 'lucide-react';
import type {
  CardioLog,
  CorrelationInsight,
  DailySummary,
  DentalAppointment,
  ModuleTab,
  UserProfile,
  WaterLog,
} from '../types/health';
import { calculateStreaksAndBadges, classifyBloodPressure } from '../utils/healthEngine';
import { daysUntilDate, formatShortDate, getTodayIso } from '../utils/dateUtils';
import { HealthScoreRing } from './charts/HealthCharts';
import { HealthCategoryCard } from './ui/HealthCategoryCard';
import { WaterTracker } from './ui/WaterTracker';

interface OverviewViewProps {
  profile: UserProfile;
  summaries: DailySummary[];
  correlations: CorrelationInsight[];
  cardioLogs: CardioLog[];
  appointments: DentalAppointment[];
  waterLogsToday: WaterLog[];
  recentUndoWater: WaterLog | null;
  onAddWater: (amountMl: number, note?: string) => Promise<void>;
  onUndoWater: (id: string) => Promise<void>;
  onNavigate: (tab: ModuleTab) => void;
  onOpenCheckIn: () => void;
  onAskAi: (prompt: string) => void;
}

function getGreeting(): string {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

export function OverviewView({
  profile,
  summaries,
  correlations,
  cardioLogs,
  appointments,
  waterLogsToday,
  recentUndoWater,
  onAddWater,
  onUndoWater,
  onNavigate,
  onOpenCheckIn,
  onAskAi,
}: OverviewViewProps) {
  const todayIso = getTodayIso();
  const today = summaries.find((d) => d.date === todayIso);
  const latest = today || summaries[summaries.length - 1];
  const streaks = calculateStreaksAndBadges(summaries);

  const waterTodayMl =
    waterLogsToday.length > 0
      ? waterLogsToday.reduce((sum, w) => sum + w.amountMl, 0)
      : today?.waterMl ?? 0;

  const [weeklyReport, setWeeklyReport] = useState<{
    summary: string;
    highlights: string[];
    nextWeekFocus: string;
  } | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch('/api/ai/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setWeeklyReport(data);
      }
    } finally {
      setReportLoading(false);
    }
  };

  const todayTasks = [
    {
      id: 'task-water',
      label: `Hydrate toward ${(profile.waterTargetMl / 1000).toFixed(1)} L goal`,
      done: waterTodayMl >= profile.waterTargetMl,
      actionLabel: 'Water Details',
      onClick: () => onNavigate('water'),
    },
    {
      id: 'task-bp',
      label: 'Log blood pressure & activity',
      done: Boolean(today?.avgSystolic),
      actionLabel: 'Open Cardio',
      onClick: () => onNavigate('cardio'),
    },
    {
      id: 'task-brush',
      label: 'Complete AM & PM brushing',
      done: Boolean(today?.brushedAm && today?.brushedPm),
      actionLabel: 'Open Dental',
      onClick: () => onNavigate('dental'),
    },
    {
      id: 'task-fog',
      label: '30-second brain fog check-in',
      done: today?.clarityScore !== null && today?.clarityScore !== undefined,
      actionLabel: 'Check In',
      onClick: onOpenCheckIn,
    },
  ];

  const completedTasks = todayTasks.filter((t) => t.done).length;
  const bpClass =
    latest?.avgSystolic && latest?.avgDiastolic
      ? classifyBloodPressure(latest.avgSystolic, latest.avgDiastolic, profile.bpThresholds)
      : null;

  const latestSleepDay = [...summaries].reverse().find((d) => d.sleepHours !== null);
  const latestClarityDay = [...summaries].reverse().find((d) => d.clarityScore !== null);

  const medLoggedToday = cardioLogs.some((c) => c.date === todayIso && c.medicationTaken);
  const nextAppt = [...appointments]
    .filter((a) => a.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextApptDays = nextAppt ? daysUntilDate(nextAppt.date) : null;
  const firstName = profile.name.split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Warm Ivory Hero Greeting + Score + Quick Reminders */}
      <section className="relative overflow-hidden rounded-3xl border border-[#E8DFD1] bg-gradient-to-br from-[#FFFDF9] via-[#FFF6EC] to-[#FCE7D8]/70 p-5 sm:p-7 dark:border-[#262B36] dark:from-[#171A21] dark:via-[#191D26] dark:to-[#231D22]">
        <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-[#6B6156] dark:text-[#A49B8E]">
              <span className="font-mono">{formatShortDate(todayIso)}</span>
              <span>·</span>
              <span>{profile.name}</span>
              <span>·</span>
              <span className="text-[#6D5CAE] dark:text-violet-300">
                {completedTasks} of {todayTasks.length} daily habits complete
              </span>
            </div>

            <h2 className="font-display-serif text-2xl sm:text-4xl font-semibold tracking-tight text-[#1E1A16] dark:text-[#F7F2EA]">
              {getGreeting()}, {firstName}. Here is your steady pulse for today.
            </h2>

            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-[#5C5349] dark:text-[#B8AFA2]">
              Your daily overview brings together hydration, blood pressure, oral care, cognitive clarity, and restorative sleep in one calm view.
            </p>

            {/* Medication & Appointment Reminder Chips */}
            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={onOpenCheckIn}
                className="hidden sm:inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-[#E05A2B] px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#E05A2B]/20 hover:bg-[#C84A1E]"
              >
                <Activity className="h-4 w-4" />
                30-Sec Daily Check-In
              </button>
              <button
                type="button"
                onClick={() => onNavigate('cardio')}
                className="inline-flex min-h-[40px] sm:min-h-[44px] items-center gap-2 rounded-2xl border border-[#E8DFD1] bg-white/85 px-3.5 py-2 text-xs font-medium text-[#1E1A16] hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <Pill className="h-3.5 w-3.5 text-[#E05A2B]" />
                {medLoggedToday ? 'Medication logged' : 'Morning medication due'}
              </button>
              {nextAppt && (
                <button
                  type="button"
                  onClick={() => onNavigate('dental')}
                  className="inline-flex min-h-[40px] sm:min-h-[44px] items-center gap-2 rounded-2xl border border-[#E8DFD1] bg-white/85 px-3.5 py-2 text-xs font-medium text-[#1E1A16] hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                >
                  <Calendar className="h-3.5 w-3.5 text-[#6D5CAE]" />
                  {nextAppt.title} in {nextApptDays}d
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 rounded-2xl border border-[#E8DFD1]/80 bg-white/75 p-4 sm:p-5 dark:border-[#262B36] dark:bg-slate-900/60">
            <HealthScoreRing score={latest?.overallHealthScore ?? 0} size={112} label="Daily Score" />
            <button
              type="button"
              onClick={() =>
                onAskAi('Give me a calm summary of my health score and what matters most today.')
              }
              className="inline-flex min-h-[38px] items-center gap-1.5 text-xs font-semibold text-[#6D5CAE] hover:underline dark:text-violet-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Interpret with Care Guide
            </button>
          </div>
        </div>
      </section>

      {/* Primary Hydration Widget + Daily Rhythm Summary */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7">
          <WaterTracker
            waterMlToday={waterTodayMl}
            waterTargetMl={profile.waterTargetMl}
            recentUndoEntry={recentUndoWater}
            onAddWater={onAddWater}
            onUndoWater={onUndoWater}
            onOpenDetails={() => onNavigate('water')}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display-serif text-lg font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
                Today&apos;s Rhythm
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('plan')}
                className="text-xs font-semibold text-[#E05A2B] hover:underline"
              >
                Open Plan
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onNavigate('sleep')}
                className="rounded-2xl border border-[#E8DFD1] bg-[#FAF6EF] p-3.5 text-left hover:border-[#6D5CAE]/40 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-[11px] text-[#6B6156] dark:text-slate-400">Sleep</p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                  {latestSleepDay?.sleepHours ?? '—'} <span className="text-xs font-normal">hrs</span>
                </p>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('cardio')}
                className="rounded-2xl border border-[#E8DFD1] bg-[#FAF6EF] p-3.5 text-left hover:border-[#E05A2B]/40 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-[11px] text-[#6B6156] dark:text-slate-400">Movement</p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                  {latest?.steps?.toLocaleString() ?? '—'} <span className="text-xs font-normal">steps</span>
                </p>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('brainfog')}
                className="rounded-2xl border border-[#E8DFD1] bg-[#FAF6EF] p-3.5 text-left hover:border-[#6D5CAE]/40 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-[11px] text-[#6B6156] dark:text-slate-400">Mood &amp; Clarity</p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                  {latestClarityDay?.clarityScore ?? '—'} <span className="text-xs font-normal">/100</span>
                </p>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('nutrition')}
                className="rounded-2xl border border-[#E8DFD1] bg-[#FAF6EF] p-3.5 text-left hover:border-[#E05A2B]/40 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-[11px] text-[#6B6156] dark:text-slate-400">Nutrition Plan</p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                  {today?.calories ?? 0}{' '}
                  <span className="text-xs font-normal">/ {profile.calorieTarget}</span>
                </p>
              </button>
            </div>
          </div>

          <ul className="mt-4 divide-y divide-[#EFE7DA] dark:divide-slate-800">
            {todayTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  {task.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#E05A2B]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-[#C5B9A7] dark:text-slate-600" />
                  )}
                  <span
                    className={`truncate text-xs font-medium ${
                      task.done
                        ? 'text-[#8C8175] line-through dark:text-slate-500'
                        : 'text-[#1E1A16] dark:text-slate-200'
                    }`}
                  >
                    {task.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={task.onClick}
                  className="text-xs font-semibold text-[#E05A2B] hover:underline whitespace-nowrap shrink-0"
                >
                  {task.actionLabel}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Distinct Category Worlds Launcher Grid */}
      <section aria-label="Health category worlds" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display-serif text-xl font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
              Health Worlds
            </h3>
            <p className="text-xs text-[#6B6156] dark:text-[#A49B8E]">
              Enter a focused category space for check-ins, trends, and guided routines
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <HealthCategoryCard
            title="Brain Fog & Focus"
            metric={`${latestClarityDay?.clarityScore ?? '—'}`}
            unit="/100"
            detail={`Sleep ${latestSleepDay?.sleepHours ?? '—'}h · Grounding & games`}
            moodClass="border-violet-200/80 bg-gradient-to-br from-[#F7F4FF] to-[#EFEAFF] text-[#1F1933] dark:border-violet-900/50 dark:from-[#141122] dark:to-[#0F0D1A] dark:text-violet-50"
            accentDotClass="bg-violet-600/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
            icon={<Brain className="h-4 w-4" />}
            onClick={() => onNavigate('brainfog')}
          />

          <HealthCategoryCard
            title="Cardiovascular"
            metric={latest?.avgSystolic ? `${latest.avgSystolic}/${latest.avgDiastolic}` : '—/—'}
            unit="mmHg"
            detail={`RHR ${latest?.avgRhr ?? '—'} bpm · ${bpClass?.category ?? 'Stable'}`}
            moodClass="border-rose-200/80 bg-gradient-to-br from-[#FFF5F7] to-[#FCE7ED] text-[#2A1019] dark:border-rose-900/50 dark:from-[#1D0D13] dark:to-[#14090D] dark:text-rose-50"
            accentDotClass="bg-rose-600/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
            icon={<HeartPulse className="h-4 w-4" />}
            onClick={() => onNavigate('cardio')}
          />

          <HealthCategoryCard
            title="Dental Care"
            metric={`${latest?.dentalScore ?? '—'}`}
            unit="/100"
            detail={`${streaks.dentalStreakDays}-day AM/PM streak · ${nextAppt ? nextAppt.title : 'Checkup log'}`}
            moodClass="border-slate-200 bg-gradient-to-br from-[#F8FAFC] to-[#EEF2F6] text-[#111827] dark:border-slate-800 dark:from-[#12141A] dark:to-[#0B0D12] dark:text-slate-100"
            accentDotClass="bg-teal-600/15 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
            icon={<Smile className="h-4 w-4" />}
            onClick={() => onNavigate('dental')}
          />

          <HealthCategoryCard
            title="Water & Hydration"
            metric={`${(waterTodayMl / 1000).toFixed(1)}`}
            unit={`/ ${(profile.waterTargetMl / 1000).toFixed(1)} L`}
            detail={`${Math.floor(waterTodayMl / 250)} glasses · Timeline & reminders`}
            moodClass="border-sky-200/80 bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] text-[#0C2D48] dark:border-sky-900/50 dark:from-[#0C1D2C] dark:to-[#081522] dark:text-sky-50"
            accentDotClass="bg-sky-600/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
            icon={<Droplets className="h-4 w-4" />}
            onClick={() => onNavigate('water')}
          />

          <HealthCategoryCard
            title="Sleep & Stress"
            metric={`${latestSleepDay?.sleepHours ?? '—'}`}
            unit="hrs"
            detail={`Stress ${latestSleepDay?.stressLevel ?? '—'}/5 · Evening wind-down`}
            moodClass="border-indigo-200/80 bg-gradient-to-br from-[#F4F6FF] to-[#E8ECFF] text-[#161B33] dark:border-indigo-900/50 dark:from-[#10182E] dark:to-[#0B1122] dark:text-indigo-50"
            accentDotClass="bg-indigo-600/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
            icon={<Moon className="h-4 w-4" />}
            onClick={() => onNavigate('sleep')}
          />

          <HealthCategoryCard
            title="Nutrition & Meals"
            metric={`${today?.calories ?? 0}`}
            unit="kcal"
            detail={`Protein ${today?.proteinG ?? 0}g · Indian & global foods`}
            moodClass="border-[#E8DFD1] bg-gradient-to-br from-[#FFFDF9] to-[#FCE7D8]/70 text-[#1E1A16] dark:border-[#262B36] dark:from-[#1A1614] dark:to-[#151210] dark:text-orange-50"
            accentDotClass="bg-[#E05A2B]/15 text-[#E05A2B] dark:bg-orange-500/20 dark:text-orange-300"
            icon={<Utensils className="h-4 w-4" />}
            onClick={() => onNavigate('nutrition')}
          />
        </div>
      </section>

      {/* Cross-Module Insights & Weekly Summary + Streaks */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display-serif text-lg font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
                Cross-Module Insights
              </h3>
              <p className="text-xs text-[#6B6156] dark:text-[#A49B8E]">
                Patterns connected across your last {summaries.length} days of logs
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onAskAi('Explain my strongest cross-module health patterns from the last 30 days.')
              }
              className="inline-flex min-h-[38px] items-center gap-1.5 text-xs font-semibold text-[#E05A2B] hover:underline whitespace-nowrap shrink-0"
            >
              Ask Care Guide <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {correlations.length === 0 ? (
            <p className="mt-5 text-sm text-[#6B6156] dark:text-slate-400">
              Log at least 5 days across modules to uncover cross-module correlations.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#EFE7DA] dark:divide-slate-800">
              {correlations.map((c) => (
                <div key={c.id} className="py-3.5 first:pt-1 last:pb-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-sm font-semibold text-[#1E1A16] dark:text-slate-100">
                      {c.title}
                    </h4>
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums ${
                        c.direction === 'warning'
                          ? 'text-[#E05A2B] dark:text-orange-400'
                          : 'text-[#6D5CAE] dark:text-violet-300'
                      }`}
                    >
                      {c.metricDelta}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#5C5349] dark:text-slate-300">{c.summary}</p>
                  <p className="mt-1 text-xs text-[#8C8175] dark:text-slate-500">
                    {c.modules.join(' + ')} · {c.confidence} confidence · {c.sampleSize} days analyzed
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#6D5CAE]" />
                <h3 className="font-display-serif text-lg font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
                  Weekly Care Summary
                </h3>
              </div>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#E8DFD1] bg-[#FAF6EF] px-3 py-1.5 text-xs font-semibold text-[#1E1A16] hover:bg-[#FCE7D8]/60 disabled:opacity-60 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${reportLoading ? 'animate-spin' : ''}`} />
                {weeklyReport ? 'Refresh' : 'Generate Recap'}
              </button>
            </div>

            {weeklyReport ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-[#453E36] dark:text-slate-300">{weeklyReport.summary}</p>
                <ul className="space-y-1.5 text-xs text-[#6B6156] dark:text-slate-400 list-disc pl-4">
                  {weeklyReport.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
                <p className="border-t border-[#EFE7DA] pt-2.5 text-xs font-medium text-[#6D5CAE] dark:border-slate-800 dark:text-violet-300">
                  Next week focus: {weeklyReport.nextWeekFocus}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#6B6156] dark:text-slate-400">
                Click &ldquo;Generate Recap&rdquo; for a calm weekly narrative across hydration, cardio, dental, brain fog, and nutrition.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#E05A2B]" />
                <h3 className="font-display-serif text-lg font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
                  Streaks &amp; Milestones
                </h3>
              </div>
              <span className="font-mono text-xs text-[#6B6156] dark:text-slate-400 tabular-nums">
                {streaks.badges.filter((b) => b.earned).length}/{streaks.badges.length} earned
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              {streaks.badges.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-2xl border p-3 ${
                    b.earned
                      ? 'border-[#E05A2B]/25 bg-[#FCE7D8]/45 dark:border-orange-500/30 dark:bg-orange-950/20'
                      : 'border-[#E8DFD1] bg-[#FAF6EF]/70 opacity-65 dark:border-slate-800 dark:bg-slate-900/50'
                  }`}
                >
                  <p className="font-semibold text-[#1E1A16] dark:text-slate-100">{b.title}</p>
                  <p className="mt-0.5 text-[#6B6156] dark:text-slate-400">{b.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
