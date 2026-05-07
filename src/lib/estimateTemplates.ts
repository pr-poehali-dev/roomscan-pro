/**
 * Шаблоны квартир для калькулятора сметы.
 * Применение шаблона задаёт типовые параметры комнаты и рекомендуемый тариф.
 */

import type { Tier, RoomInput } from "./estimate";

export type TemplateId = "new_studio" | "new_1k" | "new_2k" | "second_1k" | "second_2k" | "second_3k";

export interface EstimateTemplate {
  id: TemplateId;
  /** Тип квартиры: новостройка / вторичка */
  kind: "new" | "second";
  /** Название */
  name: string;
  /** Краткое описание */
  desc: string;
  /** Иконка Lucide */
  icon: string;
  /** Параметры комнаты по умолчанию */
  room: RoomInput;
  /** Рекомендуемый тариф */
  recommendedTier: Tier;
  /** Заметка-пояснение, что особенного в этом типе квартиры */
  note: string;
}

/**
 * Особенности нового жилья:
 *   - чаще нужна полноценная отделка с нуля (предчистовая)
 *   - стены ровные, нет старой плитки/обоев → меньше демонтажа
 *   - современная электрика, развязка под счётчик уже есть
 *   - больше площадь, выше потолки (2.7–3.0 м)
 *
 * Особенности вторички:
 *   - обязателен демонтаж старых покрытий
 *   - часто нужна замена труб и проводки
 *   - неровные стены — больше штукатурки
 *   - стандартная высота 2.5–2.7 м
 */
export const ESTIMATE_TEMPLATES: EstimateTemplate[] = [
  // ─────────── НОВОСТРОЙКА ───────────
  {
    id: "new_studio",
    kind: "new",
    name: "Студия в новостройке",
    desc: "28 м² · до 1 комнаты · евростиль",
    icon: "Building2",
    room: { area: 28, perimeter: 22, height: 2.8, doors: 1, windows: 1 },
    recommendedTier: "standart",
    note: "Без демонтажа, ровные стены. Основные расходы — чистовая отделка и сантехника.",
  },
  {
    id: "new_1k",
    kind: "new",
    name: "1-комнатная (новостройка)",
    desc: "42 м² · 1 спальня + кухня",
    icon: "Building2",
    room: { area: 42, perimeter: 28, height: 2.8, doors: 2, windows: 2 },
    recommendedTier: "standart",
    note: "Стены подготовлены под отделку. Электрика и трубы уже разведены.",
  },
  {
    id: "new_2k",
    kind: "new",
    name: "2-комнатная (новостройка)",
    desc: "62 м² · 2 спальни + гостиная",
    icon: "Building2",
    room: { area: 62, perimeter: 38, height: 2.8, doors: 4, windows: 3 },
    recommendedTier: "premium",
    note: "Простор для дизайн-проекта. Качественная отделка окупится при продаже.",
  },

  // ─────────── ВТОРИЧКА ───────────
  {
    id: "second_1k",
    kind: "second",
    name: "1-комнатная (вторичка)",
    desc: "36 м² · хрущёвка / брежневка",
    icon: "Home",
    room: { area: 36, perimeter: 25, height: 2.55, doors: 2, windows: 1 },
    recommendedTier: "econom",
    note: "Полный демонтаж старых покрытий, часто замена труб и проводки.",
  },
  {
    id: "second_2k",
    kind: "second",
    name: "2-комнатная (вторичка)",
    desc: "52 м² · стандартная планировка",
    icon: "Home",
    room: { area: 52, perimeter: 32, height: 2.6, doors: 3, windows: 2 },
    recommendedTier: "standart",
    note: "Демонтаж + выравнивание стен по маякам. Стандартный капитальный ремонт.",
  },
  {
    id: "second_3k",
    kind: "second",
    name: "3-комнатная (вторичка)",
    desc: "75 м² · улучшенной планировки",
    icon: "Home",
    room: { area: 75, perimeter: 42, height: 2.7, doors: 5, windows: 3 },
    recommendedTier: "standart",
    note: "Большой объём демонтажа. Целесообразна замена сантехники и электрики целиком.",
  },
];

export function getTemplate(id: TemplateId): EstimateTemplate | undefined {
  return ESTIMATE_TEMPLATES.find((t) => t.id === id);
}
