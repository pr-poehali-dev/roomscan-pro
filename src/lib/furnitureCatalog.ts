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

  // ─── Расширенные поля каталога ──────────────────────────────────────
  /** Материал, например "Дуб, ткань велюр" */
  material?: string;
  /** Доступные цвета — человекочитаемые названия */
  colors?: string[];
  /** HEX-палитра для отображения цветовых кружков */
  colorPalette?: string[];
  /** Рейтинг 1–5 */
  rating?: number;
  /** Количество отзывов */
  reviews?: number;
  /** Наличие на складе */
  inStock?: boolean;
  /** Популярный товар (для бейджа Hit) */
  popular?: boolean;
  /** Новинка */
  isNew?: boolean;
  /** Скидка в процентах */
  discount?: number;
  /** Старая цена (числом, до скидки) */
  oldPrice?: number;
  /** Время доставки в днях */
  deliveryDays?: number;
  /** Гарантия в месяцах */
  warrantyMonths?: number;
  /** Подробное описание */
  description?: string;
  /** URL фотореалистичного превью (AI-3D или фото) */
  imageUrl?: string;
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

export type StyleTag = "scandi" | "loft" | "classic" | "modern" | "japandi" | "glam" | "midcentury";

/** Человекочитаемые названия стилей (для UI-табов) */
export const STYLE_LABELS: Record<StyleTag, string> = {
  scandi: "Сканди",
  loft: "Лофт",
  classic: "Классика",
  modern: "Современный",
  japandi: "Японский минимализм",
  glam: "Гламур",
  midcentury: "Mid-Century",
};

