import React from 'react';
import { Printer, X } from 'lucide-react';
import type { CorrelationInsight, DailySummary, UserProfile } from '../types/health';
import { formatShortDate, getTodayIso } from '../utils/dateUtils';

interface DoctorReportModalProps {
  open: boolean;
  profile: UserProfile;
  summaries: DailySummary[];
  correlations: CorrelationInsight[];
  onClose: () => void;
}

export function DoctorReportModal({
  open,
  profile,
  summaries,
  correlations,
  onClose,
}: DoctorReportModalProps) {
  if (!open) return null;

  const last30 = summaries.slice(-30);
  const bpDays = last30.filter((d) => d.avgSystolic !== null && d.avgDiastolic !== null);
  const avgSys = bpDays.length
    ? Math.round(bpDays.reduce((s, d) => s + (d.avgSystolic ?? 0), 0) / bpDays.length)
    : null;
  const avgDia = bpDays.length
    ? Math.round(bpDays.reduce((s, d) => s + (d.avgDiastolic ?? 0), 0) / bpDays.length)
    : null;
  const avgRhr = bpDays.length
    ? Math.round(bpDays.reduce((s, d) => s + (d.avgRhr ?? 0), 0) / bpDays.length)
    : null;
  const medDays = last30.filter((d) => d.medicationTaken !== null);
  const medAdherence = medDays.length
    ? Math.round((medDays.filter((d) => d.medicationTaken).length / medDays.length) * 100)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Doctor Clinical Summary Report"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Doctor-Ready Health Summary
            </h2>
            <p className="text-xs text-slate-500">Generated {formatShortDate(getTodayIso())}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close doctor report"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-4 sm:grid-cols-4 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500">Patient</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{profile.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Age / Weight</p>
              <p className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {profile.age}y · {profile.weightKg} kg
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">30-Day Avg BP</p>
              <p className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {avgSys ? `${avgSys}/${avgDia} mmHg` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg RHR / Meds</p>
              <p className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {avgRhr ?? '—'} bpm · {medAdherence ?? '—'}%
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Observed Cross-Module Patterns
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
              {correlations.map((c) => (
                <li key={c.id}>
                  <strong>{c.title}:</strong> {c.summary}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recent 7-Day Daily Readings
            </h3>
            <table className="mt-2 w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="py-1.5">Date</th>
                  <th className="py-1.5 text-right">BP</th>
                  <th className="py-1.5 text-right">RHR</th>
                  <th className="py-1.5 text-right">Sodium</th>
                  <th className="py-1.5 text-right">Sleep</th>
                  <th className="py-1.5 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums dark:divide-slate-800">
                {last30.slice(-7).map((d) => (
                  <tr key={d.date}>
                    <td className="py-1.5">{formatShortDate(d.date)}</td>
                    <td className="py-1.5 text-right">
                      {d.avgSystolic ? `${d.avgSystolic}/${d.avgDiastolic}` : '—'}
                    </td>
                    <td className="py-1.5 text-right">{d.avgRhr ?? '—'}</td>
                    <td className="py-1.5 text-right">{d.sodiumMg} mg</td>
                    <td className="py-1.5 text-right">{d.sleepHours ?? '—'}h</td>
                    <td className="py-1.5 text-right">{d.activityMinutes}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 dark:border-slate-800">
            Disclaimer: Self-logged wellness data exported from Meridian Health. Not a clinical diagnostic report.
          </p>
        </div>
      </div>
    </div>
  );
}
