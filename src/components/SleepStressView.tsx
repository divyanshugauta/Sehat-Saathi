import React, { useState } from 'react';
import { BedDouble, Check, CloudMoon, Moon, Sparkles, Wind } from 'lucide-react';
import type { BrainFogCheckin, DailySummary } from '../types/health';
import { getTodayIso } from '../utils/dateUtils';
import { ArtHero } from './ui/ArtHero';
import { GlassPanel } from './ui/GlassPanel';
import { MetricCard } from './ui/MetricCard';
import { TrendChart } from './ui/TrendChart';

interface SleepStressViewProps {
  checkins: BrainFogCheckin[];
  summaries: DailySummary[];
  onSaveCheckin: (entry: Omit<BrainFogCheckin, 'id' | 'userId'>) => Promise<void>;
}

const WIND_DOWN_STEPS = [
  'Dim bright screens 30 minutes before rest',
  'Sip a small cup of warm water or caffeine-free herbal tea',
  'Write down tomorrow’s top 1–2 priorities to quiet mental loops',
  'Take 5 slow nasal breaths with longer exhales',
];

export function SleepStressView({
  checkins,
  summaries,
  onSaveCheckin,
}: SleepStressViewProps) {
  const todayIso = getTodayIso();
  const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];

  const [sleepHours, setSleepHours] = useState(String(latest?.sleepHours ?? 7.4));
  const [sleepQuality, setSleepQuality] = useState(latest?.sleepQuality ?? 4);
  const [stressLevel, setStressLevel] = useState(latest?.stressLevel ?? 2);
  const [bedtimeNote, setBedtimeNote] = useState(latest?.notes ?? '');
  const [completedCues, setCompletedCues] = useState<string[]>([WIND_DOWN_STEPS[0]]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const sleep7d = summaries
    .filter((d) => d.sleepHours !== null)
    .slice(-14)
    .map((d) => ({ date: d.date, value: d.sleepHours as number }));

  const stress7d = summaries
    .filter((d) => d.stressLevel !== null)
    .slice(-14)
    .map((d) => ({ date: d.date, value: d.stressLevel as number }));

  const avgSleep = sleep7d.length
    ? (sleep7d.reduce((s, d) => s + d.value, 0) / sleep7d.length).toFixed(1)
    : '—';

  const avgStress = stress7d.length
    ? (stress7d.reduce((s, d) => s + d.value, 0) / stress7d.length).toFixed(1)
    : '—';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      await onSaveCheckin({
        date: todayIso,
        focus: latest?.focus ?? 4,
        memory: latest?.memory ?? 4,
        clarity: latest?.clarity ?? 4,
        mood: latest?.mood ?? 4,
        energy: latest?.energy ?? 4,
        sleepHours: Number(sleepHours || 7.2),
        sleepQuality,
        caffeineMg: latest?.caffeineMg ?? 100,
        stressLevel,
        screenTimeHours: latest?.screenTimeHours ?? 6,
        waterMl: latest?.waterMl ?? 1800,
        notes: bedtimeNote.trim() || undefined,
      });
      setSavedMsg('Sleep & stress check-in saved.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCue = (cue: string) => {
    setCompletedCues((prev) =>
      prev.includes(cue) ? prev.filter((c) => c !== cue) : [...prev, cue]
    );
  };

  return (
    <div className="space-y-6 text-slate-100">
      <ArtHero
        theme="sleep"
        eyebrow="Sleep & Stress Restoration"
        title="Quiet evenings restore tomorrow’s clarity and heart rhythm."
        subtitle="Notice how your rest hours, sleep depth, and daytime stress move together in a calm midnight space."
        artwork={
          <div className="relative flex h-56 w-full items-center justify-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-44 w-44 rounded-full bg-violet-400/20 blur-3xl"
            />
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-indigo-300/25 bg-gradient-to-br from-indigo-950/90 to-slate-900/90 shadow-inner">
              <Moon className="h-16 w-16 text-violet-300" />
            </div>
          </div>
        }
      />

      {/* Restorative Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          theme="sleep"
          label="Last Night"
          value={latest?.sleepHours ?? '—'}
          unit="hrs"
          subtitle={`Quality ${latest?.sleepQuality ?? '—'}/5`}
          accent
        />
        <MetricCard
          theme="sleep"
          label="14-Day Average"
          value={avgSleep}
          unit="hrs"
          subtitle="Target 7.0 – 8.5 hrs"
        />
        <MetricCard
          theme="sleep"
          label="Stress Check-In"
          value={latest?.stressLevel ?? '—'}
          unit="/ 5"
          subtitle={`14d avg ${avgStress}/5`}
        />
        <MetricCard
          theme="sleep"
          label="Evening Rhythm"
          value="10:45 PM"
          subtitle="Suggested gentle wind-down"
        />
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassPanel theme="sleep" className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-violet-300" />
            <h3 className="font-display-serif text-lg font-semibold text-indigo-50">
              Sleep Duration Trend
            </h3>
          </div>
          <TrendChart
            data={sleep7d}
            unit="hrs"
            strokeColor="#C4B5FD"
            darkSurface
            minOverride={4}
            maxOverride={10}
          />
        </GlassPanel>

        <GlassPanel theme="sleep" className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <Wind className="h-4 w-4 text-slate-300" />
            <h3 className="font-display-serif text-lg font-semibold text-indigo-50">
              Daytime Stress Trend
            </h3>
          </div>
          <TrendChart
            data={stress7d}
            unit="/5"
            strokeColor="#93C5FD"
            darkSurface
            minOverride={1}
            maxOverride={5}
          />
        </GlassPanel>
      </div>

      {/* Sleep Log + Evening Wind-Down Checklist */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <GlassPanel theme="sleep" className="lg:col-span-6 p-6">
          <div className="flex items-center gap-2">
            <CloudMoon className="h-4 w-4 text-violet-300" />
            <h3 className="font-display-serif text-lg font-semibold text-indigo-50">
              Update Sleep &amp; Stress
            </h3>
          </div>

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div>
              <label htmlFor="sl-hours" className="block text-xs text-indigo-100/75">
                Hours Slept
              </label>
              <input
                id="sl-hours"
                type="number"
                step="0.1"
                min={2}
                max={14}
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-indigo-300/20 bg-slate-950/60 px-3 font-mono text-sm text-white"
              />
            </div>

            {[
              { label: 'Sleep Quality (1–5)', val: sleepQuality, set: setSleepQuality },
              { label: 'Daytime Stress (1 = calm, 5 = high)', val: stressLevel, set: setStressLevel },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-indigo-100/80">{row.label}</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => row.set(n)}
                      className={`h-10 w-10 rounded-xl font-mono text-xs font-semibold transition-colors ${
                        row.val === n
                          ? 'bg-indigo-500 text-white'
                          : 'border border-indigo-300/20 bg-slate-950/50 text-indigo-100/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label htmlFor="sl-note" className="block text-xs text-indigo-100/75">
                Rest Reflection
              </label>
              <input
                id="sl-note"
                type="text"
                placeholder="e.g., Woke rested after cool room & chamomile tea"
                value={bedtimeNote}
                onChange={(e) => setBedtimeNote(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-indigo-300/20 bg-slate-950/60 px-3 text-sm text-white placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="min-h-[46px] w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Sleep & Stress Entry'}
            </button>
            {savedMsg && <p className="text-xs text-violet-300">{savedMsg}</p>}
          </form>
        </GlassPanel>

        <GlassPanel theme="sleep" className="lg:col-span-6 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-300" />
            <h3 className="font-display-serif text-lg font-semibold text-indigo-50">
              Restorative Wind-Down Cues
            </h3>
          </div>
          <p className="text-xs text-indigo-100/75">
            Small evening rituals reduce overnight sympathetic tone and support sharper morning recall.
          </p>
          <ul className="space-y-2.5">
            {WIND_DOWN_STEPS.map((step) => {
              const checked = completedCues.includes(step);
              return (
                <li key={step}>
                  <button
                    type="button"
                    onClick={() => toggleCue(step)}
                    className={`flex min-h-[46px] w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors ${
                      checked
                        ? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
                        : 'border-indigo-300/15 bg-slate-950/40 text-indigo-100/80 hover:bg-slate-900/60'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        checked
                          ? 'border-violet-300 bg-violet-500 text-white'
                          : 'border-indigo-300/30'
                      }`}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span>{step}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </GlassPanel>
      </div>
    </div>
  );
}
