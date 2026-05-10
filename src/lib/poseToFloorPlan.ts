/**
 * Конвертер ответа backend room-pose в формат FloorPlan,
 * который понимает наш Планировщик. Сохраняет 1:1 геометрию,
 * привязывает проёмы к стенам, ставит мебель в координаты пола.
 */
import type {
  FloorPlan,
  FurnitureCategory,
  FurnitureItem,
  Opening,
  Wall,
} from "./floorPlanTypes";
import { genId } from "./floorPlanGeom";

/* Сырые типы из backend room-pose */

export interface PoseRoom {
  width_cm: number;
  depth_cm: number;
  height_cm: number;
  shape: "rect";
}

export interface PoseWall {
  id: string;
  side: "north" | "east" | "south" | "west";
  a: [number, number];
  b: [number, number];
  thickness_cm: number;
}

export interface PoseOpening {
  id: string;
  kind: "door" | "window";
  wall_id: string;
  wall_side: "north" | "east" | "south" | "west";
  t: number;
  center_cm: number;
  width_cm: number;
  sill_cm: number;
  height_cm: number;
}

export interface PoseFurniture {
  id: string;
  type: string;
  label: string;
  x_cm: number;
  y_cm: number;
  width_cm: number;
  depth_cm: number;
  height_cm: number;
  rotation_deg: number;
  against_wall: "north" | "east" | "south" | "west" | null;
  icon: string;
  confidence: number;
}

export interface PoseCamera {
  position_x: number;
  position_y: number;
  looking_wall: "north" | "east" | "south" | "west";
}

export interface PoseResponse {
  room: PoseRoom;
  walls: PoseWall[];
  openings: PoseOpening[];
  furniture: PoseFurniture[];
  camera: PoseCamera;
  room_type: string;
  dominant_style: string;
  source?: "ai" | "fallback";
  fallback?: boolean;
  latency_ms?: number;
  error?: string;
}

/* Маппинг типа из бэка на категорию фронта */
const TYPE_TO_CATEGORY: Record<string, FurnitureCategory> = {
  sofa: "sofa",
  armchair: "sofa",
  bed: "bed",
  table: "table",
  coffee_table: "table",
  desk: "table",
  chair: "chair",
  kitchen: "kitchen",
  sink: "bath",
  toilet: "bath",
  bathtub: "bath",
  wardrobe: "storage",
  shelf: "storage",
  nightstand: "storage",
  tv: "appliance",
  tv_stand: "appliance",
  fireplace: "appliance",
  lamp: "decor",
  plant: "decor",
  rug: "decor",
};

const TYPE_TO_LABEL: Record<string, string> = {
  sofa: "Диван",
  armchair: "Кресло",
  bed: "Кровать",
  table: "Стол",
  coffee_table: "Журнальный стол",
  desk: "Письменный стол",
  chair: "Стул",
  kitchen: "Кухонный гарнитур",
  sink: "Раковина",
  toilet: "Унитаз",
  bathtub: "Ванна",
  wardrobe: "Шкаф",
  shelf: "Стеллаж",
  nightstand: "Тумба",
  tv: "Телевизор",
  tv_stand: "ТВ-тумба",
  fireplace: "Камин",
  lamp: "Лампа",
  plant: "Растение",
  rug: "Ковёр",
};

/**
 * Преобразует ответ pose-детектора в FloorPlan для Планировщика.
 * Координаты приводим: pose-координаты (0..width/depth) → план (отступ 50 см от 0,0).
 */
export function poseToFloorPlan(
  pose: PoseResponse,
  name = "План из фото"
): FloorPlan {
  const margin = 50;
  const W = pose.room.width_cm;
  const D = pose.room.depth_cm;

  const tl = { x: margin, y: margin };
  const tr = { x: margin + W, y: margin };
  const br = { x: margin + W, y: margin + D };
  const bl = { x: margin, y: margin + D };

  const wallNorth: Wall = { id: genId("w"), a: tl, b: tr, thickness: 10 };
  const wallEast: Wall = { id: genId("w"), a: tr, b: br, thickness: 10 };
  const wallSouth: Wall = { id: genId("w"), a: br, b: bl, thickness: 10 };
  const wallWest: Wall = { id: genId("w"), a: bl, b: tl, thickness: 10 };

  const walls: Wall[] = [wallNorth, wallEast, wallSouth, wallWest];

  // Маппим pose-стены на наши id
  const sideToWallId: Record<string, string> = {
    north: wallNorth.id,
    east: wallEast.id,
    south: wallSouth.id,
    west: wallWest.id,
  };

  // Проёмы: t уже посчитан на бэке
  const openings: Opening[] = pose.openings
    .map((op) => {
      const wallId = sideToWallId[op.wall_side];
      if (!wallId) return null;
      return {
        id: genId("op"),
        kind: op.kind,
        wallId,
        t: Math.max(0.05, Math.min(0.95, op.t)),
        width: Math.max(40, op.width_cm),
      } satisfies Opening;
    })
    .filter((x): x is Opening => x !== null);

  // Мебель: x,y из pose уже в системе комнаты (0..W, 0..D),
  // поэтому добавляем margin чтобы попасть в систему плана.
  const furniture: FurnitureItem[] = pose.furniture.map((f) => {
    const category = TYPE_TO_CATEGORY[f.type] ?? "decor";
    const label = TYPE_TO_LABEL[f.type] ?? f.label ?? f.type;
    return {
      id: genId("f"),
      type: label,
      category,
      icon: f.icon || "Square",
      x: margin + Math.round(f.x_cm),
      y: margin + Math.round(f.y_cm),
      w: f.width_cm,
      h: f.depth_cm,
      rotation: f.rotation_deg,
    } satisfies FurnitureItem;
  });

  return {
    version: 1,
    name,
    walls,
    openings,
    furniture,
    updatedAt: Date.now(),
  };
}
