import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDailyHealthScore,
  classifyBloodPressure,
  computeCrossModuleCorrelations,
  detectEmergencySymptoms,
  calculateOralHygieneScore,
  calculateBrainFogScore,
  calculateStreaksAndBadges,
  getDentalSymptomAlert,
  getToothbrushStatus,
} from './healthEngine';
import type { DailySummary, DentalLog } from '../types/health';

test('calculateStreaksAndBadges preserves streak when today PM brush is still pending', () => {
  const baseDay = (date: string, brushedPm: boolean): DailySummary => ({
    date,
    avgSystolic: 118,
    avgDiastolic: 76,
    avgRhr: 64,
    avgHrv: 55,
    activityMinutes: 30,
    steps: 7500,
    weightKg: 74,
    medicationTaken: true,
    brushedAm: true,
    brushedPm,
    flossed: true,
    mouthwash: true,
    tongueCleaned: false,
    sugarSnacks: 0,
    dentalPain: 0,
    gumBleeding: false,
    swelling: false,
    clarityScore: 80,
    fogSeverity: 20,
    sleepHours: 7.5,
    stressLevel: 2,
    caffeineMg: 100,
    screenTimeHours: 6,
    calories: 2000,
    proteinG: 90,
    carbsG: 220,
    fatG: 65,
    sodiumMg: 1800,
    sugarG: 30,
    fiberG: 26,
    ironMg: 10,
    vitaminDMcg: 5,
    waterMl: 2100,
    cardioScore: 90,
    dentalScore: 90,
    brainFogScore: 80,
    nutritionScore: 85,
    overallHealthScore: 86,
  });

  const streaks = calculateStreaksAndBadges([
    baseDay('2026-11-12', true),
    baseDay('2026-11-13', true),
    baseDay('2026-11-14', false),
  ]);
  assert.equal(streaks.dentalStreakDays, 2);
});

test('classifyBloodPressure correctly categorizes normal, elevated, high, and crisis readings', () => {
  assert.equal(classifyBloodPressure(116, 74).category, 'Normal');
  assert.equal(classifyBloodPressure(124, 76).category, 'Elevated');
  assert.equal(classifyBloodPressure(134, 84).category, 'High Stage 1');
  assert.equal(classifyBloodPressure(146, 94).category, 'High Stage 2');
  assert.equal(classifyBloodPressure(185, 122).category, 'Crisis');
});

test('calculateDailyHealthScore weights available modules and clamps 0-100', () => {
  const full = calculateDailyHealthScore({
    cardioScore: 90,
    nutritionScore: 80,
    brainFogScore: 80,
    dentalScore: 70,
  });
  // 90*0.3 + 80*0.25 + 80*0.25 + 70*0.2 = 27 + 20 + 20 + 14 = 81
  assert.equal(full, 81);

  const partial = calculateDailyHealthScore({
    cardioScore: 90,
    nutritionScore: null,
    brainFogScore: 70,
    dentalScore: null,
  });
  // (90*0.3 + 70*0.25) / 0.55 = 44.5 / 0.55 = 80.9 -> 81
  assert.equal(partial, 81);

  assert.equal(
    calculateDailyHealthScore({
      cardioScore: null,
      nutritionScore: null,
      brainFogScore: null,
      dentalScore: null,
    }),
    0
  );
});

test('computeCrossModuleCorrelations detects sleep-fog and sodium-RHR patterns', () => {
  const mkDay = (
    idx: number,
    sleepHours: number,
    fogSeverity: number,
    sodiumMg: number,
    avgRhr: number
  ): DailySummary => ({
    date: `2026-10-${String(idx + 1).padStart(2, '0')}`,
    avgSystolic: 118,
    avgDiastolic: 76,
    avgRhr,
    avgHrv: 52,
    activityMinutes: 35,
    steps: 8000,
    weightKg: 72,
    medicationTaken: true,
    brushedAm: true,
    brushedPm: true,
    flossed: true,
    mouthwash: true,
    tongueCleaned: false,
    sugarSnacks: 0,
    dentalPain: 0,
    gumBleeding: false,
    swelling: false,
    clarityScore: 100 - fogSeverity,
    fogSeverity,
    sleepHours,
    stressLevel: 2,
    caffeineMg: 120,
    screenTimeHours: 6,
    calories: 2000,
    proteinG: 90,
    carbsG: 220,
    fatG: 65,
    sodiumMg,
    sugarG: 30,
    fiberG: 28,
    ironMg: 12,
    vitaminDMcg: 10,
    waterMl: 2200,
    cardioScore: 90,
    dentalScore: 95,
    brainFogScore: 100 - fogSeverity,
    nutritionScore: 85,
    overallHealthScore: 90,
  });

  const summaries: DailySummary[] = [
    mkDay(0, 5.2, 58, 2800, 76),
    mkDay(1, 5.5, 52, 2700, 75),
    mkDay(2, 5.4, 56, 2650, 74),
    mkDay(3, 7.6, 20, 1700, 64),
    mkDay(4, 7.8, 18, 1650, 63),
    mkDay(5, 8.0, 22, 1800, 65),
  ];

  const insights = computeCrossModuleCorrelations(summaries);
  assert.ok(insights.some((i) => i.id === 'sleep-fog'));
  assert.ok(insights.some((i) => i.id === 'sodium-rhr'));
});

test('detectEmergencySymptoms flags urgent phrases and leaves benign queries alone', () => {
  assert.equal(detectEmergencySymptoms('I am having chest pain since morning').isEmergency, true);
  assert.equal(detectEmergencySymptoms("I can't breathe well right now").isEmergency, true);
  assert.equal(detectEmergencySymptoms('Why was my energy low on Tuesday?').isEmergency, false);
});

test('dental scoring, symptom alerts, and toothbrush replacement checks behave accurately', () => {
  const greatLog: DentalLog = {
    id: '1',
    userId: 'u1',
    date: '2026-11-14',
    brushedAm: true,
    brushedPm: true,
    flossed: true,
    mouthwash: true,
    sugarSnacks: 0,
    painLevel: 0,
    gumBleeding: false,
    swelling: false,
  };
  assert.equal(calculateOralHygieneScore(greatLog), 100);

  const alertLogs: DentalLog[] = [
    { ...greatLog, date: '2026-11-13', painLevel: 5 },
    { ...greatLog, date: '2026-11-14', painLevel: 6 },
  ];
  assert.equal(getDentalSymptomAlert(alertLogs).shouldSeeDentist, true);

  const brush = getToothbrushStatus('2026-08-01', '2026-11-14');
  assert.equal(brush.needsReplacement, true);
  assert.equal(brush.daysRemaining, 0);
});

test('calculateBrainFogScore penalizes short sleep and high stress', () => {
  const sharp = calculateBrainFogScore({
    id: 'bf1',
    userId: 'u1',
    date: '2026-11-14',
    focus: 5,
    memory: 4,
    clarity: 5,
    mood: 4,
    energy: 4,
    sleepHours: 8,
    sleepQuality: 5,
    caffeineMg: 100,
    stressLevel: 2,
    screenTimeHours: 5,
    waterMl: 2400,
  });
  const foggy = calculateBrainFogScore({
    id: 'bf2',
    userId: 'u1',
    date: '2026-11-13',
    focus: 2,
    memory: 2,
    clarity: 2,
    mood: 3,
    energy: 2,
    sleepHours: 5,
    sleepQuality: 2,
    caffeineMg: 250,
    stressLevel: 5,
    screenTimeHours: 10,
    waterMl: 1100,
  });
  assert.ok((sharp ?? 0) > (foggy ?? 0));
});
