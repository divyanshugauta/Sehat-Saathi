import React, { useState } from 'react';
import { Brain, Droplets, HeartPulse, Smile, Utensils, X } from 'lucide-react';
import type {
  BrainFogCheckin,
  CardioLog,
  DentalLog,
  MealLog,
  UserProfile,
} from '../../types/health';
import { getTodayIso } from '../../utils/dateUtils';

interface QuickLogSheetProps {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
  onAddWater: (amountMl: number, note?: string) => Promise<void>;
  onSaveFog: (entry: Omit<BrainFogCheckin, 'id' | 'userId'>) => Promise<void>;
  onAddCardio: (entry: Omit<CardioLog, 'id' | 'userId'>) => Promise<void>;
  onSaveDental: (entry: Omit<DentalLog, 'id' | 'userId'>) => Promise<void>;
  onAddMealQuick: (text: string) => Promise<void>;
}

export function QuickLogSheet({
  open,
  profile,
  onClose,
  onAddWater,
  onSaveFog,
  onAddCardio,
  onSaveDental,
  onAddMealQuick,
}: QuickLogSheetProps) {
  const [tab, setTab] = useState<'water' | 'fog' | 'cardio' | 'dental' | 'meal'>('water');
  const [waterMl, setWaterMl] = useState('250');
  const [clarity, setClarity] = useState(4);
  const [energy, setEnergy] = useState(4);
  const [sleepHours, setSleepHours] = useState('7.5');
  const [systolic, setSystolic] = useState('118');
  const [diastolic, setDiastolic] = useState('76');
  const [rhr, setRhr] = useState('64');
  const [brushedAm, setBrushedAm] = useState(true);
  const [brushedPm, setBrushedPm] = useState(false);
  const [flossed, setFlossed] = useState(true);
  const [mealText, setMealText] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;
  const todayIso = getTodayIso();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (tab === 'water') {
        await onAddWater(Math.max(25, Number(waterMl || 250)), 'Quick sheet');
      } else if (tab === 'fog') {
        await onSaveFog({
          date: todayIso,
          focus: clarity,
          memory: clarity,
          clarity,
          mood: energy,
          energy,
          sleepHours: Number(sleepHours || 7),
          sleepQuality: clarity,
          caffeineMg: 100,
          stressLevel: 2,
          screenTimeHours: 6,
          waterMl: 1800,
        });
      } else if (tab === 'cardio') {
        await onAddCardio({
          date: todayIso,
          timeOfDay: new Date().getHours() < 15 ? 'morning' : 'evening',
          timestamp: new Date().toISOString(),
          systolic: Number(systolic || 120),
          diastolic: Number(diastolic || 78),
          heartRate: Number(rhr || 65),
          steps: 5000,
          activityMinutes: 30,
          weightKg: profile.weightKg,
          medicationTaken: true,
        });
      } else if (tab === 'dental') {
        await onSaveDental({
          date: todayIso,
          brushedAm,
          brushedPm,
          flossed,
          mouthwash: false,
          tongueCleaned: true,
          sugarSnacks: 0,
          painLevel: 0,
          gumBleeding: false,
          swelling: false,
        });
      } else if (tab === 'meal' && mealText.trim()) {
        await onAddMealQuick(mealText.trim());
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Quick Health Log Sheet"
    >
      <div className="w-full max-w-lg rounded-t-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-5 sm:rounded-3xl sm:p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#E8DFD1] sm:hidden dark:bg-slate-700" />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display-serif text-xl font-semibold text-[#1E1A16] dark:text-slate-100">
              Quick Log
            </h2>
            <p className="text-xs text-[#6B6156] dark:text-slate-400">
              Add an entry for {profile.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick log sheet"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#6B6156] hover:bg-black/5 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1.5 rounded-2xl bg-[#F4ECE0] p-1 dark:bg-slate-800">
          {[
            { id: 'water', label: 'Water', icon: Droplets },
            { id: 'fog', label: 'Fog', icon: Brain },
            { id: 'cardio', label: 'Heart', icon: HeartPulse },
            { id: 'dental', label: 'Dental', icon: Smile },
            { id: 'meal', label: 'Meal', icon: Utensils },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as typeof tab)}
                className={`flex min-h-[42px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition-colors ${
                  tab === item.id
                    ? 'bg-white text-[#1E1A16] shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-[#6B6156] dark:text-slate-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {tab === 'water' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {['150', '250', '500'].map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    onClick={() => setWaterMl(ml)}
                    className={`min-h-[44px] rounded-xl border font-mono text-sm font-semibold ${
                      waterMl === ml
                        ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                        : 'border-[#E8DFD1] dark:border-slate-700'
                    }`}
                  >
                    +{ml} ml
                  </button>
                ))}
              </div>
              <div>
                <label htmlFor="ql-water" className="block text-xs text-[#6B6156] dark:text-slate-400">
                  Amount (ml)
                </label>
                <input
                  id="ql-water"
                  type="number"
                  value={waterMl}
                  onChange={(e) => setWaterMl(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {tab === 'fog' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="ql-clarity" className="block text-xs text-[#6B6156]">Clarity (1–5)</label>
                <input
                  id="ql-clarity"
                  type="number"
                  min={1}
                  max={5}
                  value={clarity}
                  onChange={(e) => setClarity(Number(e.target.value))}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label htmlFor="ql-energy" className="block text-xs text-[#6B6156]">Energy (1–5)</label>
                <input
                  id="ql-energy"
                  type="number"
                  min={1}
                  max={5}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label htmlFor="ql-sleep" className="block text-xs text-[#6B6156]">Sleep (hrs)</label>
                <input
                  id="ql-sleep"
                  type="number"
                  step="0.1"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {tab === 'cardio' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="ql-sys" className="block text-xs text-[#6B6156]">Systolic</label>
                <input
                  id="ql-sys"
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label htmlFor="ql-dia" className="block text-xs text-[#6B6156]">Diastolic</label>
                <input
                  id="ql-dia"
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label htmlFor="ql-rhr" className="block text-xs text-[#6B6156]">Heart Rate</label>
                <input
                  id="ql-rhr"
                  type="number"
                  value={rhr}
                  onChange={(e) => setRhr(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {tab === 'dental' && (
            <div className="flex flex-wrap gap-4 py-1 text-sm">
              <label className="inline-flex min-h-[44px] items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={brushedAm} onChange={(e) => setBrushedAm(e.target.checked)} />
                Morning Brush
              </label>
              <label className="inline-flex min-h-[44px] items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={brushedPm} onChange={(e) => setBrushedPm(e.target.checked)} />
                Night Brush
              </label>
              <label className="inline-flex min-h-[44px] items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={flossed} onChange={(e) => setFlossed(e.target.checked)} />
                Flossed
              </label>
            </div>
          )}

          {tab === 'meal' && (
            <div>
              <label htmlFor="ql-meal" className="block text-xs text-[#6B6156]">
                Describe your meal (supports Indian &amp; global dishes)
              </label>
              <input
                id="ql-meal"
                type="text"
                placeholder="e.g., Two rotis and dal tadka"
                value={mealText}
                onChange={(e) => setMealText(e.target.value)}
                required
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="min-h-[48px] w-full rounded-2xl bg-[#E05A2B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#C84A1E] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}
