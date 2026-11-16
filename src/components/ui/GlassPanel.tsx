import React from 'react';
import { CATEGORY_THEMES, type CategoryThemeId } from '../../theme/categoryThemes';

interface GlassPanelProps {
  theme?: CategoryThemeId;
  className?: string;
  children: React.ReactNode;
}

export function GlassPanel({ theme = 'general', className = '', children }: GlassPanelProps) {
  const t = CATEGORY_THEMES[theme];
  return (
    <div className={`rounded-2xl border transition-colors ${t.panelClass} ${className}`}>
      {children}
    </div>
  );
}
