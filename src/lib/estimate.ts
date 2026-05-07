/**
 * Полная библиотека расчёта сметы ремонта.
 * 3 уровня (Эконом / Стандарт / Премиум) × 4 категории работ.
 *
 * Ценовая модель:
 *   - Базовые ставки = Москва, Стандарт, 2025 г. (см. источники в комментариях ниже).
 *   - Тарифный коэффициент: Эконом / Стандарт / Премиум — отдельно для работ и материалов.
 *   - Региональный коэффициент: см. src/lib/regions.ts (Москва = 1.00, регионы — меньше).
 *
 * Источники калибровки (открытые данные за 2025):
 *   - Средние ставки бригад: avito.ru/работа, profi.ru/remont
 *   - Стоимость материалов: Леруа Мерлен, Петрович, Castorama
 *   - Индексы стройматериалов: Росстат, ФБУ ФЦЦС
 *   - Прайсы профильных сервисов смет (homeapp, remontnik, na-dom.ru)
 */

import { getRegion, DEFAULT_REGION_ID } from "./regions";

export type Tier = "econom" | "standart" | "premium";

export interface RoomInput {
  area: number;       // м²
  perimeter: number;  // м
  height: number;     // м
  doors: number;      // шт
  windows: number;    // шт
  /** ID региона из REGIONS (по умолчанию "moscow") */
  regionId?: string;
}

export interface EstimateLine {
  name: string;
  unit: "м²" | "м" | "шт" | "комплект";
  qty: number;
  price: number;       // ₽ за единицу (с учётом тарифа и региона)
  total: number;       // ₽
  category: "demo" | "rough" | "finish" | "plumb" | "electric" | "doors";
  /** Доля «работы» в цене за единицу (0..1). Остальное — материалы. */
  worksShare: number;
}

export interface EstimateGroup {
  key: string;
  name: string;
  icon: string;
  lines: EstimateLine[];
  total: number;
}

export interface EstimateResult {
  tier: Tier;
  regionId: string;
  regionName: string;
  groups: EstimateGroup[];
  worksTotal: number;
  materialsTotal: number;
  grandTotal: number;
  perSqm: number;
  daysApprox: number;
  warranty: string;
}

// ─── Тарифные коэффициенты ──────────────────────────────────────────────────
// База — Стандарт (1.0). Эконом дешевле, Премиум дороже.
// Раздельные коэффициенты для работ и материалов — потому что в премиум-сегменте
// материалы дорожают сильнее работ (брендовые краски, итальянская сантехника и т.п.).
const TIER_RATE: Record<Tier, {
  works: number; materials: number; days: number;
  warranty: string; label: string; desc: string;
}> = {
  econom:   { works: 0.70, materials: 0.65, days: 0.85, warranty: "1 год",  label: "Эконом",   desc: "Косметический ремонт. Замена покрытий, базовые материалы." },
  standart: { works: 1.00, materials: 1.00, days: 1.00, warranty: "3 года", label: "Стандарт", desc: "Капитальный ремонт. Выравнивание стен, замена сантехники, электрики." },
  premium:  { works: 1.40, materials: 1.85, days: 1.35, warranty: "5 лет",  label: "Премиум",  desc: "Евроремонт. Дизайн-проект, премиум-материалы, авторский надзор." },
};

/**
 * Множитель цен на 2026 год к базовым ставкам, заложенным в BASE_PRICES.
 * Откалиброван по эталону Самары (worksK=0.70, materialsK=0.91, типовая комната 30 м²):
 *   Эконом   ≈ 15 000 ₽/м²
 *   Стандарт ≈ 23 000 ₽/м²
 *   Премиум  ≈ 28 500 ₽/м²
 *
 * При необходимости легко поднять/снизить общий уровень цен — меняйте только эту константу.
 */
const YEAR_2026_MULTIPLIER = 1.90;

export const TIERS: Tier[] = ["econom", "standart", "premium"];
export const TIER_META = TIER_RATE;

/**
 * Базовые цены — Москва, Стандарт, 2025 г.
 * Каждая позиция: { works: ₽/ед.работ, materials: ₽/ед.материалов }
 * Итоговая цена за единицу = works × tier.works × region.worksK
 *                         + materials × tier.materials × region.materialsK
 */
