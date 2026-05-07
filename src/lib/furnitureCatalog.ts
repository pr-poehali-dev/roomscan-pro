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

// ─── Обогащение каталога ───────────────────────────────────────────────────
// Расширяем базовые записи дополнительными атрибутами без изменения структуры.

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
};

// Применяем обогащение к базовому каталогу
FURNITURE_CATALOG.forEach((item) => {
  const patch = ENRICHMENT[item.id];
  if (patch) Object.assign(item, patch);
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