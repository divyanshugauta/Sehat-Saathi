import type { FoodCatalogItem } from '../types/health';

export const FOOD_CATALOG: FoodCatalogItem[] = [
  // Authentic Indian Food Support
  {
    id: 'in-roti',
    name: 'Whole Wheat Roti (Phulka)',
    category: 'Indian',
    servingLabel: '1 medium roti (35g)',
    barcode: '890100000101',
    calories: 104,
    proteinG: 3.4,
    carbsG: 20.5,
    fatG: 0.9,
    sodiumMg: 110,
    sugarG: 0.6,
    fiberG: 2.8,
    ironMg: 1.1,
    vitaminDMcg: 0,
  },
  {
    id: 'in-dal-tadka',
    name: 'Dal Tadka (Toor / Moong Lentils)',
    category: 'Indian',
    servingLabel: '1 bowl (220g)',
    barcode: '890100000102',
    calories: 245,
    proteinG: 12.8,
    carbsG: 31.0,
    fatG: 7.4,
    sodiumMg: 480,
    sugarG: 2.1,
    fiberG: 6.4,
    ironMg: 2.8,
    vitaminDMcg: 0,
  },
  {
    id: 'in-palak-paneer',
    name: 'Palak Paneer',
    category: 'Indian',
    servingLabel: '1 bowl (200g)',
    barcode: '890100000103',
    calories: 295,
    proteinG: 15.6,
    carbsG: 10.2,
    fatG: 21.4,
    sodiumMg: 520,
    sugarG: 2.4,
    fiberG: 3.8,
    ironMg: 3.9,
    vitaminDMcg: 0.4,
  },
  {
    id: 'in-idli-sambar',
    name: 'Steamed Idli with Sambar',
    category: 'Indian',
    servingLabel: '3 idlis + 1 cup sambar',
    barcode: '890100000104',
    calories: 275,
    proteinG: 9.8,
    carbsG: 50.2,
    fatG: 3.6,
    sodiumMg: 490,
    sugarG: 3.2,
    fiberG: 5.1,
    ironMg: 1.9,
    vitaminDMcg: 0,
  },
  {
    id: 'in-masala-dosa',
    name: 'Masala Dosa with Coconut Chutney',
    category: 'Indian',
    servingLabel: '1 dosa (240g)',
    barcode: '890100000105',
    calories: 385,
    proteinG: 8.6,
    carbsG: 56.0,
    fatG: 13.8,
    sodiumMg: 610,
    sugarG: 2.9,
    fiberG: 4.3,
    ironMg: 1.7,
    vitaminDMcg: 0,
  },
  {
    id: 'in-poha',
    name: 'Kanda Poha with Peanuts',
    category: 'Indian',
    servingLabel: '1 plate (180g)',
    barcode: '890100000106',
    calories: 255,
    proteinG: 5.9,
    carbsG: 42.0,
    fatG: 6.8,
    sodiumMg: 380,
    sugarG: 2.4,
    fiberG: 2.9,
    ironMg: 2.4,
    vitaminDMcg: 0,
  },
  {
    id: 'in-paneer-bhurji',
    name: 'Paneer Bhurji',
    category: 'Indian',
    servingLabel: '1 bowl (160g)',
    calories: 310,
    proteinG: 18.4,
    carbsG: 7.5,
    fatG: 22.6,
    sodiumMg: 440,
    sugarG: 3.1,
    fiberG: 1.8,
    ironMg: 1.2,
    vitaminDMcg: 0.5,
  },
  {
    id: 'in-rajma-chawal',
    name: 'Rajma Chawal (Kidney Beans & Rice)',
    category: 'Indian',
    servingLabel: '1 full plate (320g)',
    calories: 440,
    proteinG: 15.2,
    carbsG: 74.0,
    fatG: 8.5,
    sodiumMg: 590,
    sugarG: 3.4,
    fiberG: 9.2,
    ironMg: 3.5,
    vitaminDMcg: 0,
  },
  {
    id: 'in-sabzi-bhindi',
    name: 'Bhindi Masala (Stir-Fried Okra)',
    category: 'Indian',
    servingLabel: '1 bowl (150g)',
    calories: 155,
    proteinG: 3.8,
    carbsG: 14.5,
    fatG: 9.2,
    sodiumMg: 310,
    sugarG: 3.8,
    fiberG: 4.9,
    ironMg: 1.3,
    vitaminDMcg: 0,
  },
  {
    id: 'in-curd',
    name: 'Homemade Plain Dahi (Curd)',
    category: 'Indian',
    servingLabel: '1 katori (150g)',
    calories: 98,
    proteinG: 5.4,
    carbsG: 7.1,
    fatG: 5.2,
    sodiumMg: 70,
    sugarG: 6.8,
    fiberG: 0,
    ironMg: 0.1,
    vitaminDMcg: 0.8,
  },
  {
    id: 'in-moong-chilla',
    name: 'Moong Dal Chilla (Savory Lentil Crepe)',
    category: 'Indian',
    servingLabel: '2 chillas (160g)',
    calories: 230,
    proteinG: 13.5,
    carbsG: 30.0,
    fatG: 5.8,
    sodiumMg: 320,
    sugarG: 1.4,
    fiberG: 6.0,
    ironMg: 2.6,
    vitaminDMcg: 0,
  },
  {
    id: 'in-chole-bhature',
    name: 'Chole with Jeera Rice',
    category: 'Indian',
    servingLabel: '1 bowl + 1 cup rice',
    calories: 470,
    proteinG: 14.4,
    carbsG: 72.0,
    fatG: 13.5,
    sodiumMg: 760,
    sugarG: 4.2,
    fiberG: 8.6,
    ironMg: 3.8,
    vitaminDMcg: 0,
  },
  {
    id: 'in-sprouts',
    name: 'Moong Sprouts Chaat',
    category: 'Indian',
    servingLabel: '1 bowl (150g)',
    calories: 145,
    proteinG: 9.6,
    carbsG: 23.0,
    fatG: 1.4,
    sodiumMg: 240,
    sugarG: 2.8,
    fiberG: 5.5,
    ironMg: 2.1,
    vitaminDMcg: 0,
  },
  // Global Meals & Snacks
  {
    id: 'gl-oatmeal',
    name: 'Rolled Oats with Chia & Blueberries',
    category: 'Global',
    servingLabel: '1 bowl (260g)',
    barcode: '012345678901',
    calories: 310,
    proteinG: 11.2,
    carbsG: 48.0,
    fatG: 8.1,
    sodiumMg: 95,
    sugarG: 9.4,
    fiberG: 8.2,
    ironMg: 2.4,
    vitaminDMcg: 0,
  },
  {
    id: 'gl-eggs',
    name: 'Boiled Eggs (2 large)',
    category: 'Global',
    servingLabel: '2 eggs (100g)',
    barcode: '012345678902',
    calories: 155,
    proteinG: 12.6,
    carbsG: 1.1,
    fatG: 10.6,
    sodiumMg: 124,
    sugarG: 1.1,
    fiberG: 0,
    ironMg: 1.2,
    vitaminDMcg: 2.2,
  },
  {
    id: 'gl-greek-yogurt',
    name: 'Plain Greek Yogurt + Walnuts',
    category: 'Global',
    servingLabel: '170g cup + 15g walnuts',
    barcode: '012345678903',
    calories: 215,
    proteinG: 18.2,
    carbsG: 8.4,
    fatG: 12.1,
    sodiumMg: 65,
    sugarG: 6.1,
    fiberG: 1.1,
    ironMg: 0.5,
    vitaminDMcg: 1.0,
  },
  {
    id: 'gl-salmon',
    name: 'Grilled Salmon with Quinoa & Greens',
    category: 'Global',
    servingLabel: '1 plate (300g)',
    calories: 485,
    proteinG: 36.4,
    carbsG: 32.0,
    fatG: 22.8,
    sodiumMg: 410,
    sugarG: 2.5,
    fiberG: 4.8,
    ironMg: 2.2,
    vitaminDMcg: 11.5,
  },
  {
    id: 'gl-chicken-bowl',
    name: 'Herb Chicken & Avocado Grain Bowl',
    category: 'Global',
    servingLabel: '1 bowl (340g)',
    calories: 510,
    proteinG: 38.0,
    carbsG: 41.0,
    fatG: 20.5,
    sodiumMg: 540,
    sugarG: 4.0,
    fiberG: 7.4,
    ironMg: 2.6,
    vitaminDMcg: 0.4,
  },
  {
    id: 'gl-takeout-ramen',
    name: 'Restaurant Ramen / High-Sodium Noodle Bowl',
    category: 'Global',
    servingLabel: '1 large bowl (500g)',
    calories: 640,
    proteinG: 24.0,
    carbsG: 78.0,
    fatG: 24.0,
    sodiumMg: 1980,
    sugarG: 6.5,
    fiberG: 3.5,
    ironMg: 3.1,
    vitaminDMcg: 0.8,
  },
  {
    id: 'gl-almonds',
    name: 'Roasted Almonds (Unsalted)',
    category: 'Snack',
    servingLabel: '1 handful (28g)',
    barcode: '012345678904',
    calories: 164,
    proteinG: 6.0,
    carbsG: 6.1,
    fatG: 14.2,
    sodiumMg: 1,
    sugarG: 1.2,
    fiberG: 3.5,
    ironMg: 1.0,
    vitaminDMcg: 0,
  },
  {
    id: 'gl-banana',
    name: 'Medium Banana',
    category: 'Snack',
    servingLabel: '1 medium (118g)',
    calories: 105,
    proteinG: 1.3,
    carbsG: 27.0,
    fatG: 0.4,
    sodiumMg: 1,
    sugarG: 14.4,
    fiberG: 3.1,
    ironMg: 0.3,
    vitaminDMcg: 0,
  },
  {
    id: 'gl-protein-shake',
    name: 'Whey / Plant Protein Shake',
    category: 'Beverage',
    servingLabel: '1 scoop in 300ml water',
    barcode: '012345678905',
    calories: 135,
    proteinG: 25.0,
    carbsG: 4.5,
    fatG: 2.0,
    sodiumMg: 160,
    sugarG: 1.8,
    fiberG: 1.0,
    ironMg: 0.9,
    vitaminDMcg: 2.5,
  },
  {
    id: 'gl-masala-chai',
    name: 'Masala Chai (Low Sugar)',
    category: 'Beverage',
    servingLabel: '1 cup (180ml)',
    calories: 68,
    proteinG: 2.4,
    carbsG: 8.5,
    fatG: 2.5,
    sodiumMg: 35,
    sugarG: 6.2,
    fiberG: 0,
    ironMg: 0.1,
    vitaminDMcg: 0.3,
  },
];

