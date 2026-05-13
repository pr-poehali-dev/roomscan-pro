/**
 * Каталог покрытий для стен.
 * Демо-данные, в дальнейшем заменяются на загрузку с бэка/партнёрских каталогов.
 */

export type WallCategory =
  | "wallpaper"
  | "liquid-wallpaper"
  | "paint"
  | "plaster"
  | "panels"
  | "brick-stone"
  | "molding";

export type WallStyle =
  | "scandi" | "loft" | "classic" | "minimal" | "modern" | "japandi" | "glam" | "midcentury";

export type WallTexture =
  | "smooth" | "embossed" | "fabric" | "concrete" | "wood" | "stone" | "metallic";

export interface WallItem {
  id: string;
  title: string;
  brand: string;
  collection?: string;
  category: WallCategory;
  styles: WallStyle[];
  textures: WallTexture[];
  color: string;          // hex для превью
  pricePerUnit: number;   // ₽
  unit: "м²" | "рулон" | "л";
  coveragePerUnit: number; // сколько м² покрывает 1 unit (для рулонов/банок)
  moistureResistant: boolean;
  paintable: boolean;
  eco: boolean;
  hit?: boolean;
  rooms: Array<"kitchen" | "bath" | "living" | "bedroom" | "hall" | "kids">;
  tags?: string[];
}

export const WALL_CATEGORIES: Array<{ id: WallCategory; label: string; icon: string }> = [
  { id: "wallpaper",        label: "Обои",                       icon: "Wallpaper" },
  { id: "liquid-wallpaper", label: "Жидкие обои",                icon: "Droplets" },
  { id: "paint",            label: "Краска",                     icon: "PaintBucket" },
  { id: "plaster",          label: "Декоративная штукатурка",    icon: "Brush" },
  { id: "panels",           label: "Стеновые панели",            icon: "LayoutPanelTop" },
  { id: "brick-stone",      label: "Кирпич и камень",            icon: "Blocks" },
  { id: "molding",          label: "Молдинги",                   icon: "Frame" },
];

export const WALL_STYLES: Array<{ id: WallStyle; label: string }> = [
  { id: "scandi",     label: "Сканди" },
  { id: "loft",       label: "Лофт" },
  { id: "classic",    label: "Классика" },
  { id: "minimal",    label: "Минимализм" },
  { id: "modern",     label: "Модерн" },
  { id: "japandi",    label: "Японди" },
  { id: "glam",       label: "Гламур" },
  { id: "midcentury", label: "Mid-century" },
];

export const WALL_ROOMS: Array<{ id: WallItem["rooms"][number]; label: string; icon: string }> = [
  { id: "kitchen", label: "Кухня",    icon: "ChefHat" },
  { id: "bath",    label: "Ванная",   icon: "Bath" },
  { id: "living",  label: "Гостиная", icon: "Sofa" },
  { id: "bedroom", label: "Спальня",  icon: "Bed" },
  { id: "hall",    label: "Прихожая", icon: "DoorOpen" },
  { id: "kids",    label: "Детская",  icon: "Baby" },
];

