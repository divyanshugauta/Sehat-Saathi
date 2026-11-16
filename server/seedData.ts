import type {
  BrainFogCheckin,
  CardioLog,
  ChatMessage,
  CognitiveTestResult,
  DentalAppointment,
  DentalLog,
  MealLog,
  UserHealthBundle,
  UserProfile,
  WaterLog,
} from '../src/types/health';

function dateOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function futureDateOffset(daysAhead: number): string {
  return dateOffset(-daysAhead);
}

function buildAaravBundle(): UserHealthBundle {
  const userId = 'aarav';
  const profile: UserProfile = {
    id: userId,
    name: 'Aarav Mehta',
    relationship: 'Primary Profile',
    age: 34,
    heightCm: 176,
    weightKg: 74.2,
    avatarUrl: '/src/assets/images/avatar_primary_user_1794651938196.jpg',
    nutritionGoal: 'maintain',
    calorieTarget: 2150,
    proteinTargetG: 110,
    carbsTargetG: 240,
    fatTargetG: 70,
    waterTargetMl: 2500,
    waterReminderMinutes: 90,
    activityGoalMinWeek: 210,
    toothbrushReplacedAt: dateOffset(68),
    bpThresholds: {
      systolicHigh: 130,
      diastolicHigh: 82,
      rhrHigh: 85,
    },
  };

  const cardioLogs: CardioLog[] = [];
  const dentalLogs: DentalLog[] = [];
  const brainFogCheckins: BrainFogCheckin[] = [];
  const meals: MealLog[] = [];
  const waterLogs: WaterLog[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = dateOffset(i);
    const isToday = i === 0;

    // Create deliberate physiological correlations across 30 days
    const shortSleepDay = i % 7 === 2 || i % 11 === 5;
    const highSodiumDay = i % 6 === 3;
    const lowActivityDay = i % 5 === 4;

    const sleepHours = shortSleepDay ? 5.3 : i % 3 === 0 ? 7.9 : 7.1;
    const activityMin = lowActivityDay ? 12 : i % 2 === 0 ? 42 : 34;
    const steps = lowActivityDay ? 4200 : i % 2 === 0 ? 9400 : 7850;
    const weight = Number((74.8 - (29 - i) * 0.02 + (highSodiumDay ? 0.3 : 0)).toFixed(1));

    // Morning Cardio Log (skip today so "Log today's BP" task shows incomplete initially, or include yesterday)
    if (!isToday) {
      const amSys = Math.round(
        (lowActivityDay ? 126 : 117) + (highSodiumDay ? 6 : 0) + ((i % 3) - 1) * 2
      );
      const amDia = Math.round((lowActivityDay ? 80 : 75) + (highSodiumDay ? 3 : 0));
      const rhr = Math.round((highSodiumDay ? 74 : 64) + (shortSleepDay ? 4 : 0));
      const hrv = Math.round((shortSleepDay ? 39 : 56) - (highSodiumDay ? 5 : 0));

      cardioLogs.push({
        id: `${userId}-c-am-${i}`,
        userId,
        date,
        timeOfDay: 'morning',
        timestamp: `${date}T07:45:00`,
        systolic: amSys,
        diastolic: amDia,
        heartRate: rhr,
        hrvMs: hrv,
        steps,
        activityMinutes: activityMin,
        weightKg: weight,
        medicationTaken: i !== 14,
        notes: highSodiumDay ? 'Dinner takeout night before' : undefined,
      });

      if (i % 2 === 0) {
        cardioLogs.push({
          id: `${userId}-c-pm-${i}`,
          userId,
          date,
          timeOfDay: 'evening',
          timestamp: `${date}T20:15:00`,
          systolic: amSys + 4,
          diastolic: amDia + 2,
          heartRate: rhr + 3,
          hrvMs: hrv - 3,
          steps: 0,
          activityMinutes: 0,
          weightKg: weight,
          medicationTaken: true,
        });
      }
    } else {
      // Seed morning activity/steps baseline for today without BP yet, or let user log BP as a primary task
      cardioLogs.push({
        id: `${userId}-c-am-0`,
        userId,
        date,
        timeOfDay: 'morning',
        timestamp: `${date}T08:10:00`,
        systolic: 118,
        diastolic: 76,
        heartRate: 64,
        hrvMs: 55,
        steps: 4620,
        activityMinutes: 25,
        weightKg: 74.2,
        medicationTaken: true,
        notes: 'Morning walk complete',
      });
    }

    // Dental Logs
    const highSugarDay = i % 8 === 1;
    dentalLogs.push({
      id: `${userId}-d-${i}`,
      userId,
      date,
      brushedAm: true,
      brushedPm: isToday ? false : i !== 9,
      flossed: i % 3 !== 0,
      mouthwash: i % 2 === 0,
      tongueCleaned: i % 2 === 0,
      sugarSnacks: highSugarDay ? 3 : i % 4 === 0 ? 1 : 0,
      painLevel: i === 6 ? 2 : 0,
      gumBleeding: false,
      swelling: false,
      notes: i === 25 ? 'Baseline hygiene routine photo' : undefined,
      photoUrl: i === 25 ? '/src/assets/images/dental_checkup_baseline_1794651939926.jpg' : undefined,
      photoCaption: i === 25 ? 'Morning care setup & gumline check' : undefined,
    });

    // Brain Fog Check-ins (skip today so user can experience 30-sec check-in, or provide yesterday)
    const waterToday = isToday ? 1600 : shortSleepDay ? 1350 : 2250;
    if (!isToday) {
      const ratingBase = shortSleepDay ? 2 : highSodiumDay ? 3 : 4;
      brainFogCheckins.push({
        id: `${userId}-bf-${i}`,
        userId,
        date,
        focus: Math.min(5, ratingBase + (i % 2)),
        memory: ratingBase,
        clarity: shortSleepDay ? 2 : 4,
        mood: shortSleepDay ? 3 : 4,
        energy: shortSleepDay ? 2 : i % 4 === 0 ? 5 : 4,
        sleepHours,
        sleepQuality: shortSleepDay ? 2 : 4,
        caffeineMg: shortSleepDay ? 240 : 120,
        stressLevel: shortSleepDay ? 4 : 2,
        screenTimeHours: shortSleepDay ? 9.5 : 6.5,
        waterMl: waterToday,
        notes: shortSleepDay ? 'Late screen time before bed' : undefined,
      });
    }

    // Water logs (today split into 4 realistic glass entries totaling 1.6 L)
    if (isToday) {
      waterLogs.push(
        { id: `${userId}-w-0a`, userId, date, amountMl: 250, timestamp: `${date}T07:20:00`, note: 'Warm morning glass' },
        { id: `${userId}-w-0b`, userId, date, amountMl: 350, timestamp: `${date}T09:15:00`, note: 'Post-walk hydration' },
        { id: `${userId}-w-0c`, userId, date, amountMl: 500, timestamp: `${date}T11:40:00`, note: 'Desk bottle refill' },
        { id: `${userId}-w-0d`, userId, date, amountMl: 500, timestamp: `${date}T14:50:00`, note: 'Afternoon glass' }
      );
    } else {
      waterLogs.push({
        id: `${userId}-w-${i}`,
        userId,
        date,
        amountMl: waterToday,
        timestamp: `${date}T13:00:00`,
      });
    }

    // Nutrition Meals (with Indian + Global dishes)
    if (!isToday) {
      meals.push({
        id: `${userId}-m1-${i}`,
        userId,
        date,
        timestamp: `${date}T08:30:00`,
        mealType: 'breakfast',
        foodName: i % 2 === 0 ? 'Kanda Poha with Peanuts' : 'Rolled Oats with Chia & Blueberries',
        servingLabel: '1 bowl',
        calories: i % 2 === 0 ? 255 : 310,
        proteinG: i % 2 === 0 ? 6 : 11,
        carbsG: i % 2 === 0 ? 42 : 48,
        fatG: i % 2 === 0 ? 7 : 8,
        sodiumMg: i % 2 === 0 ? 380 : 95,
        sugarG: i % 2 === 0 ? 2.4 : 9.4,
        fiberG: i % 2 === 0 ? 3 : 8,
        ironMg: 2.4,
        vitaminDMcg: 0,
        isIndianFood: i % 2 === 0,
      });

      meals.push({
        id: `${userId}-m2-${i}`,
        userId,
        date,
        timestamp: `${date}T13:15:00`,
        mealType: 'lunch',
        foodName: highSodiumDay
          ? 'Restaurant Ramen / High-Sodium Noodle Bowl'
          : '2 Whole Wheat Roti + Dal Tadka + Dahi',
        servingLabel: highSodiumDay ? '1 large bowl' : 'Full thali',
        calories: highSodiumDay ? 640 : 551,
        proteinG: highSodiumDay ? 24 : 25,
        carbsG: highSodiumDay ? 78 : 79,
        fatG: highSodiumDay ? 24 : 14,
        sodiumMg: highSodiumDay ? 1980 : 770,
        sugarG: highSodiumDay ? 6.5 : 10.1,
        fiberG: highSodiumDay ? 3.5 : 12,
        ironMg: 5.1,
        vitaminDMcg: 0.8,
        isIndianFood: !highSodiumDay,
      });

      meals.push({
        id: `${userId}-m3-${i}`,
        userId,
        date,
        timestamp: `${date}T20:00:00`,
        mealType: 'dinner',
        foodName: shortSleepDay
          ? 'Moong Sprouts Chaat'
          : i % 2 === 0
          ? 'Palak Paneer + 2 Whole Wheat Roti'
          : 'Grilled Salmon with Quinoa & Greens',
        servingLabel: '1 serving',
        calories: shortSleepDay ? 290 : 503,
        proteinG: shortSleepDay ? 18 : 29,
        carbsG: shortSleepDay ? 42 : 46,
        fatG: shortSleepDay ? 5 : 23,
        sodiumMg: shortSleepDay ? 360 : highSodiumDay ? 720 : 510,
        sugarG: 3.5,
        fiberG: 7,
        ironMg: 3.5,
        vitaminDMcg: i % 2 === 0 ? 0.4 : 11.5,
        isIndianFood: shortSleepDay || i % 2 === 0,
      });
    } else {
      // Today: breakfast logged, lunch waiting to be logged!
      meals.push({
        id: `${userId}-m1-0`,
        userId,
        date,
        timestamp: `${date}T08:40:00`,
        mealType: 'breakfast',
        foodName: 'Steamed Idli with Sambar + Boiled Eggs (2 large)',
        servingLabel: '3 idlis + 2 eggs',
        calories: 430,
        proteinG: 22.4,
        carbsG: 51.3,
        fatG: 14.2,
        sodiumMg: 614,
        sugarG: 4.3,
        fiberG: 5.1,
        ironMg: 3.1,
        vitaminDMcg: 2.2,
        isIndianFood: true,
      });
    }
  }

  const appointments: DentalAppointment[] = [
    {
      id: 'apt-1',
      userId,
      date: futureDateOffset(19),
      title: '6-Month Cleaning & Exam',
      clinic: 'Apex Dental Studio',
      notes: 'Routine scaling and enamel check',
    },
  ];

  const cognitiveTests: CognitiveTestResult[] = [
    {
      id: 'cog-1',
      userId,
      date: dateOffset(6),
      timestamp: `${dateOffset(6)}T10:15:00`,
      testType: 'reaction',
      score: 76,
      rawMetric: '286 ms avg',
    },
    {
      id: 'cog-2',
      userId,
      date: dateOffset(3),
      timestamp: `${dateOffset(3)}T11:20:00`,
      testType: 'stroop',
      score: 84,
      rawMetric: '88% accuracy · 740 ms',
    },
    {
      id: 'cog-3',
      userId,
      date: dateOffset(1),
      timestamp: `${dateOffset(1)}T09:40:00`,
      testType: 'memory',
      score: 88,
      rawMetric: '6-step sequence',
    },
  ];

  const chatMessages: ChatMessage[] = [
    {
      id: 'chat-welcome',
      userId,
      role: 'assistant',
      content:
        'I can review your last 30 days across Cardiovascular, Dental, Brain Fog, and Nutrition. Ask about patterns like why your energy dipped or how your blood pressure is trending. Note: I provide wellness insights, not medical diagnoses.',
      timestamp: `${dateOffset(0)}T08:00:00`,
    },
  ];

  return {
    profile,
    cardioLogs,
    dentalLogs,
    appointments,
    brainFogCheckins,
    cognitiveTests,
    meals,
    waterLogs,
    chatMessages,
  };
}

