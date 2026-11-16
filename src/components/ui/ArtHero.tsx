import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CATEGORY_THEMES, type CategoryThemeId } from '../../theme/categoryThemes';

interface ArtHeroProps {
  theme: CategoryThemeId;
  eyebrow: string;
  title: string;
  subtitle: string;
  artwork?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
}

export function ArtHero({
  theme,
  eyebrow,
  title,
  subtitle,
  artwork,
  actions,
  aside,
}: ArtHeroProps) {
  const t = CATEGORY_THEMES[theme];
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${t.panelClass}`}
    >
      {t.isDarkWorld && <div aria-hidden="true" className="hero-grain pointer-events-none absolute inset-0 opacity-60" />}

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        <div className={artwork ? 'lg:col-span-7 space-y-4' : 'lg:col-span-8 space-y-4'}>
          <p className={`text-xs font-medium tracking-wide ${t.accentTextClass}`}>{eyebrow}</p>
          <h2
            className={`${t.headingClass} text-3xl sm:text-4xl font-semibold tracking-tight text-balance leading-[1.15]`}
          >
            {title}
          </h2>
          <p className={`max-w-xl text-sm sm:text-base leading-relaxed ${t.mutedTextClass}`}>
            {subtitle}
          </p>
          {actions && <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div>}
        </div>

        {artwork ? (
          <div className="lg:col-span-5 flex items-center justify-center">{artwork}</div>
        ) : aside ? (
          <div className="lg:col-span-4">{aside}</div>
        ) : null}
      </div>
    </motion.section>
  );
}
