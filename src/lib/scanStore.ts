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

const KEY = "roomscan:lastScan";
const CART_KEY = "roomscan:cart";

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