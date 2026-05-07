/**
 * Калькулятор окон и дверей.
 * Цены ориентировочные (2025, Москва/МО), включают изделие + установку.
 */

export type WindowProfile = "pvc" | "alu" | "wood";
export type WindowGlazing = "double" | "triple";
export type DoorType = "interior" | "entry";
export type DoorMaterial = "mdf" | "solid" | "metal";

export interface WindowSpec {
  profile: WindowProfile;
  glazing: WindowGlazing;
  width: number;   // см
  height: number;  // см
  sashes: number;  // створок
  count: number;
}

export interface DoorSpec {
  type: DoorType;
  material: DoorMaterial;
  width: number;   // см
  height: number;  // см
  count: number;
}

const PROFILE_RATE: Record<WindowProfile, { price: number; label: string }> = {
  pvc:  { price: 4800, label: "ПВХ" },
  alu:  { price: 8200, label: "Алюминий" },
  wood: { price: 12500, label: "Дерево (евробрус)" },
};

const GLAZING_RATE: Record<WindowGlazing, { mult: number; label: string }> = {
  double: { mult: 1.0,  label: "2 камеры (стандарт)" },
  triple: { mult: 1.35, label: "3 камеры (тёплое)" },
};

const DOOR_RATE: Record<DoorType, Record<DoorMaterial, { price: number; install: number; label: string }>> = {
  interior: {
    mdf:   { price: 8500,  install: 3500, label: "МДФ" },
    solid: { price: 22000, install: 4500, label: "Массив" },
    metal: { price: 15000, install: 5500, label: "Стеклянная/металл" },
  },
  entry: {
    mdf:   { price: 18000, install: 5500, label: "МДФ-облицовка" },
    solid: { price: 45000, install: 6500, label: "Массив (премиум)" },
    metal: { price: 32000, install: 6500, label: "Стальная" },
  },
};

export function calcWindow(w: WindowSpec): { unit: number; total: number; lines: { label: string; value: string }[] } {
  const areaM2 = (w.width * w.height) / 10000;
  const baseRate = PROFILE_RATE[w.profile].price * GLAZING_RATE[w.glazing].mult;
  const sashFactor = 1 + 0.08 * Math.max(0, w.sashes - 2); // 1-2 створки = 1.0, 3+ дороже
  const install = 4500;
  const unit = Math.round(areaM2 * baseRate * sashFactor + install);
  const total = unit * w.count;
  return {
    unit,
    total,
    lines: [
      { label: "Профиль",   value: PROFILE_RATE[w.profile].label },
      { label: "Стеклопакет", value: GLAZING_RATE[w.glazing].label },
      { label: "Размер",    value: `${w.width}×${w.height} см (${areaM2.toFixed(2)} м²)` },
      { label: "Створок",   value: `${w.sashes}` },
      { label: "Количество", value: `${w.count} шт` },
      { label: "Цена за окно", value: `${unit.toLocaleString("ru-RU")} ₽` },
      { label: "Установка",  value: "включена" },
    ],
  };
}

export function calcDoor(d: DoorSpec): { unit: number; total: number; lines: { label: string; value: string }[] } {
  const r = DOOR_RATE[d.type][d.material];
  const sizeFactor = ((d.width * d.height) / (80 * 200));
  const unit = Math.round(r.price * sizeFactor + r.install);
  const total = unit * d.count;
  return {
    unit,
    total,
    lines: [
      { label: "Тип", value: d.type === "interior" ? "Межкомнатная" : "Входная" },
      { label: "Материал", value: r.label },
      { label: "Размер",   value: `${d.width}×${d.height} см` },
      { label: "Количество", value: `${d.count} шт` },
      { label: "Цена за дверь", value: `${unit.toLocaleString("ru-RU")} ₽` },
      { label: "Установка", value: `${r.install.toLocaleString("ru-RU")} ₽ (включена)` },
    ],
  };
}

export const PROFILES = PROFILE_RATE;
export const GLAZINGS = GLAZING_RATE;
export const DOORS = DOOR_RATE;
