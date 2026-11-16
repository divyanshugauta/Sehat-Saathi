import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  CalendarDays,
  Droplets,
  HeartPulse,
  Home,
  Menu,
  MessageSquareHeart,
  Moon,
  Settings,
  Smile,
  User,
  Utensils,
  X,
} from 'lucide-react';
import type {
  AppHealthPayload,
  BrainFogCheckin,
  CardioLog,
  CognitiveTestResult,
  DentalAppointment,
  DentalLog,
  MealLog,
  ModuleTab,
  NutritionGoal,
  UserProfile,
  WaterLog,
} from './types/health';
import { CATEGORY_THEMES, type CategoryThemeId } from './theme/categoryThemes';
import {
  buildDailySummaries,
  computeCrossModuleCorrelations,
} from './utils/healthEngine';
import { formatShortDate, getTodayIso } from './utils/dateUtils';
import { OverviewView } from './components/OverviewView';
import { PlanView } from './components/PlanView';
import { WaterDetailsView } from './components/WaterDetailsView';
import { CardiovascularView } from './components/CardiovascularView';
import { DentalView } from './components/DentalView';
import { BrainFogView } from './components/BrainFogView';
import { SleepStressView } from './components/SleepStressView';
import { NutritionView } from './components/NutritionView';
import { AiAssistantView } from './components/AiAssistantView';
import { ProfileView } from './components/ProfileView';
import { DailyCheckInModal } from './components/DailyCheckInModal';
import { DoctorReportModal } from './components/DoctorReportModal';
import { SettingsModal } from './components/SettingsModal';
import { AccessibleBottomNav } from './components/ui/AccessibleBottomNav';
import { QuickLogSheet } from './components/ui/QuickLogSheet';

const NAV_ITEMS: Array<{
  id: ModuleTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Today', icon: Home },
  { id: 'plan', label: 'Plan', icon: CalendarDays },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'brainfog', label: 'Brain Fog', icon: Brain },
  { id: 'cardio', label: 'Cardiovascular', icon: HeartPulse },
  { id: 'dental', label: 'Dental Care', icon: Smile },
  { id: 'sleep', label: 'Sleep & Stress', icon: Moon },
  { id: 'nutrition', label: 'Nutrition', icon: Utensils },
  { id: 'assistant', label: 'Care Guide', icon: MessageSquareHeart },
  { id: 'profile', label: 'Profile', icon: User },
];

function getThemeForTab(tab: ModuleTab): CategoryThemeId {
  if (tab === 'brainfog') return 'brainfog';
  if (tab === 'cardio') return 'cardio';
  if (tab === 'dental') return 'dental';
  if (tab === 'sleep') return 'sleep';
  if (tab === 'water') return 'water';
  return 'general';
}

