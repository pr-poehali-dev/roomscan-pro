import type { CatalogItem } from "./floorPlanTypes";

/**
 * Каталог мебели по умолчанию для планировщика.
 * Извлечён из floorPlan.ts без изменений (1:1).
 */
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
