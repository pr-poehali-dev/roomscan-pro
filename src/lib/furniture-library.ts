/**
 * Расширенная библиотека интерьерных объектов для планировщика.
 * Каждый объект имеет AI-сгенерированное превью, описание, бренд, цену
 * и рекомендованные размеры для расстановки в плане.
 *
 * Партнёр-производитель шкафов и корпусной мебели — Шкафулькин (https://shkafulkin.ru/).
 */
import type { CatalogItem, FurnitureCategory } from "./floorPlanTypes";

/**
 * Расширенный объект каталога: дополняет CatalogItem метаданными
 * для красивых карточек в библиотеке (превью, описание, цена, бренд).
 */
export interface RichCatalogItem extends CatalogItem {
  /** Уникальный ID для поиска и сохранения */
  id: string;
  /** Краткое описание (1-2 строки) */
  description: string;
  /** Превью-изображение (PNG/JPG, ≈512px) */
  preview: string;
  /** Бренд / производитель (опционально) */
  brand?: string;
  /** Партнёрская ссылка / индикатор (опционально) */
  partnerSlug?: "shkafulkin";
  /** Стиль интерьера для фильтра */
  style?: "scandi" | "loft" | "classic" | "minimal" | "modern";
  /** Ориентировочная цена, ₽ (для будущих заявок) */
  price?: number;
  /** Теги для поиска */
  tags?: string[];
}

/* ─────────────────── ИЗОБРАЖЕНИЯ (AI-сгенерированные) ─────────────────── */
/* Все изображения — 3D isometric, белый фон, премиальный каталожный стиль. */

const IMG = {
  sofa3:           "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/4b583a4b-d855-475f-b113-fb9a9312e31c.jpg",
  sofaCorner:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/2858f17c-2950-479e-aab5-29dac4f1b078.jpg",
  armchair:        "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/70fc8dd4-2fc3-4c72-98e2-9f090050ddf9.jpg",
  bedKing:         "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/615fa69b-321e-4715-821e-cf7a2a33c46f.jpg",
  wardrobeSlide:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/945667b5-c8c7-4363-b06f-834a8fe4c187.jpg",
  walkInCloset:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/bb50f3bc-c8d4-456f-9c56-5a9f30a358d8.jpg",
  diningTable:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/c26b21f7-d465-4b01-8d63-19f766dde4c7.jpg",
  diningChair:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/85618eea-fcf3-416c-8059-ef87478e9a52.jpg",
  kitchenSet:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/56789441-a8e7-4528-ba08-3a7690257723.jpg",
  fridge:          "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/c4b6b4fd-767a-479d-9349-cda0b891f745.jpg",
  bathtub:         "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/282dabdf-99d8-4dc4-b6d7-0693f8df565a.jpg",
  shower:          "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/eeb004be-cd08-4c3f-b0e4-21631c592486.jpg",
  toilet:          "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/ea45a329-62f5-4462-a9ec-bb0603bbaf1c.jpg",
  sink:            "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/1c282e54-6c5a-4853-be4f-e061230337c3.jpg",
  coffeeTable:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/dab62b29-2bd3-4cd9-a34c-917bd2f58a77.jpg",
  tvStand:         "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/03855368-5b9a-4f60-b31d-32626185656d.jpg",
  nightstand:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/d78ba45d-2a5e-41a4-9b80-6b85dbcd5ac8.jpg",
  washMachine:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/ac6b136a-611b-42bc-bee3-31d1b812630f.jpg",
  plant:           "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/86f9fde2-e5f6-4531-8acc-f0f2fbfc59dd.jpg",
  rug:             "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/d0798c98-a62c-41a7-abd9-49c1468b063f.jpg",
  desk:            "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/e14f2cf4-7025-415e-b57e-c7e487becd91.jpg",
  officeChair:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/03100bdf-6a84-4cc5-80d2-3589eb34a867.jpg",
  shoeCabinet:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/650ac25d-f6b0-48ca-979d-0d33f5bf75ea.jpg",
};

/* ─────────────────── КАТАЛОГ ─────────────────── */

