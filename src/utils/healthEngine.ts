import type {
  BpThresholds,
  BrainFogCheckin,
  CardioLog,
  CorrelationInsight,
  DailySummary,
  DentalLog,
  MealLog,
  UserHealthBundle,
} from '../types/health';

export interface BpClassification {
  category: 'Normal' | 'Elevated' | 'High Stage 1' | 'High Stage 2' | 'Crisis';
  severity: 'normal' | 'warning' | 'alert';
  message: string;
}

export function classifyBloodPressure(
  systolic: number,
  diastolic: number,
  thresholds?: BpThresholds
): BpClassification {
  if (systolic >= 180 || diastolic >= 120) {
    return {
      category: 'Crisis',
      severity: 'alert',
      message: 'Very high reading. Rest 5 minutes, re-check, and seek urgent medical care if symptoms appear.',
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      category: 'High Stage 2',
      severity: 'alert',
      message: 'Above target range — consider consulting your doctor with your recent log.',
    };
  }
  if (
    systolic >= (thresholds?.systolicHigh ?? 130) ||
    diastolic >= (thresholds?.diastolicHigh ?? 80)
  ) {
    return {
      category: 'High Stage 1',
      severity: 'alert',
      message: 'Above your configured threshold — monitor consistently and consider consulting a clinician.',
    };
  }
  if (systolic >= 120 && diastolic < 80) {
    return {
      category: 'Elevated',
      severity: 'warning',
      message: 'Slightly elevated systolic pressure. Hydration, low sodium, and light walks can help.',
    };
  }
  return {
    category: 'Normal',
    severity: 'normal',
    message: 'Within normal cardiovascular range.',
  };
}

export function clampScore(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

export function calculateCardioScore(
  logs: CardioLog[],
  activityGoalMinDay = 30
): number | null {
  if (logs.length === 0) return null;
  const avgSys = logs.reduce((s, l) => s + l.systolic, 0) / logs.length;
  const avgDia = logs.reduce((s, l) => s + l.diastolic, 0) / logs.length;
  const avgRhr = logs.reduce((s, l) => s + l.heartRate, 0) / logs.length;
  const totalAct = logs.reduce((s, l) => s + l.activityMinutes, 0);
  const medTaken = logs.some((l) => l.medicationTaken);

  let bpScore = 100;
  if (avgSys >= 140 || avgDia >= 90) bpScore = 52;
  else if (avgSys >= 130 || avgDia >= 80) bpScore = 70;
  else if (avgSys >= 120) bpScore = 84;
  else if (avgSys < 90 || avgDia < 60) bpScore = 76;

  let rhrScore = 92;
  if (avgRhr <= 65) rhrScore = 98;
  else if (avgRhr <= 75) rhrScore = 90;
  else if (avgRhr <= 85) rhrScore = 78;
  else rhrScore = 62;

  const actRatio = Math.min(1, totalAct / Math.max(1, activityGoalMinDay));
  const actScore = 55 + actRatio * 45;
  const medBonus = medTaken ? 4 : 0;

  return clampScore(bpScore * 0.5 + rhrScore * 0.25 + actScore * 0.25 + medBonus);
}

export function calculateOralHygieneScore(log: DentalLog | undefined): number | null {
  if (!log) return null;
  let score = 20;
  if (log.brushedAm) score += 28;
  if (log.brushedPm) score += 28;
  if (log.flossed) score += 16;
  if (log.mouthwash) score += 8;
  score -= Math.min(20, log.sugarSnacks * 4);
  score -= Math.min(25, log.painLevel * 3);
  if (log.gumBleeding) score -= 8;
  if (log.swelling) score -= 12;
  return clampScore(score);
}

export function calculateBrainFogScore(checkin: BrainFogCheckin | undefined): number | null {
  if (!checkin) return null;
  const avgCognitive =
    (checkin.focus + checkin.memory + checkin.clarity + checkin.mood + checkin.energy) / 5;
  // Base 0-100 from 1-5 ratings (1 -> 20, 5 -> 100)
  let clarity = avgCognitive * 20;
  if (checkin.sleepHours < 6) clarity -= 10;
  else if (checkin.sleepHours >= 7.5) clarity += 4;
  if (checkin.stressLevel >= 4) clarity -= 6;
  return clampScore(clarity);
}

export function calculateNutritionScore(
  meals: MealLog[],
  waterMl: number,
  calorieTarget: number,
  waterTargetMl: number
): number | null {
  if (meals.length === 0 && waterMl === 0) return null;
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.proteinG, 0);
  const totalSodium = meals.reduce((s, m) => s + m.sodiumMg, 0);
  const totalSugar = meals.reduce((s, m) => s + m.sugarG, 0);

  let calScore = 80;
  if (meals.length > 0 && calorieTarget > 0) {
    const diffRatio = Math.abs(totalCal - calorieTarget) / calorieTarget;
    calScore = Math.max(40, 100 - diffRatio * 95);
  } else if (meals.length === 0) {
    calScore = 45;
  }

  const hydrationScore = Math.min(100, (waterMl / Math.max(1000, waterTargetMl)) * 100);
  const proteinScore = Math.min(100, (totalProtein / 75) * 100);
  const sodiumPenalty = totalSodium > 2300 ? Math.min(20, (totalSodium - 2300) / 100) : 0;
  const sugarPenalty = totalSugar > 50 ? Math.min(15, (totalSugar - 50) * 0.4) : 0;

  return clampScore(
    calScore * 0.42 + hydrationScore * 0.30 + proteinScore * 0.28 - sodiumPenalty - sugarPenalty
  );
}

