import type { Vec2, Wall } from "./floorPlanTypes";

/**
 * Утилиты id и геометрии для планировщика.
 * Извлечены из floorPlan.ts без изменений (1:1).
 */

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
