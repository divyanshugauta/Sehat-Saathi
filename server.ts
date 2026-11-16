import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { FOOD_CATALOG } from './src/data/foodCatalog';
import {
  buildDailySummaries,
  computeCrossModuleCorrelations,
} from './src/utils/healthEngine';
import {
  analyzeMealPhotoWithGemini,
  chatWithHealthAssistant,
  generateWeeklyReport,
  parseMealFromText,
} from './server/gemini';
import {
  addCardioLog,
  addCognitiveTest,
  addDentalAppointment,
  addMealLog,
  addWaterLog,
  appendChatMessage,
  clearUserHealthData,
  deleteMealLog,
  deleteWaterLog,
  exportAllData,
  getAppPayload,
  resetToDemoSeed,
  updateProfile,
  updateWaterLog,
  upsertBrainFogCheckin,
  upsertDentalLog,
} from './server/store';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '12mb' }));

  // Unified health data payload
  app.get('/api/health-data', (req, res) => {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    res.json(getAppPayload(userId));
  });

  // Cardio CRUD
  app.post('/api/cardio', (req, res) => {
    const { userId, ...body } = req.body || {};
    if (!body.systolic || !body.diastolic || !body.heartRate || !body.date) {
      res.status(400).json({ error: 'Systolic, diastolic, heartRate, and date are required.' });
      return;
    }
    const created = addCardioLog(
      {
        date: body.date,
        timeOfDay: body.timeOfDay === 'evening' ? 'evening' : 'morning',
        timestamp: body.timestamp || new Date().toISOString(),
        systolic: Number(body.systolic),
        diastolic: Number(body.diastolic),
        heartRate: Number(body.heartRate),
        hrvMs: body.hrvMs ? Number(body.hrvMs) : undefined,
        steps: Number(body.steps || 0),
        activityMinutes: Number(body.activityMinutes || 0),
        weightKg: Number(body.weightKg || 70),
        medicationTaken: Boolean(body.medicationTaken),
        notes: body.notes ? String(body.notes) : undefined,
      },
      userId
    );
    res.status(201).json({ entry: created, payload: getAppPayload(userId) });
  });

  // Dental CRUD
  app.post('/api/dental', (req, res) => {
    const { userId, ...body } = req.body || {};
    if (!body.date) {
      res.status(400).json({ error: 'Date is required.' });
      return;
    }
    const saved = upsertDentalLog(
      {
        date: body.date,
        brushedAm: Boolean(body.brushedAm),
        brushedPm: Boolean(body.brushedPm),
        flossed: Boolean(body.flossed),
        mouthwash: Boolean(body.mouthwash),
        tongueCleaned: Boolean(body.tongueCleaned),
        sugarSnacks: Number(body.sugarSnacks || 0),
        painLevel: Number(body.painLevel || 0),
        gumBleeding: Boolean(body.gumBleeding),
        swelling: Boolean(body.swelling),
        notes: body.notes ? String(body.notes) : undefined,
        photoUrl: body.photoUrl ? String(body.photoUrl) : undefined,
        photoCaption: body.photoCaption ? String(body.photoCaption) : undefined,
      },
      userId
    );
    res.status(201).json({ entry: saved, payload: getAppPayload(userId) });
  });

  app.post('/api/dental/appointments', (req, res) => {
    const { userId, date, title, clinic, notes } = req.body || {};
    if (!date || !title) {
      res.status(400).json({ error: 'Appointment date and title are required.' });
      return;
    }
    const created = addDentalAppointment(
      {
        date,
        title,
        clinic: clinic || 'Dental Clinic',
        notes,
      },
      userId
    );
    res.status(201).json({ entry: created, payload: getAppPayload(userId) });
  });

  // Brain Fog & Cognitive Tests
  app.post('/api/brainfog', (req, res) => {
    const { userId, ...body } = req.body || {};
    if (!body.date) {
      res.status(400).json({ error: 'Date is required.' });
      return;
    }
    const saved = upsertBrainFogCheckin(
      {
        date: body.date,
        focus: Number(body.focus || 3),
        memory: Number(body.memory || 3),
        clarity: Number(body.clarity || 3),
        mood: Number(body.mood || 3),
        energy: Number(body.energy || 3),
        sleepHours: Number(body.sleepHours || 7),
        sleepQuality: Number(body.sleepQuality || 3),
        caffeineMg: Number(body.caffeineMg || 0),
        stressLevel: Number(body.stressLevel || 3),
        screenTimeHours: Number(body.screenTimeHours || 6),
        waterMl: Number(body.waterMl || 1800),
        notes: body.notes ? String(body.notes) : undefined,
      },
      userId
    );
    res.status(201).json({ entry: saved, payload: getAppPayload(userId) });
  });

  app.post('/api/cognitive-tests', (req, res) => {
    const { userId, date, testType, score, rawMetric } = req.body || {};
    if (!testType || typeof score !== 'number') {
      res.status(400).json({ error: 'testType and numeric score are required.' });
      return;
    }
    const created = addCognitiveTest(
      {
        date: date || new Date().toISOString().slice(0, 10),
        timestamp: new Date().toISOString(),
        testType,
        score,
        rawMetric: rawMetric || `${score}/100`,
      },
      userId
    );
    res.status(201).json({ entry: created, payload: getAppPayload(userId) });
  });

  // Nutrition Meals & Water
  app.post('/api/meals', (req, res) => {
    const { userId, ...body } = req.body || {};
    if (!body.foodName || !body.date) {
      res.status(400).json({ error: 'foodName and date are required.' });
      return;
    }
    const created = addMealLog(
      {
        date: body.date,
        timestamp: body.timestamp || new Date().toISOString(),
        mealType: body.mealType || 'lunch',
        foodName: String(body.foodName),
        servingLabel: String(body.servingLabel || '1 serving'),
        calories: Number(body.calories || 0),
        proteinG: Number(body.proteinG || 0),
        carbsG: Number(body.carbsG || 0),
        fatG: Number(body.fatG || 0),
        sodiumMg: Number(body.sodiumMg || 0),
        sugarG: Number(body.sugarG || 0),
        fiberG: Number(body.fiberG || 0),
        ironMg: Number(body.ironMg || 0),
        vitaminDMcg: Number(body.vitaminDMcg || 0),
        isIndianFood: Boolean(body.isIndianFood),
      },
      userId
    );
    res.status(201).json({ entry: created, payload: getAppPayload(userId) });
  });

  app.delete('/api/meals/:id', (req, res) => {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    deleteMealLog(req.params.id, userId);
    res.json({ payload: getAppPayload(userId) });
  });

  app.post('/api/water', (req, res) => {
    const { userId, date, amountMl, note } = req.body || {};
    if (!date || !amountMl) {
      res.status(400).json({ error: 'date and amountMl are required.' });
      return;
    }
    const created = addWaterLog(
      {
        date,
        amountMl: Number(amountMl),
        timestamp: new Date().toISOString(),
        note: note ? String(note) : undefined,
      },
      userId
    );
    res.status(201).json({ entry: created, payload: getAppPayload(userId) });
  });

  app.patch('/api/water/:id', (req, res) => {
    const { userId, amountMl, note } = req.body || {};
    const updated = updateWaterLog(
      req.params.id,
      {
        amountMl: amountMl !== undefined ? Number(amountMl) : undefined,
        note: note !== undefined ? String(note) : undefined,
      },
      userId
    );
    if (!updated) {
      res.status(404).json({ error: 'Water entry not found.' });
      return;
    }
    res.json({ entry: updated, payload: getAppPayload(userId) });
  });

  app.delete('/api/water/:id', (req, res) => {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    deleteWaterLog(req.params.id, userId);
    res.json({ payload: getAppPayload(userId) });
  });

  // Food search (local Indian + Global catalog, plus optional Open Food Facts barcode/query lookup)
  app.get('/api/foods/search', async (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const barcode = String(req.query.barcode || '').trim();

    if (barcode) {
      const localMatch = FOOD_CATALOG.find((f) => f.barcode === barcode);
      if (localMatch) {
        res.json({ items: [localMatch], source: 'local' });
        return;
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const offRes = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        const offData = (await offRes.json()) as {
          status?: number;
          product?: {
            product_name?: string;
            serving_size?: string;
            nutriments?: Record<string, number>;
          };
        };
        if (offData.status === 1 && offData.product?.product_name) {
          const n = offData.product.nutriments || {};
          res.json({
            items: [
              {
                id: `off-${barcode}`,
                name: offData.product.product_name,
                category: 'Global',
                servingLabel: offData.product.serving_size || '100g serving',
                barcode,
                calories: Math.round(n['energy-kcal_100g'] || 180),
                proteinG: Number((n['proteins_100g'] || 6).toFixed(1)),
                carbsG: Number((n['carbohydrates_100g'] || 22).toFixed(1)),
                fatG: Number((n['fat_100g'] || 6).toFixed(1)),
                sodiumMg: Math.round((n['sodium_100g'] || 0.2) * 1000),
                sugarG: Number((n['sugars_100g'] || 4).toFixed(1)),
                fiberG: Number((n['fiber_100g'] || 2).toFixed(1)),
                ironMg: 1.0,
                vitaminDMcg: 0,
              },
            ],
            source: 'openfoodfacts',
          });
          return;
        }
      } catch {
        // Offline or timeout fallback
      }
      res.json({ items: [], source: 'none' });
      return;
    }

    const filtered = q
      ? FOOD_CATALOG.filter(
          (f) =>
            f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
        )
      : FOOD_CATALOG;
    res.json({ items: filtered, source: 'local' });
  });

  // Profile & Privacy controls
  app.patch('/api/profile', (req, res) => {
    const { userId, ...patch } = req.body || {};
    updateProfile(patch, userId);
    res.json({ payload: getAppPayload(userId) });
  });

  app.get('/api/export', (_req, res) => {
    res.json(exportAllData());
  });

  app.post('/api/reset', (_req, res) => {
    res.json(resetToDemoSeed());
  });

  app.post('/api/delete-all', (req, res) => {
    const { userId } = req.body || {};
    res.json(clearUserHealthData(userId));
  });

  // AI Health Assistant & Vision/Voice Endpoints
  app.post('/api/ai/chat', async (req, res) => {
    const { userId, message } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required.' });
      return;
    }
    const payload = getAppPayload(userId);
    const summaries = buildDailySummaries(payload.activeBundle, 30);
    const correlations = computeCrossModuleCorrelations(summaries);

    appendChatMessage(
      {
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      },
      userId
    );

    const result = await chatWithHealthAssistant({
      profile: payload.activeBundle.profile,
      summaries,
      correlations,
      history: payload.activeBundle.chatMessages,
      message: message.trim(),
    });

    const assistantMsg = appendChatMessage(
      {
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toISOString(),
        isEmergency: result.isEmergency,
      },
      userId
    );

    res.json({
      reply: assistantMsg,
      isEmergency: result.isEmergency,
      usedFallback: result.usedFallback,
      payload: getAppPayload(userId),
    });
  });

  app.post('/api/ai/weekly-report', async (req, res) => {
    const { userId } = req.body || {};
    const payload = getAppPayload(userId);
    const summaries = buildDailySummaries(payload.activeBundle, 30);
    const correlations = computeCrossModuleCorrelations(summaries);
    const report = await generateWeeklyReport({
      profile: payload.activeBundle.profile,
      summaries,
      correlations,
    });
    res.json(report);
  });

  app.post('/api/ai/analyze-meal', async (req, res) => {
    try {
      const { base64Image, mimeType, note } = req.body || {};
      if (!base64Image || !mimeType) {
        res.status(400).json({ error: 'Image data and mimeType are required.' });
        return;
      }
      const parsed = await analyzeMealPhotoWithGemini({ base64Image, mimeType, note });
      res.json({ meal: parsed });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to analyze meal photo.';
      res.status(422).json({ error: msg });
    }
  });

  app.post('/api/ai/parse-meal', async (req, res) => {
    const { transcript } = req.body || {};
    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ error: 'transcript is required.' });
      return;
    }
    const meal = await parseMealFromText(transcript);
    res.json({ meal });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
      plugins: [
        {
          name: 'sehat-saathi-disable-hmr-ws',
          enforce: 'post',
          transform(code, id) {
            if (id.replace(/\\/g, '/').endsWith('/vite/dist/client/client.mjs')) {
              return {
                code: code.replace(
                  /const transport = normalizeModuleRunnerTransport\(\(\(\) => \{[\s\S]*?\}\)\(\)\);/,
                  'const transport = normalizeModuleRunnerTransport({ async connect() {}, async disconnect() {}, send() {} });'
                ),
                map: null,
              };
            }
          },
        },
      ],
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sehat Saathi server running at http://localhost:${PORT}`);
  });
}

startServer();
