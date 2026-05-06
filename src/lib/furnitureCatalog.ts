/**
 * Единый каталог мебели и аксессуаров RoomScan AI.
 *
 * Источник правды для:
 *  - CatalogSection (отображение карточек)
 *  - StylesSection (рекомендации по стилю)
 *  - PlannerSection (импорт в план)
 *  - ARFurnitureView (3D-bbox с реальными размерами)
 *  - PlanExporter (спецификация в PDF)
 */

export interface FurnitureItem {
  id: number;
  name: string;
  brand: string;
  /** строка вида "280×170 см" — для отображения */
  size: string;
  /** строка вида "89 400 ₽" */
  price: string;
  /** числовая цена для расчётов */
  priceNum: number;
  category: Category;
  icon: string;        // lucide name
  /** ширина в см */
  w: number;
  /** глубина в см */
  d: number;
  /** высота в см (для AR-bbox) */
  h: number;
  /** опциональный цвет в hex для AR */
  color?: string;
  /** теги стиля (используются в StylesSection) */
  styleTags?: StyleTag[];
}

export type Category =
  | "Диваны"
  | "Столы"
  | "Кресла"
  | "Шкафы"
  | "Кровати"
  | "ТВ-зоны"
  | "Освещение"
  | "Декор"
  | "Текстиль"
  | "Растения"
  | "Кухня"
  | "Ванная";

export type StyleTag = "scandi" | "loft" | "classic" | "modern" | "japandi";

export const CATEGORIES: Category[] = [
  "Диваны", "Столы", "Кресла", "Шкафы", "Кровати", "ТВ-зоны",
  "Освещение", "Декор", "Текстиль", "Растения", "Кухня", "Ванная",
];

