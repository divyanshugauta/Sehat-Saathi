import fs from 'fs';
import path from 'path';
import type {
  AppHealthPayload,
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
import { createInitialSeedDatabase } from './seedData';

interface StoreSchema {
  activeUserId: string;
  bundles: Record<string, UserHealthBundle>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'health-store.json');

let memoryStore: StoreSchema | null = null;

function ensureStoreLoaded(): StoreSchema {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as StoreSchema;
      if (parsed && parsed.bundles && Object.keys(parsed.bundles).length > 0) {
        memoryStore = parsed;
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn('Could not read store file, regenerating seed store:', err);
  }
  memoryStore = createInitialSeedDatabase();
  persistStore();
  return memoryStore;
}

function persistStore(): void {
  if (!memoryStore) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

export function getAppPayload(requestedUserId?: string): AppHealthPayload {
  const store = ensureStoreLoaded();
  const profileIds = Object.keys(store.bundles);
  const activeId =
    requestedUserId && store.bundles[requestedUserId]
      ? requestedUserId
      : store.bundles[store.activeUserId]
      ? store.activeUserId
      : profileIds[0];

  if (requestedUserId && store.bundles[requestedUserId] && store.activeUserId !== requestedUserId) {
    store.activeUserId = requestedUserId;
    persistStore();
  }

  return {
    activeUserId: activeId,
    profiles: Object.values(store.bundles).map((b) => b.profile),
    activeBundle: store.bundles[activeId],
  };
}

function getBundle(userId?: string): UserHealthBundle {
  const store = ensureStoreLoaded();
  const id = userId && store.bundles[userId] ? userId : store.activeUserId;
  return store.bundles[id];
}

export function addCardioLog(
  input: Omit<CardioLog, 'id' | 'userId'>,
  userId?: string
): CardioLog {
  const bundle = getBundle(userId);
  const entry: CardioLog = {
    ...input,
    id: `cardio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: bundle.profile.id,
  };
  bundle.cardioLogs.push(entry);
  bundle.profile.weightKg = entry.weightKg;
  persistStore();
  return entry;
}

export function upsertDentalLog(
  input: Omit<DentalLog, 'id' | 'userId'>,
  userId?: string
): DentalLog {
  const bundle = getBundle(userId);
  const existingIdx = bundle.dentalLogs.findIndex((d) => d.date === input.date);
  if (existingIdx >= 0) {
    const merged: DentalLog = {
      ...bundle.dentalLogs[existingIdx],
      ...input,
      photoUrl: input.photoUrl || bundle.dentalLogs[existingIdx].photoUrl,
      photoCaption: input.photoCaption || bundle.dentalLogs[existingIdx].photoCaption,
    };
    bundle.dentalLogs[existingIdx] = merged;
    persistStore();
    return merged;
  }
  const created: DentalLog = {
    ...input,
    id: `dental-${Date.now()}`,
    userId: bundle.profile.id,
  };
  bundle.dentalLogs.push(created);
  persistStore();
  return created;
}

export function addDentalAppointment(
  input: Omit<DentalAppointment, 'id' | 'userId'>,
  userId?: string
): DentalAppointment {
  const bundle = getBundle(userId);
  const apt: DentalAppointment = {
    ...input,
    id: `apt-${Date.now()}`,
    userId: bundle.profile.id,
  };
  bundle.appointments.push(apt);
  persistStore();
  return apt;
}

export function upsertBrainFogCheckin(
  input: Omit<BrainFogCheckin, 'id' | 'userId'>,
  userId?: string
): BrainFogCheckin {
  const bundle = getBundle(userId);
  const existingIdx = bundle.brainFogCheckins.findIndex((b) => b.date === input.date);
  if (existingIdx >= 0) {
    const updated: BrainFogCheckin = {
      ...bundle.brainFogCheckins[existingIdx],
      ...input,
    };
    bundle.brainFogCheckins[existingIdx] = updated;
    persistStore();
    return updated;
  }
  const created: BrainFogCheckin = {
    ...input,
    id: `fog-${Date.now()}`,
    userId: bundle.profile.id,
  };
  bundle.brainFogCheckins.push(created);
  persistStore();
  return created;
}

export function addCognitiveTest(
  input: Omit<CognitiveTestResult, 'id' | 'userId'>,
  userId?: string
): CognitiveTestResult {
  const bundle = getBundle(userId);
  const created: CognitiveTestResult = {
    ...input,
    id: `cog-${Date.now()}`,
    userId: bundle.profile.id,
  };
  bundle.cognitiveTests.push(created);
  persistStore();
  return created;
}

export function addMealLog(
  input: Omit<MealLog, 'id' | 'userId'>,
  userId?: string
): MealLog {
  const bundle = getBundle(userId);
  const created: MealLog = {
    ...input,
    id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: bundle.profile.id,
  };
  bundle.meals.push(created);
  persistStore();
  return created;
}

export function deleteMealLog(mealId: string, userId?: string): boolean {
  const bundle = getBundle(userId);
  const before = bundle.meals.length;
  bundle.meals = bundle.meals.filter((m) => m.id !== mealId);
  if (bundle.meals.length !== before) {
    persistStore();
    return true;
  }
  return false;
}

export function addWaterLog(
  input: Omit<WaterLog, 'id' | 'userId'>,
  userId?: string
): WaterLog {
  const bundle = getBundle(userId);
  const created: WaterLog = {
    ...input,
    id: `water-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    userId: bundle.profile.id,
  };
  bundle.waterLogs.push(created);
  persistStore();
  return created;
}

export function updateWaterLog(
  waterId: string,
  patch: { amountMl?: number; note?: string },
  userId?: string
): WaterLog | null {
  const bundle = getBundle(userId);
  const item = bundle.waterLogs.find((w) => w.id === waterId);
  if (!item) return null;
  if (typeof patch.amountMl === 'number' && patch.amountMl > 0) {
    item.amountMl = patch.amountMl;
  }
  if (typeof patch.note === 'string') {
    item.note = patch.note;
  }
  persistStore();
  return item;
}

export function deleteWaterLog(waterId: string, userId?: string): boolean {
  const bundle = getBundle(userId);
  const before = bundle.waterLogs.length;
  bundle.waterLogs = bundle.waterLogs.filter((w) => w.id !== waterId);
  if (bundle.waterLogs.length !== before) {
    persistStore();
    return true;
  }
  return false;
}

export function updateProfile(
  patch: Partial<UserProfile>,
  userId?: string
): UserProfile {
  const bundle = getBundle(userId);
  bundle.profile = {
    ...bundle.profile,
    ...patch,
    id: bundle.profile.id,
    bpThresholds: {
      ...bundle.profile.bpThresholds,
      ...(patch.bpThresholds || {}),
    },
  };
  persistStore();
  return bundle.profile;
}

export function appendChatMessage(
  msg: Omit<ChatMessage, 'id' | 'userId'>,
  userId?: string
): ChatMessage {
  const bundle = getBundle(userId);
  const created: ChatMessage = {
    ...msg,
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    userId: bundle.profile.id,
  };
  bundle.chatMessages.push(created);
  persistStore();
  return created;
}

export function exportAllData(): StoreSchema {
  return ensureStoreLoaded();
}

export function resetToDemoSeed(): AppHealthPayload {
  memoryStore = createInitialSeedDatabase();
  persistStore();
  return getAppPayload();
}

export function clearUserHealthData(userId?: string): AppHealthPayload {
  const bundle = getBundle(userId);
  bundle.cardioLogs = [];
  bundle.dentalLogs = [];
  bundle.appointments = [];
  bundle.brainFogCheckins = [];
  bundle.cognitiveTests = [];
  bundle.meals = [];
  bundle.waterLogs = [];
  bundle.chatMessages = [
    {
      id: `msg-cleared-${Date.now()}`,
      userId: bundle.profile.id,
      role: 'assistant',
      content: 'All health logs for this profile have been deleted. You can start fresh anytime.',
      timestamp: new Date().toISOString(),
    },
  ];
  persistStore();
  return getAppPayload(bundle.profile.id);
}
