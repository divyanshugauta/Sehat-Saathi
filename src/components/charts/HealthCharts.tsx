import React, { useState } from 'react';
import { formatShortDate } from '../../utils/dateUtils';

export function HealthScoreRing({
  score,
  size = 132,
  label = 'Health Score',
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const toneClass =
    clamped >= 70
      ? 'stroke-teal-600 dark:stroke-teal-400'
      : clamped >= 55
      ? 'stroke-amber-600 dark:stroke-amber-400'
      : 'stroke-rose-600 dark:stroke-rose-400';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-label={`${label}: ${clamped} out of 100`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${toneClass} transition-all duration-500`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
          {clamped}
        </span>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
    </div>
  );
}

export function CalorieRingChart({
  consumed,
  target,
}: {
  consumed: number;
  target: number;
}) {
  const size = 148;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(1, consumed / target) : 0;
  const offset = circumference - ratio * circumference;
  const remaining = target - consumed;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-label={`Calories consumed ${consumed} of ${target}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={
            consumed > target * 1.1
              ? 'stroke-amber-600 dark:stroke-amber-400'
              : 'stroke-teal-600 dark:stroke-teal-400'
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span className="font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
          {consumed}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
          {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
        </span>
      </div>
    </div>
  );
}

export interface BpPoint {
  date: string;
  systolic: number;
  diastolic: number;
}

export function BpZoneTrendChart({ data }: { data: BpPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No blood pressure logs yet.
      </div>
    );
  }

  const width = 620;
  const height = 220;
  const pad = { top: 16, right: 20, bottom: 28, left: 38 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const minVal = 55;
  const maxVal = Math.max(160, ...data.map((d) => d.systolic + 8));
  const yScale = (v: number) =>
    pad.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;
  const xScale = (i: number) =>
    data.length === 1 ? pad.left + innerW / 2 : pad.left + (i / (data.length - 1)) * innerW;

  const sysPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.systolic).toFixed(1)}`)
    .join(' ');
  const diaPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.diastolic).toFixed(1)}`)
    .join(' ');

  const highTop = pad.top;
  const highBottom = yScale(130);
  const elevBottom = yScale(120);
  const normBottom = yScale(minVal);

  const active = hoverIdx !== null ? data[hoverIdx] : data[data.length - 1];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400" />
            Systolic
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-500 dark:bg-slate-400" />
            Diastolic
          </span>
          <span className="hidden sm:inline">Zones: Normal &lt;120 · Elevated 120–129 · High ≥130</span>
        </div>
        {active && (
          <span className="font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
            {formatShortDate(active.date)}: {active.systolic}/{active.diastolic} mmHg
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
        role="img"
        aria-label="Blood pressure trend chart with normal, elevated, and high zones"
      >
        {/* Zone bands */}
        <rect
          x={pad.left}
          y={highTop}
          width={innerW}
          height={Math.max(0, highBottom - highTop)}
          className="fill-rose-500/8 dark:fill-rose-500/12"
        />
        <rect
          x={pad.left}
          y={highBottom}
          width={innerW}
          height={Math.max(0, elevBottom - highBottom)}
          className="fill-amber-500/10 dark:fill-amber-500/14"
        />
        <rect
          x={pad.left}
          y={elevBottom}
          width={innerW}
          height={Math.max(0, normBottom - elevBottom)}
          className="fill-emerald-500/7 dark:fill-emerald-500/10"
        />

        {/* Horizontal gridlines */}
        {[80, 100, 120, 130, 140].map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeDasharray={tick === 130 ? '4 3' : undefined}
              />
              <text
                x={pad.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono tabular-nums"
              >
                {tick}
              </text>
            </g>
          );
        })}

        <path d={sysPath} fill="none" className="stroke-teal-600 dark:stroke-teal-400" strokeWidth={2.2} />
        <path d={diaPath} fill="none" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth={2} strokeDasharray="3 3" />

        {data.map((d, i) => {
          const cx = xScale(i);
          const cySys = yScale(d.systolic);
          const cyDia = yScale(d.diastolic);
          const isHovered = hoverIdx === i;
          return (
            <g
              key={d.date}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <rect x={cx - 10} y={pad.top} width={20} height={innerH} fill="transparent" />
              <circle
                cx={cx}
                cy={cySys}
                r={isHovered ? 4.5 : 3}
                className={
                  d.systolic >= 130
                    ? 'fill-rose-600 dark:fill-rose-400'
                    : 'fill-teal-600 dark:fill-teal-400'
                }
              />
              <circle cx={cx} cy={cyDia} r={isHovered ? 4 : 2.5} className="fill-slate-500 dark:fill-slate-400" />
              {(i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) && (
                <text
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {formatShortDate(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function MetricLineChart({
  data,
  unit,
  color = 'teal',
  minOverride,
  maxOverride,
}: {
  data: Array<{ date: string; value: number }>;
  unit: string;
  color?: 'teal' | 'amber' | 'slate' | 'rose';
  minOverride?: number;
  maxOverride?: number;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No data logged yet.
      </div>
    );
  }

  const width = 520;
  const height = 165;
  const pad = { top: 14, right: 16, bottom: 24, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const vals = data.map((d) => d.value);
  const minVal = minOverride ?? Math.floor(Math.min(...vals) * 0.9);
  const maxVal = maxOverride ?? Math.ceil(Math.max(...vals, minVal + 10) * 1.05);

  const yScale = (v: number) =>
    pad.top + innerH - ((v - minVal) / Math.max(1, maxVal - minVal)) * innerH;
  const xScale = (i: number) =>
    data.length === 1 ? pad.left + innerW / 2 : pad.left + (i / (data.length - 1)) * innerW;

  const path = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.value).toFixed(1)}`)
    .join(' ');

  const strokeCls =
    color === 'amber'
      ? 'stroke-amber-600 dark:stroke-amber-400'
      : color === 'rose'
      ? 'stroke-rose-600 dark:stroke-rose-400'
      : color === 'slate'
      ? 'stroke-slate-600 dark:stroke-slate-300'
      : 'stroke-teal-600 dark:stroke-teal-400';

  const fillCls =
    color === 'amber'
      ? 'fill-amber-600 dark:fill-amber-400'
      : color === 'rose'
      ? 'fill-rose-600 dark:fill-rose-400'
      : color === 'slate'
      ? 'fill-slate-600 dark:fill-slate-300'
      : 'fill-teal-600 dark:fill-teal-400';

  const active = hoverIdx !== null ? data[hoverIdx] : data[data.length - 1];

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-end text-xs font-mono text-slate-700 dark:text-slate-300 tabular-nums">
        {formatShortDate(active.date)}: {active.value} {unit}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {[minVal, Math.round((minVal + maxVal) / 2), maxVal].map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <text
                x={pad.left - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono tabular-nums"
              >
                {tick}
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" className={strokeCls} strokeWidth={2.2} />
        {data.map((d, i) => {
          const cx = xScale(i);
          const cy = yScale(d.value);
          return (
            <g
              key={`${d.date}-${i}`}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <rect x={cx - 8} y={pad.top} width={16} height={innerH} fill="transparent" />
              <circle cx={cx} cy={cy} r={hoverIdx === i ? 4.5 : 2.8} className={fillCls} />
              {(i === 0 || i === data.length - 1) && (
                <text
                  x={cx}
                  y={height - 4}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {formatShortDate(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ActivityBarChart({
  data,
  goalLine,
  unit = 'min',
}: {
  data: Array<{ date: string; value: number }>;
  goalLine?: number;
  unit?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No activity data yet.
      </div>
    );
  }
  const maxVal = Math.max(goalLine ? goalLine * 1.2 : 10, ...data.map((d) => d.value), 10);

  return (
    <div className="space-y-2">
      <div className="flex h-36 items-end gap-1.5 pt-4">
        {data.map((d) => {
          const pct = Math.max(4, Math.min(100, Math.round((d.value / maxVal) * 100)));
          const met = goalLine ? d.value >= goalLine : d.value > 0;
          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center justify-end h-full"
              title={`${formatShortDate(d.date)}: ${d.value} ${unit}`}
            >
              <div
                style={{ height: `${pct}%` }}
                className={`w-full rounded-t transition-colors ${
                  met
                    ? 'bg-teal-600 dark:bg-teal-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
        <span>{formatShortDate(data[0].date)}</span>
        {goalLine !== undefined && <span>Daily target: {goalLine} {unit}</span>}
        <span>{formatShortDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

export function FogHeatmapGrid({
  days,
}: {
  days: Array<{ date: string; clarityScore: number | null }>;
}) {
  return (
    <div>
      <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-15">
        {days.map((d) => {
          let cls = 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800';
          if (d.clarityScore !== null) {
            if (d.clarityScore >= 80) cls = 'bg-teal-600/85 border-teal-700/30 text-white';
            else if (d.clarityScore >= 65) cls = 'bg-teal-500/45 border-teal-600/20 text-slate-900 dark:text-slate-100';
            else if (d.clarityScore >= 50) cls = 'bg-amber-400/55 border-amber-500/30 text-slate-900';
            else cls = 'bg-rose-500/65 border-rose-600/30 text-white';
          }
          return (
            <div
              key={d.date}
              title={`${formatShortDate(d.date)}: ${d.clarityScore !== null ? `${d.clarityScore}/100 clarity` : 'No check-in'}`}
              className={`flex h-8 items-center justify-center rounded border text-[10px] font-mono tabular-nums ${cls}`}
            >
              {d.clarityScore ?? '—'}
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>30-day clarity heatmap (higher = sharper focus)</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500/65" /> Foggy (&lt;50)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400/55" /> Mild (50–64)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-teal-600/85" /> Sharp (80+)
          </span>
        </div>
      </div>
    </div>
  );
}