export const FURNITURE_LIBRARY: RichCatalogItem[] = [
  /* ── ГОСТИНАЯ ── */
  {
    id: "sofa-3-grey",
    type: "Диван 3-местный",
    category: "sofa",
    icon: "Sofa",
    w: 220, h: 95, color: "#94a3b8",
    description: "Прямой 3-местный диван с тканевой обивкой, мягкие подушки, скандинавский стиль.",
    preview: IMG.sofa3,
    style: "scandi",
    price: 89000,
    tags: ["диван", "гостиная", "сидение"],
  },
  {
    id: "sofa-corner",
    type: "Угловой диван",
    category: "sofa",
    icon: "Sofa",
    w: 280, h: 180, color: "#94a3b8",
    description: "Угловой диван с шезлонгом, светло-серая ткань. Раскладывается, есть короб для белья.",
    preview: IMG.sofaCorner,
    style: "modern",
    price: 145000,
    tags: ["диван", "угловой", "гостиная"],
  },
  {
    id: "armchair-beige",
    type: "Кресло",
    category: "sofa",
    icon: "Armchair",
    w: 90, h: 90, color: "#a8a29e",
    description: "Мягкое кресло с тканевой обивкой и деревянными ножками.",
    preview: IMG.armchair,
    style: "scandi",
    price: 32000,
    tags: ["кресло", "гостиная"],
  },
  {
    id: "coffee-table-marble",
    type: "Журнальный стол",
    category: "table",
    icon: "Square",
    w: 100, h: 60, color: "#d6d3d1",
    description: "Мраморная столешница на золотых металлических ножках. Стиль ар-деко.",
    preview: IMG.coffeeTable,
    style: "modern",
    price: 24500,
    tags: ["стол", "журнальный", "мрамор"],
  },
  {
    id: "tv-stand-modern",
    type: "ТВ-тумба",
    category: "storage",
    icon: "Tv",
    w: 180, h: 45, color: "#78716c",
    description: "Подвесная тумба под ТВ с открытыми и закрытыми отсеками.",
    preview: IMG.tvStand,
    style: "modern",
    price: 28500,
    tags: ["тумба", "тв", "медиа"],
  },

  /* ── СПАЛЬНЯ ── */
  {
    id: "bed-king",
    type: "Кровать 2-сп.",
    category: "bed",
    icon: "BedDouble",
    w: 200, h: 180, color: "#fde68a",
    description: "Двуспальная кровать 180×200 с мягким изголовьем серого цвета. Подъёмный механизм.",
    preview: IMG.bedKing,
    style: "scandi",
    price: 58000,
    tags: ["кровать", "спальня", "двуспальная"],
  },
  {
    id: "nightstand-white",
    type: "Тумбочка",
    category: "storage",
    icon: "Box",
    w: 50, h: 40, color: "#c4b5fd",
    description: "Прикроватная тумба с двумя выдвижными ящиками, белая.",
    preview: IMG.nightstand,
    style: "scandi",
    price: 9800,
    tags: ["тумбочка", "спальня"],
  },

  /* ── ШКАФУЛЬКИН (партнёр) ── */
  {
    id: "shk-wardrobe-slide",
    type: "Шкаф-купе с зеркалом",
    category: "storage",
    icon: "Archive",
    w: 200, h: 60, color: "#a78bfa",
    description: "Распашной шкаф-купе с зеркальной дверью на всю высоту. Изготовление по индивидуальным размерам — Шкафулькин.",
    preview: IMG.wardrobeSlide,
    brand: "Шкафулькин",
    partnerSlug: "shkafulkin",
    style: "modern",
    price: 65000,
    tags: ["шкаф", "купе", "зеркало", "хранение"],
  },
  {
    id: "shk-walkin-closet",
    type: "Гардеробная система",
    category: "storage",
    icon: "Archive",
    w: 240, h: 60, color: "#a78bfa",
    description: "Открытая гардеробная: полки, штанги, выдвижные ящики. Светлое дерево + белый. Шкафулькин — индивидуальный проект.",
    preview: IMG.walkInCloset,
    brand: "Шкафулькин",
    partnerSlug: "shkafulkin",
    style: "modern",
    price: 110000,
    tags: ["гардеробная", "шкаф", "хранение", "система"],
  },
  {
    id: "shk-shoe-cabinet",
    type: "Шкаф-прихожая",
    category: "storage",
    icon: "Archive",
    w: 120, h: 40, color: "#a78bfa",
    description: "Прихожая с зеркалом и обувницей. Белый матовый фасад. Производство Шкафулькин.",
    preview: IMG.shoeCabinet,
    brand: "Шкафулькин",
    partnerSlug: "shkafulkin",
    style: "scandi",
    price: 38500,
    tags: ["прихожая", "обувница", "шкаф"],
  },

  /* ── КУХНЯ ── */
  {
    id: "kitchen-modern-set",
    type: "Кух. гарнитур",
    category: "kitchen",
    icon: "ChefHat",
    w: 280, h: 60, color: "#fcd34d",
    description: "Угловой гарнитур с матовыми фасадами, кварцевая столешница, встроенная мойка.",
    preview: IMG.kitchenSet,
    style: "modern",
    price: 215000,
    tags: ["кухня", "гарнитур"],
  },
  {
    id: "fridge-2door",
    type: "Холодильник",
    category: "appliance",
    icon: "Refrigerator",
    w: 70, h: 65, color: "#cbd5e1",
    description: "Двухдверный холодильник Side-by-Side, нержавеющая сталь, No Frost.",
    preview: IMG.fridge,
    style: "modern",
    price: 89000,
    tags: ["холодильник", "техника"],
  },
  {
    id: "dining-table-oak",
    type: "Обеденный стол",
    category: "table",
    icon: "Square",
    w: 160, h: 90, color: "#d6d3d1",
    description: "Стол на 6 персон, дубовая столешница, чёрные металлические ножки.",
    preview: IMG.diningTable,
    style: "scandi",
    price: 42000,
    tags: ["стол", "обеденный", "столовая"],
  },
  {
    id: "dining-chair-grey",
    type: "Стул",
    category: "chair",
    icon: "Armchair",
    w: 50, h: 50, color: "#a8a29e",
    description: "Стул с серой обивкой и дубовыми ножками. Мягкое сиденье.",
    preview: IMG.diningChair,
    style: "scandi",
    price: 6500,
    tags: ["стул", "обеденный"],
  },

  /* ── ВАННАЯ ── */
  {
    id: "bathtub-freestand",
    type: "Ванна",
    category: "bath",
    icon: "Bath",
    w: 170, h: 75, color: "#bae6fd",
    description: "Отдельностоящая акриловая ванна-чаша. Современный минимализм.",
    preview: IMG.bathtub,
    style: "minimal",
    price: 78500,
    tags: ["ванна", "сантехника"],
  },
  {
    id: "shower-glass",
    type: "Душевая кабина",
    category: "bath",
    icon: "ShowerHead",
    w: 90, h: 90, color: "#bae6fd",
    description: "Угловая душевая кабина с прозрачным стеклом и поддоном.",
    preview: IMG.shower,
    style: "modern",
    price: 56000,
    tags: ["душ", "сантехника"],
  },
  {
    id: "toilet-modern",
    type: "Унитаз",
    category: "bath",
    icon: "Toilet",
    w: 40, h: 65, color: "#e2e8f0",
    description: "Подвесной безободковый унитаз с микролифтом крышки.",
    preview: IMG.toilet,
    style: "minimal",
    price: 18500,
    tags: ["унитаз", "сантехника"],
  },
  {
    id: "sink-vanity",
    type: "Раковина с тумбой",
    category: "bath",
    icon: "Droplets",
    w: 80, h: 50, color: "#e2e8f0",
    description: "Керамическая раковина на деревянной тумбе с выдвижным ящиком.",
    preview: IMG.sink,
    style: "modern",
    price: 24500,
    tags: ["раковина", "тумба", "сантехника"],
  },
  {
    id: "wash-machine-front",
    type: "Стиральная маш.",
    category: "appliance",
    icon: "WashingMachine",
    w: 60, h: 60, color: "#cbd5e1",
    description: "Фронтальная загрузка 8 кг, инверторный двигатель, A+++.",
    preview: IMG.washMachine,
    style: "modern",
    price: 42500,
    tags: ["стиралка", "техника"],
  },

  /* ── КАБИНЕТ ── */
  {
    id: "desk-oak",
    type: "Письменный стол",
    category: "table",
    icon: "Square",
    w: 140, h: 70, color: "#d6d3d1",
    description: "Стол с дубовой столешницей и встроенными ящиками.",
    preview: IMG.desk,
    style: "modern",
    price: 36500,
    tags: ["стол", "офис", "кабинет"],
  },
  {
    id: "office-chair-mesh",
    type: "Офисное кресло",
    category: "chair",
    icon: "Armchair",
    w: 65, h: 65, color: "#1f2937",
    description: "Эргономичное кресло с сетчатой спинкой и подголовником.",
    preview: IMG.officeChair,
    style: "modern",
    price: 28500,
    tags: ["кресло", "офис", "стул"],
  },

  /* ── ДЕКОР ── */
  {
    id: "plant-monstera",
    type: "Растение",
    category: "decor",
    icon: "Leaf",
    w: 50, h: 50, color: "#86efac",
    description: "Монстера в керамическом горшке. Высота ≈ 1.4 м.",
    preview: IMG.plant,
    style: "modern",
    price: 4500,
    tags: ["растение", "декор", "цветок"],
  },
  {
    id: "rug-geometric",
    type: "Ковёр",
    category: "decor",
    icon: "Square",
    w: 200, h: 140, color: "#fca5a5",
    description: "Бежевый ковёр с геометрическим орнаментом.",
    preview: IMG.rug,
    style: "modern",
    price: 12500,
    tags: ["ковёр", "декор"],
  },
];

