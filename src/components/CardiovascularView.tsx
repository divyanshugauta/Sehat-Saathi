import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, FileText, HeartPulse, Pill, Plus, ShieldQuestion, X } from 'lucide-react';
import type { CardioLog, DailySummary, UserProfile } from '../types/health';
import { classifyBloodPressure } from '../utils/healthEngine';
import { formatShortDate, getTodayIso } from '../utils/dateUtils';
import { BpZoneTrendChart } from './charts/HealthCharts';
import { ArtHero } from './ui/ArtHero';
import { GlassPanel } from './ui/GlassPanel';
import { MetricCard } from './ui/MetricCard';
import { TrendChart } from './ui/TrendChart';

interface CardiovascularViewProps {
  profile: UserProfile;
  cardioLogs: CardioLog[];
  summaries: DailySummary[];
  onAddCardio: (entry: Omit<CardioLog, 'id' | 'userId'>) => Promise<void>;
  onOpenDoctorReport: () => void;
}

export function CardiovascularView({
  profile,
  cardioLogs,
  summaries,
  onAddCardio,
  onOpenDoctorReport,
}: CardiovascularViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);
  const todayIso = getTodayIso();
  const sorted = [...cardioLogs].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const latest = sorted[sorted.length - 1];
  const loggedToday = cardioLogs.some((l) => l.date === todayIso);

  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('78');
  const [heartRate, setHeartRate] = useState('65');
  const [hrvMs, setHrvMs] = useState('54');
  const [steps, setSteps] = useState('7600');
  const [activityMinutes, setActivityMinutes] = useState('35');
  const [weightKg, setWeightKg] = useState(String(profile.weightKg));
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'evening'>('morning');
  const [medicationTaken, setMedicationTaken] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const sys = Number(systolic);
    const dia = Number(diastolic);
    const hr = Number(heartRate);
    if (!sys || !dia || !hr || sys < 60 || sys > 250 || dia < 40 || dia > 160) {
      setErrorMsg('Please enter valid blood pressure (60–250 / 40–160) and heart rate values.');
      return;
    }
    setSaving(true);
    try {
      await onAddCardio({
        date: todayIso,
        timeOfDay,
        timestamp: new Date().toISOString(),
        systolic: sys,
        diastolic: dia,
        heartRate: hr,
        hrvMs: hrvMs ? Number(hrvMs) : undefined,
        steps: Number(steps || 0),
        activityMinutes: Number(activityMinutes || 0),
        weightKg: Number(weightKg || profile.weightKg),
        medicationTaken,
        notes: notes.trim() || undefined,
      });
      setNotes('');
    } catch {
      setErrorMsg('Failed to save reading. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const latestStatus = latest
    ? classifyBloodPressure(latest.systolic, latest.diastolic, profile.bpThresholds)
    : null;

  const isTrulyUrgent =
    latest &&
    (latest.systolic >= profile.bpThresholds.systolicHigh ||
      latest.diastolic >= profile.bpThresholds.diastolicHigh);

  const bpTrend = summaries
    .filter((d) => d.avgSystolic !== null && d.avgDiastolic !== null)
    .slice(-14)
    .map((d) => ({
      date: d.date,
      systolic: d.avgSystolic as number,
      diastolic: d.avgDiastolic as number,
    }));

  const weeklyRhr = summaries
    .filter((d) => d.avgRhr !== null)
    .slice(-7)
    .map((d) => ({ date: d.date, value: d.avgRhr as number }));

  const medDays14 = summaries.slice(-14);

  return (
    <div className="space-y-6 text-[#FDF2F5]">
      {/* Dramatic Charcoal-Burgundy Rose-Glass Heart Hero */}
      <ArtHero
        theme="cardio"
        eyebrow="Cardiovascular Wellness"
        title="Steady rhythm, quiet clarity."
        subtitle="Track resting heart rate, blood pressure, and medication consistency in one calm clinical view—without turning your daily numbers into alarm."
        artwork={
          <div className="relative flex h-64 w-full items-center justify-center sm:h-72">
            {/* Soft Pink Halo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-52 w-52 rounded-full bg-pink-400/20 blur-3xl"
            />
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative h-60 w-60 sm:h-68 sm:w-68"
            >
              <img
                src="/src/assets/images/cardio_rose_heart_hero_1794855873357.jpg"
                alt="Translucent rose-glass anatomical heart sculpture with soft pink reflections"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full rounded-full object-cover"
                style={{
                  maskImage: 'radial-gradient(circle at center, black 56%, transparent 95%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 56%, transparent 95%)',
                }}
              />
            </motion.div>
            {/* Low-opacity shadow beneath */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 h-4 w-36 rounded-full bg-black/55 blur-md"
            />
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-400"
            >
              <Plus className="h-4 w-4" />
              Log Reading
            </button>
            <button
              type="button"
              onClick={onOpenDoctorReport}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-pink-200/25 bg-white/5 px-4 py-2.5 text-xs font-semibold text-pink-100 hover:bg-white/10"
            >
              <FileText className="h-4 w-4" />
              Doctor Report
            </button>
            <button
              type="button"
              onClick={() => setGuidanceOpen((o) => !o)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-pink-200/15 px-3.5 py-2.5 text-xs font-medium text-pink-200/85 hover:bg-white/5"
            >
              <ShieldQuestion className="h-4 w-4" />
              Medical Guidance
            </button>
          </>
        }
      />

      {/* Secondary Non-Alarming Guidance Drawer */}
      {guidanceOpen && (
        <GlassPanel theme="cardio" className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 text-xs text-rose-100/90">
              <p className="font-semibold text-pink-200">When to seek medical care</p>
              <p>
                Home logs help spot trends over weeks, not diagnose acute conditions. If you ever experience chest pain, sudden shortness of breath, dizziness, or readings ≥ 180/120 mmHg, call local emergency services (911 / 112) promptly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGuidanceOpen(false)}
              aria-label="Close medical guidance"
              className="rounded-lg p-1.5 text-rose-200/70 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </GlassPanel>
      )}

      {/* Urgent Threshold Alert ONLY if configured threshold exceeded */}
      {isTrulyUrgent && latestStatus && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-400/50 bg-rose-950/75 p-4 text-rose-100"
        >
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">
              Latest reading ({latest.systolic}/{latest.diastolic} mmHg) is above your {profile.bpThresholds.systolicHigh}/{profile.bpThresholds.diastolicHigh} target
            </p>
            <p className="text-xs text-rose-200/85">{latestStatus.message}</p>
          </div>
          <button
            type="button"
            onClick={onOpenDoctorReport}
            className="min-h-[40px] rounded-xl border border-rose-300/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-900/60"
          >
            Open Doctor Summary
          </button>
        </div>
      )}

      {/* Core Readings & Calm Status Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          theme="cardio"
          label="Current Heart Rate"
          value={latest?.heartRate ?? '—'}
          unit="bpm"
          subtitle={latest?.hrvMs ? `HRV ${latest.hrvMs} ms` : 'Resting reading'}
          accent
        />
        <MetricCard
          theme="cardio"
          label="Blood Pressure"
          value={latest ? `${latest.systolic}/${latest.diastolic}` : '—/—'}
          unit="mmHg"
          subtitle={latestStatus?.category ?? 'No recent reading'}
        />
        <MetricCard
          theme="cardio"
          label="Medication & Check-up"
          value={`${medDays14.filter((d) => d.medicationTaken).length}/${medDays14.length}`}
          unit="days"
          subtitle="Next review in 3 weeks"
        />
        <GlassPanel theme="cardio" className="flex flex-col justify-between p-5">
          <div className="flex items-center gap-2 text-pink-200">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold">Daily Status</span>
          </div>
          <p className="mt-2 text-sm font-medium text-white">
            {loggedToday ? 'Today’s readings are logged' : 'Ready for today’s check-in'}
          </p>
          <p className="mt-1 text-xs text-rose-100/70">
            {loggedToday ? 'Consistent daily pacing supports trend accuracy.' : 'Take 5 quiet minutes before measuring.'}
          </p>
        </GlassPanel>
      </div>

      {/* Charts & Log Reading Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <GlassPanel theme="cardio" className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display-serif text-lg font-semibold text-white">
                  Weekly Resting Heart Rate Trend
                </h3>
                <p className="text-xs text-rose-100/70">7-day resting pulse (bpm)</p>
              </div>
              <HeartPulse className="h-4 w-4 text-pink-300" />
            </div>
            <TrendChart data={weeklyRhr} unit="bpm" strokeColor="#F9A8D4" darkSurface />
          </GlassPanel>

          <GlassPanel theme="cardio" className="p-6">
            <h3 className="font-display-serif text-lg font-semibold text-white">
              Blood Pressure Zone Trend
            </h3>
            <p className="mb-3 text-xs text-rose-100/70">14-day systolic &amp; diastolic readings</p>
            <BpZoneTrendChart data={bpTrend} />
          </GlassPanel>
        </div>

        {/* Log Reading Form */}
        <GlassPanel theme="cardio" className="lg:col-span-5 p-6">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-display-serif text-lg font-semibold text-white">
              Log Reading
            </h3>
            {errorMsg && (
              <p className="rounded-xl border border-rose-400/50 bg-rose-950/60 px-3 py-2 text-xs text-rose-200">
                {errorMsg}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="bp-sys" className="block text-xs text-rose-100/80">
                  Systolic (mmHg)
                </label>
                <input
                  id="bp-sys"
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  required
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-rose-300/20 bg-black/40 px-3 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="bp-dia" className="block text-xs text-rose-100/80">
                  Diastolic (mmHg)
                </label>
                <input
                  id="bp-dia"
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  required
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-rose-300/20 bg-black/40 px-3 font-mono text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="bp-rhr" className="block text-xs text-rose-100/80">
                  Heart Rate (bpm)
                </label>
                <input
                  id="bp-rhr"
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  required
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-rose-300/20 bg-black/40 px-3 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="bp-hrv" className="block text-xs text-rose-100/80">
                  HRV (ms)
                </label>
                <input
                  id="bp-hrv"
                  type="number"
                  value={hrvMs}
                  onChange={(e) => setHrvMs(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-rose-300/20 bg-black/40 px-3 font-mono text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="bp-act" className="block text-xs text-rose-100/80">Active Min</label>
                <input
                  id="bp-act"
                  type="number"
                  value={activityMinutes}
                  onChange={(e) => setActivityMinutes(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-rose-300/20 bg-black/40 px-2.5 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="bp-steps" className="block text-xs text-rose-100/80">Steps</label>
                <input
                  id="bp-steps"
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-rose-300/20 bg-black/40 px-2.5 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="bp-wt" className="block text-xs text-rose-100/80">Weight (kg)</label>
                <input
                  id="bp-wt"
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-rose-300/20 bg-black/40 px-2.5 font-mono text-sm text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex rounded-xl bg-black/40 p-1">
                {(['morning', 'evening'] as const).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeOfDay(slot)}
                    className={`min-h-[36px] rounded-lg px-3 text-xs font-medium capitalize ${
                      timeOfDay === slot ? 'bg-rose-500 text-white' : 'text-rose-100/70'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <label className="inline-flex min-h-[44px] items-center gap-2 text-xs text-rose-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medicationTaken}
                  onChange={(e) => setMedicationTaken(e.target.checked)}
                />
                Medication taken
              </label>
            </div>

            <div>
              <label htmlFor="bp-notes" className="block text-xs text-rose-100/80">
                Context Note
              </label>
              <input
                id="bp-notes"
                type="text"
                placeholder="e.g., Rested 5 minutes before cuff check"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-rose-300/20 bg-black/40 px-3 text-sm text-white placeholder:text-rose-200/40"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] w-full rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-60"
            >
              {saving ? 'Saving Reading...' : 'Save Cardio Reading'}
            </button>
          </form>
        </GlassPanel>
      </div>

      {/* Medication Calendar */}
      <GlassPanel theme="cardio" className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-pink-300" />
            <h3 className="font-display-serif text-lg font-semibold text-white">
              14-Day Medication &amp; Check-Up Rhythm
            </h3>
          </div>
          <span className="font-mono text-xs text-pink-200 tabular-nums">
            {medDays14.filter((d) => d.medicationTaken).length}/{medDays14.length} days
          </span>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {medDays14.map((d) => (
            <div
              key={d.date}
              className={`rounded-xl border p-2 text-center text-xs ${
                d.medicationTaken === true
                  ? 'border-pink-300/35 bg-pink-500/15 text-pink-100'
                  : 'border-rose-300/15 bg-black/30 text-rose-200/60'
              }`}
            >
              <div className="font-mono text-[10px]">{formatShortDate(d.date)}</div>
              <div className="mt-1 font-medium">
                {d.medicationTaken === true ? 'Taken' : '—'}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
