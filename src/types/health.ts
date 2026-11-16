export type ModuleTab =
  | 'overview'
  | 'plan'
  | 'water'
  | 'cardio'
  | 'dental'
  | 'brainfog'
  | 'sleep'
  | 'nutrition'
  | 'assistant'
  | 'profile';

export type NutritionGoal = 'lose' | 'maintain' | 'gain';

export interface BpThresholds {
  systolicHigh: number;
  diastolicHigh: number;
  rhrHigh: number;
}

export interface UserProfile {
  id: string;
  name: string;
  relationship: string;
  age: number;
  heightCm: number;
  weightKg: number;
  avatarUrl: string;
  nutritionGoal: NutritionGoal;
  calorieTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  waterTargetMl: number;
  waterReminderMinutes?: number;
  activityGoalMinWeek: number;
  toothbrushReplacedAt: string; // YYYY-MM-DD
  bpThresholds: BpThresholds;
}

export interface CardioLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timeOfDay: 'morning' | 'evening';
  timestamp: string; // ISO
  systolic: number;
  diastolic: number;
  heartRate: number;
  hrvMs?: number;
  steps: number;
  activityMinutes: number;
  weightKg: number;
  medicationTaken: boolean;
  notes?: string;
}

export interface DentalLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  brushedAm: boolean;
  brushedPm: boolean;
  flossed: boolean;
  mouthwash: boolean;
  tongueCleaned?: boolean;
  sugarSnacks: number;
  painLevel: number; // 0-10
  gumBleeding: boolean;
  swelling: boolean;
  notes?: string;
  photoUrl?: string;
  photoCaption?: string;
}

export interface DentalAppointment {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  clinic: string;
  notes?: string;
}

export interface BrainFogCheckin {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  focus: number; // 1-5
  memory: number; // 1-5
  clarity: number; // 1-5
  mood: number; // 1-5
  energy: number; // 1-5
  sleepHours: number;
  sleepQuality: number; // 1-5
  caffeineMg: number;
  stressLevel: number; // 1-5
  screenTimeHours: number;
  waterMl: number;
  notes?: string;
}

export interface CognitiveTestResult {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  testType: 'reaction' | 'memory' | 'stroop';
  score: number; // normalized 0-100
  rawMetric: string; // e.g., "268 ms", "6 digits", "92% accuracy"
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  mealType: MealType;
  foodName: string;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sodiumMg: number;
  sugarG: number;
  fiberG: number;
  ironMg: number;
  vitaminDMcg: number;
  isIndianFood?: boolean;
}

export interface WaterLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  timestamp: string;
  note?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isEmergency?: boolean;
}

export interface DailySummary {
  date: string;
  avgSystolic: number | null;
  avgDiastolic: number | null;
  avgRhr: number | null;
  avgHrv: number | null;
  activityMinutes: number;
  steps: number;
  weightKg: number | null;
  medicationTaken: boolean | null;
  brushedAm: boolean;
  brushedPm: boolean;
  flossed: boolean;
  mouthwash: boolean;
  tongueCleaned: boolean;
  sugarSnacks: number;
  dentalPain: number;
  gumBleeding: boolean;
  swelling: boolean;
  clarityScore: number | null; // 0-100 higher = sharper
  fogSeverity: number | null; // 0-100 higher = foggier
  sleepHours: number | null;
  stressLevel: number | null;
  caffeineMg: number | null;
  screenTimeHours: number | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sodiumMg: number;
  sugarG: number;
  fiberG: number;
  ironMg: number;
  vitaminDMcg: number;
  waterMl: number;
  cardioScore: number | null;
  dentalScore: number | null;
  brainFogScore: number | null;
  nutritionScore: number | null;
  overallHealthScore: number;
}

export interface CorrelationInsight {
  id: string;
  title: string;
  summary: string;
  metricDelta: string;
  modules: ('cardio' | 'dental' | 'brainfog' | 'nutrition')[];
  confidence: 'Strong' | 'Moderate' | 'Emerging';
  sampleSize: number;
  direction: 'warning' | 'positive';
}

export interface FoodCatalogItem {
  id: string;
  name: string;
  category: 'Indian' | 'Global' | 'Beverage' | 'Snack';
  servingLabel: string;
  barcode?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sodiumMg: number;
  sugarG: number;
  fiberG: number;
  ironMg: number;
  vitaminDMcg: number;
}

export interface UserHealthBundle {
  profile: UserProfile;
  cardioLogs: CardioLog[];
  dentalLogs: DentalLog[];
  appointments: DentalAppointment[];
  brainFogCheckins: BrainFogCheckin[];
  cognitiveTests: CognitiveTestResult[];
  meals: MealLog[];
  waterLogs: WaterLog[];
  chatMessages: ChatMessage[];
}

export interface AppHealthPayload {
  activeUserId: string;
  profiles: UserProfile[];
  activeBundle: UserHealthBundle;
}