/* ─────────────────── HELPERS ─────────────────── */

export const CATEGORY_META: Record<FurnitureCategory | "all", { label: string; icon: string; description: string }> = {
  all:       { label: "Всё",      icon: "Grid3x3",       description: "Вся библиотека" },
  sofa:      { label: "Гостиная", icon: "Sofa",          description: "Диваны, кресла" },
  bed:       { label: "Спальня",  icon: "BedDouble",     description: "Кровати" },
  table:     { label: "Столы",    icon: "Square",        description: "Обеденные, журнальные, рабочие" },
  chair:     { label: "Стулья",   icon: "Armchair",      description: "Стулья, кресла" },
  kitchen:   { label: "Кухня",    icon: "ChefHat",       description: "Гарнитуры, плиты" },
  bath:      { label: "Ванная",   icon: "Bath",          description: "Сантехника" },
  storage:   { label: "Хранение", icon: "Archive",       description: "Шкафы, тумбы — Шкафулькин" },
  appliance: { label: "Техника",  icon: "Refrigerator",  description: "Холодильник, стиралка" },
  decor:     { label: "Декор",    icon: "Leaf",          description: "Растения, ковры" },
};

/**
 * Поиск по тексту — учитывает название, описание, бренд, теги.
 */
export function searchFurniture(items: RichCatalogItem[], query: string): RichCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((it) => {
    const hay = [
      it.type,
      it.description,
      it.brand ?? "",
      ...(it.tags ?? []),
    ].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

/**
 * Конвертирует RichCatalogItem в обычный CatalogItem (для совместимости со старыми вызовами).
 */
export function toCatalogItem(it: RichCatalogItem): CatalogItem {
  return {
    type: it.type,
    category: it.category,
    icon: it.icon,
    w: it.w,
    h: it.h,
    color: it.color,
  };
}

/**
 * Получает партнёрские объекты (для отдельной полки в UI).
 */
export function getPartnerItems(items: RichCatalogItem[], slug: "shkafulkin"): RichCatalogItem[] {
  return items.filter((it) => it.partnerSlug === slug);
}

export function formatPriceRub(n?: number): string {
  if (!n) return "—";
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}