/** Порядок стилей в табах */
export const STYLE_ORDER: StyleTag[] = ["scandi", "loft", "classic", "modern", "glam", "midcentury"];

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

  // ═══ РАСШИРЕНИЕ КАТАЛОГА — НОВЫЕ ХОДОВЫЕ МОДЕЛИ ═══════════════════════════
  // Диваны
  { id: 100, name: "Диван угловой Modular", brand: "Royal",   size: "320×180 см", price: "245 000 ₽", priceNum: 245000, category: "Диваны", icon: "Sofa", w: 320, d: 180, h: 88, styleTags: ["modern"] },
  { id: 101, name: "Диван Curve Blush",     brand: "Royal",   size: "240×110 см", price: "195 000 ₽", priceNum: 195000, category: "Диваны", icon: "Sofa", w: 240, d: 110, h: 78, styleTags: ["classic", "modern"] },
  { id: 102, name: "Диван Mid-Century Tik", brand: "Vintage", size: "200×90 см",  price: "132 000 ₽", priceNum: 132000, category: "Диваны", icon: "Sofa", w: 200, d: 90,  h: 80, styleTags: ["midcentury"] },
  { id: 103, name: "Диван Glam Velvet",     brand: "Royal",   size: "230×100 см", price: "168 000 ₽", priceNum: 168000, category: "Диваны", icon: "Sofa", w: 230, d: 100, h: 85, styleTags: ["glam", "classic"] },

  // Кресла и пуфы
  { id: 110, name: "Кресло Velvet Emerald", brand: "Royal",   size: "80×85 см",   price: "58 000 ₽",  priceNum: 58000,  category: "Кресла", icon: "Armchair", w: 80, d: 85, h: 95, styleTags: ["classic", "glam"] },
  { id: 111, name: "Chesterfield Leather",  brand: "Royal",   size: "95×95 см",   price: "124 000 ₽", priceNum: 124000, category: "Кресла", icon: "Armchair", w: 95, d: 95, h: 88, styleTags: ["classic", "loft"] },
  { id: 112, name: "Кресло Bouclé Cocoon",  brand: "Mira",    size: "90×95 см",   price: "78 000 ₽",  priceNum: 78000,  category: "Кресла", icon: "Armchair", w: 90, d: 95, h: 90, styleTags: ["modern"] },
  { id: 113, name: "Пуф Velvet Mustard",    brand: "Royal",   size: "60×60 см",   price: "18 500 ₽",  priceNum: 18500,  category: "Кресла", icon: "Circle", w: 60, d: 60, h: 42, styleTags: ["glam", "midcentury"] },

  // Столы
  { id: 120, name: "Стол кофейный Marble",  brand: "Royal",   size: "100×60 см",  price: "24 500 ₽",  priceNum: 24500,  category: "Столы", icon: "Square", w: 100, d: 60, h: 45, styleTags: ["modern", "classic"] },
  { id: 121, name: "Стол кофейный Loft",    brand: "Industrial", size: "110×60 см", price: "19 800 ₽", priceNum: 19800, category: "Столы", icon: "Square", w: 110, d: 60, h: 45, styleTags: ["loft"] },
  { id: 122, name: "Столики Nesting Oak",   brand: "Nord",    size: "Ø 60 см",    price: "14 500 ₽",  priceNum: 14500,  category: "Столы", icon: "Circle", w: 60, d: 60, h: 45, styleTags: ["scandi", "japandi"] },
  { id: 123, name: "Прикроватный Carrara",  brand: "Royal",   size: "50×50 см",   price: "32 000 ₽",  priceNum: 32000,  category: "Столы", icon: "Square", w: 50, d: 50, h: 55, styleTags: ["classic"] },
  { id: 124, name: "Столик Japandi Low",    brand: "Mira",    size: "Ø 50 см",    price: "12 500 ₽",  priceNum: 12500,  category: "Столы", icon: "Circle", w: 50, d: 50, h: 35, styleTags: ["japandi"] },

  // Стулья
  { id: 130, name: "Стул обеденный Soft",   brand: "Nord",    size: "50×50 см",   price: "6 500 ₽",   priceNum: 6500,   category: "Кресла", icon: "Armchair", w: 50, d: 50, h: 85, styleTags: ["scandi", "modern"] },
  { id: 131, name: "Барный стул Loft",      brand: "Industrial", size: "45×45 см", price: "11 800 ₽", priceNum: 11800,  category: "Кресла", icon: "Armchair", w: 45, d: 45, h: 110, styleTags: ["loft"] },
  { id: 132, name: "Офисное кресло Mesh",   brand: "Office Pro", size: "65×65 см", price: "28 500 ₽", priceNum: 28500,  category: "Кресла", icon: "Armchair", w: 65, d: 65, h: 115, styleTags: ["modern"] },

  // Кровати
  { id: 140, name: "Кровать односпальная",  brand: "Nord",    size: "200×90 см",  price: "32 000 ₽",  priceNum: 32000,  category: "Кровати", icon: "BedSingle", w: 200, d: 90, h: 55, styleTags: ["scandi"] },
  { id: 141, name: "Двухъярусная кровать",  brand: "Kids",    size: "200×100 см", price: "64 000 ₽",  priceNum: 64000,  category: "Кровати", icon: "BedDouble", w: 200, d: 100, h: 165, styleTags: ["scandi"] },

  // Шкафы и хранение
  { id: 150, name: "Шкаф-купе Шкафулькин",   brand: "Шкафулькин", size: "200×60 см",  price: "65 000 ₽",  priceNum: 65000,  category: "Шкафы", icon: "Archive", w: 200, d: 60, h: 240, styleTags: ["modern", "classic"] },
  { id: 151, name: "Гардеробная Шкафулькин", brand: "Шкафулькин", size: "240×60 см",  price: "110 000 ₽", priceNum: 110000, category: "Шкафы", icon: "Archive", w: 240, d: 60, h: 240, styleTags: ["modern", "scandi"] },
  { id: 152, name: "Шкаф-прихожая Шкафулькин", brand: "Шкафулькин", size: "120×40 см", price: "38 500 ₽", priceNum: 38500, category: "Шкафы", icon: "Archive", w: 120, d: 40, h: 200, styleTags: ["scandi"] },
  { id: 153, name: "Тумба прикроватная",     brand: "Nord",    size: "50×40 см",   price: "9 800 ₽",   priceNum: 9800,   category: "Шкафы", icon: "Box", w: 50, d: 40, h: 45, styleTags: ["scandi"] },
  { id: 154, name: "Стеллаж Loft Tall",      brand: "Industrial", size: "80×35 см", price: "24 500 ₽", priceNum: 24500,  category: "Шкафы", icon: "Archive", w: 80, d: 35, h: 200, styleTags: ["loft"] },
  { id: 155, name: "Стеллаж Open Oak 6",     brand: "Nord",    size: "160×35 см",  price: "32 000 ₽",  priceNum: 32000,  category: "Шкафы", icon: "Archive", w: 160, d: 35, h: 180, styleTags: ["scandi", "japandi"] },
  { id: 156, name: "Полки парящие 3шт",      brand: "Nord",    size: "90×25 см",   price: "7 500 ₽",   priceNum: 7500,   category: "Шкафы", icon: "Layers", w: 90, d: 25, h: 4, styleTags: ["scandi"] },
  { id: 157, name: "Комод 6 ящиков",         brand: "Mira",    size: "140×50 см",  price: "28 800 ₽",  priceNum: 28800,  category: "Шкафы", icon: "Archive", w: 140, d: 50, h: 90, styleTags: ["modern", "scandi"] },
  { id: 158, name: "Туалетный столик Vanity",brand: "Royal",   size: "110×45 см",  price: "42 000 ₽",  priceNum: 42000,  category: "Шкафы", icon: "Square", w: 110, d: 45, h: 80, styleTags: ["classic", "glam"] },

  // ТВ-зоны
  { id: 160, name: "ТВ-тумба Modern",        brand: "Space",   size: "180×45 см",  price: "28 500 ₽",  priceNum: 28500,  category: "ТВ-зоны", icon: "Tv", w: 180, d: 45, h: 50, styleTags: ["modern", "loft"] },

  // Кухня — линейка
  { id: 170, name: "Кухня Linear White",     brand: "Cucina",  size: "280×60 см",  price: "215 000 ₽", priceNum: 215000, category: "Кухня", icon: "ChefHat", w: 280, d: 60, h: 220, styleTags: ["modern", "scandi"] },
  { id: 171, name: "Кухня U Green",          brand: "Cucina",  size: "320×280 см", price: "485 000 ₽", priceNum: 485000, category: "Кухня", icon: "ChefHat", w: 320, d: 280, h: 220, styleTags: ["modern", "loft"] },
  { id: 172, name: "Кухня Shaker White",     brand: "Royal",   size: "280×60 см",  price: "325 000 ₽", priceNum: 325000, category: "Кухня", icon: "ChefHat", w: 280, d: 60, h: 220, styleTags: ["classic", "scandi"] },
  { id: 173, name: "Кухонный остров Bar",    brand: "Cucina",  size: "220×100 см", price: "165 000 ₽", priceNum: 165000, category: "Кухня", icon: "ChefHat", w: 220, d: 100, h: 110, styleTags: ["modern"] },
  { id: 174, name: "Колонна духовка Bosch",  brand: "Bosch",   size: "60×60 см",   price: "145 000 ₽", priceNum: 145000, category: "Кухня", icon: "Microwave", w: 60, d: 60, h: 220, styleTags: ["modern"] },
  { id: 175, name: "Варочная панель",        brand: "Bosch",   size: "60×52 см",   price: "68 000 ₽",  priceNum: 68000,  category: "Кухня", icon: "Flame", w: 60, d: 52, h: 5, styleTags: ["modern"] },
  { id: 176, name: "Вытяжка Chimney",        brand: "Bosch",   size: "60×50 см",   price: "42 500 ₽",  priceNum: 42500,  category: "Кухня", icon: "Wind", w: 60, d: 50, h: 90, styleTags: ["modern", "loft"] },
  { id: 177, name: "Посудомойка 60",         brand: "Bosch",   size: "60×60 см",   price: "56 000 ₽",  priceNum: 56000,  category: "Кухня", icon: "WashingMachine", w: 60, d: 60, h: 85, styleTags: ["modern"] },
  { id: 178, name: "Холодильник Side",       brand: "Samsung", size: "90×70 см",   price: "89 000 ₽",  priceNum: 89000,  category: "Кухня", icon: "Refrigerator", w: 90, d: 70, h: 180, styleTags: ["modern"] },
  { id: 179, name: "Стиральная машина 8кг",  brand: "Bosch",   size: "60×60 см",   price: "42 500 ₽",  priceNum: 42500,  category: "Ванная", icon: "WashingMachine", w: 60, d: 60, h: 85, styleTags: ["modern"] },

  // Освещение
  { id: 180, name: "Подвес Loft Cage",       brand: "Lumen",   size: "Ø 35 см",    price: "8 500 ₽",   priceNum: 8500,   category: "Освещение", icon: "Lightbulb", w: 35, d: 35, h: 45, styleTags: ["loft"] },
  { id: 181, name: "Хрустальная люстра XL",  brand: "Royal",   size: "Ø 90 см",    price: "148 000 ₽", priceNum: 148000, category: "Освещение", icon: "Sparkles", w: 90, d: 90, h: 100, styleTags: ["classic", "glam"] },

  // Декор
  { id: 190, name: "Зеркало Round Gold",     brand: "Wall",    size: "Ø 80 см",    price: "16 500 ₽",  priceNum: 16500,  category: "Декор", icon: "Circle", w: 80, d: 4, h: 80, styleTags: ["modern", "glam", "midcentury"] },
  { id: 191, name: "Напольное зеркало Gold", brand: "Wall",    size: "70×200 см",  price: "38 500 ₽",  priceNum: 38500,  category: "Декор", icon: "Square", w: 70, d: 5, h: 200, styleTags: ["classic", "glam"] },
  { id: 192, name: "Триптих картин Beige",   brand: "Wall",    size: "120×60 см",  price: "14 500 ₽",  priceNum: 14500,  category: "Декор", icon: "Image", w: 120, d: 4, h: 60, styleTags: ["modern", "japandi"] },

  // Растения
  { id: 200, name: "Фикус Lyrata 1.8м",      brand: "Green",   size: "Ø 70 см",    price: "12 600 ₽",  priceNum: 12600,  category: "Растения", icon: "Trees", w: 70, d: 70, h: 180, styleTags: ["modern", "scandi"] },

  // Текстиль
  { id: 210, name: "Ковёр Persian Bordo",    brand: "Soft",    size: "240×170 см", price: "62 000 ₽",  priceNum: 62000,  category: "Текстиль", icon: "Square", w: 240, d: 170, h: 1, styleTags: ["classic"] },
  { id: 211, name: "Ковёр Shaggy White",     brand: "Soft",    size: "Ø 200 см",   price: "24 800 ₽",  priceNum: 24800,  category: "Текстиль", icon: "Circle", w: 200, d: 200, h: 4, styleTags: ["modern", "glam"] },

  // Ванная — расширение
  { id: 220, name: "Ванна Free-stand",       brand: "Roca",    size: "170×75 см",  price: "78 500 ₽",  priceNum: 78500,  category: "Ванная", icon: "Bath", w: 170, d: 75, h: 60, styleTags: ["modern"] },
  { id: 221, name: "Ванна Clawfoot",         brand: "Roca",    size: "170×75 см",  price: "132 000 ₽", priceNum: 132000, category: "Ванная", icon: "Bath", w: 170, d: 75, h: 70, styleTags: ["classic"] },
  { id: 222, name: "Душевая кабина",         brand: "Roca",    size: "90×90 см",   price: "56 000 ₽",  priceNum: 56000,  category: "Ванная", icon: "ShowerHead", w: 90, d: 90, h: 200, styleTags: ["modern"] },
  { id: 223, name: "Унитаз подвесной",       brand: "Roca",    size: "40×65 см",   price: "18 500 ₽",  priceNum: 18500,  category: "Ванная", icon: "Toilet", w: 40, d: 65, h: 40, styleTags: ["modern"] },
  { id: 224, name: "Двойная Vanity 160",     brand: "Roca",    size: "160×55 см",  price: "124 000 ₽", priceNum: 124000, category: "Ванная", icon: "Droplets", w: 160, d: 55, h: 85, styleTags: ["modern", "classic"] },
  { id: 225, name: "Полотенцесушитель",      brand: "Roca",    size: "50×10 см",   price: "14 500 ₽",  priceNum: 14500,  category: "Ванная", icon: "Sun", w: 50, d: 10, h: 80, styleTags: ["modern"] },
];

