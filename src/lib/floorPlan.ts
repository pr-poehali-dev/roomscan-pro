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
 *
 * Этот файл — фасад. Реализация разделена на 4 модуля:
 *   - floorPlanTypes.ts   — типы данных
 *   - floorPlanGeom.ts    — геометрические утилиты
 *   - floorPlanStorage.ts — хранилище, фабрики, метрики
 *   - floorPlanCatalog.ts — каталог мебели по умолчанию
 */

export type {
  Vec2,
  Wall,
  Opening,
  OpeningKind,
  FurnitureCategory,
  FurnitureItem,
  FloorPlan,
  CatalogItem,
} from "./floorPlanTypes";

export {
  genId,
  dist,
  pointOnWall,
  wallAngleDeg,
  snap,
  snapPoint,
} from "./floorPlanGeom";

export {
  loadFloorPlan,
  saveFloorPlan,
  emptyPlan,
  rectRoomPlan,
  planAreaM2,
  planPerimeterM,
} from "./floorPlanStorage";

export { FURNITURE_CATALOG } from "./floorPlanCatalog";
