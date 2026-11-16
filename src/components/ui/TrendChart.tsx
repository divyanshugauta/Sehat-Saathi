import React, { useState } from 'react';
import { formatShortDate } from '../../utils/dateUtils';

interface TrendChartProps {
  data: Array<{ date: string; value: number }>;
  unit: string;
  strokeColor?: string;
  darkSurface?: boolean;
  minOverride?: number;
  maxOverride?: number;
  height?: number;
}

export function TrendChart({
  data,
  unit,
  strokeColor = '#0EA5E9',
  darkSurface = false,
  minOverride,
  maxOverride,
  height = 170,
}: TrendChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div
        className={`flex h-40 items-center justify-center text-sm ${
          darkSurface ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        No readings logged yet.
      </div>
    );
  }

  const width = 540;
  const pad = { top: 16, right: 16, bottom: 26, left: 38 };
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

  const active = hoverIdx !== null ? data[hoverIdx] : data[data.length - 1];

  return (
    <div>
      <div
        className={`mb-1.5 flex items-center justify-end font-mono text-xs tabular-nums ${
          darkSurface ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'
        }`}
      >
        {formatShortDate(active.date)}: {active.value} {unit}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible">
        {[minVal, Math.round((minVal + maxVal) / 2), maxVal].map((tick) => {
          const y = yScale(tick);
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke={darkSurface ? 'rgba(255,255,255,0.1)' : 'rgba(148,163,184,0.25)'}
              />
              <text
                x={pad.left - 8}
                y={y + 4}
                textAnchor="end"
                className={`text-[10px] font-mono tabular-nums ${
                  darkSurface ? 'fill-slate-400' : 'fill-slate-400'
                }`}
              >
                {tick}
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke={strokeColor} strokeWidth={2.4} strokeLinecap="round" />
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
              <rect x={cx - 10} y={pad.top} width={20} height={innerH} fill="transparent" />
              <circle
                cx={cx}
                cy={cy}
                r={hoverIdx === i ? 4.8 : 3}
                fill={strokeColor}
              />
              {(i === 0 || i === data.length - 1) && (
                <text
                  x={cx}
                  y={height - 5}
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
