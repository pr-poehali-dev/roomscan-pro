import type { DetectedObject } from "@/lib/visionStore";

/** Ответ backend-функции детектора объектов комнаты. */
export interface DetectionResponse {
  objects: DetectedObject[];
  room_type: string;
  dominant_style: string;
  latency_ms?: number;
  fallback?: boolean;
}

export const ROOM_TYPE_LABELS: Record<string, string> = {
  living: "Гостиная",
  bedroom: "Спальня",
  kitchen: "Кухня",
  bathroom: "Ванная",
  hall: "Прихожая",
  office: "Кабинет",
  child: "Детская",
};

export const STYLE_LABELS: Record<string, string> = {
  scandi: "Скандинавский",
  loft: "Лофт",
  classic: "Классика",
  minimal: "Минимализм",
  modern: "Модерн",
  japandi: "Японди",
  glamour: "Гламур",
  midcentury: "Mid-century",
};

/** Палитра bbox по типу объекта (для визуального различия). */
export const BBOX_COLORS: Record<string, string> = {
  sofa: "#22c55e",
  armchair: "#10b981",
  table: "#f59e0b",
  chair: "#eab308",
  bed: "#8b5cf6",
  wardrobe: "#a855f7",
  tv: "#3b82f6",
  lamp: "#f97316",
  plant: "#16a34a",
  rug: "#ec4899",
  shelf: "#06b6d4",
  kitchen: "#ef4444",
  door: "#64748b",
  window: "#0ea5e9",
  fireplace: "#dc2626",
  sink: "#0284c7",
  toilet: "#475569",
  bathtub: "#14b8a6",
};

export const BBOX_FALLBACK = "#64748b";
