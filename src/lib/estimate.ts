/**
 * Полная библиотека расчёта сметы ремонта.
 * 3 уровня (Эконом / Стандарт / Премиум) × 4 категории работ.
 *
 * Источник цен: усреднённые рыночные ставки 2025 г. (Москва/МО),
 * аналог методики avangard-ai.ru (косметический / капитальный / евроремонт).
 */

export type Tier = "econom" | "standart" | "premium";

export interface RoomInput {
  area: number;       // м²
  perimeter: number;  // м
  height: number;     // м
  doors: number;      // шт
  windows: number;    // шт
}

export interface EstimateLine {
  name: string;
  unit: "м²" | "м" | "шт" | "комплект";
  qty: number;
  price: number;       // ₽ за единицу
  total: number;       // ₽
  category: "demo" | "rough" | "finish" | "plumb" | "electric" | "doors";
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
const TIER_RATE: Record<Tier, { works: number; materials: number; days: number; warranty: string; label: string; desc: string }> = {
  econom:   { works: 0.75, materials: 0.65, days: 0.85, warranty: "1 год",   label: "Эконом",    desc: "Косметический ремонт. Замена покрытий без демонтажа стен." },
  standart: { works: 1.00, materials: 1.00, days: 1.00, warranty: "3 года",  label: "Стандарт",  desc: "Капитальный ремонт. Выравнивание стен, замена сантехники, электрики." },
  premium:  { works: 1.55, materials: 2.10, days: 1.30, warranty: "5 лет",   label: "Премиум",   desc: "Евроремонт. Дизайн-проект, премиум-материалы, авторский надзор." },
};

export const TIERS: Tier[] = ["econom", "standart", "premium"];
export const TIER_META = TIER_RATE;

// ─── Расчёт сметы ───────────────────────────────────────────────────────────
export function calcEstimate(room: RoomInput, tier: Tier): EstimateResult {
  const { area, perimeter, height, doors, windows } = room;
  const wallArea = Math.max(0, perimeter * height - doors * 2.1 * 0.9 - windows * 1.4 * 1.1);
  const ceilArea = area;
  const floorArea = area * 0.98;

  const k = TIER_RATE[tier];
  const w = k.works;
  const m = k.materials;

  // 1. ДЕМОНТАЖ
  const demo: EstimateLine[] = [
    { name: "Демонтаж старых покрытий пола", unit: "м²", qty: floorArea, price: Math.round(180 * w), total: 0, category: "demo" },
    { name: "Снятие обоев / штукатурки",      unit: "м²", qty: wallArea,  price: Math.round(120 * w), total: 0, category: "demo" },
    { name: "Демонтаж плинтуса",              unit: "м",  qty: perimeter, price: Math.round(60 * w),  total: 0, category: "demo" },
    { name: "Вынос мусора, уборка",           unit: "м²", qty: area,      price: Math.round(150 * w), total: 0, category: "demo" },
  ];

  // 2. ЧЕРНОВЫЕ РАБОТЫ
  const rough: EstimateLine[] = [
    { name: "Стяжка пола",                    unit: "м²", qty: floorArea, price: Math.round((450 + 280 * m) * 1), total: 0, category: "rough" },
    { name: "Штукатурка стен по маякам",      unit: "м²", qty: wallArea,  price: Math.round((520 + 220 * m) * 1), total: 0, category: "rough" },
    { name: "Шпаклёвка стен (2 слоя)",        unit: "м²", qty: wallArea,  price: Math.round((280 + 120 * m) * 1), total: 0, category: "rough" },
    { name: "Шпаклёвка потолка",              unit: "м²", qty: ceilArea,  price: Math.round((320 + 110 * m) * 1), total: 0, category: "rough" },
    { name: "Грунтовка поверхностей",         unit: "м²", qty: wallArea + ceilArea, price: Math.round((90 + 40 * m) * 1), total: 0, category: "rough" },
  ];

  // 3. ЧИСТОВЫЕ РАБОТЫ + МАТЕРИАЛЫ
  const finishLamPrice = Math.round((420 + 800 * m) * 1);   // работа + материал
  const finishWallPrice = Math.round((350 + 480 * m) * 1);
  const finishCeilPrice = Math.round((280 + 180 * m) * 1);
  const finishPlinthPrice = Math.round((180 + 240 * m) * 1);
  const finish: EstimateLine[] = [
    { name: "Укладка ламината/паркета",       unit: "м²", qty: floorArea * 1.08, price: finishLamPrice, total: 0, category: "finish" },
    { name: "Поклейка обоев / покраска стен", unit: "м²", qty: wallArea * 1.10,  price: finishWallPrice, total: 0, category: "finish" },
    { name: "Покраска потолка",               unit: "м²", qty: ceilArea,         price: finishCeilPrice, total: 0, category: "finish" },
    { name: "Установка плинтуса",             unit: "м",  qty: perimeter,        price: finishPlinthPrice, total: 0, category: "finish" },
  ];

  // 4. САНТЕХНИКА (по комплектам — упрощённо)
  const plumb: EstimateLine[] = [
    { name: "Замена труб водоснабжения",      unit: "комплект", qty: 1, price: Math.round((18000 + 12000 * m) * w), total: 0, category: "plumb" },
    { name: "Установка унитаза",              unit: "шт", qty: 1, price: Math.round((4500 + 8500 * m) * w), total: 0, category: "plumb" },
    { name: "Установка раковины + смеситель", unit: "шт", qty: 1, price: Math.round((3800 + 6200 * m) * w), total: 0, category: "plumb" },
    { name: "Установка ванны/душ. кабины",    unit: "шт", qty: 1, price: Math.round((9500 + 18000 * m) * w), total: 0, category: "plumb" },
  ];

  // 5. ЭЛЕКТРИКА
  const elecRate = Math.round((620 + 180 * m) * 1); // ₽/м²
  const sockets = Math.max(6, Math.round(area * 0.7));
  const lights = Math.max(2, Math.round(area * 0.18));
  const electric: EstimateLine[] = [
    { name: "Прокладка кабеля + штробление",  unit: "м²", qty: area, price: elecRate, total: 0, category: "electric" },
    { name: "Розетки / выключатели",          unit: "шт", qty: sockets, price: Math.round((480 + 220 * m) * w), total: 0, category: "electric" },
    { name: "Светильники, установка",         unit: "шт", qty: lights,  price: Math.round((1200 + 600 * m) * w), total: 0, category: "electric" },
    { name: "Электрощит, автоматы",           unit: "комплект", qty: 1, price: Math.round((8500 + 6500 * m) * w), total: 0, category: "electric" },
  ];

  // 6. ДВЕРИ
  const doorsLines: EstimateLine[] = doors > 0 ? [
    { name: "Межкомнатные двери (с установкой)", unit: "шт", qty: doors, price: Math.round((9500 + 14000 * m) * w), total: 0, category: "doors" },
  ] : [];

  // считаем total для каждой линии
  const fillTotals = (lines: EstimateLine[]) => lines.map((l) => ({ ...l, total: Math.round(l.qty * l.price) }));

  const groups: EstimateGroup[] = [
    { key: "demo",    name: "Демонтажные работы", icon: "Hammer",   lines: fillTotals(demo),    total: 0 },
    { key: "rough",   name: "Черновые работы",    icon: "Trowel",   lines: fillTotals(rough),   total: 0 },
    { key: "finish",  name: "Чистовая отделка",   icon: "Paintbrush", lines: fillTotals(finish), total: 0 },
    { key: "plumb",   name: "Сантехника",         icon: "Droplets", lines: fillTotals(plumb),   total: 0 },
    { key: "electric",name: "Электрика",          icon: "Zap",      lines: fillTotals(electric),total: 0 },
    ...(doorsLines.length ? [{ key: "doors", name: "Двери", icon: "DoorOpen", lines: fillTotals(doorsLines), total: 0 }] : []),
  ].map((g) => ({ ...g, total: g.lines.reduce((s, l) => s + l.total, 0) }));

  const grandTotal = groups.reduce((s, g) => s + g.total, 0);
  // Грубо: работы ≈ 45%, материалы ≈ 55% от итога
  const worksTotal = Math.round(grandTotal * 0.45);
  const materialsTotal = grandTotal - worksTotal;

  return {
    tier,
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