const BASE_PRICES = {
  // ДЕМОНТАЖ — почти только работа
  demo_floor:        { works: 220,   materials: 0    },  // снять старое покрытие
  demo_walls:        { works: 160,   materials: 0    },  // обои/штукатурка
  demo_plinth:       { works: 80,    materials: 0    },
  demo_garbage:      { works: 200,   materials: 0    },  // вынос мусора
  demo_door:         { works: 1500,  materials: 0    },  // демонтаж двери, шт

  // ЧЕРНОВЫЕ
  stiazhka:          { works: 480,   materials: 320  },  // стяжка пола, ₽/м²
  shtukaturka:       { works: 560,   materials: 240  },  // штукатурка по маякам
  shpaklevka_walls:  { works: 320,   materials: 130  },  // 2 слоя, стены
  shpaklevka_ceil:   { works: 360,   materials: 120  },
  gruntovka:         { works: 100,   materials: 50   },
  gipsokarton:       { works: 650,   materials: 380  },  // ГКЛ-перегородки опц.

  // ЧИСТОВЫЕ
  laminat:           { works: 480,   materials: 950  },  // ламинат с подложкой
  paint_walls:       { works: 380,   materials: 520  },  // покраска или обои
  paint_ceil:        { works: 320,   materials: 200  },
  plinth:            { works: 220,   materials: 280  },  // плинтус с установкой
  tile:              { works: 1200,  materials: 1500 },  // плитка с/у, ₽/м²

  // САНТЕХНИКА (комплекты)
  trubi:             { works: 14000, materials: 18000 }, // замена труб ХВС/ГВС
  unitaz:            { works: 4500,  materials: 9500  }, // унитаз
  rakovina:          { works: 3500,  materials: 7000  }, // раковина+смеситель
  vanna:             { works: 8500,  materials: 22000 }, // ванна или душевая

  // ЭЛЕКТРИКА
  el_wiring:         { works: 480,   materials: 280  },  // кабель + штробление
  el_socket:         { works: 480,   materials: 320  },  // розетка/выключатель
  el_light:          { works: 1100,  materials: 1200 },  // светильник
  el_shield:         { works: 8500,  materials: 9500 },  // электрощит, автоматы

  // ДВЕРИ
  door_inner:        { works: 7000,  materials: 14000 }, // межкомнатная с уст.
} as const;


// ─── Расчёт сметы ───────────────────────────────────────────────────────────

/**
 * Вычисляет цену за единицу с учётом тарифа и региона.
 * Возвращает { price, worksShare } — где worksShare нужен потом для итогов.
 */
function priced(
  base: { works: number; materials: number },
  tier: Tier,
  region: ReturnType<typeof getRegion>,
): { price: number; worksShare: number } {
  const k = TIER_RATE[tier];
  const Y = YEAR_2026_MULTIPLIER;
  const w = base.works * k.works * region.worksK * Y;
  const m = base.materials * k.materials * region.materialsK * Y;
  const total = w + m;
  const worksShare = total > 0 ? w / total : 1;
  return { price: Math.round(total), worksShare };
}

