import { GoogleGenAI, Type } from '@google/genai';
import type {
  ChatMessage,
  CorrelationInsight,
  DailySummary,
  UserProfile,
} from '../src/types/health';
import { deterministicParseMealText } from '../src/data/foodCatalog';
import { detectEmergencySymptoms } from '../src/utils/healthEngine';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const HEALTH_ASSISTANT_SYSTEM_PROMPT = `You are Meridian, a calm, evidence-informed personal wellness assistant inside a multi-module health dashboard (Cardiovascular, Dental, Brain Fog, Nutrition & Calories).
STRICT SAFETY & CLINICAL RULES:
1. You are NOT a medical device and you MUST NEVER diagnose conditions, prescribe medications, or replace a licensed clinician.
2. When readings or symptoms look concerning (persistent high BP, persistent dental pain/bleeding, extreme fatigue), gently suggest consulting a doctor or dentist.
3. Ground every insight strictly in the user's 30-day structured daily summaries and detected correlations provided in the prompt. Cite specific numbers and dates accurately.
4. Keep responses concise, structured, empathetic, and easy to scan (short paragraphs or bullet points).`;

export async function chatWithHealthAssistant(params: {
  profile: UserProfile;
  summaries: DailySummary[];
  correlations: CorrelationInsight[];
  history: ChatMessage[];
  message: string;
}): Promise<{ reply: string; isEmergency: boolean; usedFallback: boolean }> {
  const emergency = detectEmergencySymptoms(params.message);
  if (emergency.isEmergency) {
    return {
      reply: emergency.guidance,
      isEmergency: true,
      usedFallback: false,
    };
  }

  const ai = getGeminiClient();
  const compactSummaries = params.summaries.slice(-30).map((s) => ({
    date: s.date,
    bp: s.avgSystolic ? `${s.avgSystolic}/${s.avgDiastolic}` : null,
    rhr: s.avgRhr,
    actMin: s.activityMinutes,
    clarity: s.clarityScore,
    sleepH: s.sleepHours,
    stress: s.stressLevel,
    kcal: s.calories,
    proteinG: s.proteinG,
    sodiumMg: s.sodiumMg,
    waterMl: s.waterMl,
    oralScore: s.dentalScore,
    pain: s.dentalPain,
    healthScore: s.overallHealthScore,
  }));

  if (!ai) {
    return {
      reply: buildStructuredLocalAnswer(params.message, params.profile, params.summaries, params.correlations),
      isEmergency: false,
      usedFallback: true,
    };
  }

  try {
    const contextBlock = JSON.stringify({
      profile: {
        name: params.profile.name,
        age: params.profile.age,
        goal: params.profile.nutritionGoal,
        calorieTarget: params.profile.calorieTarget,
        bpThresholds: params.profile.bpThresholds,
      },
      correlations: params.correlations.map((c) => `${c.title}: ${c.summary} (${c.metricDelta})`),
      last30Days: compactSummaries,
    });

    const recentHistory = params.history
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Structured 30-day user context:\n${contextBlock}\n\nRecent conversation:\n${recentHistory}\n\nUser question: ${params.message}`,
      config: {
        systemInstruction: HEALTH_ASSISTANT_SYSTEM_PROMPT,
      },
    });

    return {
      reply:
        response.text?.trim() ||
        buildStructuredLocalAnswer(params.message, params.profile, params.summaries, params.correlations),
      isEmergency: false,
      usedFallback: false,
    };
  } catch (err) {
    console.error('Gemini chat error:', err);
    return {
      reply: buildStructuredLocalAnswer(params.message, params.profile, params.summaries, params.correlations),
      isEmergency: false,
      usedFallback: true,
    };
  }
}

function buildStructuredLocalAnswer(
  question: string,
  profile: UserProfile,
  summaries: DailySummary[],
  correlations: CorrelationInsight[]
): string {
  const q = question.toLowerCase();
  const recent7 = summaries.slice(-7);
  const bpDays = recent7.filter((d) => d.avgSystolic !== null);
  const avgSys = bpDays.length
    ? Math.round(bpDays.reduce((s, d) => s + (d.avgSystolic ?? 0), 0) / bpDays.length)
    : null;
  const avgDia = bpDays.length
    ? Math.round(bpDays.reduce((s, d) => s + (d.avgDiastolic ?? 0), 0) / bpDays.length)
    : null;
  const clarityDays = recent7.filter((d) => d.clarityScore !== null);
  const avgClarity = clarityDays.length
    ? Math.round(clarityDays.reduce((s, d) => s + (d.clarityScore ?? 0), 0) / clarityDays.length)
    : null;
  const avgSleep = clarityDays.length
    ? (
        clarityDays.reduce((s, d) => s + (d.sleepHours ?? 0), 0) / clarityDays.length
      ).toFixed(1)
    : null;

  if (q.includes('bp') || q.includes('blood pressure') || q.includes('heart')) {
    return avgSys
      ? `Over the last 7 logged days for ${profile.name}, average blood pressure is ${avgSys}/${avgDia} mmHg (threshold ${profile.bpThresholds.systolicHigh}/${profile.bpThresholds.diastolicHigh} mmHg). ${correlations.find((c) => c.modules.includes('cardio'))?.summary ?? 'Keeping activity above 30 min/day and sodium under 2,300 mg supports steadier readings.'} Consider sharing trends with your doctor at your next visit.`
      : 'There are not enough recent blood pressure entries to evaluate a trend yet. Log a morning reading in Cardiovascular to begin tracking.';
  }

  if (q.includes('energy') || q.includes('fog') || q.includes('tired') || q.includes('focus')) {
    const sleepInsight = correlations.find((c) => c.id === 'sleep-fog' || c.id === 'fuel-clarity');
    return `Your 7-day mental clarity score averages ${avgClarity ?? '--'}/100 with ${avgSleep ?? '--'} hours of sleep per night. ${sleepInsight ? sleepInsight.summary : 'Consistent sleep (7+ hrs) and hydration (2,000+ ml) strongly support daytime focus.'}`;
  }

  return `Here is your 7-day snapshot for ${profile.name}: Average BP is ${avgSys ?? '--'}/${avgDia ?? '--'} mmHg, mental clarity is ${avgClarity ?? '--'}/100, and ${correlations[0]?.summary ?? 'cross-module habits remain steady.'} For personalized medical guidance, always consult a qualified clinician.`;
}

export async function generateWeeklyReport(params: {
  profile: UserProfile;
  summaries: DailySummary[];
  correlations: CorrelationInsight[];
}): Promise<{ summary: string; highlights: string[]; nextWeekFocus: string }> {
  const recent7 = params.summaries.slice(-7);
  const avgHealth = recent7.length
    ? Math.round(recent7.reduce((s, d) => s + d.overallHealthScore, 0) / recent7.length)
    : 0;
  const bpDays = recent7.filter((d) => d.avgSystolic !== null);
  const avgSys = bpDays.length
    ? Math.round(bpDays.reduce((s, d) => s + (d.avgSystolic ?? 0), 0) / bpDays.length)
    : 0;
  const avgDia = bpDays.length
    ? Math.round(bpDays.reduce((s, d) => s + (d.avgDiastolic ?? 0), 0) / bpDays.length)
    : 0;
  const totalAct = recent7.reduce((s, d) => s + d.activityMinutes, 0);

  const fallback = {
    summary: `${params.profile.name} averaged a ${avgHealth}/100 Daily Health Score across the last ${recent7.length} days, with ${totalAct} active minutes and ${avgSys ? `${avgSys}/${avgDia} mmHg average BP` : 'steady logging'}.`,
    highlights: [
      params.correlations[0]?.summary || 'Consistent morning routines helped stabilize daily scores.',
      `Total weekly movement reached ${totalAct} min toward the ${params.profile.activityGoalMinWeek} min target.`,
      `Oral hygiene & hydration logs kept daily baseline habits visible across modules.`,
    ],
    nextWeekFocus:
      'Aim for 7+ hours of sleep and keep daily sodium below 2,300 mg to support both resting heart rate and mental clarity.',
  };

  const ai = getGeminiClient();
  if (!ai) return fallback;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Generate a concise weekly wellness recap JSON for ${params.profile.name}. Data: ${JSON.stringify({
        avgHealth,
        avgBp: `${avgSys}/${avgDia}`,
        totalActivityMin: totalAct,
        correlations: params.correlations.slice(0, 3),
        days: recent7.map((d) => ({
          date: d.date,
          score: d.overallHealthScore,
          bp: d.avgSystolic ? `${d.avgSystolic}/${d.avgDiastolic}` : null,
          clarity: d.clarityScore,
          kcal: d.calories,
          dental: d.dentalScore,
        })),
      })}`,
      config: {
        systemInstruction:
          'You summarize 7-day wellness logs warmly and concisely without diagnosing medical conditions.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextWeekFocus: { type: Type.STRING },
          },
          required: ['summary', 'highlights', 'nextWeekFocus'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.summary && Array.isArray(parsed.highlights)) {
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function analyzeMealPhotoWithGemini(params: {
  base64Image: string;
  mimeType: string;
  note?: string;
}) {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error(
      'Gemini API key is not configured on the server for photo analysis. Use text/search meal logging or add GEMINI_API_KEY in Secrets.'
    );
  }

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: params.mimeType,
            data: params.base64Image,
          },
        },
        {
          text: `Identify the meal shown in this photo${params.note ? ` (user note: ${params.note})` : ''} and estimate realistic nutrition values for the visible portion.`,
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING },
          servingLabel: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          proteinG: { type: Type.NUMBER },
          carbsG: { type: Type.NUMBER },
          fatG: { type: Type.NUMBER },
          sodiumMg: { type: Type.NUMBER },
          sugarG: { type: Type.NUMBER },
          fiberG: { type: Type.NUMBER },
          ironMg: { type: Type.NUMBER },
          vitaminDMcg: { type: Type.NUMBER },
          isIndianFood: { type: Type.BOOLEAN },
        },
        required: [
          'foodName',
          'servingLabel',
          'calories',
          'proteinG',
          'carbsG',
          'fatG',
          'sodiumMg',
          'sugarG',
          'fiberG',
        ],
      },
    },
  });

  return JSON.parse(response.text || '{}');
}

export async function parseMealFromText(transcript: string) {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      ...deterministicParseMealText(transcript),
      servingLabel: '1 logged meal',
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Parse this meal description into estimated nutrition macros (handle Indian dishes like roti, dal, sabzi, idli accurately): "${transcript}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            servingLabel: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            proteinG: { type: Type.NUMBER },
            carbsG: { type: Type.NUMBER },
            fatG: { type: Type.NUMBER },
            sodiumMg: { type: Type.NUMBER },
            sugarG: { type: Type.NUMBER },
            fiberG: { type: Type.NUMBER },
            ironMg: { type: Type.NUMBER },
            vitaminDMcg: { type: Type.NUMBER },
            isIndianFood: { type: Type.BOOLEAN },
          },
          required: ['foodName', 'servingLabel', 'calories', 'proteinG', 'carbsG', 'fatG'],
        },
      },
    });
    return JSON.parse(response.text || '{}');
  } catch {
    return {
      ...deterministicParseMealText(transcript),
      servingLabel: '1 logged meal',
    };
  }
}
