import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Droplets, RotateCcw } from 'lucide-react';
import type { WaterLog } from '../../types/health';

interface WaterTrackerProps {
  waterMlToday: number;
  waterTargetMl: number;
  recentUndoEntry?: WaterLog | null;
  onAddWater: (amountMl: number, note?: string) => Promise<void>;
  onUndoWater?: (id: string) => Promise<void>;
  onOpenDetails?: () => void;
  compact?: boolean;
}

export function WaterTracker({
  waterMlToday,
  waterTargetMl,
  recentUndoEntry,
  onAddWater,
  onUndoWater,
  onOpenDetails,
  compact = false,
}: WaterTrackerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [customOpen, setCustomOpen] = useState(false);
  const [customMl, setCustomMl] = useState('300');
  const [busy, setBusy] = useState(false);

  const target = Math.max(500, waterTargetMl);
  const pct = Math.max(0, Math.min(100, Math.round((waterMlToday / target) * 100)));
  const litersDone = (waterMlToday / 1000).toFixed(1);
  const litersTarget = (target / 1000).toFixed(1);
  const remainingMl = Math.max(0, target - waterMlToday);
  const glassesDone = Math.floor(waterMlToday / 250);
  const glassesTarget = Math.max(1, Math.round(target / 250));

  const supportivePrompt =
    remainingMl === 0
      ? 'Daily hydration goal reached. Nice steady pacing today.'
      : remainingMl <= 250
      ? 'One more glass to reach today’s goal.'
      : `${remainingMl} ml remaining for today’s goal.`;

  const triggerAdd = async (ml: number, note?: string) => {
    if (ml <= 0 || busy) return;
    setBusy(true);
    try {
      await onAddWater(ml, note);
    } finally {
      setBusy(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(customMl);
    if (!Number.isFinite(val) || val < 25 || val > 2000) return;
    await triggerAdd(Math.round(val), 'Custom entry');
    setCustomOpen(false);
  };

  // Liquid Y position inside 160x160 circle (0% = 160, 100% = 0)
  const fillTopY = 160 - (pct / 100) * 150;

  return (
    <div className="rounded-3xl border border-sky-200/80 bg-gradient-to-br from-white via-sky-50/45 to-cyan-50/60 p-5 sm:p-6 text-slate-900 dark:border-sky-900/50 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/30 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300">
            <Droplets className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display-serif text-lg font-semibold tracking-tight">
              Water &amp; Hydration
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">{supportivePrompt}</p>
          </div>
        </div>
        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="inline-flex min-h-[40px] items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-sky-700 hover:bg-sky-100/70 whitespace-nowrap dark:text-sky-300 dark:hover:bg-sky-900/40"
          >
            History &amp; Goals <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className={`mt-5 flex flex-col items-center gap-6 ${compact ? 'sm:flex-row' : 'md:flex-row'}`}>
        {/* Signature Animated Water Orb */}
        <div className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full border-2 border-sky-300/80 bg-white/80 shadow-inner shadow-sky-200/60 overflow-hidden dark:border-sky-700/70 dark:bg-slate-950/70 dark:shadow-sky-950">
          <svg
            viewBox="0 0 160 160"
            className="absolute inset-0 h-full w-full"
            aria-label={`Hydration level ${litersDone} liters of ${litersTarget} liters`}
          >
            <defs>
              <linearGradient id="waterOrbGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0.96" />
              </linearGradient>
              <clipPath id="orbClip">
                <circle cx="80" cy="80" r="78" />
              </clipPath>
            </defs>

            <g clipPath="url(#orbClip)">
              {/* Back gentle wave */}
              <motion.g
                animate={shouldReduceMotion ? undefined : { y: 0 }}
                style={{ transform: `translateY(${fillTopY}px)` }}
                className="transition-transform duration-700 ease-out"
              >
                <path
                  d="M0,12 Q40,2 80,12 T160,12 T240,12 T320,12 L320,180 L0,180 Z"
                  fill="#0284C7"
                  fillOpacity="0.38"
                  className={shouldReduceMotion ? '' : 'animate-wave-reverse'}
                />
                {/* Front primary wave */}
                <path
                  d="M0,10 Q40,20 80,10 T160,10 T240,10 T320,10 L320,180 L0,180 Z"
                  fill="url(#waterOrbGrad)"
                  className={shouldReduceMotion ? '' : 'animate-wave-slow'}
                />
              </motion.g>

              {/* Low-intensity rising bubbles */}
              {!shouldReduceMotion && pct > 15 && (
                <g fill="#E0F2FE" fillOpacity="0.6">
                  <circle cx="52" cy="135" r="3" className="animate-bubble-1" />
                  <circle cx="96" cy="142" r="2.2" className="animate-bubble-2" />
                  <circle cx="74" cy="148" r="2.6" className="animate-bubble-3" />
                </g>
              )}
            </g>
          </svg>

          {/* Soft Glass Shine */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-3 h-14 w-6 -rotate-25 rounded-full bg-white/45 blur-[1px]"
          />

          <div className="relative z-10 text-center">
            <p
              className={`font-mono text-2xl font-bold tabular-nums ${
                pct > 54 ? 'text-white drop-shadow-xs' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {litersDone} L
            </p>
            <p
              className={`font-mono text-xs tabular-nums ${
                pct > 44 ? 'text-sky-50' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              of {litersTarget} L
            </p>
          </div>
        </div>

        {/* Readout + Tactile Quick Buttons */}
        <div className="flex-1 w-full space-y-4">
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-sky-200/70 bg-white/75 p-3.5 dark:border-sky-900/50 dark:bg-slate-950/60">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Glasses</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                {glassesDone} of {glassesTarget}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Remaining</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                {remainingMl} ml
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Progress</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-sky-700 dark:text-sky-300 tabular-nums">
                {pct}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[150, 250, 500].map((ml) => (
              <button
                key={ml}
                type="button"
                disabled={busy}
                onClick={() => triggerAdd(ml, `Quick +${ml} ml`)}
                className="min-h-[44px] rounded-xl border border-sky-300/80 bg-white/90 px-3 py-2 font-mono text-xs font-semibold text-sky-800 transition-transform active:scale-95 hover:bg-sky-50 disabled:opacity-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-sky-950/50"
              >
                +{ml} ml
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomOpen((o) => !o)}
              className="min-h-[44px] rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-transform active:scale-95 hover:bg-sky-700"
            >
              Custom
            </button>
          </div>

          {customOpen && (
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
              <label htmlFor="custom-water-ml" className="sr-only">
                Custom water amount in ml
              </label>
              <input
                id="custom-water-ml"
                type="number"
                min={25}
                max={2000}
                value={customMl}
                onChange={(e) => setCustomMl(e.target.value)}
                className="min-h-[44px] w-28 rounded-xl border border-sky-300 bg-white px-3 font-mono text-sm text-slate-900 dark:border-sky-800 dark:bg-slate-900 dark:text-slate-100"
              />
              <span className="text-xs text-slate-500">ml</span>
              <button
                type="submit"
                disabled={busy}
                className="min-h-[44px] rounded-xl bg-sky-700 px-4 text-xs font-semibold text-white hover:bg-sky-800"
              >
                Add Custom
              </button>
            </form>
          )}

          {recentUndoEntry && onUndoWater && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-300 bg-sky-100/75 px-3.5 py-2 text-xs text-sky-950 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100">
              <span>Added +{recentUndoEntry.amountMl} ml just now</span>
              <button
                type="button"
                onClick={() => onUndoWater(recentUndoEntry.id)}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-semibold text-sky-800 shadow-xs hover:bg-sky-50 dark:bg-slate-900 dark:text-sky-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Undo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