function buildSunitaBundle(): UserHealthBundle {
  const userId = 'sunita';
  const profile: UserProfile = {
    id: userId,
    name: 'Sunita Mehta',
    relationship: 'Mother · Family Care',
    age: 62,
    heightCm: 158,
    weightKg: 64.5,
    avatarUrl: '/src/assets/images/avatar_family_parent_1794651939793.jpg',
    nutritionGoal: 'maintain',
    calorieTarget: 1750,
    proteinTargetG: 75,
    carbsTargetG: 210,
    fatTargetG: 55,
    waterTargetMl: 2000,
    activityGoalMinWeek: 150,
    toothbrushReplacedAt: dateOffset(96),
    bpThresholds: {
      systolicHigh: 135,
      diastolicHigh: 85,
      rhrHigh: 88,
    },
  };

  const cardioLogs: CardioLog[] = [];
  const dentalLogs: DentalLog[] = [];
  const brainFogCheckins: BrainFogCheckin[] = [];
  const meals: MealLog[] = [];
  const waterLogs: WaterLog[] = [];

  for (let i = 19; i >= 0; i--) {
    const date = dateOffset(i);
    const highSodiumDay = i % 5 === 2;
    const sys = 132 + (highSodiumDay ? 9 : 0) - Math.floor((19 - i) * 0.35);
    const dia = 82 + (highSodiumDay ? 5 : 0);

    cardioLogs.push({
      id: `${userId}-c-${i}`,
      userId,
      date,
      timeOfDay: 'morning',
      timestamp: `${date}T07:30:00`,
      systolic: sys,
      diastolic: dia,
      heartRate: highSodiumDay ? 78 : 71,
      hrvMs: 41,
      steps: 5400,
      activityMinutes: 25,
      weightKg: 64.5,
      medicationTaken: i !== 7,
    });

    dentalLogs.push({
      id: `${userId}-d-${i}`,
      userId,
      date,
      brushedAm: true,
      brushedPm: i !== 0,
      flossed: i % 2 === 0,
      mouthwash: true,
      sugarSnacks: 0,
      painLevel: i <= 2 ? 2 : 0,
      gumBleeding: false,
      swelling: false,
    });

    brainFogCheckins.push({
      id: `${userId}-bf-${i}`,
      userId,
      date,
      focus: 4,
      memory: 4,
      clarity: 4,
      mood: 4,
      energy: highSodiumDay ? 3 : 4,
      sleepHours: 7.2,
      sleepQuality: 4,
      caffeineMg: 70,
      stressLevel: 2,
      screenTimeHours: 3.5,
      waterMl: 1900,
    });

    waterLogs.push({
      id: `${userId}-w-${i}`,
      userId,
      date,
      amountMl: 1900,
      timestamp: `${date}T14:00:00`,
    });

    meals.push({
      id: `${userId}-m-${i}`,
      userId,
      date,
      timestamp: `${date}T13:00:00`,
      mealType: 'lunch',
      foodName: '2 Whole Wheat Roti + Dal Tadka + Bhindi Masala',
      servingLabel: 'Lunch thali',
      calories: 608,
      proteinG: 23.4,
      carbsG: 86.5,
      fatG: 18.4,
      sodiumMg: highSodiumDay ? 2450 : 1010,
      sugarG: 7.1,
      fiberG: 16.9,
      ironMg: 6.3,
      vitaminDMcg: 0,
      isIndianFood: true,
    });
  }

  return {
    profile,
    cardioLogs,
    dentalLogs,
    appointments: [
      {
        id: 'apt-s1',
        userId,
        date: futureDateOffset(11),
        title: 'Routine Checkup & Sensitivity Review',
        clinic: 'Lotus Dental Care',
      },
    ],
    brainFogCheckins,
    cognitiveTests: [],
    meals,
    waterLogs,
    chatMessages: [
      {
        id: 'chat-sunita-1',
        userId,
        role: 'assistant',
        content:
          "Viewing Sunita's Family Care profile. Morning blood pressure has been trending gently downward over the past 2 weeks alongside consistent medication adherence.",
        timestamp: `${dateOffset(0)}T08:00:00`,
      },
    ],
  };
}

export function createInitialSeedDatabase(): {
  activeUserId: string;
  bundles: Record<string, UserHealthBundle>;
} {
  const aarav = buildAaravBundle();
  const sunita = buildSunitaBundle();
  return {
    activeUserId: aarav.profile.id,
    bundles: {
      [aarav.profile.id]: aarav,
      [sunita.profile.id]: sunita,
    },
  };
}
