/**
 * Ядро профессионального планировщика квартир (аналог Remplanner / Planner5D / Floorplanner).
 *
 * Все размеры храним в САНТИМЕТРАХ — это удобно для строительных задач.
 * При отрисовке масштабируем в пиксели через scale (см → пиксель).
 *
 * Модель плана:
 *   - walls: набор стен (отрезки между двумя точками)
 *   - openings: дверные / оконные проёмы, привязанные к конкретной стене
 *   - furniture: размещённая мебель/сантехника с координатами и поворотом
 *
 * Хранилище — localStorage (ключ "roomscan:floorPlan").
 */

export type Vec2 = { x: number; y: number };

export interface Wall {
  id: string;
  /** Начало стены, см */
  a: Vec2;
  /** Конец стены, см */
  b: Vec2;
  /** Толщина стены, см (несущая 30, перегородка 10) */
  thickness: number;
}

export type OpeningKind = "door" | "window";

export interface Opening {
  id: string;
  kind: OpeningKind;
  /** К какой стене привязан проём */
  wallId: string;
  /** Положение проёма вдоль стены (0..1, доля длины от a→b) */
  t: number;
  /** Ширина проёма, см */
  width: number;
}

/** Категории мебели — используем в каталоге и фильтрах. */
export type FurnitureCategory =
  | "sofa"
  | "bed"
  | "table"
  | "chair"
  | "kitchen"
  | "bath"
  | "storage"
  | "appliance"
  | "decor";

export interface FurnitureItem {
  id: string;
  /** Тип/название (например, "Двуспальная кровать") */
  type: string;
  category: FurnitureCategory;
  /** Иконка Lucide для отображения */
  icon: string;
  /** Левый верхний угол bounding box в плане, см */
  x: number;
  y: number;
  /** Размеры (без поворота), см */
  w: number;
  h: number;
  /** Поворот по часовой стрелке, градусы (0/90/180/270 в основном) */
  rotation: number;
  /** Цвет акцентной заливки */
  color?: string;
}

export interface FloorPlan {
  /** Версия для совместимости при будущих изменениях */
  version: 1;
  /** Имя плана (показывается в шапке) */
  name: string;
  walls: Wall[];
  openings: Opening[];
  furniture: FurnitureItem[];
  /** Когда последний раз обновлялся, timestamp ms */
  updatedAt: number;
}

const STORAGE_KEY = "roomscan:floorPlan";

/* ---------- утилиты id и геометрии ---------- */

