import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Bell, Brain, Clock, Droplets, Gamepad2, Pause, Play, RotateCcw, Wind, Zap } from 'lucide-react';
import type {
  BrainFogCheckin,
  CognitiveTestResult,
  CorrelationInsight,
  DailySummary,
} from '../types/health';
import { formatShortDate, getTodayIso } from '../utils/dateUtils';
import { FogHeatmapGrid } from './charts/HealthCharts';
import { ArtHero } from './ui/ArtHero';
import { GlassPanel } from './ui/GlassPanel';
import { TrendChart } from './ui/TrendChart';

interface BrainFogViewProps {
  checkins: BrainFogCheckin[];
  cognitiveTests: CognitiveTestResult[];
  summaries: DailySummary[];
  correlations: CorrelationInsight[];
  onSaveCheckin: (entry: Omit<BrainFogCheckin, 'id' | 'userId'>) => Promise<void>;
  onSaveCognitiveTest: (test: Omit<CognitiveTestResult, 'id' | 'userId'>) => Promise<void>;
  onTakeWaterBreak: () => Promise<void>;
}

const STROOP_COLORS = [
  { name: 'VIOLET', hex: '#A78BFA' },
  { name: 'YELLOW', hex: '#FACC15' },
  { name: 'CYAN', hex: '#22D3EE' },
  { name: 'CORAL', hex: '#FB7185' },
];

