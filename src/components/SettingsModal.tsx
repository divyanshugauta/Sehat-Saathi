import React, { useState } from 'react';
import { Download, Moon, RotateCcw, Sun, Trash2, X } from 'lucide-react';
import type { UserProfile } from '../types/health';

interface SettingsModalProps {
  open: boolean;
  profile: UserProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onClose: () => void;
  onSaveThresholds: (patch: Partial<UserProfile>) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onDeleteAll: () => Promise<void>;
}

export function SettingsModal({
  open,
  profile,
  darkMode,
  onToggleDarkMode,
  onClose,
  onSaveThresholds,
  onResetDemo,
  onDeleteAll,
}: SettingsModalProps) {
  const [sysHigh, setSysHigh] = useState(String(profile.bpThresholds.systolicHigh));
  const [diaHigh, setDiaHigh] = useState(String(profile.bpThresholds.diastolicHigh));
  const [calTarget, setCalTarget] = useState(String(profile.calorieTarget));
  const [actTarget, setActTarget] = useState(String(profile.activityGoalMinWeek));
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveThresholds({
      calorieTarget: Number(calTarget || 2000),
      activityGoalMinWeek: Number(actTarget || 150),
      bpThresholds: {
        ...profile.bpThresholds,
        systolicHigh: Number(sysHigh || 130),
        diastolicHigh: Number(diaHigh || 80),
      },
    });
    onClose();
  };

  const handleExport = () => {
    window.location.href = '/api/export';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Settings and Privacy Controls"
    >
      <div className="w-full max-w-md rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="font-display-serif text-xl font-semibold text-[#1E1A16] dark:text-slate-100">
            Settings &amp; Privacy
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-xl p-1.5 text-[#6B6156] hover:bg-black/5 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#E8DFD1] p-3 dark:border-slate-800">
          <span className="text-sm font-medium text-[#1E1A16] dark:text-slate-200">Appearance</span>
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#E8DFD1] bg-[#FAF6EF] px-3 py-1.5 text-xs font-medium text-[#1E1A16] hover:bg-[#FCE7D8]/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {darkMode ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="st-sys" className="block text-xs text-[#6B6156]">
                BP Alert Systolic (≥)
              </label>
              <input
                id="st-sys"
                type="number"
                value={sysHigh}
                onChange={(e) => setSysHigh(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E8DFD1] px-2.5 py-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label htmlFor="st-dia" className="block text-xs text-[#6B6156]">
                BP Alert Diastolic (≥)
              </label>
              <input
                id="st-dia"
                type="number"
                value={diaHigh}
                onChange={(e) => setDiaHigh(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E8DFD1] px-2.5 py-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label htmlFor="st-cal" className="block text-xs text-[#6B6156]">
                Daily Calorie Target
              </label>
              <input
                id="st-cal"
                type="number"
                value={calTarget}
                onChange={(e) => setCalTarget(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E8DFD1] px-2.5 py-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div>
              <label htmlFor="st-act" className="block text-xs text-[#6B6156]">
                Weekly Activity Goal (m)
              </label>
              <input
                id="st-act"
                type="number"
                value={actTarget}
                onChange={(e) => setActTarget(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E8DFD1] px-2.5 py-1.5 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="min-h-[44px] w-full rounded-xl bg-[#E05A2B] py-2 text-sm font-semibold text-white hover:bg-[#C84A1E]"
          >
            Save Thresholds &amp; Goals
          </button>
        </form>

        <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">Data Privacy Controls</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap dark:border-slate-700 dark:text-slate-200"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={async () => {
                await onResetDemo();
                onClose();
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap dark:border-slate-700 dark:text-slate-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore Demo Data
            </button>
          </div>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete All Profile Data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await onDeleteAll();
                  setConfirmDelete(false);
                  onClose();
                }}
                className="flex-1 rounded-lg bg-rose-600 py-2 text-xs font-medium text-white hover:bg-rose-700"
              >
                Confirm Delete All
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