export function genId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function dist(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

/** Точка на стене по параметру t (0..1) */
export function pointOnWall(wall: Wall, t: number): Vec2 {
  return {
    x: wall.a.x + (wall.b.x - wall.a.x) * t,
    y: wall.a.y + (wall.b.y - wall.a.y) * t,
  };
}

/** Угол стены в градусах (для поворота проёма при отрисовке) */
export function wallAngleDeg(wall: Wall): number {
  return (Math.atan2(wall.b.y - wall.a.y, wall.b.x - wall.a.x) * 180) / Math.PI;
}

/**
 * Привязка к сетке (см). Используем при рисовании стен.
 */
export function snap(value: number, grid = 10): number {
  return Math.round(value / grid) * grid;
}
export function snapPoint(p: Vec2, grid = 10): Vec2 {
  return { x: snap(p.x, grid), y: snap(p.y, grid) };
}

/* ---------- хранилище ---------- */

export function loadFloorPlan(): FloorPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as FloorPlan;
    if (data?.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveFloorPlan(plan: FloorPlan): void {
  if (typeof window === "undefined") return;
  const next: FloorPlan = { ...plan, updatedAt: Date.now() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("roomscan:floorPlan:changed"));
}

export function emptyPlan(name = "Мой план"): FloorPlan {
  return {
    version: 1,
    name,
    walls: [],
    openings: [],
    furniture: [],
    updatedAt: Date.now(),
  };
}

/**
 * Создаёт прямоугольную комнату из 4 стен по размерам в см.
 * Удобно для быстрого старта (или подставить из последнего скана).
 */
export function rectRoomPlan(widthCm: number, lengthCm: number, name = "Моя комната"): FloorPlan {
  const margin = 50; // отступ от 0,0
  const w = Math.max(100, Math.round(widthCm));
  const h = Math.max(100, Math.round(lengthCm));

  const tl = { x: margin, y: margin };
  const tr = { x: margin + w, y: margin };
  const br = { x: margin + w, y: margin + h };
  const bl = { x: margin, y: margin + h };

  const t = 10;
  const walls: Wall[] = [
    { id: genId("w"), a: tl, b: tr, thickness: t },
    { id: genId("w"), a: tr, b: br, thickness: t },
    { id: genId("w"), a: br, b: bl, thickness: t },
    { id: genId("w"), a: bl, b: tl, thickness: t },
  ];

  return {
    version: 1,
    name,
    walls,
    openings: [],
    furniture: [],
    updatedAt: Date.now(),
  };
}

/* ---------- метрики плана ---------- */

/** Площадь, м² (по периметру стен с использованием формулы Гаусса) */
export function planAreaM2(plan: FloorPlan): number {
  // Берём уникальные точки стен в порядке обхода
  if (plan.walls.length < 3) return 0;
  // Восстанавливаем полигон, идя по концам стен (предполагаем замкнутый контур)
  const pts: Vec2[] = [];
  let current = plan.walls[0].a;
  pts.push(current);
  const used = new Set<string>();
  used.add(plan.walls[0].id);
  current = plan.walls[0].b;
  pts.push(current);

  while (used.size < plan.walls.length) {
    const next = plan.walls.find(
      (w) =>
        !used.has(w.id) &&
        (Math.abs(w.a.x - current.x) < 1 && Math.abs(w.a.y - current.y) < 1),
    );
    if (!next) break;
    used.add(next.id);
    current = next.b;
    pts.push(current);
  }

  // Формула Гаусса
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    s += p1.x * p2.y - p2.x * p1.y;
  }
  // см² → м²
  return Math.abs(s) / 2 / 10000;
}

/** Сумма длин стен, м (периметр) */
export function planPerimeterM(plan: FloorPlan): number {
  let total = 0;
  for (const w of plan.walls) total += dist(w.a, w.b);
  return total / 100;
}

/* ---------- каталог мебели по умолчанию ---------- */

export interface CatalogItem {
  type: string;
  category: FurnitureCategory;
  icon: string;
  /** Габариты по умолчанию, см */
  w: number;
  h: number;
  color?: string;
}

export const FURNITURE_CATALOG: CatalogItem[] = [
  // Гостиная
  { type: "Диван 3-местный", category: "sofa", icon: "Sofa", w: 220, h: 95, color: "#94a3b8" },
  { type: "Диван 2-местный", category: "sofa", icon: "Sofa", w: 160, h: 90, color: "#94a3b8" },
  { type: "Кресло",          category: "sofa", icon: "Armchair", w: 90, h: 90, color: "#a8a29e" },
  { type: "Журнальный стол", category: "table", icon: "Square", w: 100, h: 60, color: "#d6d3d1" },
  { type: "ТВ-тумба",        category: "storage", icon: "Tv", w: 160, h: 45, color: "#78716c" },

  // Спальня
  { type: "Кровать 2-сп.",   category: "bed", icon: "BedDouble", w: 200, h: 180, color: "#fde68a" },
  { type: "Кровать 1-сп.",   category: "bed", icon: "BedSingle", w: 200, h: 90, color: "#fde68a" },
  { type: "Шкаф купе",       category: "storage", icon: "Archive", w: 200, h: 60, color: "#a78bfa" },
  { type: "Тумбочка",        category: "storage", icon: "Box", w: 50, h: 40, color: "#c4b5fd" },

  // Кухня
  { type: "Кух. гарнитур",   category: "kitchen", icon: "ChefHat", w: 240, h: 60, color: "#fcd34d" },
  { type: "Холодильник",     category: "appliance", icon: "Refrigerator", w: 60, h: 65, color: "#cbd5e1" },
  { type: "Плита",           category: "kitchen", icon: "Flame", w: 60, h: 60, color: "#f87171" },
  { type: "Обеденный стол",  category: "table", icon: "Circle", w: 120, h: 80, color: "#d6d3d1" },
  { type: "Стул",            category: "chair", icon: "Armchair", w: 45, h: 45, color: "#a8a29e" },

  // Ванная
  { type: "Ванна",           category: "bath", icon: "Bath", w: 170, h: 75, color: "#bae6fd" },
  { type: "Душевая кабина",  category: "bath", icon: "ShowerHead", w: 90, h: 90, color: "#bae6fd" },
  { type: "Унитаз",          category: "bath", icon: "Toilet", w: 40, h: 65, color: "#e2e8f0" },
  { type: "Раковина",        category: "bath", icon: "Droplets", w: 60, h: 45, color: "#e2e8f0" },
  { type: "Стиральная маш.", category: "appliance", icon: "WashingMachine", w: 60, h: 60, color: "#cbd5e1" },

  // Декор
  { type: "Растение",        category: "decor", icon: "Leaf", w: 40, h: 40, color: "#86efac" },
  { type: "Ковёр",           category: "decor", icon: "Square", w: 200, h: 140, color: "#fca5a5" },
];