export interface ModuleScores {
  cardioScore: number | null;
  dentalScore: number | null;
  brainFogScore: number | null;
  nutritionScore: number | null;
}

export function calculateDailyHealthScore(scores: ModuleScores): number {
  const weights: Array<{ score: number | null; weight: number }> = [
    { score: scores.cardioScore, weight: 0.30 },
    { score: scores.nutritionScore, weight: 0.25 },
    { score: scores.brainFogScore, weight: 0.25 },
    { score: scores.dentalScore, weight: 0.20 },
  ];

  const available = weights.filter((w) => w.score !== null);
  if (available.length === 0) return 0;

  const totalWeight = available.reduce((s, w) => s + w.weight, 0);
  const weightedSum = available.reduce((s, w) => s + (w.score as number) * w.weight, 0);
  return clampScore(weightedSum / totalWeight);
}

export function buildDailySummaries(bundle: UserHealthBundle, daysLimit = 30): DailySummary[] {
  const dateSet = new Set<string>();
  bundle.cardioLogs.forEach((l) => dateSet.add(l.date));
  bundle.dentalLogs.forEach((l) => dateSet.add(l.date));
  bundle.brainFogCheckins.forEach((l) => dateSet.add(l.date));
  bundle.meals.forEach((l) => dateSet.add(l.date));
  bundle.waterLogs.forEach((l) => dateSet.add(l.date));

  const dates = Array.from(dateSet).sort().slice(-daysLimit);
  const activityDayGoal = Math.round(bundle.profile.activityGoalMinWeek / 7);

  return dates.map((date) => {
    const cardio = bundle.cardioLogs.filter((l) => l.date === date);
    const dental = bundle.dentalLogs.find((l) => l.date === date);
    const fog = bundle.brainFogCheckins.find((l) => l.date === date);
    const meals = bundle.meals.filter((l) => l.date === date);
    const waterMlLogs = bundle.waterLogs
      .filter((l) => l.date === date)
      .reduce((s, w) => s + w.amountMl, 0);
    const waterMl = Math.max(waterMlLogs, fog?.waterMl ?? 0);

    const avgSystolic =
      cardio.length > 0
        ? Math.round(cardio.reduce((s, l) => s + l.systolic, 0) / cardio.length)
        : null;
    const avgDiastolic =
      cardio.length > 0
        ? Math.round(cardio.reduce((s, l) => s + l.diastolic, 0) / cardio.length)
        : null;
    const avgRhr =
      cardio.length > 0
        ? Math.round(cardio.reduce((s, l) => s + l.heartRate, 0) / cardio.length)
        : null;
    const hrvLogs = cardio.filter((l) => typeof l.hrvMs === 'number');
    const avgHrv =
      hrvLogs.length > 0
        ? Math.round(hrvLogs.reduce((s, l) => s + (l.hrvMs ?? 0), 0) / hrvLogs.length)
        : null;

    const activityMinutes = cardio.reduce((s, l) => s + l.activityMinutes, 0);
    const steps = cardio.reduce((s, l) => s + l.steps, 0);
    const weightKg = cardio.length > 0 ? cardio[cardio.length - 1].weightKg : null;
    const medicationTaken =
      cardio.length > 0 ? cardio.some((l) => l.medicationTaken) : null;

    const calories = meals.reduce((s, m) => s + m.calories, 0);
    const proteinG = Math.round(meals.reduce((s, m) => s + m.proteinG, 0));
    const carbsG = Math.round(meals.reduce((s, m) => s + m.carbsG, 0));
    const fatG = Math.round(meals.reduce((s, m) => s + m.fatG, 0));
    const sodiumMg = Math.round(meals.reduce((s, m) => s + m.sodiumMg, 0));
    const sugarG = Math.round(meals.reduce((s, m) => s + m.sugarG, 0));
    const fiberG = Math.round(meals.reduce((s, m) => s + m.fiberG, 0));
    const ironMg = Number(meals.reduce((s, m) => s + m.ironMg, 0).toFixed(1));
    const vitaminDMcg = Number(meals.reduce((s, m) => s + m.vitaminDMcg, 0).toFixed(1));

    const cardioScore = calculateCardioScore(cardio, activityDayGoal);
    const dentalScore = calculateOralHygieneScore(dental);
    const brainFogScore = calculateBrainFogScore(fog);
    const nutritionScore = calculateNutritionScore(
      meals,
      waterMl,
      bundle.profile.calorieTarget,
      bundle.profile.waterTargetMl
    );
    const overallHealthScore = calculateDailyHealthScore({
      cardioScore,
      dentalScore,
      brainFogScore,
      nutritionScore,
    });

    const fogSeverity = brainFogScore !== null ? 100 - brainFogScore : null;

    return {
      date,
      avgSystolic,
      avgDiastolic,
      avgRhr,
      avgHrv,
      activityMinutes,
      steps,
      weightKg,
      medicationTaken,
      brushedAm: dental?.brushedAm ?? false,
      brushedPm: dental?.brushedPm ?? false,
      flossed: dental?.flossed ?? false,
      mouthwash: dental?.mouthwash ?? false,
      tongueCleaned: dental?.tongueCleaned ?? false,
      sugarSnacks: dental?.sugarSnacks ?? 0,
      dentalPain: dental?.painLevel ?? 0,
      gumBleeding: dental?.gumBleeding ?? false,
      swelling: dental?.swelling ?? false,
      clarityScore: brainFogScore,
      fogSeverity,
      sleepHours: fog?.sleepHours ?? null,
      stressLevel: fog?.stressLevel ?? null,
      caffeineMg: fog?.caffeineMg ?? null,
      screenTimeHours: fog?.screenTimeHours ?? null,
      calories,
      proteinG,
      carbsG,
      fatG,
      sodiumMg,
      sugarG,
      fiberG,
      ironMg,
      vitaminDMcg,
      waterMl,
      cardioScore,
      dentalScore,
      brainFogScore,
      nutritionScore,
      overallHealthScore,
    };
  });
}

