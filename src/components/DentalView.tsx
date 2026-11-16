import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Camera,
  Check,
  Download,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
} from 'lucide-react';
import type {
  DailySummary,
  DentalAppointment,
  DentalLog,
  UserProfile,
} from '../types/health';
import {
  calculateStreaksAndBadges,
  getDentalSymptomAlert,
  getToothbrushStatus,
} from '../utils/healthEngine';
import { daysUntilDate, formatShortDate, getTodayIso } from '../utils/dateUtils';
import { ArtHero } from './ui/ArtHero';
import { GlassPanel } from './ui/GlassPanel';
import { MetricCard } from './ui/MetricCard';
import { TrendChart } from './ui/TrendChart';

interface DentalViewProps {
  profile: UserProfile;
  dentalLogs: DentalLog[];
  appointments: DentalAppointment[];
  summaries: DailySummary[];
  onSaveDental: (entry: Omit<DentalLog, 'id' | 'userId'>) => Promise<void>;
  onAddAppointment: (apt: Omit<DentalAppointment, 'id' | 'userId'>) => Promise<void>;
  onUpdateToothbrushDate: (date: string) => Promise<void>;
}

const QUADRANTS = [
  'Upper Right Quadrant',
  'Upper Left Quadrant',
  'Lower Left Quadrant',
  'Lower Right Quadrant',
];

function EnamelMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M7.5 3.5C5 3.5 3.5 5.8 3.5 8.5C3.5 12 5.4 14.5 6.4 18.8C6.8 20.5 8 21 8.8 19.6L11 15.6C11.4 14.8 12.6 14.8 13 15.6L15.2 19.6C16 21 17.2 20.5 17.6 18.8C18.6 14.5 20.5 12 20.5 8.5C20.5 5.8 19 3.5 16.5 3.5C14.7 3.5 13.5 4.4 12 4.4C10.5 4.4 9.3 3.5 7.5 3.5Z"
        stroke="url(#enamelGrad)"
        strokeWidth="1.8"
      />
      <defs>
        <linearGradient id="enamelGrad" x1="3" y1="3" x2="21" y2="21">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function DentalView({
  profile,
  dentalLogs,
  appointments,
  summaries,
  onSaveDental,
  onAddAppointment,
  onUpdateToothbrushDate,
}: DentalViewProps) {
  const todayIso = getTodayIso();
  const todayLog = dentalLogs.find((l) => l.date === todayIso);

  const [brushedAm, setBrushedAm] = useState(todayLog?.brushedAm ?? false);
  const [brushedPm, setBrushedPm] = useState(todayLog?.brushedPm ?? false);
  const [flossed, setFlossed] = useState(todayLog?.flossed ?? false);
  const [mouthwash, setMouthwash] = useState(todayLog?.mouthwash ?? false);
  const [tongueCleaned, setTongueCleaned] = useState(todayLog?.tongueCleaned ?? false);
  const [sugarSnacks, setSugarSnacks] = useState(String(todayLog?.sugarSnacks ?? 0));
  const [painLevel, setPainLevel] = useState(String(todayLog?.painLevel ?? 0));
  const [gumBleeding, setGumBleeding] = useState(todayLog?.gumBleeding ?? false);
  const [swelling, setSwelling] = useState(todayLog?.swelling ?? false);
  const [notes, setNotes] = useState(todayLog?.notes ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(todayLog?.photoUrl);
  const [photoCaption, setPhotoCaption] = useState(todayLog?.photoCaption ?? '');
  const [saving, setSaving] = useState(false);

  // 2-Minute Brushing Timer
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  // Book Dentist Visit form
  const [aptDate, setAptDate] = useState('');
  const [aptTitle, setAptTitle] = useState('');
  const [aptClinic, setAptClinic] = useState('');

  // Before-Visit & Post-Visit Checklists
  const [beforeChecklist, setBeforeChecklist] = useState([
    { id: 'bv1', label: 'Note cold or sweet tooth sensitivity spots', done: true },
    { id: 'bv2', label: 'Bring updated medication & blood pressure summary', done: false },
    { id: 'bv3', label: 'Brush and floss gently 1 hour prior', done: false },
  ]);
  const [postReminders, setPostReminders] = useState([
    { id: 'pv1', label: 'Wait 30 minutes before warm drinks after fluoride', done: false },
    { id: 'pv2', label: 'Use soft bristles for 48 hours post-scaling', done: false },
    { id: 'pv3', label: 'Schedule 6-month follow-up before leaving clinic', done: true },
  ]);

  useEffect(() => {
    setBrushedAm(todayLog?.brushedAm ?? false);
    setBrushedPm(todayLog?.brushedPm ?? false);
    setFlossed(todayLog?.flossed ?? false);
    setMouthwash(todayLog?.mouthwash ?? false);
    setTongueCleaned(todayLog?.tongueCleaned ?? false);
    setSugarSnacks(String(todayLog?.sugarSnacks ?? 0));
    setPainLevel(String(todayLog?.painLevel ?? 0));
    setGumBleeding(todayLog?.gumBleeding ?? false);
    setSwelling(todayLog?.swelling ?? false);
    setNotes(todayLog?.notes ?? '');
    setPhotoUrl(todayLog?.photoUrl);
    setPhotoCaption(todayLog?.photoCaption ?? '');
  }, [todayLog?.id, profile.id]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const elapsed = 120 - secondsLeft;
  const quadrantIndex = Math.min(3, Math.floor(elapsed / 30));
  const formattedTimer = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveDental({
        date: todayIso,
        brushedAm,
        brushedPm,
        flossed,
        mouthwash,
        tongueCleaned,
        sugarSnacks: Number(sugarSnacks || 0),
        painLevel: Number(painLevel || 0),
        gumBleeding,
        swelling,
        notes: notes.trim() || undefined,
        photoUrl,
        photoCaption: photoCaption.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteBrushTimer = async () => {
    const isMorning = new Date().getHours() < 15;
    const nextAm = isMorning ? true : brushedAm;
    const nextPm = !isMorning ? true : brushedPm;
    setBrushedAm(nextAm);
    setBrushedPm(nextPm);
    setTimerRunning(false);
    setSecondsLeft(120);
    await onSaveDental({
      date: todayIso,
      brushedAm: nextAm,
      brushedPm: nextPm,
      flossed,
      mouthwash,
      tongueCleaned,
      sugarSnacks: Number(sugarSnacks || 0),
      painLevel: Number(painLevel || 0),
      gumBleeding,
      swelling,
      notes: notes.trim() || undefined,
      photoUrl,
      photoCaption: photoCaption.trim() || undefined,
    });
  };

  const handleAddApt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptDate || !aptTitle) return;
    await onAddAppointment({
      date: aptDate,
      title: aptTitle,
      clinic: aptClinic || 'Dental Studio',
    });
    setAptDate('');
    setAptTitle('');
    setAptClinic('');
  };

  const handleDownloadDentalReport = () => {
    const report = {
      patient: profile.name,
      generatedOn: todayIso,
      toothbrushReplacedAt: profile.toothbrushReplacedAt,
      upcomingAppointments: appointments,
      recentDentalLogs: dentalLogs.slice(-14),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sehat-saathi-dental-history-${todayIso}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const symptomAlert = getDentalSymptomAlert(dentalLogs);
  const brushStatus = getToothbrushStatus(profile.toothbrushReplacedAt, todayIso);
  const streaks = calculateStreaksAndBadges(summaries);
  const todaySummary = summaries.find((s) => s.date === todayIso);
  const painTimeline = summaries.slice(-14).map((s) => ({
    date: s.date,
    value: s.dentalPain,
  }));

  const upcomingApt = [...appointments]
    .filter((a) => a.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const daysToCheckup = upcomingApt ? daysUntilDate(upcomingApt.date, todayIso) : null;

  const photoEntries = [...dentalLogs]
    .filter((l) => Boolean(l.photoUrl))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 text-slate-100">
      {/* Inky-Black Diagonal Pearlescent Dental Hero */}
      <ArtHero
        theme="dental"
        eyebrow="Dental & Oral Editorial"
        title="Precision enamel care, morning and night."
        subtitle="Build lasting brushing, flossing, and tongue-cleaning streaks while keeping dental sensitivity notes and visit checklists organized."
        artwork={
          <div className="relative flex h-64 w-full items-center justify-center sm:h-72">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-6 rounded-full bg-gradient-to-tr from-violet-500/20 via-slate-300/10 to-teal-400/20 blur-2xl"
            />
            <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-300/15 bg-black">
              <img
                src="/src/assets/images/dental_pearlescent_hero_1794855874915.jpg"
                alt="Diagonal arrangement of pearlescent silver and frosted glass teeth on black obsidian"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-95"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06070A] via-transparent to-[#06070A]/40"
              />
            </div>
          </div>
        }
        actions={
          <button
            type="button"
            onClick={handleDownloadDentalReport}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-teal-300/30 bg-teal-500/15 px-4 py-2.5 text-xs font-semibold text-teal-200 hover:bg-teal-500/25"
          >
            <Download className="h-4 w-4" />
            Download Dental History
          </button>
        }
      />

      {symptomAlert.shouldSeeDentist && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-violet-400/40 bg-violet-950/50 p-4 text-violet-100"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
          <div>
            <p className="text-sm font-semibold">Symptom Note: Consider scheduling a dental visit</p>
            <p className="text-xs text-violet-200/85">{symptomAlert.reason}</p>
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          theme="dental"
          label="Oral Hygiene Score"
          value={todaySummary?.dentalScore ?? '—'}
          unit="/100"
          accent
        />
        <MetricCard
          theme="dental"
          label="Morning & Night Streak"
          value={streaks.dentalStreakDays}
          unit="days"
          subtitle="Consecutive AM + PM care"
        />
        <GlassPanel theme="dental" className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-300">Toothbrush Age</p>
            <EnamelMark />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="font-mono text-2xl font-semibold tabular-nums text-white">
              {brushStatus.daysUsed}d
              <span className="text-xs font-normal text-slate-400"> / 90d</span>
            </p>
            <button
              type="button"
              onClick={() => onUpdateToothbrushDate(todayIso)}
              className="text-xs font-semibold text-teal-300 hover:underline"
            >
              Replace
            </button>
          </div>
        </GlassPanel>
        <MetricCard
          theme="dental"
          label="Next Dental Check-Up"
          value={daysToCheckup !== null ? `In ${daysToCheckup}d` : 'None'}
          subtitle={upcomingApt ? `${upcomingApt.clinic} · ${formatShortDate(upcomingApt.date)}` : 'Book below'}
        />
      </div>

      {/* Main Grid: Brushing Timer & Routine Tracker */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel theme="dental" className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-teal-300" />
                <h3 className="font-display-serif text-lg font-semibold text-white">
                  2-Minute Brushing Timer
                </h3>
              </div>
              <EnamelMark />
            </div>

            <div className="my-5 flex flex-col items-center text-center">
              <div className="font-mono text-5xl font-semibold tracking-tight text-white tabular-nums">
                {formattedTimer}
              </div>
              <p className="mt-2 text-sm font-medium text-teal-300">
                {secondsLeft === 0 ? 'Brushing Complete' : QUADRANTS[quadrantIndex]}
              </p>
              <div className="mt-3 grid w-full grid-cols-4 gap-1.5">
                {QUADRANTS.map((q, idx) => (
                  <div
                    key={q}
                    className={`h-1.5 rounded-full ${
                      elapsed >= (idx + 1) * 30
                        ? 'bg-teal-400'
                        : idx === quadrantIndex && timerRunning
                        ? 'bg-violet-400'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-400 whitespace-nowrap"
              >
                {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {timerRunning ? 'Pause' : secondsLeft === 120 ? 'Start Timer' : 'Resume'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(120);
                }}
                aria-label="Reset brushing timer"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleCompleteBrushTimer}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-teal-400/30 bg-teal-950/50 px-3.5 text-xs font-semibold text-teal-200 hover:bg-teal-900/50"
              >
                <Check className="h-3.5 w-3.5" />
                Log Brush
              </button>
            </div>
          </GlassPanel>

          <GlassPanel theme="dental" className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display-serif text-lg font-semibold text-white">
                14-Day Streak Calendar
              </h3>
              <EnamelMark />
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {summaries.slice(-14).map((d) => {
                const both = d.brushedAm && d.brushedPm;
                const partial = d.brushedAm || d.brushedPm;
                return (
                  <div
                    key={d.date}
                    className={`rounded-xl border p-2 text-center text-[11px] ${
                      both
                        ? 'border-teal-400/35 bg-teal-500/15 text-teal-100'
                        : partial
                        ? 'border-violet-400/30 bg-violet-500/15 text-violet-100'
                        : 'border-slate-800 bg-slate-950/60 text-slate-500'
                    }`}
                  >
                    <div className="font-mono text-[10px]">{formatShortDate(d.date)}</div>
                    <div className="mt-1 font-medium">
                      {both ? '2x' : partial ? '1x' : '0x'}
                      {d.flossed ? ' · F' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </div>

        {/* Daily Oral Care Routine & Sensitivity Log */}
        <GlassPanel theme="dental" className="lg:col-span-7 p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EnamelMark />
                <h3 className="font-display-serif text-lg font-semibold text-white">
                  Brushing, Flossing &amp; Tongue-Cleaning Tracker
                </h3>
              </div>
              <span className="font-mono text-xs text-slate-400">{formatShortDate(todayIso)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: 'Morning Brush', checked: brushedAm, set: setBrushedAm },
                { label: 'Night Brush', checked: brushedPm, set: setBrushedPm },
                { label: 'Flossed', checked: flossed, set: setFlossed },
                { label: 'Tongue Cleaning', checked: tongueCleaned, set: setTongueCleaned },
                { label: 'Mouthwash', checked: mouthwash, set: setMouthwash },
              ].map((item) => (
                <label
                  key={item.label}
                  className={`flex min-h-[44px] items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                    item.checked
                      ? 'border-teal-400/45 bg-teal-500/15 text-teal-100'
                      : 'border-slate-800 bg-slate-950/50 text-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.set(e.target.checked)}
                    className="h-4 w-4 rounded accent-teal-400"
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dental-sugar" className="block text-xs text-slate-300">
                  Sugary Snacks Today
                </label>
                <input
                  id="dental-sugar"
                  type="number"
                  min={0}
                  max={20}
                  value={sugarSnacks}
                  onChange={(e) => setSugarSnacks(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="dental-pain" className="block text-xs text-slate-300">
                  Sensitivity / Pain Level (0–10): {painLevel}
                </label>
                <input
                  id="dental-pain"
                  type="range"
                  min={0}
                  max={10}
                  value={painLevel}
                  onChange={(e) => setPainLevel(e.target.value)}
                  className="mt-3 w-full accent-teal-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="inline-flex min-h-[40px] items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gumBleeding}
                  onChange={(e) => setGumBleeding(e.target.checked)}
                />
                Gum bleeding noted
              </label>
              <label className="inline-flex min-h-[40px] items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={swelling}
                  onChange={(e) => setSwelling(e.target.checked)}
                />
                Gum or jaw swelling
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dental-notes" className="block text-xs text-slate-300">
                  Tooth Sensitivity / Pain Note
                </label>
                <input
                  id="dental-notes"
                  type="text"
                  placeholder="e.g., Mild cold sensitivity lower left"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="dental-photo" className="block text-xs text-slate-300">
                  Smile / Gum Photo Log
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs font-medium text-slate-200 hover:bg-slate-800">
                    <Camera className="h-3.5 w-3.5 text-violet-300" />
                    Upload
                    <input
                      id="dental-photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="sr-only"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Photo caption"
                    aria-label="Photo caption"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="min-h-[44px] flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] w-full rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-60"
            >
              {saving ? 'Saving Routine...' : 'Save Today’s Dental Care'}
            </button>
          </form>
        </GlassPanel>
      </div>

      {/* Before-Visit Checklist, Post-Visit Care, Book Visit & History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <GlassPanel theme="dental" className="lg:col-span-4 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <EnamelMark />
            <h3 className="font-display-serif text-lg font-semibold text-white">
              Before &amp; Post-Visit Care
            </h3>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-violet-300">Before-Visit Checklist</p>
            {beforeChecklist.map((item) => (
              <label key={item.id} className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() =>
                    setBeforeChecklist((prev) =>
                      prev.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x))
                    )
                  }
                  className="mt-0.5"
                />
                <span className={item.done ? 'line-through text-slate-500' : ''}>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            <p className="text-xs font-semibold text-teal-300">Post-Visit Care Reminders</p>
            {postReminders.map((item) => (
              <label key={item.id} className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() =>
                    setPostReminders((prev) =>
                      prev.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x))
                    )
                  }
                  className="mt-0.5"
                />
                <span className={item.done ? 'line-through text-slate-500' : ''}>{item.label}</span>
              </label>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel theme="dental" className="lg:col-span-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-300" />
              <h3 className="font-display-serif text-lg font-semibold text-white">
                Book a Dentist Visit
              </h3>
            </div>
            <EnamelMark />
          </div>
          <ul className="mt-3 space-y-2 text-xs">
            {appointments.map((apt) => (
              <li key={apt.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="font-semibold text-white">{apt.title}</p>
                <p className="text-slate-400">
                  {apt.clinic} · <span className="font-mono">{formatShortDate(apt.date)}</span>
                </p>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddApt} className="mt-4 space-y-2.5 border-t border-slate-800 pt-4">
            <input
              type="date"
              value={aptDate}
              onChange={(e) => setAptDate(e.target.value)}
              aria-label="Appointment date"
              className="min-h-[42px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white"
            />
            <input
              type="text"
              placeholder="Visit type (e.g., Cleaning & Exam)"
              value={aptTitle}
              onChange={(e) => setAptTitle(e.target.value)}
              className="min-h-[42px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white"
            />
            <input
              type="text"
              placeholder="Clinic name"
              value={aptClinic}
              onChange={(e) => setAptClinic(e.target.value)}
              className="min-h-[42px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-white"
            />
            <button
              type="submit"
              className="min-h-[42px] w-full rounded-xl border border-teal-400/35 bg-teal-500/15 text-xs font-semibold text-teal-200 hover:bg-teal-500/25"
            >
              Book Dentist Visit
            </button>
          </form>
        </GlassPanel>

        <GlassPanel theme="dental" className="lg:col-span-4 p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-display-serif text-lg font-semibold text-white">
                Sensitivity Timeline
              </h3>
              <Sparkles className="h-4 w-4 text-violet-300" />
            </div>
            <TrendChart
              data={painTimeline}
              unit="/10"
              strokeColor="#A78BFA"
              darkSurface
              minOverride={0}
              maxOverride={10}
              height={130}
            />
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-semibold text-slate-300">Dental Photo History</h4>
            {photoEntries.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No dental photos yet.</p>
            ) : (
              <div className="mt-2 space-y-2.5">
                {photoEntries.slice(0, 1).map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-slate-800">
                    <img
                      src={item.photoUrl}
                      alt={item.photoCaption || `Dental log ${item.date}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-28 w-full object-cover"
                    />
                    <div className="p-2.5 text-xs">
                      <p className="font-medium text-white">
                        {item.photoCaption || 'Dental Progress Photo'}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400">{formatShortDate(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