// ─── Обогащение каталога ───────────────────────────────────────────────────
// Расширяем базовые записи дополнительными атрибутами без изменения структуры.

/**
 * AI-сгенерированные превью объектов каталога (3D-изометрия на белом фоне).
 * Используются как ключевая визуализация в карточках.
 */
const PREVIEW = {
  sofaCorner:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/2858f17c-2950-479e-aab5-29dac4f1b078.jpg",
  sofa3:         "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/4b583a4b-d855-475f-b113-fb9a9312e31c.jpg",
  sofaCurved:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/6f225671-ceba-49b9-aa8c-c33667e6d388.jpg",
  sofaModular:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/b90a8ef0-d820-44b4-9853-efefe199a4f3.jpg",
  sofaMidcentury:"https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/16e2047e-3d2c-4414-badb-3a05aca53f81.jpg",
  diningTable:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/c26b21f7-d465-4b01-8d63-19f766dde4c7.jpg",
  coffeeMarble:  "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/dab62b29-2bd3-4cd9-a34c-917bd2f58a77.jpg",
  coffeeLoft:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/6f38f468-d241-4535-ab57-ce5cf2ec3d9d.jpg",
  coffeeNesting: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/ee00ef5e-76c2-45d8-87e2-c2abbe23cc50.jpg",
  sideClassic:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/47de563b-54e3-4fc5-bd97-5b725317dd5a.jpg",
  sideJapandi:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/125f26e4-bb1e-4b38-8cf9-99b53a7b0e77.jpg",
  desk:          "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/e14f2cf4-7025-415e-b57e-c7e487becd91.jpg",
  diningChair:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/85618eea-fcf3-416c-8059-ef87478e9a52.jpg",
  barstool:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/fc9aedc2-d050-46e1-9f6a-2d845eeaec35.jpg",
  officeChair:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/03100bdf-6a84-4cc5-80d2-3589eb34a867.jpg",
  armchairBeige: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/70fc8dd4-2fc3-4c72-98e2-9f090050ddf9.jpg",
  armchairVelvet:"https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/653e5dc2-ed97-436f-a28a-332fad1476b3.jpg",
  armchairLeather:"https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/623e6b8b-1cd2-4496-aebc-eb02325c0122.jpg",
  armchairBoucle:"https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/c581167c-ab11-41ce-a6df-bd5f47e056d7.jpg",
  pouf:          "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/e71a474a-86e6-4eef-90a5-e72e7b89dafb.jpg",
  bedKing:       "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/615fa69b-321e-4715-821e-cf7a2a33c46f.jpg",
  bedSingle:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/0cbc049b-3a02-45e4-83e5-7dfc95e90e85.jpg",
  bedBunk:       "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/134eabb7-5355-4d7f-bb72-1a4897a98d0f.jpg",
  wardrobe:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/945667b5-c8c7-4363-b06f-834a8fe4c187.jpg",
  walkInCloset:  "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/bb50f3bc-c8d4-456f-9c56-5a9f30a358d8.jpg",
  shoeCabinet:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/650ac25d-f6b0-48ca-979d-0d33f5bf75ea.jpg",
  bookcaseLoft:  "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/adac9b7d-1721-492e-a8df-aac9c121cf3f.jpg",
  bookcaseScandi:"https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/c40f258f-775e-4a40-9351-a8c1880bf380.jpg",
  shelves:       "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/bd457cdd-ed45-4265-8961-a2ceeec8bccd.jpg",
  dresser:       "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/13dd350a-9529-4587-808b-862cbc37fbb3.jpg",
  vanity:        "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/05b20e27-c216-4fd3-a6da-0456573d3e43.jpg",
  nightstand:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/d78ba45d-2a5e-41a4-9b80-6b85dbcd5ac8.jpg",
  tvStand:       "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/03855368-5b9a-4f60-b31d-32626185656d.jpg",
  kitchenSet:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/56789441-a8e7-4528-ba08-3a7690257723.jpg",
  kitchenU:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/a0bdf9f9-15eb-4a45-8946-6af76c7b3621.jpg",
  kitchenShaker: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/b83b4ba2-4100-41ea-b055-af59ae9b0cfb.jpg",
  kitchenIsland: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/a9db1a74-b1c0-4654-a2df-94a4d6628369.jpg",
  ovenColumn:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/ddf27f4f-d9b6-469a-a8f5-7c3c4bbcca85.jpg",
  cooktop:       "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/05f66f6e-54d2-4b09-a135-5ac41d49c919.jpg",
  rangeHood:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/b4066060-67a2-48c1-9bb7-429190544f8a.jpg",
  dishwasher:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/48b73794-874c-437f-8951-8f25d089dc98.jpg",
  fridge:        "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/c4b6b4fd-767a-479d-9349-cda0b891f745.jpg",
  washMachine:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/ac6b136a-611b-42bc-bee3-31d1b812630f.jpg",
  bathtub:       "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/282dabdf-99d8-4dc4-b6d7-0693f8df565a.jpg",
  bathtubClassic:"https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/aa257e0d-5c4d-4341-8e66-f2ce1b277065.jpg",
  shower:        "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/eeb004be-cd08-4c3f-b0e4-21631c592486.jpg",
  toilet:        "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/ea45a329-62f5-4462-a9ec-bb0603bbaf1c.jpg",
  sink:          "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/1c282e54-6c5a-4853-be4f-e061230337c3.jpg",
  vanityDouble:  "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/45a7102e-84b4-422f-8c23-8201f3bfe4d3.jpg",
  towelRail:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/f3490438-3d19-4406-8609-9c9c574ebb65.jpg",
  pendantLight:  "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/1c9866bb-b694-4de6-b723-bcdff6402b78.jpg",
  floorLamp:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/fc9172b0-638e-43c3-a979-8ce7e3f10aee.jpg",
  tableLamp:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/68d15138-aab4-4c1d-a912-855cadee4332.jpg",
  chandelier:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/70543ce6-86bc-4254-b56d-9203aa04f5bf.jpg",
  mirrorRound:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/bead99de-2ad0-43e8-9fc6-57d2263d652f.jpg",
  mirrorFloor:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/d96cb966-d8c4-4070-907a-ddb2e29db7d2.jpg",
  wallArt:       "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/909105fd-6fc8-4bf4-900c-3a82ad0b3d61.jpg",
  plant:         "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/86f9fde2-e5f6-4531-8acc-f0f2fbfc59dd.jpg",
  fiddleFig:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/b6523a02-a4c1-49c1-be73-b75682b46700.jpg",
  rug:           "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/d0798c98-a62c-41a7-abd9-49c1468b063f.jpg",
  rugPersian:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/c8af3689-b024-47e8-8ba5-910b5d6bb3d6.jpg",
  rugShag:       "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/5e74d170-637c-48e4-9695-60d6450e74ca.jpg",
};

