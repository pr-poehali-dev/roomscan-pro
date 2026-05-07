import type { FloorPlan, Vec2, Wall } from "./floorPlanTypes";
import { dist, genId } from "./floorPlanGeom";

/**
 * Хранилище плана в localStorage, фабрики и метрики.
 * Извлечены из floorPlan.ts без изменений (1:1).
 */

const STORAGE_KEY = "roomscan:floorPlan";

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
