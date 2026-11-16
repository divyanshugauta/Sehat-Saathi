import React from 'react';
import { CalendarDays, HeartHandshake, Home, Plus, User } from 'lucide-react';
import type { ModuleTab } from '../../types/health';

interface AccessibleBottomNavProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  onOpenAdd: () => void;
}

export function AccessibleBottomNav({
  activeTab,
  onSelectTab,
  onOpenAdd,
}: AccessibleBottomNavProps) {
  const isToday = activeTab === 'overview';
  const isPlan = activeTab === 'plan' || activeTab === 'nutrition' || activeTab === 'water';
  const isCare =
    activeTab === 'assistant' ||
    activeTab === 'cardio' ||
    activeTab === 'dental' ||
    activeTab === 'brainfog' ||
    activeTab === 'sleep';
  const isProfile = activeTab === 'profile';

  return (
    <nav
      aria-label="Mobile primary navigation"
      className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-[#E8DFD1] bg-[#FFFDF9]/95 backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-950/95"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-2">
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          aria-current={isToday ? 'page' : undefined}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
            isToday
              ? 'text-[#E05A2B] dark:text-orange-400'
              : 'text-[#6B6156] hover:text-[#1E1A16] dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Today</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('plan')}
          aria-current={isPlan ? 'page' : undefined}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
            isPlan
              ? 'text-[#E05A2B] dark:text-orange-400'
              : 'text-[#6B6156] hover:text-[#1E1A16] dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <CalendarDays className="h-5 w-5" />
          <span>Plan</span>
        </button>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenAdd}
            aria-label="Add health log"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E05A2B] text-white shadow-md shadow-[#E05A2B]/25 transition-transform active:scale-95 hover:bg-[#C84A1E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A2B] focus-visible:ring-offset-2"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab('assistant')}
          aria-current={isCare ? 'page' : undefined}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
            isCare
              ? 'text-[#E05A2B] dark:text-orange-400'
              : 'text-[#6B6156] hover:text-[#1E1A16] dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <HeartHandshake className="h-5 w-5" />
          <span>Care</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          aria-current={isProfile ? 'page' : undefined}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
            isProfile
              ? 'text-[#E05A2B] dark:text-orange-400'
              : 'text-[#6B6156] hover:text-[#1E1A16] dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </button>
      </div>
    </nav>
  );
}