export function computeCrossModuleCorrelations(
  summaries: DailySummary[]
): CorrelationInsight[] {
  const insights: CorrelationInsight[] = [];

  // 1. Brain Fog vs Short Sleep (< 6h)
  const sleepDays = summaries.filter((d) => d.sleepHours !== null && d.fogSeverity !== null);
  const shortSleep = sleepDays.filter((d) => (d.sleepHours as number) < 6);
  const goodSleep = sleepDays.filter((d) => (d.sleepHours as number) >= 7);
  if (shortSleep.length >= 2 && goodSleep.length >= 2) {
    const avgFogShort =
      shortSleep.reduce((s, d) => s + (d.fogSeverity as number), 0) / shortSleep.length;
    const avgFogGood =
      goodSleep.reduce((s, d) => s + (d.fogSeverity as number), 0) / goodSleep.length;
    const pctDiff = avgFogGood > 0 ? Math.round(((avgFogShort - avgFogGood) / avgFogGood) * 100) : 0;
    if (pctDiff >= 12) {
      insights.push({
        id: 'sleep-fog',
        title: 'Short sleep elevates brain fog',
        summary: `On nights under 6 hours of sleep (${shortSleep.length} days), your brain fog severity averages ${Math.round(avgFogShort)} vs. ${Math.round(avgFogGood)} when sleeping 7+ hours.`,
        metricDelta: `+${pctDiff}% fog load`,
        modules: ['brainfog'],
        confidence: shortSleep.length >= 4 ? 'Strong' : 'Moderate',
        sampleSize: sleepDays.length,
        direction: 'warning',
      });
    }
  }

  // 2. Resting Heart Rate vs High-Sodium Days (> 2300 mg)
  const cardioNutritionDays = summaries.filter(
    (d) => d.avgRhr !== null && d.calories > 0
  );
  const highSodium = cardioNutritionDays.filter((d) => d.sodiumMg > 2300);
  const normalSodium = cardioNutritionDays.filter((d) => d.sodiumMg <= 2300);
  if (highSodium.length >= 2 && normalSodium.length >= 2) {
    const rhrHigh =
      highSodium.reduce((s, d) => s + (d.avgRhr as number), 0) / highSodium.length;
    const rhrNorm =
      normalSodium.reduce((s, d) => s + (d.avgRhr as number), 0) / normalSodium.length;
    const bpmDiff = Math.round(rhrHigh - rhrNorm);
    if (bpmDiff >= 2) {
      insights.push({
        id: 'sodium-rhr',
        title: 'Resting heart rate rises after high-sodium days',
        summary: `Days exceeding 2,300 mg sodium show an average resting heart rate of ${Math.round(rhrHigh)} bpm compared to ${Math.round(rhrNorm)} bpm on balanced-sodium days.`,
        metricDelta: `+${bpmDiff} bpm RHR`,
        modules: ['cardio', 'nutrition'],
        confidence: highSodium.length >= 3 ? 'Strong' : 'Moderate',
        sampleSize: cardioNutritionDays.length,
        direction: 'warning',
      });
    }
  }

  // 3. Brain Fog vs Low Calories (< 1500 kcal) or Low Hydration (< 1600 ml)
  const fuelFogDays = summaries.filter(
    (d) => d.clarityScore !== null && d.calories > 0
  );
  const underFueled = fuelFogDays.filter(
    (d) => d.calories < 1500 || d.waterMl < 1600
  );
  const wellFueled = fuelFogDays.filter(
    (d) => d.calories >= 1500 && d.waterMl >= 1800
  );
  if (underFueled.length >= 2 && wellFueled.length >= 2) {
    const clarityLow =
      underFueled.reduce((s, d) => s + (d.clarityScore as number), 0) / underFueled.length;
    const clarityHigh =
      wellFueled.reduce((s, d) => s + (d.clarityScore as number), 0) / wellFueled.length;
    const delta = Math.round(clarityHigh - clarityLow);
    if (delta >= 6) {
      insights.push({
        id: 'fuel-clarity',
        title: 'Hydration & steady calories boost mental clarity',
        summary: `When you hit 1,800+ ml water and 1,500+ kcal, your mental clarity score averages ${Math.round(clarityHigh)} vs. ${Math.round(clarityLow)} on under-fueled days.`,
        metricDelta: `+${delta} pts clarity`,
        modules: ['brainfog', 'nutrition'],
        confidence: 'Moderate',
        sampleSize: fuelFogDays.length,
        direction: 'positive',
      });
    }
  }

  // 4. Activity Minutes vs Systolic Blood Pressure
  const bpActivityDays = summaries.filter((d) => d.avgSystolic !== null);
  const activeDays = bpActivityDays.filter((d) => d.activityMinutes >= 30);
  const sedentaryDays = bpActivityDays.filter((d) => d.activityMinutes < 20);
  if (activeDays.length >= 3 && sedentaryDays.length >= 2) {
    const sysActive =
      activeDays.reduce((s, d) => s + (d.avgSystolic as number), 0) / activeDays.length;
    const sysSedentary =
      sedentaryDays.reduce((s, d) => s + (d.avgSystolic as number), 0) / sedentaryDays.length;
    const bpDrop = Math.round(sysSedentary - sysActive);
    if (bpDrop >= 2) {
      insights.push({
        id: 'activity-bp',
        title: '30+ min activity lowers systolic pressure',
        summary: `On days with at least 30 active minutes, average systolic BP sits at ${Math.round(sysActive)} mmHg versus ${Math.round(sysSedentary)} mmHg on low-activity days.`,
        metricDelta: `-${bpDrop} mmHg sys`,
        modules: ['cardio'],
        confidence: 'Strong',
        sampleSize: bpActivityDays.length,
        direction: 'positive',
      });
    }
  }

  // 5. Sugar Snacks vs Dental Sensitivity
  const dentalDays = summaries.filter((d) => d.dentalScore !== null);
  const highSugarDental = dentalDays.filter((d) => d.sugarSnacks >= 2);
  const lowSugarDental = dentalDays.filter((d) => d.sugarSnacks <= 1);
  if (highSugarDental.length >= 2 && lowSugarDental.length >= 2) {
    const avgScoreHigh =
      highSugarDental.reduce((s, d) => s + (d.dentalScore as number), 0) /
      highSugarDental.length;
    const avgScoreLow =
      lowSugarDental.reduce((s, d) => s + (d.dentalScore as number), 0) /
      lowSugarDental.length;
    const diff = Math.round(avgScoreLow - avgScoreHigh);
    if (diff >= 5) {
      insights.push({
        id: 'sugar-dental',
        title: 'Frequent sugary snacks dip oral hygiene score',
        summary: `Days with 2+ sugary snacks average ${Math.round(avgScoreHigh)}/100 oral hygiene compared to ${Math.round(avgScoreLow)}/100 on low-sugar days.`,
        metricDelta: `-${diff} pts oral`,
        modules: ['dental', 'nutrition'],
        confidence: 'Emerging',
        sampleSize: dentalDays.length,
        direction: 'warning',
      });
    }
  }

  return insights;
}

