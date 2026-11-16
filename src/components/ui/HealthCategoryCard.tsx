import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface HealthCategoryCardProps {
  title: string;
  metric: string;
  unit?: string;
  detail: string;
  moodClass: string;
  accentDotClass: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function HealthCategoryCard({
  title,
  metric,
  unit,
  detail,
  moodClass,
  accentDotClass,
  icon,
  onClick,
}: HealthCategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A2B] min-h-[138px] ${moodClass}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${accentDotClass}`}>
            {icon}
          </span>
          <span className="text-xs font-semibold tracking-tight">{title}</span>
        </div>
        <ArrowUpRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
      </div>

      <div className="mt-4">
        <p className="font-mono text-2xl font-semibold tabular-nums">
          {metric}
          {unit && <span className="ml-1 text-xs font-normal opacity-75">{unit}</span>}
        </p>
        <p className="mt-1 text-xs opacity-80">{detail}</p>
      </div>
    </button>
  );
}