export const WALL_ITEMS: WallItem[] = [
  {
    id: "w-001", title: "Обои флизелиновые «Норд»", brand: "Loymina", collection: "Nordic",
    category: "wallpaper", styles: ["scandi", "minimal"], textures: ["smooth"],
    color: "#E8E2D5", pricePerUnit: 4200, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: true, paintable: false, eco: true, hit: true,
    rooms: ["living", "bedroom", "hall"], tags: ["флизелин", "под покраску"],
  },
  {
    id: "w-002", title: "Краска интерьерная матовая", brand: "Tikkurila", collection: "Joker",
    category: "paint", styles: ["scandi", "minimal", "modern"], textures: ["smooth"],
    color: "#F4F1EC", pricePerUnit: 3890, unit: "л", coveragePerUnit: 8,
    moistureResistant: true, paintable: false, eco: true, hit: true,
    rooms: ["living", "bedroom", "kids", "hall"], tags: ["матовая", "детская"],
  },
  {
    id: "w-003", title: "Декоративная штукатурка «Травертино»", brand: "Bayramix",
    category: "plaster", styles: ["classic", "modern", "glam"], textures: ["stone", "embossed"],
    color: "#D8C9A8", pricePerUnit: 1450, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false,
    rooms: ["living", "hall"], tags: ["венецианка"],
  },
  {
    id: "w-004", title: "Стеновые панели МДФ «Дуб»", brand: "Soundec", collection: "Wood Line",
    category: "panels", styles: ["loft", "midcentury", "modern"], textures: ["wood"],
    color: "#8B6A45", pricePerUnit: 2890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true,
    rooms: ["living", "bedroom", "hall"], tags: ["реечные", "акустические"],
  },
  {
    id: "w-005", title: "Декоративный кирпич «Лофт»", brand: "White Hills",
    category: "brick-stone", styles: ["loft", "midcentury"], textures: ["stone"],
    color: "#B85C3D", pricePerUnit: 1980, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: true, eco: false, hit: true,
    rooms: ["living", "kitchen", "hall"], tags: ["клинкер"],
  },
  {
    id: "w-006", title: "Жидкие обои шёлковые «Прованс»", brand: "Silk Plaster",
    category: "liquid-wallpaper", styles: ["classic", "scandi"], textures: ["fabric"],
    color: "#E6D9C2", pricePerUnit: 890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true,
    rooms: ["bedroom", "living", "kids"], tags: ["шёлк", "ручная отделка"],
  },
  {
    id: "w-007", title: "Обои виниловые тиснёные «Графит»", brand: "Палитра",
    category: "wallpaper", styles: ["modern", "loft"], textures: ["embossed", "concrete"],
    color: "#5C5C66", pricePerUnit: 2890, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: true, paintable: false, eco: false,
    rooms: ["living", "hall"], tags: ["винил"],
  },
  {
    id: "w-008", title: "Краска для кухни и ванной", brand: "Dulux", collection: "Kitchen & Bath",
    category: "paint", styles: ["minimal", "modern", "scandi"], textures: ["smooth"],
    color: "#DCE7E2", pricePerUnit: 5290, unit: "л", coveragePerUnit: 10,
    moistureResistant: true, paintable: false, eco: true, hit: true,
    rooms: ["kitchen", "bath"], tags: ["устойчивая к мытью"],
  },
  {
    id: "w-009", title: "3D-панели гипсовые «Волна»", brand: "Artpole",
    category: "panels", styles: ["modern", "glam"], textures: ["embossed"],
    color: "#FAFAF7", pricePerUnit: 3200, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: true, eco: true,
    rooms: ["living", "bedroom"], tags: ["3D"],
  },
  {
    id: "w-010", title: "Молдинг полиуретановый", brand: "Orac Decor", collection: "Luxxus",
    category: "molding", styles: ["classic", "glam"], textures: ["smooth"],
    color: "#FFFFFF", pricePerUnit: 1490, unit: "м", coveragePerUnit: 1,
    moistureResistant: true, paintable: true, eco: true,
    rooms: ["living", "bedroom", "hall"], tags: ["карниз", "под покраску"],
  },
  {
    id: "w-011", title: "Микроцемент «Бетон»", brand: "Topciment",
    category: "plaster", styles: ["loft", "minimal", "modern"], textures: ["concrete"],
    color: "#A8A39A", pricePerUnit: 2890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false, hit: true,
    rooms: ["bath", "kitchen", "living"], tags: ["микроцемент", "влагостойкий"],
  },
  {
    id: "w-012", title: "Обои бумажные детские «Зоопарк»", brand: "York Wallcoverings",
    category: "wallpaper", styles: ["scandi", "minimal"], textures: ["smooth"],
    color: "#F7C8A8", pricePerUnit: 3490, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: false, paintable: false, eco: true,
    rooms: ["kids", "bedroom"], tags: ["детская", "бумажные"],
  },
];
