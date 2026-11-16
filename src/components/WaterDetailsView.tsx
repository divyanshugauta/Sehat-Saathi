import React, { useState } from 'react';
import { Bell, Check, Droplets, Edit3, GlassWater, Trash2 } from 'lucide-react';
import type { DailySummary, UserProfile, WaterLog } from '../types/health';
import { formatShortDate, getTodayIso } from '../utils/dateUtils';
import { ArtHero } from './ui/ArtHero';
import { GlassPanel } from './ui/GlassPanel';
import { MetricCard } from './ui/MetricCard';
import { TrendChart } from './ui/TrendChart';
import { WaterTracker } from './ui/WaterTracker';

interface WaterDetailsViewProps {
  profile: UserProfile;
  waterLogs: WaterLog[];
  summaries: DailySummary[];
  recentUndoEntry: WaterLog | null;
  onAddWater: (amountMl: number, note?: string) => Promise<void>;
  onUpdateWater: (id: string, amountMl: number, note?: string) => Promise<void>;
  onDeleteWater: (id: string) => Promise<void>;
  onUpdateWaterSettings: (patch: {
    waterTargetMl: number;
    waterReminderMinutes: number;
  }) => Promise<void>;
}

export function WaterDetailsView({
  profile,
  waterLogs,
  summaries,
  recentUndoEntry,
  onAddWater,
  onUpdateWater,
  onDeleteWater,
  onUpdateWaterSettings,
}: WaterDetailsViewProps) {
  const todayIso = getTodayIso();
  const todayEntries = waterLogs
    .filter((w) => w.date === todayIso)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const waterToday = todayEntries.reduce((s, w) => s + w.amountMl, 0);

  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');
  const [goalMl, setGoalMl] = useState(String(profile.waterTargetMl));
  const [reminderMin, setReminderMin] = useState(String(profile.waterReminderMinutes ?? 90));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');

  const glassesTotal = Math.max(1, Math.round(profile.waterTargetMl / 250));
  const glassesFilled = Math.floor(waterToday / 250);

  // Hydration analytics
  const pastDays = summaries.filter((d) => d.waterMl > 0);
  const avgMl = pastDays.length
    ? Math.round(pastDays.reduce((s, d) => s + d.waterMl, 0) / pastDays.length)
    : 0;
  const bestDay = pastDays.reduce<DailySummary | null>(
    (best, cur) => (!best || cur.waterMl > best.waterMl ? cur : best),
    null
  );

  let streakDays = 0;
  const desc = [...summaries].sort((a, b) => b.date.localeCompare(a.date));
  for (let i = 0; i < desc.length; i++) {
    if (i === 0 && desc[0].waterMl < profile.waterTargetMl * 0.75) continue;
    if (desc[i].waterMl >= profile.waterTargetMl * 0.75) streakDays++;
    else break;
  }

  const chartData = summaries
    .slice(chartRange === '7d' ? -7 : -30)
    .map((d) => ({ date: d.date, value: d.waterMl }));

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateWaterSettings({
      waterTargetMl: Math.max(1000, Number(goalMl || 2500)),
      waterReminderMinutes: Number(reminderMin || 0),
    });
  };

  const startEdit = (entry: WaterLog) => {
    setEditingId(entry.id);
    setEditAmount(String(entry.amountMl));
    setEditNote(entry.note || '');
  };

  const submitEdit = async (id: string) => {
    const ml = Number(editAmount);
    if (!Number.isFinite(ml) || ml <= 0) return;
    await onUpdateWater(id, ml, editNote);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <ArtHero
        theme="water"
        eyebrow="Water & Hydration"
        title="Steady hydration keeps focus and circulation effortless."
        subtitle="Track every glass, adjust daily hydration goals, and review weekly fluid trends with one-tap undo."
      />

      {/* Signature Interactive Orb */}
      <WaterTracker
        waterMlToday={waterToday}
        waterTargetMl={profile.waterTargetMl}
        recentUndoEntry={recentUndoEntry}
        onAddWater={onAddWater}
        onUndoWater={onDeleteWater}
      />

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          theme="water"
          label="Hydration Streak"
          value={streakDays}
          unit="days"
          subtitle="75%+ of daily goal"
          accent
        />
        <MetricCard
          theme="water"
          label="30-Day Daily Avg"
          value={(avgMl / 1000).toFixed(2)}
          unit="L"
          subtitle={`${avgMl} ml per day`}
        />
        <MetricCard
          theme="water"
          label="Best Day"
          value={bestDay ? (bestDay.waterMl / 1000).toFixed(2) : '—'}
          unit="L"
          subtitle={bestDay ? formatShortDate(bestDay.date) : 'No logs yet'}
        />
        <MetricCard
          theme="water"
          label="Reminder Pace"
          value={profile.waterReminderMinutes ? `${profile.waterReminderMinutes}m` : 'Off'}
          subtitle="Gentle daytime nudges"
        />
      </div>

      {/* Glass-by-Glass Tracker & Weekly/Monthly Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <GlassPanel theme="water" className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display-serif text-lg font-semibold">Glass-by-Glass Tracker</h3>
            <span className="font-mono text-xs text-sky-700 dark:text-sky-300 tabular-nums">
              {glassesFilled} / {glassesTotal} glasses (250 ml)
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2.5">
            {Array.from({ length: glassesTotal }).map((_, idx) => {
              const filled = idx < glassesFilled;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onAddWater(250, `Glass #${idx + 1}`)}
                  aria-label={`Log glass ${idx + 1} (+250 ml)`}
                  className={`flex min-h-[54px] flex-col items-center justify-center rounded-xl border transition-colors ${
                    filled
                      ? 'border-sky-400 bg-sky-100 text-sky-800 dark:border-sky-700 dark:bg-sky-900/50 dark:text-sky-200'
                      : 'border-slate-200 bg-slate-50/70 text-slate-400 hover:border-sky-300 hover:text-sky-600 dark:border-slate-800 dark:bg-slate-950'
                  }`}
                >
                  <GlassWater className="h-4 w-4" />
                  <span className="mt-1 font-mono text-[10px]">{idx + 1}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Tap any glass to quickly log a 250 ml pour.
          </p>
        </GlassPanel>

        <GlassPanel theme="water" className="lg:col-span-7 p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display-serif text-lg font-semibold">Hydration Trend</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Daily fluid intake (ml)
              </p>
            </div>
            <div className="flex rounded-xl bg-sky-100/70 p-1 dark:bg-slate-800">
              {(['7d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChartRange(r)}
                  className={`min-h-[34px] rounded-lg px-3 text-xs font-semibold ${
                    chartRange === r
                      ? 'bg-white text-sky-800 shadow-xs dark:bg-slate-700 dark:text-sky-200'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {r === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>
          <TrendChart data={chartData} unit="ml" strokeColor="#0284C7" minOverride={0} />
        </GlassPanel>
      </div>

      {/* Editable History Timeline & Goal/Reminder Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <GlassPanel theme="water" className="lg:col-span-7 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display-serif text-lg font-semibold">
              Today&apos;s Hydration Timeline
            </h3>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {todayEntries.length} entries
            </span>
          </div>

          {todayEntries.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No water logged today yet. Tap +250 ml above to start.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-sky-100 dark:divide-slate-800">
              {todayEntries.map((entry) => {
                const timeStr = new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isEditing = editingId === entry.id;
                return (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    {isEditing ? (
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          aria-label="Edit water amount ml"
                          className="w-24 rounded-lg border border-sky-300 px-2.5 py-1.5 font-mono text-xs dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Note"
                          aria-label="Edit water note"
                          className="flex-1 min-w-[120px] rounded-lg border border-sky-300 px-2.5 py-1.5 text-xs dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => submitEdit(entry.id)}
                          aria-label="Save edited water entry"
                          className="min-h-[36px] rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Droplets className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          <div>
                            <p className="font-mono text-sm font-semibold tabular-nums">
                              {entry.amountMl} ml
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {timeStr} · {entry.note || 'Water intake'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(entry)}
                            aria-label={`Edit ${entry.amountMl} ml water entry`}
                            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-500 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteWater(entry.id)}
                            aria-label={`Delete ${entry.amountMl} ml water entry`}
                            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </GlassPanel>

        <GlassPanel theme="water" className="lg:col-span-5 p-6">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-sky-700 dark:text-sky-400" />
            <h3 className="font-display-serif text-lg font-semibold">Goals &amp; Reminders</h3>
          </div>
          <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
            <div>
              <label htmlFor="water-goal-input" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Daily Hydration Goal (ml)
              </label>
              <input
                id="water-goal-input"
                type="number"
                min={1000}
                max={5000}
                step={100}
                value={goalMl}
                onChange={(e) => setGoalMl(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div>
              <label htmlFor="water-rem-select" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Hydration Reminder Cadence
              </label>
              <select
                id="water-rem-select"
                value={reminderMin}
                onChange={(e) => setReminderMin(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="60">Every 60 minutes</option>
                <option value="90">Every 90 minutes</option>
                <option value="120">Every 2 hours</option>
                <option value="0">Reminders paused</option>
              </select>
            </div>

            <button
              type="submit"
              className="min-h-[44px] w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Save Hydration Preferences
            </button>
          </form>
        </GlassPanel>
      </div>
    </div>
  );
}
