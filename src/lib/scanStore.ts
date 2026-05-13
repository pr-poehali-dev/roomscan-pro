/**
 * Лёгкий store последнего скана через localStorage.
 * Используется для передачи данных между секциями (Scan → Planner) без global state.
 */

export interface DetectedOpening {
  type: "door" | "window";
  wall_idx: number;
  width: number;
  height: number;
  sill: number;
  center: [number, number, number];
}

export interface LastScan {
  width: number;
  length: number;
  height: number;
  area: number;
  doors?: number;
  windows?: number;
  openings?: DetectedOpening[];
  savedAt: number;
}

export interface CartItemRef {
  id: number;
  name: string;
  icon: string;
  w: number;  // см
  d: number;  // см
  priceNum: number;
  category: string;
}

/** Универсальная позиция «Корзины проекта»: мебель, покрытия, услуги. */
export interface ProjectItem {
  id: string;             // уникальный ключ в корзине
  source: "furniture" | "tiles" | "walls" | "openings" | "other";
  title: string;
  subtitle?: string;      // бренд / коллекция / категория
  icon?: string;          // lucide-name или emoji
  unit: "шт" | "м²" | "рулон" | "м" | "комплект";
  qty: number;
  pricePerUnit: number;   // ₽
  addedAt: number;
}

const KEY = "roomscan:lastScan";
const CART_KEY = "roomscan:cart";
const PROJECT_KEY = "roomscan:project";

export function saveLastScan(data: Omit<LastScan, "savedAt">) {
  try {
    const payload: LastScan = { ...data, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event("roomscan:lastScan:changed"));
  } catch {
    // ignore storage errors (quota / private mode)
  }
}

export function getLastScan(): LastScan | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastScan;
  } catch {
    return null;
  }
}

export function clearLastScan() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("roomscan:lastScan:changed"));
  } catch {
    /* ignore */
  }
}

// ─── Cart store ──────────────────────────────────────────────────────────────

export function saveCart(items: CartItemRef[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("roomscan:cart:changed"));
  } catch {
    /* ignore */
  }
}

export function getCart(): CartItemRef[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItemRef[];
  } catch {
    return [];
  }
}

export function clearCart() {
  try {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event("roomscan:cart:changed"));
  } catch {
    /* ignore */
  }
}

// ─── Project basket (универсальная корзина проекта) ──────────────────────────

export function getProjectItems(): ProjectItem[] {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ProjectItem[];
  } catch {
    return [];
  }
}

export function saveProjectItems(items: ProjectItem[]) {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("roomscan:project:changed"));
  } catch {
    /* ignore */
  }
}

export function addProjectItem(item: ProjectItem) {
  const items = getProjectItems();
  // если такой id уже есть — увеличиваем qty
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], qty: items[idx].qty + item.qty };
  } else {
    items.push(item);
  }
  saveProjectItems(items);
}

export function removeProjectItem(id: string) {
  saveProjectItems(getProjectItems().filter((i) => i.id !== id));
}

export function clearProjectItems() {
  try {
    localStorage.removeItem(PROJECT_KEY);
    window.dispatchEvent(new Event("roomscan:project:changed"));
  } catch {
    /* ignore */
  }
}

export function projectTotal(): number {
  return getProjectItems().reduce((s, i) => s + i.qty * i.pricePerUnit, 0);
}

// ─── Геометрия комнаты из последнего скана ───────────────────────────────────

/**
 * Возвращает периметр (м), площадь стен (м²) и площадь стен за вычетом
 * стандартных проёмов (м²) на основании последнего скана.
 * Если скана нет — возвращает null.
 */
export function getWallsGeometry(): {
  perimeter: number;
  wallsArea: number;
  wallsAreaNet: number;
} | null {
  const scan = getLastScan();
  if (!scan) return null;
  const perimeter = 2 * (scan.width + scan.length);
  const wallsArea = perimeter * scan.height;
  // вычитаем стандартные проёмы: дверь 2.0м×0.9м = 1.8м², окно 1.5м×1.4м = 2.1м²
  const doorsArea = (scan.doors ?? 0) * 1.8;
  const windowsArea = (scan.windows ?? 0) * 2.1;
  const wallsAreaNet = Math.max(0, wallsArea - doorsArea - windowsArea);
  return {
    perimeter: Math.round(perimeter * 10) / 10,
    wallsArea: Math.round(wallsArea * 10) / 10,
    wallsAreaNet: Math.round(wallsAreaNet * 10) / 10,
  };
}

// ─── Активное покрытие стен для Планировщика ─────────────────────────────────

/**
 * Покрытие, применённое к стенам в 3D-планировщике.
 * id — ссылка на WallItem из каталога. color — hex для рендера.
 */
/** Полный набор фактур, которые умеет рендерить Планировщик. */
export type CoatingTextureKind =
  | "smooth" | "matte" | "satin" | "glossy"
  | "embossed" | "3d" | "rough" | "graphite"
  | "fabric" | "linen" | "silk" | "velvet" | "leather"
  | "wood" | "stone" | "brick" | "marble" | "concrete"
  | "venetian" | "metallic" | "cork"
  | "geometric" | "stripe" | "floral" | "damask";

export interface ActiveWallCoating {
  id: string;
  title: string;
  brand: string;
  color: string;           // "#RRGGBB"
  texture?: CoatingTextureKind;
}

const WALL_COATING_KEY = "roomscan:wallCoating";

export function getActiveWallCoating(): ActiveWallCoating | null {
  try {
    const raw = localStorage.getItem(WALL_COATING_KEY);
    return raw ? (JSON.parse(raw) as ActiveWallCoating) : null;
  } catch {
    return null;
  }
}

export function setActiveWallCoating(c: ActiveWallCoating | null) {
  try {
    if (c) localStorage.setItem(WALL_COATING_KEY, JSON.stringify(c));
    else localStorage.removeItem(WALL_COATING_KEY);
    window.dispatchEvent(new Event("roomscan:wallCoating:changed"));
  } catch {
    /* ignore */
  }
}