/**
 * Типы данных планировщика квартир.
 * Извлечены из floorPlan.ts без изменений (1:1).
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

export interface CatalogItem {
  type: string;
  category: FurnitureCategory;
  icon: string;
  /** Габариты по умолчанию, см */
  w: number;
  h: number;
  color?: string;
}
