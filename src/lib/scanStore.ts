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

const KEY = "roomscan:lastScan";

export function saveLastScan(data: Omit<LastScan, "savedAt">) {
  try {
    const payload: LastScan = { ...data, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
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
  } catch {
    /* ignore */
  }
}
