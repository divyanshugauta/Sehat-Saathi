import React from 'react';
import { CATEGORY_THEMES, type CategoryThemeId } from '../../theme/categoryThemes';

interface MetricCardProps {
  theme?: CategoryThemeId;
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  accent?: boolean;
  onClick?: () => void;
}

export function MetricCard({
  theme = 'general',
  label,
  value,
  unit,
  subtitle,
  accent = false,
  onClick,
}: MetricCardProps) {
  const t = CATEGORY_THEMES[theme];
  const base = `rounded-2xl border p-4 sm:p-5 text-left transition-colors ${t.panelClass}`;

  const content = (
    <>
      <p className={`text-xs font-medium ${t.mutedTextClass}`}>{label}</p>
      <p
        className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
          accent ? t.accentTextClass : ''
        }`}
      >
        {value}
        {unit && <span className={`ml-1 text-xs font-normal ${t.mutedTextClass}`}>{unit}</span>}
      </p>
      {subtitle && <p className={`mt-1 text-xs ${t.mutedTextClass}`}>{subtitle}</p>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} w-full hover:opacity-95 focus-visible:outline-none focus-visible:ring-2`}
      >
        {content}
      </button>
    );
  }

  return <div className={base}>{content}</div>;
}
