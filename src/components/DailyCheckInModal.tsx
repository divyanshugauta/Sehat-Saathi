import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { BrainFogCheckin, CardioLog, DentalLog, UserProfile } from '../types/health';
import { getTodayIso } from '../utils/dateUtils';

interface DailyCheckInModalProps {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaveUnified: (payload: {
    fog: Omit<BrainFogCheckin, 'id' | 'userId'>;
    dental: Omit<DentalLog, 'id' | 'userId'>;
    cardio?: Omit<CardioLog, 'id' | 'userId'>;
    waterMlAdded: number;
  }) => Promise<void>;
}

export function DailyCheckInModal({
  open,
  profile,
  onClose,
  onSaveUnified,
}: DailyCheckInModalProps) {
  const [clarity, setClarity] = useState(4);
  const [energy, setEnergy] = useState(4);
  const [focus, setFocus] = useState(4);
  const [sleepHours, setSleepHours] = useState('7.4');
  const [brushedAm, setBrushedAm] = useState(true);
  const [brushedPm, setBrushedPm] = useState(false);
  const [flossed, setFlossed] = useState(true);
  const [includeBp, setIncludeBp] = useState(false);
  const [systolic, setSystolic] = useState('119');
  const [diastolic, setDiastolic] = useState('76');
  const [rhr, setRhr] = useState('64');
  const [waterAdd, setWaterAdd] = useState('500');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const todayIso = getTodayIso();
    try {
      await onSaveUnified({
        fog: {
          date: todayIso,
          focus,
          memory: clarity,
          clarity,
          mood: energy,
          energy,
          sleepHours: Number(sleepHours || 7),
          sleepQuality: clarity,
          caffeineMg: 120,
          stressLevel: 2,
          screenTimeHours: 6,
          waterMl: 1800,
        },
        dental: {
          date: todayIso,
          brushedAm,
          brushedPm,
          flossed,
          mouthwash: false,
          sugarSnacks: 0,
          painLevel: 0,
          gumBleeding: false,
          swelling: false,
        },
        cardio: includeBp
          ? {
              date: todayIso,
              timeOfDay: new Date().getHours() < 15 ? 'morning' : 'evening',
              timestamp: new Date().toISOString(),
              systolic: Number(systolic || 120),
              diastolic: Number(diastolic || 78),
              heartRate: Number(rhr || 66),
              steps: 4500,
              activityMinutes: 25,
              weightKg: profile.weightKg,
              medicationTaken: true,
            }
          : undefined,
        waterMlAdded: Number(waterAdd || 0),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Unified Daily Check-In"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Unified Daily Check-In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update brain fog, oral care, hydration, and optional BP for {profile.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close daily check-in"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="ci-clarity" className="block text-xs text-slate-500">
                Clarity (1–5)
              </label>
              <input
                id="ci-clarity"
                type="number"
                min={1}
                max={5}
                value={clarity}
                onChange={(e) => setClarity(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label htmlFor="ci-focus" className="block text-xs text-slate-500">
                Focus (1–5)
              </label>
              <input
                id="ci-focus"
                type="number"
                min={1}
                max={5}
                value={focus}
                onChange={(e) => setFocus(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label htmlFor="ci-energy" className="block text-xs text-slate-500">
                Energy (1–5)
              </label>
              <input
                id="ci-energy"
                type="number"
                min={1}
                max={5}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label htmlFor="ci-sleep" className="block text-xs text-slate-500">
                Sleep (hrs)
              </label>
              <input
                id="ci-sleep"
                type="number"
                step="0.1"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={brushedAm} onChange={(e) => setBrushedAm(e.target.checked)} />
              Brushed AM
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={brushedPm} onChange={(e) => setBrushedPm(e.target.checked)} />
              Brushed PM
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={flossed} onChange={(e) => setFlossed(e.target.checked)} />
              Flossed
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div>
              <label htmlFor="ci-water" className="block text-xs text-slate-500">
                Add Water (ml)
              </label>
              <input
                id="ci-water"
                type="number"
                value={waterAdd}
                onChange={(e) => setWaterAdd(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="flex items-end pb-1.5">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={includeBp} onChange={(e) => setIncludeBp(e.target.checked)} />
                Also log Blood Pressure
              </label>
            </div>
          </div>

          {includeBp && (
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
              <div>
                <label htmlFor="ci-sys" className="block text-xs text-slate-500">Systolic</label>
                <input
                  id="ci-sys"
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label htmlFor="ci-dia" className="block text-xs text-slate-500">Diastolic</label>
                <input
                  id="ci-dia"
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label htmlFor="ci-rhr" className="block text-xs text-slate-500">Heart Rate</label>
                <input
                  id="ci-rhr"
                  type="number"
                  value={rhr}
                  onChange={(e) => setRhr(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Check-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
