import React, { useState } from 'react';
import { Download, Moon, RotateCcw, Sun, Trash2, Users } from 'lucide-react';
import type { UserProfile } from '../types/health';

interface ProfileViewProps {
  profiles: UserProfile[];
  activeProfile: UserProfile;
  darkMode: boolean;
  onSelectProfile: (userId: string) => Promise<void>;
  onToggleDarkMode: () => void;
  onSaveThresholds: (patch: Partial<UserProfile>) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onDeleteAll: () => Promise<void>;
}

export function ProfileView({
  profiles,
  activeProfile,
  darkMode,
  onSelectProfile,
  onToggleDarkMode,
  onSaveThresholds,
  onResetDemo,
  onDeleteAll,
}: ProfileViewProps) {
  const [sysHigh, setSysHigh] = useState(String(activeProfile.bpThresholds.systolicHigh));
  const [diaHigh, setDiaHigh] = useState(String(activeProfile.bpThresholds.diastolicHigh));
  const [calTarget, setCalTarget] = useState(String(activeProfile.calorieTarget));
  const [waterTarget, setWaterTarget] = useState(String(activeProfile.waterTargetMl));
  const [actTarget, setActTarget] = useState(String(activeProfile.activityGoalMinWeek));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice('');
    await onSaveThresholds({
      calorieTarget: Number(calTarget || 2000),
      waterTargetMl: Number(waterTarget || 2500),
      activityGoalMinWeek: Number(actTarget || 150),
      bpThresholds: {
        ...activeProfile.bpThresholds,
        systolicHigh: Number(sysHigh || 130),
        diastolicHigh: Number(diaHigh || 80),
      },
    });
    setSavedNotice('Personal goals & thresholds updated.');
  };

  const handleExport = () => {
    window.location.href = '/api/export';
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Active Family Profile Switcher */}
      <section className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#E05A2B]" />
            <h2 className="font-display-serif text-xl font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
              Family Care Profiles
            </h2>
          </div>
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#E8DFD1] bg-[#FAF6EF] px-4 text-xs font-semibold text-[#1E1A16] hover:bg-[#FCE7D8]/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {darkMode ? 'Switch to Warm Ivory' : 'Switch to Dark Mode'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {profiles.map((p) => {
            const isActive = p.id === activeProfile.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProfile(p.id)}
                className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors ${
                  isActive
                    ? 'border-[#E05A2B] bg-[#FCE7D8]/45 dark:border-orange-500 dark:bg-orange-950/25'
                    : 'border-[#E8DFD1] bg-[#FAF6EF] hover:border-[#E05A2B]/40 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <img
                  src={p.avatarUrl}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-full object-cover bg-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[#1E1A16] dark:text-slate-100">
                    {p.name}
                  </p>
                  <p className="text-xs text-[#6B6156] dark:text-slate-400">
                    {p.relationship} · Age {p.age} · {p.weightKg} kg
                  </p>
                </div>
                {isActive && (
                  <span className="rounded-lg bg-[#E05A2B] px-2.5 py-1 text-[11px] font-semibold text-white">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Goals & Clinical Alert Thresholds */}
      <section className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
        <h3 className="font-display-serif text-lg font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
          Daily Targets &amp; Alert Thresholds
        </h3>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="pf-water" className="block text-xs text-[#6B6156] dark:text-slate-400">
                Daily Water Goal (ml)
              </label>
              <input
                id="pf-water"
                type="number"
                value={waterTarget}
                onChange={(e) => setWaterTarget(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label htmlFor="pf-cal" className="block text-xs text-[#6B6156] dark:text-slate-400">
                Daily Calorie Target (kcal)
              </label>
              <input
                id="pf-cal"
                type="number"
                value={calTarget}
                onChange={(e) => setCalTarget(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label htmlFor="pf-act" className="block text-xs text-[#6B6156] dark:text-slate-400">
                Weekly Activity Goal (min)
              </label>
              <input
                id="pf-act"
                type="number"
                value={actTarget}
                onChange={(e) => setActTarget(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label htmlFor="pf-sys" className="block text-xs text-[#6B6156] dark:text-slate-400">
                BP Alert Systolic (≥ mmHg)
              </label>
              <input
                id="pf-sys"
                type="number"
                value={sysHigh}
                onChange={(e) => setSysHigh(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label htmlFor="pf-dia" className="block text-xs text-[#6B6156] dark:text-slate-400">
                BP Alert Diastolic (≥ mmHg)
              </label>
              <input
                id="pf-dia"
                type="number"
                value={diaHigh}
                onChange={(e) => setDiaHigh(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#E8DFD1] bg-white px-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="min-h-[46px] rounded-2xl bg-[#E05A2B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#C84A1E]"
          >
            Save Personal Goals
          </button>
          {savedNotice && <p className="text-xs font-medium text-[#6D5CAE]">{savedNotice}</p>}
        </form>
      </section>

      {/* Privacy & Data Controls */}
      <section className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 space-y-3 dark:border-[#262B36] dark:bg-[#171A21]">
        <h3 className="font-display-serif text-lg font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
          Data Privacy &amp; Portability
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E8DFD1] bg-[#FAF6EF] px-4 text-xs font-semibold text-[#1E1A16] hover:bg-[#FCE7D8]/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E8DFD1] bg-[#FAF6EF] px-4 text-xs font-semibold text-[#1E1A16] hover:bg-[#FCE7D8]/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <RotateCcw className="h-4 w-4" />
            Restore Demo Data
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-200 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
            >
              <Trash2 className="h-4 w-4" />
              Delete All Profile Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await onDeleteAll();
                  setConfirmDelete(false);
                }}
                className="min-h-[44px] rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Confirm Delete All
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[44px] rounded-xl border border-[#E8DFD1] px-3 text-xs dark:border-slate-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