export function BrainFogView({
  checkins,
  cognitiveTests,
  summaries,
  correlations,
  onSaveCheckin,
  onSaveCognitiveTest,
  onTakeWaterBreak,
}: BrainFogViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const todayIso = getTodayIso();
  const todayCheckin = checkins.find((c) => c.date === todayIso);

  const [clarity, setClarity] = useState(todayCheckin?.clarity ?? 4);
  const [energy, setEnergy] = useState(todayCheckin?.energy ?? 4);
  const [sleepQuality, setSleepQuality] = useState(todayCheckin?.sleepQuality ?? 4);
  const [stressLevel, setStressLevel] = useState(todayCheckin?.stressLevel ?? 2);
  const [sleepHours, setSleepHours] = useState(String(todayCheckin?.sleepHours ?? 7.2));
  const [caffeineMg, setCaffeineMg] = useState(String(todayCheckin?.caffeineMg ?? 120));
  const [notes, setNotes] = useState(todayCheckin?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  // Helpful Actions state
  const [groundingActive, setGroundingActive] = useState(false);
  const [groundingSec, setGroundingSec] = useState(120);
  const [restReminderSet, setRestReminderSet] = useState<string | null>(null);
  const [waterBreakDone, setWaterBreakDone] = useState(false);

  // Cognitive Lab Tabs
  const [activeGame, setActiveGame] = useState<'reaction' | 'memory' | 'stroop'>('reaction');
  const [rxPhase, setRxPhase] = useState<'idle' | 'waiting' | 'ready' | 'done'>('idle');
  const [rxTrials, setRxTrials] = useState<number[]>([]);
  const rxStartRef = useRef<number>(0);
  const rxTimeoutRef = useRef<number | null>(null);

  const [memSequence, setMemSequence] = useState<number[]>([]);
  const [memUserInput, setMemUserInput] = useState<number[]>([]);
  const [memShowingIdx, setMemShowingIdx] = useState<number | null>(null);
  const [memStatus, setMemStatus] = useState<'idle' | 'showing' | 'input' | 'finished'>('idle');
  const [memResultMsg, setMemResultMsg] = useState('');

  const [stroopRound, setStroopRound] = useState(0);
  const [stroopCorrect, setStroopCorrect] = useState(0);
  const [stroopPrompt, setStroopPrompt] = useState<{ word: string; inkIdx: number }>({
    word: 'CYAN',
    inkIdx: 1,
  });
  const [stroopActive, setStroopActive] = useState(false);
  const [stroopTimes, setStroopTimes] = useState<number[]>([]);
  const stroopRoundStartRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (rxTimeoutRef.current) window.clearTimeout(rxTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!groundingActive) return;
    const id = window.setInterval(() => {
      setGroundingSec((prev) => {
        if (prev <= 1) {
          setGroundingActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [groundingActive]);

  const handleSaveCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice('');
    try {
      await onSaveCheckin({
        date: todayIso,
        focus: clarity,
        memory: clarity,
        clarity,
        mood: energy,
        energy,
        sleepHours: Number(sleepHours || 7),
        sleepQuality,
        caffeineMg: Number(caffeineMg || 0),
        stressLevel,
        screenTimeHours: 6,
        waterMl: 1800,
        notes: notes.trim() || undefined,
      });
      setSavedNotice('Check-in recorded. You may benefit from a short break if stress feels elevated.');
    } finally {
      setSaving(false);
    }
  };

  // Reaction Game Handlers
  const startReactionRound = () => {
    if (rxTimeoutRef.current) window.clearTimeout(rxTimeoutRef.current);
    setRxPhase('waiting');
    const delay = 1100 + Math.floor(Math.random() * 1400);
    rxTimeoutRef.current = window.setTimeout(() => {
      rxStartRef.current = performance.now();
      setRxPhase('ready');
    }, delay);
  };

  const handleReactionTap = async () => {
    if (rxPhase === 'waiting') {
      if (rxTimeoutRef.current) window.clearTimeout(rxTimeoutRef.current);
      setRxPhase('idle');
      return;
    }
    if (rxPhase !== 'ready') return;
    const ms = Math.round(performance.now() - rxStartRef.current);
    const next = [...rxTrials, ms];
    setRxTrials(next);
    if (next.length >= 3) {
      setRxPhase('done');
      const avg = Math.round(next.reduce((s, v) => s + v, 0) / next.length);
      const score = Math.max(40, Math.min(100, Math.round(125 - avg / 6)));
      await onSaveCognitiveTest({
        date: todayIso,
        timestamp: new Date().toISOString(),
        testType: 'reaction',
        score,
        rawMetric: `${avg} ms avg`,
      });
    } else {
      startReactionRound();
    }
  };

  const startMemoryTest = () => {
    const seq = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6));
    setMemSequence(seq);
    setMemUserInput([]);
    setMemResultMsg('');
    setMemStatus('showing');
    seq.forEach((tile, idx) => {
      window.setTimeout(() => setMemShowingIdx(tile), idx * 550);
      window.setTimeout(() => setMemShowingIdx(null), idx * 550 + 380);
    });
    window.setTimeout(() => setMemStatus('input'), seq.length * 550 + 120);
  };

  const handleMemoryTileClick = async (tileIdx: number) => {
    if (memStatus !== 'input') return;
    const next = [...memUserInput, tileIdx];
    setMemUserInput(next);
    if (next.length === memSequence.length) {
      const correctCount = next.filter((v, idx) => v === memSequence[idx]).length;
      const score = Math.round((correctCount / memSequence.length) * 100);
      setMemStatus('finished');
      setMemResultMsg(`Matched ${correctCount}/${memSequence.length} tiles (${score}%)`);
      await onSaveCognitiveTest({
        date: todayIso,
        timestamp: new Date().toISOString(),
        testType: 'memory',
        score,
        rawMetric: `${correctCount}/${memSequence.length} sequence`,
      });
    }
  };

  const nextStroopQuestion = () => {
    const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    const inkIdx = (wordIdx + 1 + Math.floor(Math.random() * 3)) % STROOP_COLORS.length;
    setStroopPrompt({ word: STROOP_COLORS[wordIdx].name, inkIdx });
    stroopRoundStartRef.current = performance.now();
  };

  const startStroopTest = () => {
    setStroopRound(1);
    setStroopCorrect(0);
    setStroopTimes([]);
    setStroopActive(true);
    nextStroopQuestion();
  };

  const handleStroopAnswer = async (pickedIdx: number) => {
    if (!stroopActive) return;
    const elapsedMs = Math.round(performance.now() - stroopRoundStartRef.current);
    const isRight = pickedIdx === stroopPrompt.inkIdx;
    const nextCorrect = stroopCorrect + (isRight ? 1 : 0);
    const nextTimes = [...stroopTimes, elapsedMs];

    if (stroopRound >= 5) {
      setStroopActive(false);
      setStroopCorrect(nextCorrect);
      setStroopTimes(nextTimes);
      const accuracy = Math.round((nextCorrect / 5) * 100);
      const avgMs = Math.round(nextTimes.reduce((s, t) => s + t, 0) / nextTimes.length);
      await onSaveCognitiveTest({
        date: todayIso,
        timestamp: new Date().toISOString(),
        testType: 'stroop',
        score: accuracy,
        rawMetric: `${accuracy}% · ${avgMs} ms`,
      });
    } else {
      setStroopCorrect(nextCorrect);
      setStroopTimes(nextTimes);
      setStroopRound((r) => r + 1);
      nextStroopQuestion();
    }
  };

  const clarity7d = summaries
    .filter((d) => d.clarityScore !== null)
    .slice(-7)
    .map((d) => ({ date: d.date, value: d.clarityScore as number }));

  const heatmapDays = summaries.slice(-30).map((d) => ({
    date: d.date,
    clarityScore: d.clarityScore,
  }));

  const triggerInsights = correlations.filter((c) => c.modules.includes('brainfog'));
  const breathCycleSec = (120 - groundingSec) % 14;
  const breathPhase =
    breathCycleSec < 4 ? 'Inhale slowly (4s)' : breathCycleSec < 8 ? 'Hold gently (4s)' : 'Exhale softly (6s)';

  return (
    <div className="space-y-6 text-slate-100">
      {/* Dedicated Brain Fog Particle-Brain Hero (ONLY on Brain Fog screens) */}
      <ArtHero
        theme="brainfog"
        eyebrow="Brain Fog & Cognitive Care"
        title="Clear the fog, one check-in at a time."
        subtitle="Notice patterns across sleep, hydration, and daily stress without pressure. Low clarity is a gentle signal to pause, hydrate, or rest—not a clinical diagnosis."
        artwork={
          <div className="relative flex h-64 w-full items-center justify-center sm:h-72">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-4 rounded-full bg-violet-600/20 blur-3xl"
            />
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              className="relative h-full w-full max-w-[340px] overflow-hidden rounded-3xl"
            >
              <img
                src="/src/assets/images/brain_particle_hero_1794855874009.jpg"
                alt="Particle-field neural brain illustration in violet, cyan, and warm gold"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-95"
                style={{
                  maskImage: 'radial-gradient(circle at center, black 55%, transparent 98%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 55%, transparent 98%)',
                }}
              />
              {!shouldReduceMotion && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                  <span className="absolute left-[24%] top-[28%] h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#facc15]" />
                  <span className="absolute right-[26%] top-[36%] h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
                  <span className="absolute left-[48%] bottom-[30%] h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_#a78bfa]" />
                </div>
              )}
            </motion.div>
          </div>
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setGroundingSec(120);
                setGroundingActive(true);
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 whitespace-nowrap"
            >
              <Wind className="h-4 w-4" />
              2-Minute Grounding
            </button>
            <button
              type="button"
              onClick={async () => {
                await onTakeWaterBreak();
                setWaterBreakDone(true);
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-950/50 px-3.5 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/50 whitespace-nowrap"
            >
              <Droplets className="h-4 w-4" />
              {waterBreakDone ? 'Logged +250 ml Break' : 'Take a Water Break'}
            </button>
            <button
              type="button"
              onClick={() => setRestReminderSet('Scheduled a calm 15-min rest nudge for 4:00 PM')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-yellow-300/30 bg-yellow-950/30 px-3.5 py-2.5 text-xs font-semibold text-yellow-200 hover:bg-yellow-900/40 whitespace-nowrap"
            >
              <Bell className="h-4 w-4" />
              Rest Reminder
            </button>
          </>
        }
      />

      {restReminderSet && (
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-950/40 px-4 py-3 text-xs text-yellow-200">
          {restReminderSet}
        </div>
      )}

      {/* 2-Minute Grounding Exercise Panel */}
      {(groundingActive || groundingSec < 120) && (
        <GlassPanel theme="brainfog" className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-cyan-300">Guided Grounding</p>
              <h3 className="font-display-serif text-xl font-semibold text-white">
                {groundingSec === 0 ? 'Grounding Complete' : breathPhase}
              </h3>
              <p className="text-xs text-slate-300">
                Relax your jaw and shoulders. Follow a calm 4-4-6 cadence.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-semibold text-yellow-300 tabular-nums">
                {String(Math.floor(groundingSec / 60)).padStart(2, '0')}:
                {String(groundingSec % 60).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => setGroundingActive((a) => !a)}
                aria-label={groundingActive ? 'Pause grounding' : 'Resume grounding'}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-violet-600 text-white"
              >
                {groundingActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setGroundingActive(false);
                  setGroundingSec(120);
                }}
                aria-label="Reset grounding"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-700 text-slate-300"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Check-In Form + Useful Insights & 7-Day Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <GlassPanel theme="brainfog" className="lg:col-span-5 p-6">
          <form onSubmit={handleSaveCheckin} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-300" />
                <h3 className="font-display-serif text-lg font-semibold text-white">
                  Quick Check-In
                </h3>
              </div>
              <span className="font-mono text-xs text-slate-400">{formatShortDate(todayIso)}</span>
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor="bf-clarity-slider" className="font-medium text-slate-200">
                  Mental Clarity Slider (1–5)
                </label>
                <span className="font-mono font-semibold text-cyan-300 tabular-nums">
                  {clarity} / 5
                </span>
              </div>
              <input
                id="bf-clarity-slider"
                type="range"
                min={1}
                max={5}
                value={clarity}
                onChange={(e) => setClarity(Number(e.target.value))}
                className="mt-2 w-full accent-cyan-400"
              />
            </div>

            {[
              { label: 'Energy Level', val: energy, set: setEnergy },
              { label: 'Sleep Quality', val: sleepQuality, set: setSleepQuality },
              { label: 'Stress Level', val: stressLevel, set: setStressLevel },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-300">{row.label}</span>
                <div className="flex gap-1.5" role="group" aria-label={row.label}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => row.set(n)}
                      className={`h-10 w-10 rounded-xl font-mono text-xs font-semibold transition-colors ${
                        row.val === n
                          ? 'bg-violet-600 text-white'
                          : 'border border-slate-700 bg-slate-900/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="bf-sleep-hrs" className="block text-xs text-slate-400">
                  Sleep Hours
                </label>
                <input
                  id="bf-sleep-hrs"
                  type="number"
                  step="0.1"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="bf-caffeine-mg" className="block text-xs text-slate-400">
                  Caffeine (mg)
                </label>
                <input
                  id="bf-caffeine-mg"
                  type="number"
                  value={caffeineMg}
                  onChange={(e) => setCaffeineMg(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 font-mono text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bf-notes" className="block text-xs text-slate-400">
                Optional Notes
              </label>
              <textarea
                id="bf-notes"
                rows={2}
                placeholder="e.g., Post-lunch dip, felt sharper after walk"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
            >
              {saving ? 'Saving Check-In...' : 'Save Brain Fog Check-In'}
            </button>
            {savedNotice && <p className="text-xs text-cyan-300">{savedNotice}</p>}
          </form>
        </GlassPanel>

        {/* Insights & 7-Day Trend */}
        <div className="lg:col-span-7 space-y-6">
          <GlassPanel theme="brainfog" className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-b border-slate-800 pb-5 mb-5">
              <div>
                <p className="text-xs text-slate-400">Recent Pattern</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {clarity <= 2 ? 'You may benefit from a short break' : 'Steady cognitive baseline'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Common Low-Clarity Window</p>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-semibold text-yellow-300">
                  <Clock className="h-3.5 w-3.5" /> 2:00 PM – 4:30 PM
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Hydration / Sleep Link</p>
                <p className="mt-1 text-xs text-cyan-200">
                  {triggerInsights[0]?.metricDelta || '7+ hrs sleep boosts clarity'}
                </p>
              </div>
            </div>

            <h3 className="font-display-serif text-lg font-semibold text-white">
              7-Day Clarity Trend
            </h3>
            <p className="mb-2 text-xs text-slate-400">Higher score indicates sharper mental clarity</p>
            <TrendChart
              data={clarity7d}
              unit="/100"
              strokeColor="#22D3EE"
              darkSurface
              minOverride={20}
              maxOverride={100}
            />
          </GlassPanel>

          <GlassPanel theme="brainfog" className="p-6">
            <h3 className="mb-3 font-display-serif text-lg font-semibold text-white">
              30-Day Clarity Heatmap
            </h3>
            <FogHeatmapGrid days={heatmapDays} />
          </GlassPanel>
        </div>
      </div>

      {/* Bottom Row: Correlations + Interactive Mini Cognitive Lab */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <GlassPanel theme="brainfog" className="lg:col-span-5 p-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-300" />
            <h3 className="font-display-serif text-lg font-semibold text-white">
              Sleep &amp; Hydration Correlations
            </h3>
          </div>
          <div className="mt-4 divide-y divide-slate-800">
            {triggerInsights.length === 0 ? (
              <p className="py-4 text-sm text-slate-400">
                Log more check-ins across sleep and hydration ranges to uncover triggers.
              </p>
            ) : (
              triggerInsights.map((ins) => (
                <div key={ins.id} className="py-3.5 first:pt-1 last:pb-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">{ins.title}</h4>
                    <span className="font-mono text-xs font-semibold text-yellow-300 tabular-nums">
                      {ins.metricDelta}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">{ins.summary}</p>
                </div>
              ))
            )}
          </div>
        </GlassPanel>

        <GlassPanel theme="brainfog" className="lg:col-span-7 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-cyan-300" />
              <h3 className="font-display-serif text-lg font-semibold text-white">
                Cognitive Check-In Games
              </h3>
            </div>
            <div className="flex rounded-xl bg-slate-900 p-1">
              {[
                { id: 'reaction', label: 'Reaction Time' },
                { id: 'memory', label: 'Memory Sequence' },
                { id: 'stroop', label: 'Stroop Test' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveGame(t.id as 'reaction' | 'memory' | 'stroop')}
                  className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeGame === t.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            {activeGame === 'reaction' && (
              <div className="space-y-4 text-center">
                <p className="text-xs text-slate-300">
                  Tap as soon as the panel turns cyan (3 quick trials).
                </p>
                <button
                  type="button"
                  onClick={
                    rxPhase === 'idle' || rxPhase === 'done'
                      ? () => {
                          setRxTrials([]);
                          startReactionRound();
                        }
                      : handleReactionTap
                  }
                  className={`flex h-32 w-full items-center justify-center rounded-2xl text-sm font-semibold transition-colors ${
                    rxPhase === 'ready'
                      ? 'bg-cyan-400 text-slate-950'
                      : rxPhase === 'waiting'
                      ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/40'
                      : 'border border-slate-700 bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {rxPhase === 'idle' && 'Start Reaction Test'}
                  {rxPhase === 'waiting' && `Wait for cyan... (${rxTrials.length + 1}/3)`}
                  {rxPhase === 'ready' && 'TAP NOW!'}
                  {rxPhase === 'done' &&
                    `Saved! Avg: ${Math.round(
                      rxTrials.reduce((s, v) => s + v, 0) / Math.max(1, rxTrials.length)
                    )} ms — Tap to Retry`}
                </button>
              </div>
            )}

            {activeGame === 'memory' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-300">
                    {memStatus === 'idle' && 'Watch the 5-step sequence, then repeat it.'}
                    {memStatus === 'showing' && 'Memorize the highlighted tiles...'}
                    {memStatus === 'input' &&
                      `Your turn (${memUserInput.length}/${memSequence.length})`}
                    {memStatus === 'finished' && memResultMsg}
                  </p>
                  <button
                    type="button"
                    onClick={startMemoryTest}
                    className="min-h-[38px] rounded-xl bg-violet-600 px-3.5 text-xs font-semibold text-white"
                  >
                    {memStatus === 'idle' ? 'Start Sequence' : 'Restart'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[0, 1, 2, 3, 4, 5].map((tile) => (
                    <button
                      key={tile}
                      type="button"
                      onClick={() => handleMemoryTileClick(tile)}
                      aria-label={`Memory tile ${tile + 1}`}
                      className={`h-14 rounded-xl border font-mono text-sm font-semibold transition-colors ${
                        memShowingIdx === tile
                          ? 'border-cyan-300 bg-cyan-400 text-slate-950'
                          : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {tile + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeGame === 'stroop' && (
              <div className="space-y-4 text-center">
                {!stroopActive ? (
                  <div className="space-y-3 py-4">
                    <p className="text-xs text-slate-300">
                      Pick the <strong>INK COLOR</strong> of each word, ignoring what it spells.
                    </p>
                    {stroopTimes.length > 0 && (
                      <p className="font-mono text-sm font-semibold text-cyan-300">
                        Saved: {stroopCorrect}/5 correct
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={startStroopTest}
                      className="min-h-[42px] rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white"
                    >
                      {stroopTimes.length > 0 ? 'Play Stroop Again' : 'Start Stroop Test'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="font-mono text-xs text-slate-400">
                      Round {stroopRound}/5 — Pick the ink color:
                    </p>
                    <p
                      className="text-3xl font-bold tracking-wider"
                      style={{ color: STROOP_COLORS[stroopPrompt.inkIdx].hex }}
                    >
                      {stroopPrompt.word}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {STROOP_COLORS.map((c, idx) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleStroopAnswer(idx)}
                          className="min-h-[44px] rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 divide-y divide-slate-800 text-xs">
            {[...cognitiveTests]
              .reverse()
              .slice(0, 3)
              .map((ct) => (
                <div key={ct.id} className="flex items-center justify-between py-2">
                  <span className="capitalize text-slate-200">
                    {ct.testType} · <span className="text-slate-400">{formatShortDate(ct.date)}</span>
                  </span>
                  <span className="font-mono text-cyan-300 tabular-nums">
                    {ct.score}/100 ({ct.rawMetric})
                  </span>
                </div>
              ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
