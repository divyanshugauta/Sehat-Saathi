import React, { useEffect, useState } from 'react';
import {
  Camera,
  Droplets,
  Mic,
  Plus,
  QrCode,
  Search,
  Trash2,
} from 'lucide-react';
import type {
  DailySummary,
  FoodCatalogItem,
  MealLog,
  MealType,
  NutritionGoal,
  UserProfile,
} from '../types/health';
import { getMealSuggestions } from '../data/foodCatalog';
import { getTodayIso } from '../utils/dateUtils';
import { CalorieRingChart, MetricLineChart } from './charts/HealthCharts';

interface NutritionViewProps {
  profile: UserProfile;
  meals: MealLog[];
  summaries: DailySummary[];
  onAddMeal: (meal: Omit<MealLog, 'id' | 'userId'>) => Promise<void>;
  onDeleteMeal: (id: string) => Promise<void>;
  onAddWater: (amountMl: number) => Promise<void>;
  onUpdateGoal: (goal: NutritionGoal, calorieTarget: number) => Promise<void>;
}

export function NutritionView({
  profile,
  meals,
  summaries,
  onAddMeal,
  onDeleteMeal,
  onAddWater,
  onUpdateGoal,
}: NutritionViewProps) {
  const todayIso = getTodayIso();
  const todaySummary = summaries.find((s) => s.date === todayIso);
  const todayMeals = meals.filter((m) => m.date === todayIso);

  const caloriesToday = todaySummary?.calories ?? 0;
  const proteinToday = todaySummary?.proteinG ?? 0;
  const carbsToday = todaySummary?.carbsG ?? 0;
  const fatToday = todaySummary?.fatG ?? 0;
  const waterToday = todaySummary?.waterMl ?? 0;

  const [loggerTab, setLoggerTab] = useState<'search' | 'barcode' | 'voice' | 'photo'>('search');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Indian' | 'Global'>('All');
  const [catalogItems, setCatalogItems] = useState<FoodCatalogItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Barcode
  const [barcode, setBarcode] = useState('');
  const [barcodeMsg, setBarcodeMsg] = useState('');

  // Voice / NL
  const [nlText, setNlText] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [listening, setListening] = useState(false);

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setSearching(true);
    fetch(`/api/foods/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => {
        if (active && Array.isArray(d.items)) {
          setCatalogItems(d.items);
        }
      })
      .finally(() => {
        if (active) setSearching(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  const filteredCatalog = catalogItems.filter((item) => {
    if (categoryFilter === 'Indian') return item.category === 'Indian';
    if (categoryFilter === 'Global') return item.category !== 'Indian';
    return true;
  });

  const handleQuickAddItem = async (item: FoodCatalogItem) => {
    await onAddMeal({
      date: todayIso,
      timestamp: new Date().toISOString(),
      mealType,
      foodName: item.name,
      servingLabel: item.servingLabel,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      sodiumMg: item.sodiumMg,
      sugarG: item.sugarG,
      fiberG: item.fiberG,
      ironMg: item.ironMg,
      vitaminDMcg: item.vitaminDMcg,
      isIndianFood: item.category === 'Indian',
    });
  };

  const handleBarcodeLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    setBarcodeMsg('');
    const res = await fetch(`/api/foods/search?barcode=${encodeURIComponent(barcode.trim())}`);
    const data = await res.json();
    if (Array.isArray(data.items) && data.items.length > 0) {
      await handleQuickAddItem(data.items[0]);
      setBarcodeMsg(`Logged "${data.items[0].name}" (${data.items[0].calories} kcal).`);
      setBarcode('');
    } else {
      setBarcodeMsg('No matching product found for that barcode.');
    }
  };

  const handleNaturalLanguageLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlText.trim()) return;
    setNlLoading(true);
    try {
      const res = await fetch('/api/ai/parse-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: nlText.trim() }),
      });
      const data = await res.json();
      if (data.meal) {
        await onAddMeal({
          date: todayIso,
          timestamp: new Date().toISOString(),
          mealType,
          foodName: data.meal.foodName,
          servingLabel: data.meal.servingLabel || '1 logged meal',
          calories: Number(data.meal.calories || 0),
          proteinG: Number(data.meal.proteinG || 0),
          carbsG: Number(data.meal.carbsG || 0),
          fatG: Number(data.meal.fatG || 0),
          sodiumMg: Number(data.meal.sodiumMg || 0),
          sugarG: Number(data.meal.sugarG || 0),
          fiberG: Number(data.meal.fiberG || 0),
          ironMg: Number(data.meal.ironMg || 0),
          vitaminDMcg: Number(data.meal.vitaminDMcg || 0),
          isIndianFood: Boolean(data.meal.isIndianFood),
        });
        setNlText('');
      }
    } finally {
      setNlLoading(false);
    }
  };

  const handleStartVoice = () => {
    interface SpeechRecognitionInstance {
      lang: string;
      onresult: ((evt: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
    }
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setNlText('Two whole wheat rotis and one bowl dal tadka');
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = 'en-US';
    setListening(true);
    recognition.onresult = (evt) => {
      const transcript = evt.results[0]?.[0]?.transcript || '';
      setNlText(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const handleMealPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      setPhotoPreview(reader.result);
      const [meta, base64] = reader.result.split(',');
      const mimeType = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
      try {
        const res = await fetch('/api/ai/analyze-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image: base64, mimeType, note: photoNote }),
        });
        const data = await res.json();
        if (!res.ok) {
          setPhotoError(data.error || 'Could not analyze meal photo.');
        } else if (data.meal) {
          await onAddMeal({
            date: todayIso,
            timestamp: new Date().toISOString(),
            mealType,
            foodName: data.meal.foodName,
            servingLabel: data.meal.servingLabel || 'Photo estimate',
            calories: Number(data.meal.calories || 0),
            proteinG: Number(data.meal.proteinG || 0),
            carbsG: Number(data.meal.carbsG || 0),
            fatG: Number(data.meal.fatG || 0),
            sodiumMg: Number(data.meal.sodiumMg || 0),
            sugarG: Number(data.meal.sugarG || 0),
            fiberG: Number(data.meal.fiberG || 0),
            ironMg: Number(data.meal.ironMg || 0),
            vitaminDMcg: Number(data.meal.vitaminDMcg || 0),
            isIndianFood: Boolean(data.meal.isIndianFood),
          });
        }
      } catch {
        setPhotoError('Photo analysis request failed.');
      } finally {
        setPhotoLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const remainingCalories = Math.max(0, profile.calorieTarget - caloriesToday);
  const remainingProtein = Math.max(0, profile.proteinTargetG - proteinToday);
  const suggestions = getMealSuggestions(remainingCalories, remainingProtein);

  const calorieTrend = summaries
    .filter((d) => d.calories > 0)
    .slice(-14)
    .map((d) => ({ date: d.date, value: d.calories }));
  const weightTrend = summaries
    .filter((d) => d.weightKg !== null)
    .slice(-14)
    .map((d) => ({ date: d.date, value: d.weightKg as number }));

  const handleGoalChange = (nextGoal: NutritionGoal) => {
    const base = profile.nutritionGoal === 'lose'
      ? profile.calorieTarget + 350
      : profile.nutritionGoal === 'gain'
      ? profile.calorieTarget - 300
      : profile.calorieTarget;
    const nextCal = nextGoal === 'lose' ? base - 350 : nextGoal === 'gain' ? base + 300 : base;
    onUpdateGoal(nextGoal, Math.max(1300, nextCal));
  };

  return (
    <div className="space-y-6">
      {/* Top Row: Calories Ring + Macros + Water Tracker */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display-serif text-lg font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
              Daily Calories &amp; Goal
            </h3>
            <div className="flex rounded-xl bg-[#F4ECE0] p-1 dark:bg-slate-800">
              {(['lose', 'maintain', 'gain'] as NutritionGoal[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGoalChange(g)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    profile.nutritionGoal === g
                      ? 'bg-white text-[#1E1A16] shadow-xs dark:bg-slate-700 dark:text-slate-100'
                      : 'text-[#6B6156] dark:text-slate-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="my-4 flex flex-wrap items-center gap-6">
            <CalorieRingChart consumed={caloriesToday} target={profile.calorieTarget} />
            <div className="flex-1 space-y-3 min-w-[160px]">
              {[
                { label: 'Protein', val: proteinToday, target: profile.proteinTargetG, tone: 'bg-[#E05A2B]' },
                { label: 'Carbs', val: carbsToday, target: profile.carbsTargetG, tone: 'bg-[#6D5CAE]' },
                { label: 'Fat', val: fatToday, target: profile.fatTargetG, tone: 'bg-amber-600' },
              ].map((m) => {
                const pct = Math.min(100, Math.round((m.val / Math.max(1, m.target)) * 100));
                return (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6B6156] dark:text-slate-400">{m.label}</span>
                      <span className="font-mono font-medium text-[#1E1A16] dark:text-slate-100 tabular-nums">
                        {m.val} / {m.target}g
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#EFE7DA] dark:bg-slate-800">
                      <div className={`h-full rounded-full ${m.tone}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Micronutrients + Water */}
        <div className="lg:col-span-7 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
            <h3 className="font-display-serif text-lg font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
              Micronutrients Today
            </h3>
            <p className="text-xs text-[#6B6156] dark:text-slate-400">
              Linked to cardiovascular &amp; dental targets
            </p>
            <dl className="mt-4 divide-y divide-[#EFE7DA] text-sm dark:divide-slate-800">
              {[
                { label: 'Sodium', val: `${todaySummary?.sodiumMg ?? 0} mg`, limit: '< 2,300 mg' },
                { label: 'Sugar', val: `${todaySummary?.sugarG ?? 0} g`, limit: '< 50 g' },
                { label: 'Fiber', val: `${todaySummary?.fiberG ?? 0} g`, limit: '25–35 g' },
                { label: 'Iron', val: `${todaySummary?.ironMg ?? 0} mg`, limit: '8–18 mg' },
                { label: 'Vitamin D', val: `${todaySummary?.vitaminDMcg ?? 0} mcg`, limit: '15 mcg' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2">
                  <dt className="text-[#6B6156] dark:text-slate-400">{row.label}</dt>
                  <dd className="font-mono text-xs text-[#1E1A16] dark:text-slate-100 tabular-nums">
                    <span className="font-semibold">{row.val}</span>{' '}
                    <span className="text-[#8C8175]">({row.limit})</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-sky-200/80 bg-gradient-to-br from-white to-sky-50/70 p-6 dark:border-sky-900/50 dark:from-slate-900 dark:to-sky-950/30">
            <div>
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <h3 className="font-display-serif text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Water Intake
                </h3>
              </div>
              <p className="mt-3 font-mono text-3xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {waterToday} <span className="text-sm font-normal text-slate-400">/ {profile.waterTargetMl} ml</span>
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sky-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-600 dark:bg-sky-400 transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((waterToday / Math.max(1, profile.waterTargetMl)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => onAddWater(250)}
                className="min-h-[44px] flex-1 rounded-xl border border-sky-200 bg-white py-2 font-mono text-xs font-semibold text-sky-800 hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-200"
              >
                +250 ml
              </button>
              <button
                type="button"
                onClick={() => onAddWater(500)}
                className="min-h-[44px] flex-1 rounded-xl bg-sky-600 py-2 font-mono text-xs font-semibold text-white hover:bg-sky-700"
              >
                +500 ml
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Logger & Today's Ledger */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display-serif text-lg font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
              Log Meal (Indian &amp; Global Database)
            </h3>
            <div className="flex items-center gap-2">
              <label htmlFor="meal-slot" className="text-xs text-[#6B6156]">
                Meal:
              </label>
              <select
                id="meal-slot"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="min-h-[38px] rounded-xl border border-[#E8DFD1] bg-white px-2.5 py-1 text-xs capitalize dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="mt-4 flex flex-wrap gap-1 rounded-2xl bg-[#F4ECE0] p-1 dark:bg-slate-800">
            {[
              { id: 'search', label: 'Food Search', icon: Search },
              { id: 'barcode', label: 'Barcode', icon: QrCode },
              { id: 'voice', label: 'Quick / Voice', icon: Mic },
              { id: 'photo', label: 'AI Photo', icon: Camera },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLoggerTab(t.id as 'search' | 'barcode' | 'voice' | 'photo')}
                  className={`inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    loggerTab === t.id
                      ? 'bg-white text-[#1E1A16] shadow-xs dark:bg-slate-700 dark:text-slate-100'
                      : 'text-[#6B6156] dark:text-slate-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {loggerTab === 'search' && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <input
                  type="search"
                  placeholder="Search roti, dal, idli, salmon, oats..."
                  aria-label="Search food database"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[42px] flex-1 min-w-[200px] rounded-xl border border-[#E8DFD1] bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                <div className="flex rounded-xl bg-[#F4ECE0] p-1 dark:bg-slate-800">
                  {(['All', 'Indian', 'Global'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                        categoryFilter === cat
                          ? 'bg-white text-[#1E1A16] shadow-xs dark:bg-slate-700 dark:text-slate-100'
                          : 'text-[#6B6156] dark:text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#EFE7DA] dark:divide-slate-800">
                {searching ? (
                  <p className="py-6 text-center text-xs text-[#6B6156]">Searching foods...</p>
                ) : filteredCatalog.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#6B6156]">No foods matched.</p>
                ) : (
                  filteredCatalog.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#1E1A16] dark:text-slate-100">
                          {item.name}
                        </p>
                        <p className="font-mono text-xs text-[#6B6156] dark:text-slate-400 tabular-nums">
                          {item.servingLabel} · {item.calories} kcal · P {item.proteinG}g · C {item.carbsG}g · Na {item.sodiumMg}mg
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickAddItem(item)}
                        aria-label={`Add ${item.name}`}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-[#E8DFD1] px-3 py-1.5 text-xs font-semibold text-[#E05A2B] hover:bg-[#FCE7D8]/50 whitespace-nowrap shrink-0 dark:border-slate-700 dark:text-orange-400"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {loggerTab === 'barcode' && (
            <form onSubmit={handleBarcodeLookup} className="mt-4 space-y-3">
              <p className="text-xs text-[#6B6156] dark:text-slate-400">
                Enter an EAN/UPC barcode (queries local catalog + Open Food Facts). Sample: <span className="font-mono">890100000102</span> (Dal Tadka) or <span className="font-mono">012345678905</span> (Protein Shake).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter barcode digits..."
                  aria-label="Barcode number"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="min-h-[44px] flex-1 rounded-xl border border-[#E8DFD1] bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#E05A2B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C84A1E] whitespace-nowrap"
                >
                  Lookup &amp; Add
                </button>
              </div>
              {barcodeMsg && <p className="text-xs text-[#E05A2B] dark:text-orange-400">{barcodeMsg}</p>}
            </form>
          )}

          {loggerTab === 'voice' && (
            <form onSubmit={handleNaturalLanguageLog} className="mt-4 space-y-3">
              <p className="text-xs text-[#6B6156] dark:text-slate-400">
                Describe what you ate naturally (e.g., &ldquo;I had two rotis and dal for lunch&rdquo;).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="I had two rotis and palak paneer..."
                  aria-label="Natural language meal input"
                  value={nlText}
                  onChange={(e) => setNlText(e.target.value)}
                  className="min-h-[44px] flex-1 rounded-xl border border-[#E8DFD1] bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={handleStartVoice}
                  aria-label="Dictate meal via microphone"
                  className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-medium whitespace-nowrap ${
                    listening
                      ? 'border-rose-400 bg-rose-50 text-rose-700'
                      : 'border-[#E8DFD1] text-[#1E1A16] hover:bg-[#FAF6EF] dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  disabled={nlLoading}
                  className="min-h-[44px] rounded-xl bg-[#E05A2B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#C84A1E] disabled:opacity-60 whitespace-nowrap"
                >
                  {nlLoading ? 'Parsing...' : 'Log Meal'}
                </button>
              </div>
            </form>
          )}

          {loggerTab === 'photo' && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-[#6B6156] dark:text-slate-400">
                Upload a meal photo to estimate calories and macros via Gemini Vision.
              </p>
              <input
                type="text"
                placeholder="Optional note (e.g., homemade thali)"
                value={photoNote}
                onChange={(e) => setPhotoNote(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[#E8DFD1] bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#D7CBB8] p-6 text-center hover:bg-[#FAF6EF] dark:border-slate-700 dark:hover:bg-slate-800/50">
                <Camera className="h-6 w-6 text-[#E05A2B]" />
                <span className="mt-2 text-xs font-medium text-[#1E1A16] dark:text-slate-300">
                  {photoLoading ? 'Analyzing meal photo...' : 'Choose meal photo to analyze & log'}
                </span>
                <input type="file" accept="image/*" onChange={handleMealPhoto} className="sr-only" />
              </label>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Uploaded meal preview"
                  className="h-32 w-full rounded-xl object-cover"
                />
              )}
              {photoError && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  {photoError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Today's Meals + Suggestions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
            <h3 className="font-display-serif text-lg font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
              Today&apos;s Meals ({todayMeals.length})
            </h3>
            {todayMeals.length === 0 ? (
              <p className="mt-4 text-sm text-[#6B6156]">No meals logged today yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[#EFE7DA] dark:divide-slate-800">
                {todayMeals.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#1E1A16] dark:text-slate-100">
                        {m.foodName}
                      </p>
                      <p className="font-mono text-[#6B6156] dark:text-slate-400 tabular-nums">
                        <span className="capitalize">{m.mealType}</span> · {m.calories} kcal · P {m.proteinG}g
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMeal(m.id)}
                      aria-label={`Delete ${m.foodName}`}
                      className="rounded-lg p-2 text-[#8C8175] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
            <h3 className="font-display-serif text-base font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
              Smart Suggestions for Remaining Macros
            </h3>
            <p className="mt-0.5 font-mono text-xs text-[#6B6156] dark:text-slate-400 tabular-nums">
              Remaining: {remainingCalories} kcal · {remainingProtein}g protein
            </p>
            <div className="mt-3 space-y-2">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-[#E8DFD1] p-2.5 text-xs dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#1E1A16] dark:text-slate-100">{s.name}</p>
                    <p className="font-mono text-[#6B6156] tabular-nums">
                      {s.calories} kcal · {s.proteinG}g protein
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickAddItem(s)}
                    className="min-h-[34px] rounded-xl bg-[#FCE7D8] px-3 py-1 font-semibold text-[#A83E17] hover:bg-[#FBD7BF] whitespace-nowrap dark:bg-slate-800 dark:text-orange-300"
                  >
                    + Log
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Calorie & Weight Trends */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
          <h3 className="font-display-serif text-base font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
            14-Day Calorie Intake Trend
          </h3>
          <p className="mb-3 text-xs text-[#6B6156] dark:text-slate-400">
            Daily energy intake vs {profile.calorieTarget} kcal target
          </p>
          <MetricLineChart data={calorieTrend} unit="kcal" color="teal" />
        </div>
        <div className="rounded-3xl border border-[#E8DFD1] bg-[#FFFDF9] p-6 dark:border-[#262B36] dark:bg-[#171A21]">
          <h3 className="font-display-serif text-base font-semibold text-[#1E1A16] dark:text-[#F7F2EA]">
            Body Weight Trend
          </h3>
          <p className="mb-3 text-xs text-[#6B6156] dark:text-slate-400">14-day weight trajectory (kg)</p>
          <MetricLineChart data={weightTrend} unit="kg" color="slate" />
        </div>
      </div>
    </div>
  );
}