const EMERGENCY_PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  { regex: /\bchest\s*(pain|tightness|pressure|ache)\b/i, reason: 'Chest pain or pressure' },
  { regex: /\b(can'?t|cannot|trouble|difficulty)\s*breath(e|ing)\b/i, reason: 'Breathing difficulty' },
  { regex: /\bshortness\s+of\s+breath\b/i, reason: 'Shortness of breath' },
  { regex: /\bheart\s*attack\b/i, reason: 'Possible cardiac emergency' },
  { regex: /\b(stroke|face\s*droop|slurred\s*speech|sudden\s*numbness)\b/i, reason: 'Possible stroke symptoms' },
  { regex: /\bfainting\b|\bpassed\s*out\b/i, reason: 'Loss of consciousness' },
  { regex: /\bsevere\s+bleeding\b/i, reason: 'Severe bleeding' },
  { regex: /\b(suicid(e|al)|self[-\s]*harm|kill\s*myself)\b/i, reason: 'Mental health crisis' },
];

export interface EmergencyCheckResult {
  isEmergency: boolean;
  reasons: string[];
  guidance: string;
}

export function detectEmergencySymptoms(message: string): EmergencyCheckResult {
  const reasons: string[] = [];
  for (const item of EMERGENCY_PATTERNS) {
    if (item.regex.test(message)) {
      reasons.push(item.reason);
    }
  }
  if (reasons.length === 0) {
    return { isEmergency: false, reasons: [], guidance: '' };
  }
  return {
    isEmergency: true,
    reasons,
    guidance:
      'If you are experiencing a medical emergency (such as chest pain, trouble breathing, sudden numbness, or severe bleeding), stop using this dashboard and call your local emergency number (911 in the US, 112 in India/EU, 999 in the UK) or go to the nearest emergency department immediately.',
  };
}

export function getDentalSymptomAlert(logs: DentalLog[]): {
  shouldSeeDentist: boolean;
  reason: string;
} {
  const recent = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const persistentPainDays = recent.filter((l) => l.painLevel >= 4).length;
  const bleedingDays = recent.filter((l) => l.gumBleeding).length;
  const swellingPresent = recent.some((l) => l.swelling);

  if (swellingPresent) {
    return {
      shouldSeeDentist: true,
      reason: 'Swelling logged in recent dental check-ins. Consider scheduling a dentist appointment promptly.',
    };
  }
  if (persistentPainDays >= 2) {
    return {
      shouldSeeDentist: true,
      reason: `Pain or sensitivity rated 4+/10 on ${persistentPainDays} recent days. Consider consulting a dentist.`,
    };
  }
  if (bleedingDays >= 2) {
    return {
      shouldSeeDentist: true,
      reason: `Gum bleeding noted on ${bleedingDays} recent days. Consider booking a routine periodontal check.`,
    };
  }
  return {
    shouldSeeDentist: false,
    reason: 'No persistent pain, bleeding, or swelling patterns detected.',
  };
}

export function getToothbrushStatus(replacedAt: string, todayIso: string): {
  daysUsed: number;
  daysRemaining: number;
  needsReplacement: boolean;
} {
  const start = new Date(`${replacedAt}T00:00:00Z`).getTime();
  const end = new Date(`${todayIso}T00:00:00Z`).getTime();
  const daysUsed = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, 90 - daysUsed);
  return {
    daysUsed,
    daysRemaining,
    needsReplacement: daysUsed >= 90,
  };
}

