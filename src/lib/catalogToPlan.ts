/**
 * Мост между каталогом мебели и 3D-планировщиком.
 * Позволяет одной функцией добавить любой SKU из FURNITURE_CATALOG
 * прямо в floorPlan.furniture с правильной категорией для 3D-рендеринга.
 */
import type { FurnitureItem as CatalogFurniture, Category } from "./furnitureCatalog";
import { loadFloorPlan, saveFloorPlan, emptyPlan } from "./floorPlanStorage";
import type {
  FloorPlan,
  FurnitureItem as PlanFurniture,
  FurnitureCategory,
} from "./floorPlanTypes";
import { genId } from "./floorPlanGeom";

/**
 * Маппинг категорий каталога → категорий планировщика.
 * Это критично: 3D-рендер выбирает геометрию по category из FloorPlan.
 */
const CATEGORY_MAP: Record<Category, FurnitureCategory> = {
  Диваны: "sofa",
  Столы: "table",
  Кресла: "chair",
  Шкафы: "storage",
  Кровати: "bed",
  "ТВ-зоны": "storage",
  Освещение: "decor",
  Декор: "decor",
  Текстиль: "decor",
  Растения: "decor",
  Кухня: "kitchen",
  Ванная: "bath",
};

/** Категории, которые планировщик считает "техникой" — даём им белый цвет. */
const APPLIANCE_BRANDS = new Set(["Bosch", "Samsung", "Roca"]);

/**
 * Получает текущий план из localStorage или создаёт пустую прямоугольную комнату 4×3 м.
 * Если плана не было — создаём базовую комнату, иначе пользователь не увидит мебель в 3D.
 */
export function ensureFloorPlan(): FloorPlan {
  const existing = loadFloorPlan();
  if (existing && existing.walls.length > 0) return existing;
  // Создаём дефолтную комнату 400×300 см, если её ещё нет
  const margin = 50;
  const w = 400;
  const h = 300;
  const tl = { x: margin, y: margin };
  const tr = { x: margin + w, y: margin };
  const br = { x: margin + w, y: margin + h };
  const bl = { x: margin, y: margin + h };
  const t = 10;
  return {
    version: 1,
    name: existing?.name ?? "Моя комната",
    walls: [
      { id: genId("w"), a: tl, b: tr, thickness: t },
      { id: genId("w"), a: tr, b: br, thickness: t },
      { id: genId("w"), a: br, b: bl, thickness: t },
      { id: genId("w"), a: bl, b: tl, thickness: t },
    ],
    openings: existing?.openings ?? [],
    furniture: existing?.furniture ?? [],
    updatedAt: Date.now(),
  };
}

/**
 * Подбирает свободное место в комнате для новой мебели по сетке 50см.
 * Не идеально, но избегает наложений в типичных случаях.
 */
function findFreeSpot(plan: FloorPlan, w: number, h: number): { x: number; y: number } {
  // Bounding box комнаты
  const xs = plan.walls.flatMap((wall) => [wall.a.x, wall.b.x]);
  const ys = plan.walls.flatMap((wall) => [wall.a.y, wall.b.y]);
  const minX = xs.length ? Math.min(...xs) + 30 : 60;
  const minY = ys.length ? Math.min(...ys) + 30 : 60;
  const maxX = xs.length ? Math.max(...xs) - 30 - w : minX + 200;
  const maxY = ys.length ? Math.max(...ys) - 30 - h : minY + 200;

  const STEP = 50;
  for (let y = minY; y <= maxY; y += STEP) {
    for (let x = minX; x <= maxX; x += STEP) {
      const overlap = plan.furniture.some(
        (f) =>
          x < f.x + f.w &&
          x + w > f.x &&
          y < f.y + f.h &&
          y + h > f.y,
      );
      if (!overlap) return { x, y };
    }
  }
  // Если не нашли — кладём в случайном месте около центра
  return {
    x: minX + Math.floor(Math.random() * 100),
    y: minY + Math.floor(Math.random() * 100),
  };
}

/**
 * Добавляет SKU из каталога в 3D-планировщик.
 * Сохраняет в localStorage, диспатчит событие — планировщик подхватит автоматически.
 *
 * @returns id созданного объекта в плане
 */
export function addCatalogItemToFloorPlan(item: CatalogFurniture): string {
  const plan = ensureFloorPlan();
  const category = CATEGORY_MAP[item.category];
  const w = Math.max(20, Math.round(item.w));
  const h = Math.max(20, Math.round(item.d));
  const { x, y } = findFreeSpot(plan, w, h);

  const isAppliance = APPLIANCE_BRANDS.has(item.brand);
  const color = item.colorPalette?.[0] ?? (isAppliance ? "#cbd5e1" : undefined);

  const newItem: PlanFurniture = {
    id: genId("f"),
    type: item.name,
    category: isAppliance && item.category === "Кухня" ? "appliance" : category,
    icon: item.icon,
    x,
    y,
    w,
    h,
    rotation: 0,
    color,
  };

  const next: FloorPlan = {
    ...plan,
    furniture: [...plan.furniture, newItem],
    updatedAt: Date.now(),
  };
  saveFloorPlan(next);
  return newItem.id;
}