export function getMealSuggestions(
  remainingCalories: number,
  remainingProteinG: number
): FoodCatalogItem[] {
  const candidates = FOOD_CATALOG.filter((f) => f.calories <= Math.max(250, remainingCalories + 80));
  return candidates
    .sort((a, b) => {
      if (remainingProteinG > 20) {
        return b.proteinG / Math.max(1, b.calories) - a.proteinG / Math.max(1, a.calories);
      }
      return Math.abs(a.calories - Math.max(180, remainingCalories * 0.5)) -
        Math.abs(b.calories - Math.max(180, remainingCalories * 0.5));
    })
    .slice(0, 3);
}

export function deterministicParseMealText(text: string): {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sodiumMg: number;
  sugarG: number;
  fiberG: number;
  ironMg: number;
  vitaminDMcg: number;
  isIndianFood: boolean;
} {
  const lower = text.toLowerCase();
  const matched: Array<{ item: FoodCatalogItem; qty: number }> = [];

  const qtyWordMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    half: 0.5,
  };

  for (const item of FOOD_CATALOG) {
    const keywords = item.name
      .toLowerCase()
      .replace(/[()]/g, '')
      .split(/[\s,/]+/)
      .filter((w) => w.length >= 4);
    const hit = keywords.some((kw) => lower.includes(kw));
    if (hit) {
      let qty = 1;
      const numMatch = lower.match(new RegExp(`(\\d+|one|two|three|four|half)\\s+(?:\\w+\\s+)?${keywords[0]}`));
      if (numMatch) {
        const raw = numMatch[1];
        qty = qtyWordMap[raw] ?? Number(raw) ?? 1;
      }
      matched.push({ item, qty });
    }
  }

  if (matched.length === 0) {
    return {
      foodName: text.trim().slice(0, 60) || 'Custom Meal',
      calories: 320,
      proteinG: 14,
      carbsG: 38,
      fatG: 11,
      sodiumMg: 390,
      sugarG: 4,
      fiberG: 4,
      ironMg: 1.6,
      vitaminDMcg: 0.3,
      isIndianFood: /roti|dal|paneer|idli|dosa|sabzi|poha|chawal|chai/i.test(lower),
    };
  }

  const sum = matched.reduce(
    (acc, { item, qty }) => ({
      calories: acc.calories + item.calories * qty,
      proteinG: acc.proteinG + item.proteinG * qty,
      carbsG: acc.carbsG + item.carbsG * qty,
      fatG: acc.fatG + item.fatG * qty,
      sodiumMg: acc.sodiumMg + item.sodiumMg * qty,
      sugarG: acc.sugarG + item.sugarG * qty,
      fiberG: acc.fiberG + item.fiberG * qty,
      ironMg: acc.ironMg + item.ironMg * qty,
      vitaminDMcg: acc.vitaminDMcg + item.vitaminDMcg * qty,
      isIndianFood: acc.isIndianFood || item.category === 'Indian',
    }),
    {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      sodiumMg: 0,
      sugarG: 0,
      fiberG: 0,
      ironMg: 0,
      vitaminDMcg: 0,
      isIndianFood: false,
    }
  );

  return {
    foodName: matched.map((m) => (m.qty !== 1 ? `${m.qty}x ${m.item.name}` : m.item.name)).join(' + '),
    calories: Math.round(sum.calories),
    proteinG: Math.round(sum.proteinG),
    carbsG: Math.round(sum.carbsG),
    fatG: Math.round(sum.fatG),
    sodiumMg: Math.round(sum.sodiumMg),
    sugarG: Math.round(sum.sugarG),
    fiberG: Math.round(sum.fiberG),
    ironMg: Number(sum.ironMg.toFixed(1)),
    vitaminDMcg: Number(sum.vitaminDMcg.toFixed(1)),
    isIndianFood: sum.isIndianFood,
  };
}