export const FURNITURE_CATALOG: FurnitureItem[] = [
  // ─── Диваны ────────────────────────────────────────────────────────────
  { id: 1,  name: "Диван угловой Loft",   brand: "Arredo", size: "280×170 см", price: "89 400 ₽",  priceNum: 89400,  category: "Диваны",  icon: "Sofa",      w: 280, d: 170, h: 85, styleTags: ["loft", "modern"] },
  { id: 10, name: "Диван 3-местный Mira", brand: "Nord",   size: "220×95 см",  price: "76 200 ₽",  priceNum: 76200,  category: "Диваны",  icon: "Sofa",      w: 220, d: 95,  h: 82, styleTags: ["scandi", "japandi"] },
  { id: 11, name: "Диван прямой Velvet",  brand: "Royal",  size: "240×100 см", price: "118 000 ₽", priceNum: 118000, category: "Диваны",  icon: "Sofa",      w: 240, d: 100, h: 88, styleTags: ["classic"] },

  // ─── Столы ─────────────────────────────────────────────────────────────
  { id: 2,  name: "Обеденный стол Solid", brand: "Nord",   size: "160×80 см",  price: "34 200 ₽",  priceNum: 34200,  category: "Столы",   icon: "Table2",    w: 160, d: 80,  h: 75, styleTags: ["scandi", "modern"] },
  { id: 9,  name: "Журнальный столик Neo",brand: "Space",  size: "100×50 см",  price: "14 200 ₽",  priceNum: 14200,  category: "Столы",   icon: "Table",     w: 100, d: 50,  h: 45, styleTags: ["modern", "loft"] },
  { id: 12, name: "Стол письменный Work", brand: "Nord",   size: "140×70 см",  price: "28 900 ₽",  priceNum: 28900,  category: "Столы",   icon: "Table",     w: 140, d: 70,  h: 76, styleTags: ["scandi", "modern"] },
  { id: 13, name: "Барный стол Flow",     brand: "Arredo", size: "120×60 см",  price: "42 500 ₽",  priceNum: 42500,  category: "Столы",   icon: "Wine",      w: 120, d: 60,  h: 105, styleTags: ["loft", "modern"] },

  // ─── Кресла ────────────────────────────────────────────────────────────
  { id: 3,  name: "Кресло Arc",           brand: "Arredo", size: "85×90 см",   price: "22 800 ₽",  priceNum: 22800,  category: "Кресла",  icon: "Armchair",  w: 85,  d: 90,  h: 95, styleTags: ["modern", "loft"] },
  { id: 8,  name: "Пуф Round",            brand: "Arredo", size: "60×60 см",   price: "8 400 ₽",   priceNum: 8400,   category: "Кресла",  icon: "Circle",    w: 60,  d: 60,  h: 42, styleTags: ["modern", "japandi"] },
  { id: 14, name: "Кресло-качалка Calm",  brand: "Nord",   size: "75×95 см",   price: "31 200 ₽",  priceNum: 31200,  category: "Кресла",  icon: "Armchair",  w: 75,  d: 95,  h: 100, styleTags: ["scandi"] },

  // ─── Шкафы ─────────────────────────────────────────────────────────────
  { id: 4,  name: "Шкаф-купе Forma",      brand: "Space",  size: "240×60 см",  price: "67 600 ₽",  priceNum: 67600,  category: "Шкафы",   icon: "Package",   w: 240, d: 60,  h: 220, styleTags: ["modern"] },
  { id: 7,  name: "Стеллаж Open",         brand: "Nord",   size: "120×30 см",  price: "12 900 ₽",  priceNum: 12900,  category: "Шкафы",   icon: "BookOpen",  w: 120, d: 30,  h: 180, styleTags: ["scandi", "japandi"] },
  { id: 15, name: "Комод Linen 4",        brand: "Nord",   size: "120×45 см",  price: "26 800 ₽",  priceNum: 26800,  category: "Шкафы",   icon: "Archive",   w: 120, d: 45,  h: 90, styleTags: ["scandi", "classic"] },

  // ─── Кровати ───────────────────────────────────────────────────────────
  { id: 5,  name: "Кровать Frame",        brand: "Nord",   size: "200×160 см", price: "58 000 ₽",  priceNum: 58000,  category: "Кровати", icon: "BedDouble", w: 200, d: 160, h: 55, styleTags: ["scandi", "modern"] },
  { id: 16, name: "Кровать Loft Iron",    brand: "Arredo", size: "200×180 см", price: "72 400 ₽",  priceNum: 72400,  category: "Кровати", icon: "BedDouble", w: 200, d: 180, h: 60, styleTags: ["loft"] },

  // ─── ТВ-зоны ───────────────────────────────────────────────────────────
  { id: 6,  name: "Тумба TV Unit",        brand: "Space",  size: "180×40 см",  price: "18 500 ₽",  priceNum: 18500,  category: "ТВ-зоны", icon: "Tv",        w: 180, d: 40,  h: 50, styleTags: ["modern", "scandi"] },
  { id: 17, name: "Тумба Wave",           brand: "Arredo", size: "200×45 см",  price: "32 700 ₽",  priceNum: 32700,  category: "ТВ-зоны", icon: "Tv",        w: 200, d: 45,  h: 48, styleTags: ["loft", "modern"] },

  // ─── Освещение ─────────────────────────────────────────────────────────
  { id: 20, name: "Подвесной свет Globe", brand: "Lumen",  size: "Ø 30 см",    price: "9 800 ₽",   priceNum: 9800,   category: "Освещение", icon: "Lightbulb",   w: 30,  d: 30,  h: 30, styleTags: ["scandi", "modern"] },
  { id: 21, name: "Торшер Tripod",        brand: "Lumen",  size: "Ø 45 см",    price: "14 600 ₽",  priceNum: 14600,  category: "Освещение", icon: "Lamp",        w: 45,  d: 45,  h: 165, styleTags: ["scandi", "loft"] },
  { id: 22, name: "Настольная лампа Arc", brand: "Lumen",  size: "20×15 см",   price: "5 400 ₽",   priceNum: 5400,   category: "Освещение", icon: "LampDesk",    w: 20,  d: 15,  h: 50, styleTags: ["modern", "japandi"] },
  { id: 23, name: "Люстра Crystal",       brand: "Royal",  size: "Ø 70 см",    price: "48 000 ₽",  priceNum: 48000,  category: "Освещение", icon: "Sparkles",    w: 70,  d: 70,  h: 80, styleTags: ["classic"] },

  // ─── Декор ─────────────────────────────────────────────────────────────
  { id: 30, name: "Картина Abstract",     brand: "Wall",   size: "80×60 см",   price: "12 000 ₽",  priceNum: 12000,  category: "Декор",   icon: "Image",     w: 80,  d: 4,   h: 60, styleTags: ["modern", "loft"] },
  { id: 31, name: "Зеркало Round",        brand: "Wall",   size: "Ø 80 см",    price: "16 500 ₽",  priceNum: 16500,  category: "Декор",   icon: "Circle",    w: 80,  d: 4,   h: 80, styleTags: ["scandi", "modern"] },
  { id: 32, name: "Ваза Ceramic",         brand: "Arta",   size: "20×20 см",   price: "3 800 ₽",   priceNum: 3800,   category: "Декор",   icon: "FlaskRound",w: 20,  d: 20,  h: 35, styleTags: ["scandi", "japandi"] },
  { id: 33, name: "Полка декоративная",   brand: "Wall",   size: "60×20 см",   price: "4 200 ₽",   priceNum: 4200,   category: "Декор",   icon: "Layers",    w: 60,  d: 20,  h: 4, styleTags: ["scandi", "modern"] },

  // ─── Текстиль ──────────────────────────────────────────────────────────
  { id: 40, name: "Ковёр Berber",         brand: "Soft",   size: "200×140 см", price: "24 000 ₽",  priceNum: 24000,  category: "Текстиль",icon: "Square",    w: 200, d: 140, h: 1, styleTags: ["scandi", "japandi"] },
  { id: 41, name: "Ковёр Persian",        brand: "Royal",  size: "240×170 см", price: "62 000 ₽",  priceNum: 62000,  category: "Текстиль",icon: "Square",    w: 240, d: 170, h: 1, styleTags: ["classic"] },
  { id: 42, name: "Шторы Linen",          brand: "Soft",   size: "пара 280 см",price: "11 400 ₽",  priceNum: 11400,  category: "Текстиль",icon: "AlignVerticalSpaceBetween", w: 280, d: 5, h: 280, styleTags: ["scandi", "modern", "japandi"] },
  { id: 43, name: "Плед Wool",            brand: "Soft",   size: "200×150 см", price: "6 800 ₽",   priceNum: 6800,   category: "Текстиль",icon: "Square",    w: 200, d: 150, h: 1, styleTags: ["scandi", "japandi"] },

  // ─── Растения ──────────────────────────────────────────────────────────
  { id: 50, name: "Монстера большая",     brand: "Green",  size: "Ø 40 см",    price: "8 200 ₽",   priceNum: 8200,   category: "Растения",icon: "Leaf",      w: 60,  d: 60,  h: 160, styleTags: ["scandi", "modern", "japandi"] },
  { id: 51, name: "Фикус лировидный",     brand: "Green",  size: "Ø 35 см",    price: "12 600 ₽",  priceNum: 12600,  category: "Растения",icon: "Trees",     w: 50,  d: 50,  h: 180, styleTags: ["scandi", "modern"] },
  { id: 52, name: "Суккулент Mini Set",   brand: "Green",  size: "3×Ø 12 см",  price: "2 400 ₽",   priceNum: 2400,   category: "Растения",icon: "Sprout",    w: 36,  d: 12,  h: 18, styleTags: ["modern", "japandi"] },

  // ─── Кухня ─────────────────────────────────────────────────────────────
  { id: 60, name: "Кухонный остров",      brand: "Cucina", size: "180×90 см",  price: "142 000 ₽", priceNum: 142000, category: "Кухня",   icon: "ChefHat",   w: 180, d: 90,  h: 92, styleTags: ["modern", "loft"] },
  { id: 61, name: "Барный стул Bistro",   brand: "Cucina", size: "Ø 40 см",    price: "9 600 ₽",   priceNum: 9600,   category: "Кухня",   icon: "Coffee",    w: 40,  d: 40,  h: 110, styleTags: ["loft", "modern"] },
  { id: 62, name: "Стол кухонный Square", brand: "Nord",   size: "90×90 см",  price: "21 800 ₽",  priceNum: 21800,  category: "Кухня",   icon: "Square",    w: 90,  d: 90,  h: 75, styleTags: ["scandi", "modern"] },

  // ─── Ванная ────────────────────────────────────────────────────────────
  { id: 70, name: "Раковина Pure",        brand: "Aqua",   size: "60×45 см",   price: "18 400 ₽",  priceNum: 18400,  category: "Ванная",  icon: "Droplets",  w: 60,  d: 45,  h: 18, styleTags: ["modern", "scandi"] },
  { id: 71, name: "Зеркало Bath LED",     brand: "Aqua",   size: "80×70 см",   price: "23 200 ₽",  priceNum: 23200,  category: "Ванная",  icon: "Square",    w: 80,  d: 8,   h: 70, styleTags: ["modern"] },
  { id: 72, name: "Тумба под раковину",   brand: "Aqua",   size: "80×45 см",   price: "32 600 ₽",  priceNum: 32600,  category: "Ванная",  icon: "Package",   w: 80,  d: 45,  h: 60, styleTags: ["modern", "scandi"] },
];

/** Группировка по категориям — для UI */
export function groupByCategory(items: FurnitureItem[]): Record<Category, FurnitureItem[]> {
  const out = {} as Record<Category, FurnitureItem[]>;
  CATEGORIES.forEach((c) => { out[c] = []; });
  items.forEach((it) => { out[it.category].push(it); });
  return out;
}

/** Поиск по тегу стиля */
export function byStyleTag(tag: StyleTag): FurnitureItem[] {
  return FURNITURE_CATALOG.filter((f) => f.styleTags?.includes(tag));
}

/** Получить элемент по id */
export function getFurnitureById(id: number): FurnitureItem | undefined {
  return FURNITURE_CATALOG.find((f) => f.id === id);
}