type Enrichment = Partial<Omit<FurnitureItem, "id">>;

const ENRICHMENT: Record<number, Enrichment> = {
  1:  { material: "Велюр, металл", colors: ["Серый", "Графит"], colorPalette: ["#7e8489", "#3a3d40"], rating: 4.8, reviews: 142, popular: true, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Угловой диван премиум-класса с механизмом еврокнижка. Каркас из массива бука, велюровая обивка с грязеотталкивающей пропиткой." },
  10: { material: "Лён, дуб", colors: ["Бежевый", "Молочный"], colorPalette: ["#d8c9a8", "#efe7d2"], rating: 4.7, reviews: 98, isNew: true, deliveryDays: 5, warrantyMonths: 18, inStock: true, description: "Лаконичный 3-местный диван в скандинавском стиле. Натуральный лён, ножки из массива дуба." },
  11: { material: "Бархат, дерево", colors: ["Изумруд", "Бордо", "Тёмно-синий"], colorPalette: ["#1f5d4f", "#6e1f24", "#1e2a4a"], rating: 4.9, reviews: 67, discount: 15, oldPrice: 138800, deliveryDays: 10, warrantyMonths: 24, inStock: true, description: "Классический бархатный диван с каретной стяжкой. Идеально для гостиной в классическом или ар-деко стиле." },

  2:  { material: "Дуб масляный", colors: ["Натуральный дуб"], colorPalette: ["#b08858"], rating: 4.6, reviews: 213, popular: true, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Обеденный стол из массива дуба с маслом. Выдерживает до 200 кг, рассчитан на 6 человек." },
  9:  { material: "ЛДСП, металл", colors: ["Чёрный мрамор", "Дуб сонома"], colorPalette: ["#1a1a1a", "#c9a77a"], rating: 4.4, reviews: 89, deliveryDays: 3, warrantyMonths: 12, inStock: true, description: "Журнальный столик с эффектом мрамора. Подходит к минимализму и лофту." },
  12: { material: "ЛДСП, металл", colors: ["Белый", "Графит"], colorPalette: ["#f5f5f5", "#3a3d40"], rating: 4.5, reviews: 134, deliveryDays: 5, warrantyMonths: 18, inStock: true, description: "Эргономичный письменный стол. Кабель-органайзер в комплекте." },
  13: { material: "Металл, дуб", colors: ["Чёрный с дубом"], colorPalette: ["#1a1a1a", "#b08858"], rating: 4.7, reviews: 56, isNew: true, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Барный стол лофт. Тяжёлый стальной каркас, столешница из массива дуба." },

  3:  { material: "Букле, металл", colors: ["Молочный", "Графит", "Терракот"], colorPalette: ["#efe7d2", "#3a3d40", "#c9624a"], rating: 4.7, reviews: 178, popular: true, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Кресло с обивкой букле. Ножки из чёрного матового металла." },
  8:  { material: "Велюр", colors: ["Зелёный", "Розовый", "Серый"], colorPalette: ["#3d7a5f", "#d6a3a3", "#7e8489"], rating: 4.5, reviews: 94, deliveryDays: 3, warrantyMonths: 12, inStock: true, description: "Круглый пуф с велюровой обивкой. Идеален как банкетка или подставка для ног." },
  14: { material: "Шерсть, дуб", colors: ["Серая шерсть"], colorPalette: ["#9aa0a6"], rating: 4.8, reviews: 112, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Кресло-качалка из массива дуба с шерстяной обивкой. Скандинавский стиль." },

  4:  { material: "ЛДСП, зеркало", colors: ["Белый", "Графит", "Дуб"], colorPalette: ["#f5f5f5", "#3a3d40", "#b08858"], rating: 4.6, reviews: 245, popular: true, deliveryDays: 10, warrantyMonths: 24, inStock: true, description: "Шкаф-купе с зеркальными дверями и встроенной подсветкой. Доводчики Blum." },
  7:  { material: "Сосна", colors: ["Натуральный"], colorPalette: ["#d8b886"], rating: 4.4, reviews: 167, deliveryDays: 5, warrantyMonths: 18, inStock: true, description: "Открытый стеллаж 5 полок. Натуральный массив сосны." },
  15: { material: "Массив берёзы", colors: ["Белый", "Натуральный"], colorPalette: ["#f5f5f5", "#d8b886"], rating: 4.7, reviews: 89, isNew: true, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Комод на 4 ящика из массива берёзы. Скрытые направляющие с доводчиками." },

  5:  { material: "Дуб, ткань", colors: ["Дуб натуральный"], colorPalette: ["#b08858"], rating: 4.8, reviews: 203, popular: true, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Кровать с мягким изголовьем из массива дуба. Ортопедическое основание в комплекте." },
  16: { material: "Металл, кожа", colors: ["Чёрный"], colorPalette: ["#1a1a1a"], rating: 4.6, reviews: 78, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Кровать в стиле лофт со стальным каркасом и кожаным изголовьем." },

  6:  { material: "ЛДСП", colors: ["Белый", "Графит"], colorPalette: ["#f5f5f5", "#3a3d40"], rating: 4.5, reviews: 156, deliveryDays: 5, warrantyMonths: 18, inStock: true, description: "Тумба под телевизор до 65 дюймов. Ниша для саундбара." },
  17: { material: "ЛДСП, металл", colors: ["Дуб", "Чёрный"], colorPalette: ["#b08858", "#1a1a1a"], rating: 4.7, reviews: 92, isNew: true, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "ТВ-тумба с металлическими ножками. Кабель-канал внутри." },

  20: { material: "Стекло, латунь", colors: ["Прозрачный", "Дымчатый"], colorPalette: ["#e8e8e8", "#5a5550"], rating: 4.6, reviews: 124, deliveryDays: 3, warrantyMonths: 24, inStock: true, description: "Подвесной светильник с шарообразным плафоном. Лампа E27 в комплекте." },
  21: { material: "Текстиль, дерево", colors: ["Серый", "Бежевый"], colorPalette: ["#9aa0a6", "#d8c9a8"], rating: 4.5, reviews: 88, deliveryDays: 5, warrantyMonths: 24, inStock: true, description: "Торшер на трёх деревянных ножках с текстильным абажуром." },
  22: { material: "Металл", colors: ["Чёрный", "Латунь"], colorPalette: ["#1a1a1a", "#b88a4a"], rating: 4.7, reviews: 156, popular: true, deliveryDays: 2, warrantyMonths: 24, inStock: true, description: "Настольная лампа с регулируемым кронштейном. LED-лампа 8 Вт." },
  23: { material: "Хрусталь, металл", colors: ["Хром"], colorPalette: ["#cdd2d6"], rating: 4.9, reviews: 45, discount: 20, oldPrice: 60000, deliveryDays: 10, warrantyMonths: 36, inStock: true, description: "Хрустальная люстра на 8 ламп. Идеально для классической гостиной." },

  30: { material: "Холст, дерево", colors: ["Мультиколор"], colorPalette: ["#3a3d40", "#c9624a", "#1f5d4f"], rating: 4.5, reviews: 67, deliveryDays: 5, warrantyMonths: 12, inStock: true, description: "Абстрактная картина в раме. Печать на холсте, размер 80×60 см." },
  31: { material: "Стекло, металл", colors: ["Чёрный", "Латунь"], colorPalette: ["#1a1a1a", "#b88a4a"], rating: 4.6, reviews: 198, popular: true, deliveryDays: 3, warrantyMonths: 24, inStock: true, description: "Круглое зеркало в металлической раме. Диаметр 80 см." },
  32: { material: "Керамика", colors: ["Белый", "Чёрный матовый"], colorPalette: ["#f5f5f5", "#2a2a2a"], rating: 4.4, reviews: 112, isNew: true, deliveryDays: 2, warrantyMonths: 6, inStock: true, description: "Керамическая ваза ручной работы. Подходит для сухоцветов и живых букетов." },
  33: { material: "Дуб", colors: ["Натуральный"], colorPalette: ["#b08858"], rating: 4.3, reviews: 89, deliveryDays: 3, warrantyMonths: 12, inStock: true, description: "Настенная декоративная полка из массива дуба. Скрытое крепление." },

  40: { material: "Шерсть", colors: ["Кремовый"], colorPalette: ["#efe7d2"], rating: 4.7, reviews: 134, popular: true, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Берберский ковёр ручной работы. 100% овечья шерсть." },
  41: { material: "Шерсть, шёлк", colors: ["Бордо с золотым"], colorPalette: ["#6e1f24", "#b88a4a"], rating: 4.8, reviews: 56, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Персидский ковёр с классическим орнаментом. Ручное узелковое плетение." },
  42: { material: "Лён", colors: ["Молочный", "Серый", "Бежевый"], colorPalette: ["#efe7d2", "#9aa0a6", "#d8c9a8"], rating: 4.6, reviews: 178, deliveryDays: 5, warrantyMonths: 12, inStock: true, description: "Льняные шторы с подкладом. Пара 280 см. На люверсах." },
  43: { material: "Шерсть мериноса", colors: ["Серый", "Молочный"], colorPalette: ["#9aa0a6", "#efe7d2"], rating: 4.7, reviews: 234, deliveryDays: 3, warrantyMonths: 6, inStock: true, description: "Плед из шерсти мериноса с бахромой." },

  50: { material: "Живое растение", colors: ["Зелёный"], colorPalette: ["#3d7a5f"], rating: 4.6, reviews: 87, popular: true, deliveryDays: 2, warrantyMonths: 0, inStock: true, description: "Монстера деликатесная высотой до 160 см. Кашпо в комплекте. Уход — раз в неделю." },
  51: { material: "Живое растение", colors: ["Зелёный"], colorPalette: ["#2f6347"], rating: 4.5, reviews: 65, deliveryDays: 2, warrantyMonths: 0, inStock: true, description: "Фикус лировидный. Высота до 180 см. Любит рассеянный свет." },
  52: { material: "Живое растение", colors: ["Зелёный"], colorPalette: ["#7da87a"], rating: 4.4, reviews: 123, deliveryDays: 2, warrantyMonths: 0, inStock: true, description: "Набор из 3 суккулентов в керамических кашпо." },

  60: { material: "МДФ, кварц", colors: ["Белый кварц", "Чёрный кварц"], colorPalette: ["#f5f5f5", "#1a1a1a"], rating: 4.8, reviews: 34, isNew: true, discount: 10, oldPrice: 158000, deliveryDays: 21, warrantyMonths: 60, inStock: true, description: "Кухонный остров со столешницей из кварцевого агломерата. Встроенные розетки." },
  61: { material: "Металл, экокожа", colors: ["Чёрный", "Коричневый"], colorPalette: ["#1a1a1a", "#5a3a28"], rating: 4.5, reviews: 167, popular: true, deliveryDays: 5, warrantyMonths: 18, inStock: true, description: "Барный стул с регулировкой высоты. Поворотный механизм 360°." },
  62: { material: "Дуб", colors: ["Натуральный дуб"], colorPalette: ["#b08858"], rating: 4.6, reviews: 78, deliveryDays: 10, warrantyMonths: 24, inStock: true, description: "Квадратный кухонный стол на 4 персоны. Массив дуба." },

  70: { material: "Керамика", colors: ["Белый матовый"], colorPalette: ["#f5f5f5"], rating: 4.7, reviews: 145, deliveryDays: 7, warrantyMonths: 60, inStock: true, description: "Накладная керамическая раковина с матовой поверхностью." },
  71: { material: "Стекло, LED", colors: ["Хром"], colorPalette: ["#cdd2d6"], rating: 4.6, reviews: 98, isNew: true, deliveryDays: 5, warrantyMonths: 36, inStock: true, description: "Зеркало для ванной с LED-подсветкой и подогревом. Сенсорное управление." },
  72: { material: "ЛДСП влагостойкая", colors: ["Белый", "Дуб"], colorPalette: ["#f5f5f5", "#b08858"], rating: 4.5, reviews: 112, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Тумба под раковину с двумя ящиками. Влагостойкое покрытие." },

  // Новые SKU 100+
  100: { material: "Велюр, металл", colors: ["Графит"], colorPalette: ["#3a3d40"], rating: 4.9, reviews: 78, popular: true, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Большой L-образный модульный диван премиум-класса с шезлонгом и подъёмным механизмом." },
  101: { material: "Велюр, латунь", colors: ["Розовый blush", "Изумруд"], colorPalette: ["#fbcfe8", "#1f5d4f"], rating: 4.8, reviews: 56, isNew: true, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Полукруглый велюровый диван в стиле ар-деко. Латунные ножки." },
  102: { material: "Тик, велюр", colors: ["Оранжевый", "Графит"], colorPalette: ["#d97706", "#3a3d40"], rating: 4.7, reviews: 43, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Винтажный диван 60-х. Натуральный тик, ножки-шпильки." },
  103: { material: "Велюр, латунь", colors: ["Изумруд", "Сапфир"], colorPalette: ["#10b981", "#1e3a8a"], rating: 4.8, reviews: 38, isNew: true, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Гламурный велюровый диван с каретной стяжкой и латунными ножками." },

  110: { material: "Бархат, латунь", colors: ["Изумруд"], colorPalette: ["#10b981"], rating: 4.9, reviews: 68, popular: true, deliveryDays: 10, warrantyMonths: 24, inStock: true, description: "Изумрудно-зелёное велюровое кресло на латунных ножках. Стиль ар-деко." },
  111: { material: "Натуральная кожа", colors: ["Бордо", "Коричневый"], colorPalette: ["#78350f", "#7f1d1d"], rating: 4.9, reviews: 124, deliveryDays: 21, warrantyMonths: 60, inStock: true, description: "Классическое кожаное кресло Chesterfield с каретной стяжкой." },
  112: { material: "Букле, металл", colors: ["Молочный"], colorPalette: ["#f5f5dc"], rating: 4.8, reviews: 89, isNew: true, popular: true, deliveryDays: 10, warrantyMonths: 24, inStock: true, description: "Округлое кресло-кокон в фактурной ткани букле. Современный минимализм." },
  113: { material: "Велюр, металл", colors: ["Горчичный"], colorPalette: ["#eab308"], rating: 4.6, reviews: 67, deliveryDays: 7, warrantyMonths: 18, inStock: true, description: "Круглый пуф горчичного велюра на золотом основании. Гламурный акцент." },

  120: { material: "Мрамор, латунь", colors: ["Белый мрамор"], colorPalette: ["#f5f5f4"], rating: 4.9, reviews: 92, popular: true, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Журнальный стол с натуральной мраморной столешницей и золотыми ножками." },
  121: { material: "Сталь, дуб", colors: ["Чёрный"], colorPalette: ["#1c1917"], rating: 4.6, reviews: 78, deliveryDays: 10, warrantyMonths: 24, inStock: true, description: "Журнальный стол лофт. Состаренное дерево + чёрный металлокаркас." },
  122: { material: "Дуб масляный", colors: ["Натуральный"], colorPalette: ["#d6d3d1"], rating: 4.7, reviews: 134, isNew: true, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Парный набор круглых столиков из светлого дуба. Сканди-минимализм." },
  123: { material: "Мрамор, дерево", colors: ["Белый"], colorPalette: ["#fafaf9"], rating: 4.8, reviews: 56, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Классический белый прикроватный столик с резьбой и мрамором." },
  124: { material: "Натуральное дерево", colors: ["Серое дерево"], colorPalette: ["#a8a29e"], rating: 4.7, reviews: 45, deliveryDays: 10, warrantyMonths: 24, inStock: true, description: "Низкий минималистский столик в японском стиле." },

  130: { material: "Дуб, ткань", colors: ["Серый", "Бежевый"], colorPalette: ["#a8a29e", "#d8c9a8"], rating: 4.8, reviews: 245, popular: true, deliveryDays: 5, warrantyMonths: 24, inStock: true, description: "Стул обеденный с серой обивкой и дубовыми ножками. Универсал для любой кухни." },
  131: { material: "Сталь, орех", colors: ["Чёрный"], colorPalette: ["#1c1917"], rating: 4.7, reviews: 167, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Барный стул лофт с металлокаркасом и сиденьем из ореха." },
  132: { material: "Сетка, металл", colors: ["Чёрный"], colorPalette: ["#1f2937"], rating: 4.7, reviews: 312, popular: true, deliveryDays: 5, warrantyMonths: 36, inStock: true, description: "Эргономичное офисное кресло с сетчатой спинкой и подголовником." },

  140: { material: "Дуб, лён", colors: ["Дуб", "Молочный"], colorPalette: ["#b08858", "#efe7d2"], rating: 4.6, reviews: 98, deliveryDays: 10, warrantyMonths: 36, inStock: true, description: "Односпальная кровать с дубовым каркасом, ортопедическое основание в комплекте." },
  141: { material: "МДФ", colors: ["Белый"], colorPalette: ["#fafaf9"], rating: 4.5, reviews: 67, deliveryDays: 14, warrantyMonths: 24, inStock: true, description: "Двухъярусная кровать со ступеньками для детской комнаты." },

  150: { material: "ЛДСП, зеркало", colors: ["Белый", "Дуб"], colorPalette: ["#fafaf9", "#b08858"], rating: 4.9, reviews: 156, popular: true, deliveryDays: 25, warrantyMonths: 60, inStock: true, description: "Шкаф-купе с зеркалом в полный рост. Изготовление по индивидуальным размерам — фабрика Шкафулькин." },
  151: { material: "ЛДСП, светлое дерево", colors: ["Дуб светлый", "Белый"], colorPalette: ["#d8c9a8", "#fafaf9"], rating: 4.9, reviews: 89, isNew: true, popular: true, deliveryDays: 30, warrantyMonths: 60, inStock: true, description: "Открытая гардеробная система: полки, штанги, ящики. Производство Шкафулькин." },
  152: { material: "ЛДСП, зеркало", colors: ["Белый матовый"], colorPalette: ["#fafaf9"], rating: 4.7, reviews: 67, deliveryDays: 25, warrantyMonths: 60, inStock: true, description: "Прихожая с зеркалом и обувницей. Белый матовый фасад. Шкафулькин." },
  153: { material: "Берёза", colors: ["Белый"], colorPalette: ["#c4b5fd"], rating: 4.6, reviews: 178, deliveryDays: 5, warrantyMonths: 18, inStock: true, description: "Прикроватная тумба с двумя ящиками, белая." },
  154: { material: "Сталь, орех", colors: ["Чёрный"], colorPalette: ["#1c1917"], rating: 4.7, reviews: 134, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Высокий узкий стеллаж на металлокаркасе, 5 полок. Лофт." },
  155: { material: "Дуб масляный", colors: ["Натуральный дуб"], colorPalette: ["#d6d3d1"], rating: 4.8, reviews: 123, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Широкий дубовый стеллаж 6 ячеек. Скандинавский стиль." },
  156: { material: "ЛДСП", colors: ["Белый"], colorPalette: ["#fafaf9"], rating: 4.4, reviews: 245, deliveryDays: 3, warrantyMonths: 12, inStock: true, description: "Набор из 3 парящих белых полок. Скрытое крепление." },
  157: { material: "ЛДСП", colors: ["Белый"], colorPalette: ["#fafaf9"], rating: 4.6, reviews: 167, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Современный белый комод на 6 ящиков с никелевыми ручками." },
  158: { material: "ЛДСП, зеркало", colors: ["Белый глянец"], colorPalette: ["#fef3c7"], rating: 4.7, reviews: 89, deliveryDays: 10, warrantyMonths: 24, inStock: true, description: "Туалетный столик Vanity с зеркалом и пуфом. Гламурный стиль." },

  160: { material: "ЛДСП", colors: ["Серый"], colorPalette: ["#78716c"], rating: 4.7, reviews: 198, popular: true, deliveryDays: 5, warrantyMonths: 24, inStock: true, description: "Подвесная ТВ-тумба с открытыми и закрытыми отсеками. Под ТВ до 75 дюймов." },

  170: { material: "МДФ, кварц", colors: ["Белый"], colorPalette: ["#fcd34d"], rating: 4.8, reviews: 67, popular: true, deliveryDays: 30, warrantyMonths: 60, inStock: true, description: "Угловая кухня с матовыми фасадами, кварцевая столешница, встроенная мойка." },
  171: { material: "МДФ, дерево, латунь", colors: ["Тёмно-зелёный"], colorPalette: ["#064e3b"], rating: 4.9, reviews: 34, isNew: true, deliveryDays: 45, warrantyMonths: 60, inStock: true, description: "U-образная кухня с островом. Тёмно-зелёные матовые фасады, дерево, латунь." },
  172: { material: "МДФ, мрамор", colors: ["Белый"], colorPalette: ["#fafaf9"], rating: 4.9, reviews: 56, deliveryDays: 45, warrantyMonths: 60, inStock: true, description: "Классическая белая Shaker-кухня с мраморной столешницей." },
  173: { material: "Кварц, дерево", colors: ["Тёмно-синий"], colorPalette: ["#1e3a8a"], rating: 4.8, reviews: 78, deliveryDays: 30, warrantyMonths: 60, inStock: true, description: "Кухонный остров с барной стойкой. Кварц + темно-синий низ." },
  174: { material: "Сталь, стекло", colors: ["Чёрное стекло"], colorPalette: ["#1c1917"], rating: 4.9, reviews: 124, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Встроенная колонна духовка + микроволновка, чёрное стекло. Bosch." },
  175: { material: "Стекло, индукция", colors: ["Чёрный"], colorPalette: ["#000000"], rating: 4.8, reviews: 234, deliveryDays: 10, warrantyMonths: 36, inStock: true, description: "Индукционная варочная панель Bosch, 4 конфорки. Сенсорное управление." },
  176: { material: "Нержавеющая сталь", colors: ["Сталь"], colorPalette: ["#cbd5e1"], rating: 4.7, reviews: 156, deliveryDays: 7, warrantyMonths: 24, inStock: true, description: "Каминная вытяжка из нержавейки, 3 скорости." },
  177: { material: "Сталь", colors: ["Сталь"], colorPalette: ["#cbd5e1"], rating: 4.8, reviews: 198, deliveryDays: 7, warrantyMonths: 36, inStock: true, description: "Встраиваемая посудомоечная машина 60 см, A+++. 14 комплектов." },
  178: { material: "Сталь", colors: ["Сталь"], colorPalette: ["#cbd5e1"], rating: 4.8, reviews: 312, popular: true, deliveryDays: 5, warrantyMonths: 36, inStock: true, description: "Двухдверный холодильник Side-by-Side. Нержавейка, No Frost." },
  179: { material: "Сталь", colors: ["Белый"], colorPalette: ["#cbd5e1"], rating: 4.7, reviews: 412, popular: true, deliveryDays: 5, warrantyMonths: 24, inStock: true, description: "Стиральная машина Bosch с фронтальной загрузкой 8 кг, инверторный двигатель, A+++." },

  180: { material: "Сталь матовая", colors: ["Чёрный"], colorPalette: ["#1c1917"], rating: 4.6, reviews: 145, deliveryDays: 5, warrantyMonths: 24, inStock: true, description: "Чёрный индустриальный подвес-клетка. Стиль лофт. Лампа E27." },
  181: { material: "Хрусталь, латунь", colors: ["Хрусталь"], colorPalette: ["#fafaf9"], rating: 4.9, reviews: 78, deliveryDays: 21, warrantyMonths: 60, inStock: true, description: "Большая многоуровневая хрустальная люстра. Премиум-классика." },

  190: { material: "Стекло, латунь", colors: ["Золото"], colorPalette: ["#eab308"], rating: 4.7, reviews: 234, popular: true, deliveryDays: 3, warrantyMonths: 24, inStock: true, description: "Круглое зеркало в золотой раме. Минималистичный современный декор." },
  191: { material: "Стекло, латунь", colors: ["Золото"], colorPalette: ["#eab308"], rating: 4.8, reviews: 89, deliveryDays: 7, warrantyMonths: 36, inStock: true, description: "Высокое напольное зеркало с округлым верхом, золотая рама. Гламур." },
  192: { material: "Холст, дерево", colors: ["Бежевый"], colorPalette: ["#a8a29e"], rating: 4.5, reviews: 124, isNew: true, deliveryDays: 5, warrantyMonths: 12, inStock: true, description: "Триптих абстрактных картин в бежевых тонах. Минимализм." },

  200: { material: "Живое растение, бетон", colors: ["Зелёный"], colorPalette: ["#16a34a"], rating: 4.6, reviews: 56, popular: true, deliveryDays: 2, warrantyMonths: 0, inStock: true, description: "Фикус Lyrata в бетонном кашпо. Высота ≈ 1.8 м." },

  210: { material: "Шерсть, шёлк", colors: ["Бордо с золотым"], colorPalette: ["#7f1d1d"], rating: 4.9, reviews: 45, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Винтажный персидский ковёр бордо с золотым орнаментом. Ручное узелковое плетение." },
  211: { material: "Полиэстер шегги", colors: ["Белый"], colorPalette: ["#fafaf9"], rating: 4.5, reviews: 178, deliveryDays: 5, warrantyMonths: 12, inStock: true, description: "Круглый пушистый ковёр шегги, белый. Для спальни и гостиной." },

  220: { material: "Акрил", colors: ["Белый"], colorPalette: ["#bae6fd"], rating: 4.8, reviews: 67, popular: true, deliveryDays: 14, warrantyMonths: 60, inStock: true, description: "Отдельностоящая акриловая ванна-чаша. Современный минимализм. Roca." },
  221: { material: "Чугун, латунь", colors: ["Белый"], colorPalette: ["#fafaf9"], rating: 4.9, reviews: 34, deliveryDays: 21, warrantyMonths: 120, inStock: true, description: "Винтажная чугунная ванна на ножках с латунным смесителем. Классика." },
  222: { material: "Стекло, поддон", colors: ["Прозрачный"], colorPalette: ["#bae6fd"], rating: 4.7, reviews: 124, deliveryDays: 14, warrantyMonths: 36, inStock: true, description: "Угловая стеклянная душевая кабина с поддоном." },
  223: { material: "Керамика", colors: ["Белый"], colorPalette: ["#e2e8f0"], rating: 4.7, reviews: 234, popular: true, deliveryDays: 7, warrantyMonths: 60, inStock: true, description: "Подвесной безободковый унитаз с микролифтом крышки. Roca." },
  224: { material: "Орех, мрамор", colors: ["Орех"], colorPalette: ["#78350f"], rating: 4.9, reviews: 56, deliveryDays: 21, warrantyMonths: 60, inStock: true, description: "Двойная тумба с двумя раковинами и мраморной столешницей. Ванная для двоих." },
  225: { material: "Хром", colors: ["Хром"], colorPalette: ["#cbd5e1"], rating: 4.6, reviews: 198, deliveryDays: 5, warrantyMonths: 36, inStock: true, description: "Хромированный настенный полотенцесушитель. Roca." },
};

// ─── Превью-картинки (PREVIEW) — мапятся на ID ───────────────────────────
const PREVIEW_BY_ID: Record<number, string> = {
  // Старые SKU
  1: PREVIEW.sofaCorner,
  10: PREVIEW.sofa3,
  11: PREVIEW.sofaMidcentury,
  2: PREVIEW.diningTable,
  9: PREVIEW.coffeeMarble,
  12: PREVIEW.desk,
  13: PREVIEW.coffeeLoft,
  3: PREVIEW.armchairBeige,
  8: PREVIEW.pouf,
  14: PREVIEW.armchairBoucle,
  4: PREVIEW.wardrobe,
  7: PREVIEW.bookcaseScandi,
  15: PREVIEW.dresser,
  5: PREVIEW.bedKing,
  16: PREVIEW.bedSingle,
  6: PREVIEW.tvStand,
  17: PREVIEW.tvStand,
  20: PREVIEW.pendantLight,
  21: PREVIEW.floorLamp,
  22: PREVIEW.tableLamp,
  23: PREVIEW.chandelier,
  30: PREVIEW.wallArt,
  31: PREVIEW.mirrorRound,
  32: PREVIEW.sideJapandi,
  33: PREVIEW.shelves,
  40: PREVIEW.rug,
  41: PREVIEW.rugPersian,
  42: PREVIEW.rug,
  43: PREVIEW.rugShag,
  50: PREVIEW.plant,
  51: PREVIEW.fiddleFig,
  52: PREVIEW.plant,
  60: PREVIEW.kitchenIsland,
  61: PREVIEW.barstool,
  62: PREVIEW.diningTable,
  70: PREVIEW.sink,
  71: PREVIEW.mirrorRound,
  72: PREVIEW.sink,
  // Новые SKU
  100: PREVIEW.sofaModular,
  101: PREVIEW.sofaCurved,
  102: PREVIEW.sofaMidcentury,
  103: PREVIEW.sofaCurved,
  110: PREVIEW.armchairVelvet,
  111: PREVIEW.armchairLeather,
  112: PREVIEW.armchairBoucle,
  113: PREVIEW.pouf,
  120: PREVIEW.coffeeMarble,
  121: PREVIEW.coffeeLoft,
  122: PREVIEW.coffeeNesting,
  123: PREVIEW.sideClassic,
  124: PREVIEW.sideJapandi,
  130: PREVIEW.diningChair,
  131: PREVIEW.barstool,
  132: PREVIEW.officeChair,
  140: PREVIEW.bedSingle,
  141: PREVIEW.bedBunk,
  150: PREVIEW.wardrobe,
  151: PREVIEW.walkInCloset,
  152: PREVIEW.shoeCabinet,
  153: PREVIEW.nightstand,
  154: PREVIEW.bookcaseLoft,
  155: PREVIEW.bookcaseScandi,
  156: PREVIEW.shelves,
  157: PREVIEW.dresser,
  158: PREVIEW.vanity,
  160: PREVIEW.tvStand,
  170: PREVIEW.kitchenSet,
  171: PREVIEW.kitchenU,
  172: PREVIEW.kitchenShaker,
  173: PREVIEW.kitchenIsland,
  174: PREVIEW.ovenColumn,
  175: PREVIEW.cooktop,
  176: PREVIEW.rangeHood,
  177: PREVIEW.dishwasher,
  178: PREVIEW.fridge,
  179: PREVIEW.washMachine,
  180: PREVIEW.pendantLight,
  181: PREVIEW.chandelier,
  190: PREVIEW.mirrorRound,
  191: PREVIEW.mirrorFloor,
  192: PREVIEW.wallArt,
  200: PREVIEW.fiddleFig,
  210: PREVIEW.rugPersian,
  211: PREVIEW.rugShag,
  220: PREVIEW.bathtub,
  221: PREVIEW.bathtubClassic,
  222: PREVIEW.shower,
  223: PREVIEW.toilet,
  224: PREVIEW.vanityDouble,
  225: PREVIEW.towelRail,
};

// Применяем обогащение к базовому каталогу
FURNITURE_CATALOG.forEach((item) => {
  const patch = ENRICHMENT[item.id];
  if (patch) Object.assign(item, patch);
  const img = PREVIEW_BY_ID[item.id];
  if (img && !item.imageUrl) item.imageUrl = img;
});

// ─── Хелперы фильтрации ────────────────────────────────────────────────────

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

/**
 * Подбор похожих товаров «С этим покупают».
 * Учитывает совпадение стилей, дружественные категории, близость цены, рейтинг.
 */
export function getRelatedItems(item: FurnitureItem, limit = 4): FurnitureItem[] {
  const candidates = FURNITURE_CATALOG.filter((f) => f.id !== item.id);

  const COMPLEMENT: Partial<Record<Category, Category[]>> = {
    "Диваны":     ["Столы", "Освещение", "Текстиль", "Декор"],
    "Кровати":    ["Шкафы", "Освещение", "Текстиль", "Декор"],
    "Столы":      ["Кресла", "Освещение", "Декор"],
    "Кресла":     ["Столы", "Освещение", "Текстиль"],
    "Шкафы":      ["Декор", "Растения", "Освещение"],
    "ТВ-зоны":    ["Диваны", "Декор", "Освещение"],
    "Освещение":  ["Декор", "Растения", "Текстиль"],
    "Декор":      ["Растения", "Освещение", "Текстиль"],
    "Текстиль":   ["Диваны", "Кровати", "Декор"],
    "Растения":   ["Декор", "Освещение"],
    "Кухня":      ["Освещение", "Декор", "Растения"],
    "Ванная":     ["Освещение", "Декор", "Текстиль"],
  };

  const friendly = COMPLEMENT[item.category] ?? [];

  const scored = candidates.map((c) => {
    let score = 0;

    const myTags = new Set(item.styleTags ?? []);
    const matchingTags = (c.styleTags ?? []).filter((t) => myTags.has(t)).length;
    score += matchingTags * 3;

    if (friendly.includes(c.category)) score += 4;
    if (c.category === item.category) score += 1;

    const priceDiff = Math.abs(c.priceNum - item.priceNum) / Math.max(item.priceNum, 1);
    if (priceDiff < 0.5) score += 2;
    else if (priceDiff < 1.5) score += 1;

    score += (c.rating ?? 0) * 0.5;
    if (c.inStock !== false) score += 1;
    if (c.popular) score += 1;

    return { item: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}

/** Уникальные бренды */
export function getAllBrands(): string[] {
  return Array.from(new Set(FURNITURE_CATALOG.map((f) => f.brand))).sort();
}

/** Минимальная и максимальная цена */
export function getPriceRange(): { min: number; max: number } {
  const prices = FURNITURE_CATALOG.map((f) => f.priceNum);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export type SortBy = "popular" | "price-asc" | "price-desc" | "rating" | "new";

export interface CatalogFilters {
  search?: string;
  category?: Category | "all";
  brands?: string[];
  styleTags?: StyleTag[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  hasDiscount?: boolean;
  sortBy?: SortBy;
}

/** Главная функция фильтрации/сортировки */
export function filterCatalog(filters: CatalogFilters): FurnitureItem[] {
  let result = [...FURNITURE_CATALOG];

  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.brand.toLowerCase().includes(q) ||
        f.material?.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q),
    );
  }
  if (filters.category && filters.category !== "all") {
    result = result.filter((f) => f.category === filters.category);
  }
  if (filters.brands && filters.brands.length > 0) {
    result = result.filter((f) => filters.brands!.includes(f.brand));
  }
  if (filters.styleTags && filters.styleTags.length > 0) {
    result = result.filter((f) =>
      f.styleTags?.some((t) => filters.styleTags!.includes(t)),
    );
  }
  if (typeof filters.minPrice === "number") {
    result = result.filter((f) => f.priceNum >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === "number") {
    result = result.filter((f) => f.priceNum <= filters.maxPrice!);
  }
  if (typeof filters.minRating === "number") {
    result = result.filter((f) => (f.rating ?? 0) >= filters.minRating!);
  }
  if (filters.inStockOnly) {
    result = result.filter((f) => f.inStock !== false);
  }
  if (filters.hasDiscount) {
    result = result.filter((f) => (f.discount ?? 0) > 0);
  }

  switch (filters.sortBy) {
    case "price-asc":
      result.sort((a, b) => a.priceNum - b.priceNum);
      break;
    case "price-desc":
      result.sort((a, b) => b.priceNum - a.priceNum);
      break;
    case "rating":
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "new":
      result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      break;
    case "popular":
    default:
      result.sort((a, b) => {
        const ap = (a.popular ? 1 : 0) * 1000 + (a.reviews ?? 0);
        const bp = (b.popular ? 1 : 0) * 1000 + (b.reviews ?? 0);
        return bp - ap;
      });
      break;
  }

  return result;
}