export function calcEstimate(room: RoomInput, tier: Tier): EstimateResult {
  const { area, perimeter, height, doors, windows } = room;
  const region = getRegion(room.regionId || DEFAULT_REGION_ID);

  const wallArea = Math.max(0, perimeter * height - doors * 2.1 * 0.9 - windows * 1.4 * 1.1);
  const ceilArea = area;
  const floorArea = area * 0.98;

  // Хелпер для быстрого создания строки сметы
  const line = (
    name: string,
    unit: EstimateLine["unit"],
    qty: number,
    base: { works: number; materials: number },
    category: EstimateLine["category"],
  ): EstimateLine => {
    const { price, worksShare } = priced(base, tier, region);
    return { name, unit, qty, price, total: 0, category, worksShare };
  };

  // 1. ДЕМОНТАЖ
  const demo: EstimateLine[] = [
    line("Демонтаж старых покрытий пола", "м²", floorArea, BASE_PRICES.demo_floor,   "demo"),
    line("Снятие обоев / штукатурки",     "м²", wallArea,  BASE_PRICES.demo_walls,   "demo"),
    line("Демонтаж плинтуса",             "м",  perimeter, BASE_PRICES.demo_plinth,  "demo"),
    line("Вынос мусора, уборка",          "м²", area,      BASE_PRICES.demo_garbage, "demo"),
  ];
  if (doors > 0) {
    demo.push(line("Демонтаж старых дверей", "шт", doors, BASE_PRICES.demo_door, "demo"));
  }

  // 2. ЧЕРНОВЫЕ РАБОТЫ
  const rough: EstimateLine[] = [
    line("Стяжка пола",                "м²", floorArea, BASE_PRICES.stiazhka,         "rough"),
    line("Штукатурка стен по маякам",  "м²", wallArea,  BASE_PRICES.shtukaturka,      "rough"),
    line("Шпаклёвка стен (2 слоя)",    "м²", wallArea,  BASE_PRICES.shpaklevka_walls, "rough"),
    line("Шпаклёвка потолка",          "м²", ceilArea,  BASE_PRICES.shpaklevka_ceil,  "rough"),
    line("Грунтовка поверхностей",     "м²", wallArea + ceilArea, BASE_PRICES.gruntovka, "rough"),
  ];

  // 3. ЧИСТОВЫЕ РАБОТЫ
  const finish: EstimateLine[] = [
    line("Укладка ламината/паркета",       "м²", floorArea * 1.08, BASE_PRICES.laminat,     "finish"),
    line("Поклейка обоев / покраска стен", "м²", wallArea * 1.10,  BASE_PRICES.paint_walls, "finish"),
    line("Покраска потолка",               "м²", ceilArea,         BASE_PRICES.paint_ceil,  "finish"),
    line("Установка плинтуса",             "м",  perimeter,        BASE_PRICES.plinth,      "finish"),
  ];

  // 4. САНТЕХНИКА
  const plumb: EstimateLine[] = [
    line("Замена труб водоснабжения",      "комплект", 1, BASE_PRICES.trubi,    "plumb"),
    line("Установка унитаза",              "шт", 1, BASE_PRICES.unitaz,         "plumb"),
    line("Установка раковины + смеситель", "шт", 1, BASE_PRICES.rakovina,       "plumb"),
    line("Установка ванны / душ. кабины",  "шт", 1, BASE_PRICES.vanna,          "plumb"),
  ];

  // 5. ЭЛЕКТРИКА
  const sockets = Math.max(6, Math.round(area * 0.7));
  const lights  = Math.max(2, Math.round(area * 0.18));
  const electric: EstimateLine[] = [
    line("Прокладка кабеля + штробление", "м²", area,    BASE_PRICES.el_wiring, "electric"),
    line("Розетки / выключатели",          "шт", sockets, BASE_PRICES.el_socket, "electric"),
    line("Светильники, установка",         "шт", lights,  BASE_PRICES.el_light,  "electric"),
    line("Электрощит, автоматы",           "комплект", 1, BASE_PRICES.el_shield, "electric"),
  ];

  // 6. ДВЕРИ
  const doorsLines: EstimateLine[] = doors > 0
    ? [line("Межкомнатные двери (с установкой)", "шт", doors, BASE_PRICES.door_inner, "doors")]
    : [];

  const fillTotals = (lines: EstimateLine[]) =>
    lines.map((l) => ({ ...l, total: Math.round(l.qty * l.price) }));

  const groups: EstimateGroup[] = [
    { key: "demo",     name: "Демонтажные работы", icon: "Hammer",     lines: fillTotals(demo),       total: 0 },
    { key: "rough",    name: "Черновые работы",    icon: "Trowel",     lines: fillTotals(rough),      total: 0 },
    { key: "finish",   name: "Чистовая отделка",   icon: "Paintbrush", lines: fillTotals(finish),     total: 0 },
    { key: "plumb",    name: "Сантехника",         icon: "Droplets",   lines: fillTotals(plumb),      total: 0 },
    { key: "electric", name: "Электрика",          icon: "Zap",        lines: fillTotals(electric),   total: 0 },
    ...(doorsLines.length ? [{ key: "doors", name: "Двери", icon: "DoorOpen", lines: fillTotals(doorsLines), total: 0 }] : []),
  ].map((g) => ({ ...g, total: g.lines.reduce((s, l) => s + l.total, 0) }));

  const grandTotal = groups.reduce((s, g) => s + g.total, 0);

  // Точное разделение работ/материалов через worksShare каждой строки
  let worksTotal = 0;
  for (const g of groups) {
    for (const l of g.lines) worksTotal += l.total * l.worksShare;
  }
  worksTotal = Math.round(worksTotal);
  const materialsTotal = grandTotal - worksTotal;

  const k = TIER_RATE[tier];

  return {
    tier,
    regionId: region.id,
    regionName: region.name,
    groups,
    worksTotal,
    materialsTotal,
    grandTotal,
    perSqm: Math.round(grandTotal / Math.max(1, area)),
    daysApprox: Math.max(7, Math.round(area * 0.8 * k.days)),
    warranty: k.warranty,
  };
}

export function formatRub(n: number): string {
  return n.toLocaleString("ru-RU") + " ₽";
}