export interface StreakBadgeSummary {
  dentalStreakDays: number;
  cardioStreakDays: number;
  fogCheckinStreakDays: number;
  badges: Array<{ id: string; title: string; subtitle: string; earned: boolean }>;
}

export function calculateStreaksAndBadges(summaries: DailySummary[]): StreakBadgeSummary {
  const desc = [...summaries].sort((a, b) => b.date.localeCompare(a.date));

  const countStreak = (isComplete: (d: DailySummary) => boolean): number => {
    if (desc.length === 0) return 0;
    let startIdx = 0;
    if (!isComplete(desc[0]) && desc.length > 1 && isComplete(desc[1])) {
      startIdx = 1;
    }
    let streak = 0;
    for (let i = startIdx; i < desc.length; i++) {
      if (isComplete(desc[i])) streak++;
      else break;
    }
    return streak;
  };

  const dentalStreakDays = countStreak((d) => d.brushedAm && d.brushedPm);
  const cardioStreakDays = countStreak((d) => d.avgSystolic !== null);
  const fogCheckinStreakDays = countStreak((d) => d.clarityScore !== null);

  const hydratedDays = summaries.filter((d) => d.waterMl >= 2000).length;
  const activeGoalDays = summaries.filter((d) => d.activityMinutes >= 30).length;

  const badges = [
    {
      id: 'dental-7',
      title: 'Dual Brush Consistency',
      subtitle: '5+ days AM & PM brushing',
      earned: dentalStreakDays >= 5,
    },
    {
      id: 'cardio-7',
      title: 'Heart Guardian',
      subtitle: '7+ days BP tracking streak',
      earned: cardioStreakDays >= 7,
    },
    {
      id: 'hydration-10',
      title: 'Hydration Habit',
      subtitle: '10+ days hitting 2,000 ml water',
      earned: hydratedDays >= 10,
    },
    {
      id: 'active-10',
      title: 'Steady Mover',
      subtitle: '10+ days with 30m activity',
      earned: activeGoalDays >= 10,
    },
  ];

  return {
    dentalStreakDays,
    cardioStreakDays,
    fogCheckinStreakDays,
    badges,
  };
}
