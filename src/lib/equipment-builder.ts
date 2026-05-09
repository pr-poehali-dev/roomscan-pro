/**
 * Логика drag-and-drop конструктора инженерных узлов:
 * - размещение оборудования на 2D-плане тех.помещения
 * - проверка совместимости и перекрытий
 * - расчёт суммарной мощности и стоимости
 */

import { EquipmentItem, EQUIPMENT, formatRub } from "./engineering";

/** Положение оборудования на плане (метры) */
export interface BuilderPlacement {
  /** Уникальный ID этой инстанции (для drag-and-drop) */
  uid: string;
  /** ID оборудования из каталога */
  equipmentId: string;
  /** Положение на плане [x, z], м (от левого верхнего угла) */
  position: [number, number];
  /** Поворот вокруг вертикальной оси: 0 / 90 / 180 / 270 ° */
  rotation: 0 | 90 | 180 | 270;
}

/** Параметры тех.помещения */
export interface RoomDimensions {
  /** Длина (X), м */
  width: number;
  /** Глубина (Z), м */
  depth: number;
  /** Высота (Y), м */
  height: number;
  /** Расположение двери (опционально) */
  door?: { side: "north" | "south" | "east" | "west"; position: number; width: number };
  /** Расположение окна */
  window?: { side: "north" | "south" | "east" | "west"; position: number; width: number };
}

/** Готовая компоновка для сохранения / экспорта */
export interface BuilderComposition {
  id: string;
  name: string;
  room: RoomDimensions;
  placements: BuilderPlacement[];
  /** Дата изменения (timestamp) */
  updatedAt: number;
}

/** Сводка по компоновке */
export interface CompositionSummary {
  totalPrice: number;
  totalArea: number;
  itemsCount: number;
  totalPower: number;
  /** Площадь, занятая оборудованием на плане */
  occupiedArea: number;
  /** % заполнения помещения */
  fillPercent: number;
  /** Есть ли проблемы (перекрытия / выход за границы) */
  hasIssues: boolean;
  /** Список найденных проблем */
  issues: string[];
}

/* ────────────────── ХЕЛПЕРЫ ────────────────── */

let _uidCounter = 0;
export function nextUid(): string {
  _uidCounter += 1;
  return `p${Date.now().toString(36)}${_uidCounter}`;
}

/** Габариты оборудования с учётом поворота: [width, depth] на плане */
export function footprint(item: EquipmentItem, rotation: number): [number, number] {
  const [w, , d] = item.size;
  return rotation % 180 === 0 ? [w, d] : [d, w];
}

/** Проверяет, помещается ли блок в комнату */
export function isInsideRoom(
  pos: [number, number],
  size: [number, number],
  room: RoomDimensions,
): boolean {
  const margin = 0.05;
  return (
    pos[0] >= -margin &&
    pos[1] >= -margin &&
    pos[0] + size[0] <= room.width + margin &&
    pos[1] + size[1] <= room.depth + margin
  );
}

/** AABB-проверка пересечения двух прямоугольников */
export function rectsOverlap(
  a: { x: number; z: number; w: number; d: number },
  b: { x: number; z: number; w: number; d: number },
): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.z + a.d <= b.z || b.z + b.d <= a.z);
}

/** Считает сводку по композиции */
export function summarize(composition: BuilderComposition): CompositionSummary {
  let totalPrice = 0;
  let totalPower = 0;
  let occupiedArea = 0;
  const issues: string[] = [];

  const rects = composition.placements.map((p) => {
    const item = EQUIPMENT.find((e) => e.id === p.equipmentId)!;
    const [w, d] = footprint(item, p.rotation);
    return { uid: p.uid, item, x: p.position[0], z: p.position[1], w, d };
  });

  for (const r of rects) {
    totalPrice += r.item.price;
    if (r.item.category === "boiler" && r.item.power) totalPower += r.item.power;
    occupiedArea += r.w * r.d;

    if (
      !isInsideRoom(
        [r.x, r.z],
        [r.w, r.d],
        composition.room,
      )
    ) {
      issues.push(`«${r.item.name}» выходит за границы помещения`);
    }
  }

  // Перекрытия
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (rectsOverlap(rects[i], rects[j])) {
        issues.push(`«${rects[i].item.name}» пересекается с «${rects[j].item.name}»`);
      }
    }
  }

  // Обязательные элементы (не блокирующие, информационные)
  const categories = new Set(rects.map((r) => r.item.category));
  if (categories.has("boiler") && !categories.has("safety_group")) {
    issues.push("Рекомендуется добавить группу безопасности к котлу");
  }
  if (categories.has("boiler") && !categories.has("expansion_tank")) {
    issues.push("Рекомендуется добавить расширительный бак");
  }
  if (categories.has("gas_tank") && !categories.has("gas_detector")) {
    issues.push("Для газгольдера обязателен сигнализатор загазованности");
  }

  const totalArea = composition.room.width * composition.room.depth;
  return {
    totalPrice,
    totalArea,
    itemsCount: composition.placements.length,
    totalPower,
    occupiedArea,
    fillPercent: totalArea > 0 ? Math.round((occupiedArea / totalArea) * 100) : 0,
    hasIssues: issues.length > 0,
    issues,
  };
}

/** Найти свободное место для нового блока методом «змейки» */
export function findFreeSpot(
  composition: BuilderComposition,
  itemSize: [number, number],
): [number, number] {
  const step = 0.2;
  const rects = composition.placements.map((p) => {
    const item = EQUIPMENT.find((e) => e.id === p.equipmentId)!;
    const [w, d] = footprint(item, p.rotation);
    return { x: p.position[0], z: p.position[1], w, d };
  });

  for (let z = 0.2; z + itemSize[1] <= composition.room.depth - 0.2; z += step) {
    for (let x = 0.2; x + itemSize[0] <= composition.room.width - 0.2; x += step) {
      const candidate = { x, z, w: itemSize[0], d: itemSize[1] };
      let overlaps = false;
      for (const r of rects) {
        if (rectsOverlap(candidate, r)) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) return [x, z];
    }
  }
  return [0.2, 0.2];
}

export const DEFAULT_ROOM: RoomDimensions = {
  width: 4.0,
  depth: 3.0,
  height: 2.7,
};

export function emptyComposition(name = "Моя котельная"): BuilderComposition {
  return {
    id: `comp-${Date.now().toString(36)}`,
    name,
    room: { ...DEFAULT_ROOM },
    placements: [],
    updatedAt: Date.now(),
  };
}

/** Возвращает текстовый формат суммы с символом валюты */
export function formatPrice(n: number): string {
  return formatRub(n);
}
