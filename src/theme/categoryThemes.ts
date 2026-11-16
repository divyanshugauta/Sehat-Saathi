export type CategoryThemeId =
  | 'general'
  | 'water'
  | 'brainfog'
  | 'cardio'
  | 'dental'
  | 'sleep';

export interface CategoryTheme {
  id: CategoryThemeId;
  name: string;
  canvasClass: string;
  panelClass: string;
  mutedTextClass: string;
  headingClass: string;
  accentTextClass: string;
  primaryButtonClass: string;
  isDarkWorld: boolean;
}

export const CATEGORY_THEMES: Record<CategoryThemeId, CategoryTheme> = {
  general: {
    id: 'general',
    name: 'General Wellness',
    canvasClass: 'bg-[#FAF6EF] text-[#1E1A16] dark:bg-[#111318] dark:text-[#F4EFE6]',
    panelClass:
      'bg-[#FFFDF9] border-[#E8DFD1] text-[#1E1A16] dark:bg-[#171A21] dark:border-[#262B36] dark:text-[#F4EFE6]',
    mutedTextClass: 'text-[#6B6156] dark:text-[#A49B8E]',
    headingClass: 'font-display-serif text-[#1E1A16] dark:text-[#F7F2EA]',
    accentTextClass: 'text-[#E05A2B] dark:text-[#FB923C]',
    primaryButtonClass:
      'bg-[#E05A2B] hover:bg-[#C84A1E] text-white focus-visible:ring-[#E05A2B]',
    isDarkWorld: false,
  },
  water: {
    id: 'water',
    name: 'Water & Hydration',
    canvasClass: 'bg-[#FAF6EF] text-[#1E1A16] dark:bg-[#111318] dark:text-[#F4EFE6]',
    panelClass:
      'bg-white/90 border-sky-200/80 text-slate-900 dark:bg-slate-900/90 dark:border-sky-900/60 dark:text-slate-100',
    mutedTextClass: 'text-slate-600 dark:text-slate-400',
    headingClass: 'font-display-serif text-slate-900 dark:text-slate-50',
    accentTextClass: 'text-sky-700 dark:text-sky-400',
    primaryButtonClass:
      'bg-sky-600 hover:bg-sky-700 text-white focus-visible:ring-sky-500',
    isDarkWorld: false,
  },
  brainfog: {
    id: 'brainfog',
    name: 'Brain Fog',
    canvasClass: 'bg-[#070911] text-slate-100',
    panelClass: 'bg-[#0F1322]/90 border-violet-500/25 text-slate-100 backdrop-blur-md',
    mutedTextClass: 'text-slate-300',
    headingClass: 'font-display-serif text-white',
    accentTextClass: 'text-cyan-300',
    primaryButtonClass:
      'bg-violet-600 hover:bg-violet-500 text-white focus-visible:ring-violet-400',
    isDarkWorld: true,
  },
  cardio: {
    id: 'cardio',
    name: 'Cardiovascular',
    canvasClass: 'bg-gradient-to-b from-[#0E070A] via-[#190910] to-[#11080B] text-[#FDF2F5]',
    panelClass: 'bg-[#1C0D14]/90 border-rose-300/20 text-[#FDF2F5] backdrop-blur-md',
    mutedTextClass: 'text-rose-100/75',
    headingClass: 'font-display-serif text-[#FFF5F7]',
    accentTextClass: 'text-pink-300',
    primaryButtonClass:
      'bg-rose-500 hover:bg-rose-400 text-white focus-visible:ring-pink-300',
    isDarkWorld: true,
  },
  dental: {
    id: 'dental',
    name: 'Dental Care',
    canvasClass: 'bg-[#06070A] text-slate-100',
    panelClass: 'bg-[#101218]/90 border-slate-300/15 text-slate-100 backdrop-blur-md',
    mutedTextClass: 'text-slate-300',
    headingClass: 'font-display-serif text-slate-50',
    accentTextClass: 'text-teal-300',
    primaryButtonClass:
      'bg-teal-500 hover:bg-teal-400 text-slate-950 focus-visible:ring-teal-300',
    isDarkWorld: true,
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep & Stress',
    canvasClass: 'bg-gradient-to-b from-[#0B1221] via-[#111B33] to-[#0D1528] text-slate-100',
    panelClass: 'bg-[#141F3A]/90 border-indigo-300/20 text-slate-100 backdrop-blur-md',
    mutedTextClass: 'text-indigo-100/75',
    headingClass: 'font-display-serif text-indigo-50',
    accentTextClass: 'text-violet-300',
    primaryButtonClass:
      'bg-indigo-500 hover:bg-indigo-400 text-white focus-visible:ring-indigo-300',
    isDarkWorld: true,
  },
};
