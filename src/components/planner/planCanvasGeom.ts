import { type FloorPlan, type FurnitureItem, type Wall, dist } from "@/lib/floorPlan";

/**
 * Чистые геометрические утилиты для PlanCanvas.
 * Логика 1:1 перенесена из PlanCanvas.tsx без изменений.
 */

export const GRID_CM = 10;     // мелкая сетка
export const GRID_BIG = 100;   // крупная сетка (1 м)

export type Pt = { x: number; y: number };

export interface DrawingWall {
  a: Pt;
  b: Pt;
}

/** Поиск мебели под точкой мира (AABB, без учёта поворота — достаточно для UX). */
export function findFurnAt(plan: FloorPlan, worldX: number, worldY: number): FurnitureItem | null {
  // Сверху вниз — последний размещённый имеет приоритет
  for (let i = plan.furniture.length - 1; i >= 0; i--) {
    const f = plan.furniture[i];
    if (worldX >= f.x && worldX <= f.x + f.w && worldY >= f.y && worldY <= f.y + f.h) return f;
  }
  return null;
}

/** Найти ближайшую точку на стене и параметр t (0..1). */
export function projectToWall(wall: Wall, p: Pt) {
  const dx = wall.b.x - wall.a.x;
  const dy = wall.b.y - wall.a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { t: 0, dist: dist(wall.a, p), point: { ...wall.a } };
  let t = ((p.x - wall.a.x) * dx + (p.y - wall.a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = { x: wall.a.x + dx * t, y: wall.a.y + dy * t };
  return { t, dist: dist(point, p), point };
}

export function findClosestWall(plan: FloorPlan, p: Pt, maxDist = 30): { wall: Wall; t: number } | null {
  let best: { wall: Wall; t: number; d: number } | null = null;
  for (const w of plan.walls) {
    const pr = projectToWall(w, p);
    if (pr.dist < maxDist && (!best || pr.dist < best.d)) {
      best = { wall: w, t: pr.t, d: pr.dist };
    }
  }
  return best ? { wall: best.wall, t: best.t } : null;
}
