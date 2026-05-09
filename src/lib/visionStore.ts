/**
 * Лёгкий store детекций room-vision (через localStorage).
 * Используется для передачи распознанных объектов из RoomVisionDetector
 * в Планировщик (FloorPlanEditor) — пользователь нажимает «Импорт в план»
 * → объекты появляются в редакторе с реальными размерами и позициями.
 */

export interface DetectedObject {
  type: string;
  label: string;
  /** Нормализованный bbox: [x, y, w, h] в долях 0..1 */
  bbox: [number, number, number, number];
  confidence: number;
  icon: string;
  default_w_cm: number;
  default_d_cm: number;
  default_h_cm: number;
}

export interface VisionDetection {
  objects: DetectedObject[];
  room_type: string;
  dominant_style: string;
  /** Превью комнаты (data URL или public URL) */
  imagePreview?: string;
  /** Когда сохранили (epoch ms) */
  savedAt: number;
}

const KEY = "roomscan:vision:v1";

export function saveDetection(d: Omit<VisionDetection, "savedAt">) {
  try {
    const payload: VisionDetection = { ...d, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event("roomscan:vision:changed"));
  } catch {
    /* noop */
  }
}

export function getDetection(): VisionDetection | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VisionDetection) : null;
  } catch {
    return null;
  }
}

export function clearDetection() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("roomscan:vision:changed"));
  } catch {
    /* noop */
  }
}
