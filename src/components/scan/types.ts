/**
 * Общие типы для раздела «Сканирование».
 */

export type Method = "choose" | "webxr" | "photo" | "vision" | "pose";

export interface Measurement {
  width: number;
  depth?: number;
  length?: number;
  height: number;
  area: number;
  method?: string;
  accuracy_estimate?: string;
  frames_used?: number;
  confidence?: string;
}