export default function App() {
  const [payload, setPayload] = useState<AppHealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ModuleTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [doctorReportOpen, setDoctorReportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [pendingAiPrompt, setPendingAiPrompt] = useState<string | undefined>(undefined);
  const [recentUndoWater, setRecentUndoWater] = useState<WaterLog | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const loadHealthData = useCallback(async (userId?: string) => {
    try {
      setError(null);
      const url = userId ? `/api/health-data?userId=${encodeURIComponent(userId)}` : '/api/health-data';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load health records');
      const data = (await res.json()) as AppHealthPayload;
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to health store.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  const activeBundle = payload?.activeBundle;

  const summaries = useMemo(() => {
    if (!activeBundle) return [];
    return buildDailySummaries(activeBundle, 30);
  }, [activeBundle]);

  const correlations = useMemo(() => {
    return computeCrossModuleCorrelations(summaries);
  }, [summaries]);

  const postAndSync = async (url: string, body: unknown, method = 'POST') => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
    const data = await res.json();
    if (data.payload) {
      setPayload(data.payload);
    } else if (data.activeBundle) {
      setPayload(data);
    } else {
      await loadHealthData(payload?.activeUserId);
    }
    return data;
  };

  const handleAddCardio = async (entry: Omit<CardioLog, 'id' | 'userId'>) => {
    await postAndSync('/api/cardio', { userId: payload?.activeUserId, ...entry });
  };

  const handleSaveDental = async (entry: Omit<DentalLog, 'id' | 'userId'>) => {
    await postAndSync('/api/dental', { userId: payload?.activeUserId, ...entry });
  };

  const handleAddAppointment = async (apt: Omit<DentalAppointment, 'id' | 'userId'>) => {
    await postAndSync('/api/dental/appointments', { userId: payload?.activeUserId, ...apt });
  };

  const handleUpdateToothbrushDate = async (date: string) => {
    await postAndSync('/api/profile', { userId: payload?.activeUserId, toothbrushReplacedAt: date }, 'PATCH');
  };

  const handleSaveFogCheckin = async (entry: Omit<BrainFogCheckin, 'id' | 'userId'>) => {
    await postAndSync('/api/brainfog', { userId: payload?.activeUserId, ...entry });
  };

  const handleSaveCognitiveTest = async (test: Omit<CognitiveTestResult, 'id' | 'userId'>) => {
    await postAndSync('/api/cognitive-tests', { userId: payload?.activeUserId, ...test });
  };

  const handleAddMeal = async (meal: Omit<MealLog, 'id' | 'userId'>) => {
    await postAndSync('/api/meals', { userId: payload?.activeUserId, ...meal });
  };

  const handleAddMealQuick = async (text: string) => {
    const parsedRes = await fetch('/api/ai/parse-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: text }),
    });
    const parsed = await parsedRes.json();
    if (parsed.meal) {
      await handleAddMeal({
        date: getTodayIso(),
        timestamp: new Date().toISOString(),
        mealType: 'snack',
        foodName: parsed.meal.foodName,
        servingLabel: parsed.meal.servingLabel || '1 logged meal',
        calories: Number(parsed.meal.calories || 0),
        proteinG: Number(parsed.meal.proteinG || 0),
        carbsG: Number(parsed.meal.carbsG || 0),
        fatG: Number(parsed.meal.fatG || 0),
        sodiumMg: Number(parsed.meal.sodiumMg || 0),
        sugarG: Number(parsed.meal.sugarG || 0),
        fiberG: Number(parsed.meal.fiberG || 0),
        ironMg: Number(parsed.meal.ironMg || 0),
        vitaminDMcg: Number(parsed.meal.vitaminDMcg || 0),
        isIndianFood: Boolean(parsed.meal.isIndianFood),
      });
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    const res = await fetch(
      `/api/meals/${encodeURIComponent(mealId)}?userId=${encodeURIComponent(payload?.activeUserId || '')}`,
      { method: 'DELETE' }
    );
    const data = await res.json();
    if (data.payload) setPayload(data.payload);
  };

  const handleAddWater = async (amountMl: number, note?: string) => {
    const data = await postAndSync('/api/water', {
      userId: payload?.activeUserId,
      date: getTodayIso(),
      amountMl,
      note,
    });
    if (data?.entry) {
      setRecentUndoWater(data.entry as WaterLog);
    }
  };

  const handleUpdateWater = async (id: string, amountMl: number, note?: string) => {
    await postAndSync(
      `/api/water/${encodeURIComponent(id)}`,
      { userId: payload?.activeUserId, amountMl, note },
      'PATCH'
    );
  };

  const handleDeleteWater = async (id: string) => {
    const res = await fetch(
      `/api/water/${encodeURIComponent(id)}?userId=${encodeURIComponent(payload?.activeUserId || '')}`,
      { method: 'DELETE' }
    );
    const data = await res.json();
    if (data.payload) setPayload(data.payload);
    setRecentUndoWater((prev) => (prev?.id === id ? null : prev));
  };

  const handleUpdateWaterSettings = async (patch: {
    waterTargetMl: number;
    waterReminderMinutes: number;
  }) => {
    await postAndSync('/api/profile', { userId: payload?.activeUserId, ...patch }, 'PATCH');
  };

  const handleUpdateGoal = async (nutritionGoal: NutritionGoal, calorieTarget: number) => {
    await postAndSync(
      '/api/profile',
      { userId: payload?.activeUserId, nutritionGoal, calorieTarget },
      'PATCH'
    );
  };

  const handleSaveUnifiedCheckIn = async (data: {
    fog: Omit<BrainFogCheckin, 'id' | 'userId'>;
    dental: Omit<DentalLog, 'id' | 'userId'>;
    cardio?: Omit<CardioLog, 'id' | 'userId'>;
    waterMlAdded: number;
  }) => {
    await handleSaveFogCheckin(data.fog);
    await handleSaveDental(data.dental);
    if (data.cardio) await handleAddCardio(data.cardio);
    if (data.waterMlAdded > 0) await handleAddWater(data.waterMlAdded, 'Daily Check-In');
  };

  const handleSendChat = async (message: string) => {
    await postAndSync('/api/ai/chat', { userId: payload?.activeUserId, message });
  };

  const handleSaveThresholds = async (patch: Partial<UserProfile>) => {
    await postAndSync('/api/profile', { userId: payload?.activeUserId, ...patch }, 'PATCH');
  };

  const handleResetDemo = async () => {
    setRecentUndoWater(null);
    await postAndSync('/api/reset', {});
  };

  const handleDeleteAll = async () => {
    setRecentUndoWater(null);
    await postAndSync('/api/delete-all', { userId: payload?.activeUserId });
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];
  const themeId = getThemeForTab(activeTab);
  const categoryTheme = CATEGORY_THEMES[themeId];
  const isDarkWorld = categoryTheme.isDarkWorld;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] dark:bg-[#111318]">
        <div className="space-y-2 text-center">
          <p className="font-display-serif text-2xl font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
            Sehat Saathi
          </p>
          <p className="text-sm text-[#6B6156] dark:text-[#A49B8E]">
            Loading your personal health companion...
          </p>
        </div>
      </div>
    );
  }

  if (error || !payload || !activeBundle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6EF] p-6 dark:bg-[#111318]">
        <div className="max-w-md rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display-serif text-xl font-semibold text-[#1E1A16] dark:text-slate-100">
            Unable to Load Sehat Saathi
          </h1>
          <p className="mt-2 text-sm text-[#6B6156] dark:text-slate-400">{error}</p>
          <button
            type="button"
            onClick={() => loadHealthData()}
            className="mt-4 min-h-[44px] rounded-xl bg-[#E05A2B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#C84A1E]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const profile = activeBundle.profile;
  const todayIso = getTodayIso();
  const waterLogsToday = activeBundle.waterLogs.filter((w) => w.date === todayIso);

  const sidebarChrome = isDarkWorld
    ? 'border-white/10 bg-[#0B0D14]/90 text-slate-100'
    : 'border-[#E8DFD1] bg-[#FFFDF9] text-[#1E1A16] dark:border-[#262B36] dark:bg-[#151820] dark:text-[#F4EFE6]';

  const headerChrome = isDarkWorld
    ? 'border-white/10 bg-[#0B0D14]/80 text-slate-100 backdrop-blur-md'
    : 'border-[#E8DFD1] bg-[#FFFDF9]/90 text-[#1E1A16] backdrop-blur-md dark:border-[#262B36] dark:bg-[#151820]/90 dark:text-[#F4EFE6]';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${categoryTheme.canvasClass}`}>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className={`no-print hidden w-64 shrink-0 flex-col justify-between border-r p-5 lg:flex ${sidebarChrome}`}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05A2B] rounded-lg"
              >
                <span className="font-display-serif text-xl font-semibold tracking-tight whitespace-nowrap">
                  Sehat Saathi
                </span>
                <span className={`block text-[11px] ${isDarkWorld ? 'text-slate-400' : 'text-[#6B6156] dark:text-slate-400'}`}>
                  Personal Care Companion
                </span>
              </button>
            </div>

            {/* Family Profile Switcher */}
            <div>
              <label
                htmlFor="profile-switcher"
                className={`block text-[11px] font-medium ${isDarkWorld ? 'text-slate-400' : 'text-[#6B6156] dark:text-slate-400'}`}
              >
                Active Profile
              </label>
              <div
                className={`mt-1.5 flex items-center gap-2.5 rounded-2xl border p-2 ${
                  isDarkWorld
                    ? 'border-white/10 bg-white/5'
                    : 'border-[#E8DFD1] bg-[#FAF6EF] dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full object-cover bg-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <select
                    id="profile-switcher"
                    value={payload.activeUserId}
                    onChange={(e) => {
                      setRecentUndoWater(null);
                      loadHealthData(e.target.value);
                    }}
                    className="w-full bg-transparent text-xs font-semibold focus:outline-none"
                  >
                    {payload.profiles.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p className={`truncate px-1 text-[11px] ${isDarkWorld ? 'text-slate-400' : 'text-[#6B6156] dark:text-slate-400'}`}>
                    {profile.relationship}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav aria-label="Health modules" className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? isDarkWorld
                          ? 'bg-white/12 text-white'
                          : 'bg-[#FCE7D8] text-[#B33F16] dark:bg-orange-950/40 dark:text-orange-300'
                        : isDarkWorld
                        ? 'text-slate-300 hover:bg-white/8 hover:text-white'
                        : 'text-[#5C5349] hover:bg-[#FAF6EF] hover:text-[#1E1A16] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className={`space-y-3 border-t pt-4 ${isDarkWorld ? 'border-white/10' : 'border-[#E8DFD1] dark:border-slate-800'}`}>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium ${
                isDarkWorld
                  ? 'text-slate-300 hover:bg-white/10'
                  : 'text-[#5C5349] hover:bg-[#FAF6EF] dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings &amp; Privacy
            </button>
            <p className={`px-3 text-[11px] leading-relaxed ${isDarkWorld ? 'text-slate-400' : 'text-[#8C8175] dark:text-slate-500'}`}>
              Personal wellness companion — not a medical device. Consult a clinician for medical concerns.
            </p>
          </div>
        </aside>

        {/* Mobile Category Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 flex w-72 flex-col justify-between bg-[#FFFDF9] p-5 text-[#1E1A16] dark:bg-slate-900 dark:text-slate-100">
              <div className="space-y-5 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="font-display-serif text-xl font-semibold">Sehat Saathi</span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-[#6B6156]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl border border-[#E8DFD1] bg-[#FAF6EF] p-2.5 dark:border-slate-800 dark:bg-slate-800">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <select
                    aria-label="Switch active family profile"
                    value={payload.activeUserId}
                    onChange={(e) => {
                      setRecentUndoWater(null);
                      loadHealthData(e.target.value);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-transparent text-xs font-semibold"
                  >
                    {payload.profiles.map((p) => (
                      <option key={p.id} value={p.id} className="dark:bg-slate-900">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <nav className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                          activeTab === item.id
                            ? 'bg-[#FCE7D8] text-[#B33F16] dark:bg-orange-950/40 dark:text-orange-300'
                            : 'text-[#5C5349] dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSettingsOpen(true);
                }}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E8DFD1] px-3 py-2 text-xs font-medium text-[#1E1A16] dark:border-slate-700 dark:text-slate-200"
              >
                <Settings className="h-4 w-4" />
                Settings &amp; Privacy
              </button>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className={`no-print sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b px-4 sm:px-6 lg:px-8 ${headerChrome}`}>
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border lg:hidden ${
                  isDarkWorld ? 'border-white/15 text-slate-200' : 'border-[#E8DFD1] text-[#5C5349] dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-display-serif text-lg font-semibold">
                  {activeNav.label}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className={`hidden font-mono text-xs sm:inline ${isDarkWorld ? 'text-slate-400' : 'text-[#6B6156] dark:text-slate-400'}`}>
                {formatShortDate(todayIso)}
              </span>
              <button
                type="button"
                onClick={() => setCheckInOpen(true)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#E05A2B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#C84A1E] whitespace-nowrap shrink-0"
              >
                <Activity className="h-3.5 w-3.5" />
                Daily Check-In
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1320px] w-full mx-auto">
            {activeTab === 'overview' && (
              <OverviewView
                profile={profile}
                summaries={summaries}
                correlations={correlations}
                cardioLogs={activeBundle.cardioLogs}
                appointments={activeBundle.appointments}
                waterLogsToday={waterLogsToday}
                recentUndoWater={recentUndoWater}
                onAddWater={handleAddWater}
                onUndoWater={handleDeleteWater}
                onNavigate={setActiveTab}
                onOpenCheckIn={() => setCheckInOpen(true)}
                onAskAi={(prompt) => {
                  setPendingAiPrompt(prompt);
                  setActiveTab('assistant');
                }}
              />
            )}
            {activeTab === 'plan' && (
              <PlanView
                profile={profile}
                meals={activeBundle.meals}
                summaries={summaries}
                onAddMeal={handleAddMeal}
                onDeleteMeal={handleDeleteMeal}
                onAddWater={handleAddWater}
                onUpdateGoal={handleUpdateGoal}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === 'water' && (
              <WaterDetailsView
                profile={profile}
                waterLogs={activeBundle.waterLogs}
                summaries={summaries}
                recentUndoEntry={recentUndoWater}
                onAddWater={handleAddWater}
                onUpdateWater={handleUpdateWater}
                onDeleteWater={handleDeleteWater}
                onUpdateWaterSettings={handleUpdateWaterSettings}
              />
            )}
            {activeTab === 'cardio' && (
              <CardiovascularView
                profile={profile}
                cardioLogs={activeBundle.cardioLogs}
                summaries={summaries}
                onAddCardio={handleAddCardio}
                onOpenDoctorReport={() => setDoctorReportOpen(true)}
              />
            )}
            {activeTab === 'dental' && (
              <DentalView
                profile={profile}
                dentalLogs={activeBundle.dentalLogs}
                appointments={activeBundle.appointments}
                summaries={summaries}
                onSaveDental={handleSaveDental}
                onAddAppointment={handleAddAppointment}
                onUpdateToothbrushDate={handleUpdateToothbrushDate}
              />
            )}
            {activeTab === 'brainfog' && (
              <BrainFogView
                checkins={activeBundle.brainFogCheckins}
                cognitiveTests={activeBundle.cognitiveTests}
                summaries={summaries}
                correlations={correlations}
                onSaveCheckin={handleSaveFogCheckin}
                onSaveCognitiveTest={handleSaveCognitiveTest}
                onTakeWaterBreak={() => handleAddWater(250, 'Brain Fog break')}
              />
            )}
            {activeTab === 'sleep' && (
              <SleepStressView
                checkins={activeBundle.brainFogCheckins}
                summaries={summaries}
                onSaveCheckin={handleSaveFogCheckin}
              />
            )}
            {activeTab === 'nutrition' && (
              <NutritionView
                profile={profile}
                meals={activeBundle.meals}
                summaries={summaries}
                onAddMeal={handleAddMeal}
                onDeleteMeal={handleDeleteMeal}
                onAddWater={handleAddWater}
                onUpdateGoal={handleUpdateGoal}
              />
            )}
            {activeTab === 'assistant' && (
              <AiAssistantView
                profile={profile}
                messages={activeBundle.chatMessages}
                initialPrompt={pendingAiPrompt}
                onConsumeInitialPrompt={() => setPendingAiPrompt(undefined)}
                onSendMessage={handleSendChat}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileView
                profiles={payload.profiles}
                activeProfile={profile}
                darkMode={darkMode}
                onSelectProfile={async (uid) => {
                  setRecentUndoWater(null);
                  await loadHealthData(uid);
                }}
                onToggleDarkMode={() => setDarkMode((d) => !d)}
                onSaveThresholds={handleSaveThresholds}
                onResetDemo={handleResetDemo}
                onDeleteAll={handleDeleteAll}
              />
            )}
          </main>

          <footer
            className={`no-print hidden lg:block border-t px-5 py-3 text-center text-xs ${
              isDarkWorld
                ? 'border-white/10 text-slate-400'
                : 'border-[#E8DFD1] text-[#6B6156] dark:border-slate-800 dark:text-slate-400'
            }`}
          >
            Sehat Saathi is a personal wellness companion, not a medical device. Always consult a qualified healthcare professional for diagnosis or treatment.
          </footer>
        </div>
      </div>

      {/* Mobile Primary Bottom Nav */}
      <AccessibleBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAdd={() => setQuickAddOpen(true)}
      />

      <QuickLogSheet
        open={quickAddOpen}
        profile={profile}
        onClose={() => setQuickAddOpen(false)}
        onAddWater={handleAddWater}
        onSaveFog={handleSaveFogCheckin}
        onAddCardio={handleAddCardio}
        onSaveDental={handleSaveDental}
        onAddMealQuick={handleAddMealQuick}
      />

      <DailyCheckInModal
        open={checkInOpen}
        profile={profile}
        onClose={() => setCheckInOpen(false)}
        onSaveUnified={handleSaveUnifiedCheckIn}
      />

      <DoctorReportModal
        open={doctorReportOpen}
        profile={profile}
        summaries={summaries}
        correlations={correlations}
        onClose={() => setDoctorReportOpen(false)}
      />

      <SettingsModal
        open={settingsOpen}
        profile={profile}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onClose={() => setSettingsOpen(false)}
        onSaveThresholds={handleSaveThresholds}
        onResetDemo={handleResetDemo}
        onDeleteAll={handleDeleteAll}
      />
    </div>
  );
}
