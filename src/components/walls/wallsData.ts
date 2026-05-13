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
  | "molding"
  | "tile"
  | "mural"
  | "fabric"
  | "cork"
  | "metallic";

export type WallStyle =
  | "scandi" | "loft" | "classic" | "minimal" | "modern" | "japandi" | "glam" | "midcentury"
  | "boho" | "industrial" | "artdeco" | "provence" | "wabi-sabi";

export type WallTexture =
  | "smooth" | "embossed" | "fabric" | "concrete" | "wood" | "stone" | "metallic"
  | "velvet" | "silk" | "matte" | "glossy" | "satin" | "venetian" | "rough"
  | "brick" | "marble" | "geometric" | "linen" | "cork" | "leather" | "3d"
  | "stripe" | "floral" | "damask" | "graphite";

/** Цветовое семейство для фильтра по тону */
export type ColorFamily =
  | "white" | "beige" | "grey" | "black"
  | "brown" | "wood" | "terracotta" | "red"
  | "yellow" | "green" | "blue" | "pink" | "purple" | "metallic";

export interface WallItem {
  id: string;
  title: string;
  brand: string;
  collection?: string;
  category: WallCategory;
  styles: WallStyle[];
  textures: WallTexture[];
  color: string;          // hex для превью
  colorFamily: ColorFamily;
  colorName?: string;     // человеческое название тона: «графитовый», «терракотовый»
  pricePerUnit: number;   // ₽
  unit: "м²" | "рулон" | "л" | "м";
  coveragePerUnit: number; // сколько м² покрывает 1 unit
  moistureResistant: boolean;
  paintable: boolean;
  eco: boolean;
  fireResistant?: boolean;
  acoustic?: boolean;
  premium?: boolean;
  hit?: boolean;
  rooms: Array<"kitchen" | "bath" | "living" | "bedroom" | "hall" | "kids" | "office">;
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
  { id: "tile",             label: "Настенная плитка",           icon: "Grid2x2" },
  { id: "mural",            label: "Фотообои и фрески",          icon: "Image" },
  { id: "fabric",           label: "Тканевые покрытия",          icon: "Shirt" },
  { id: "cork",             label: "Пробка",                     icon: "Cylinder" },
  { id: "metallic",         label: "Металл / зеркало",           icon: "Sparkles" },
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
  { id: "boho",       label: "Бохо" },
  { id: "industrial", label: "Индастриал" },
  { id: "artdeco",    label: "Ар-деко" },
  { id: "provence",   label: "Прованс" },
  { id: "wabi-sabi",  label: "Wabi-sabi" },
];

export const WALL_TEXTURES: Array<{ id: WallTexture; label: string; icon: string }> = [
  { id: "smooth",    label: "Гладкая",         icon: "Square" },
  { id: "matte",     label: "Матовая",         icon: "Circle" },
  { id: "glossy",    label: "Глянцевая",       icon: "Sun" },
  { id: "satin",     label: "Сатин",           icon: "Sparkle" },
  { id: "embossed",  label: "Тиснёная",        icon: "Waves" },
  { id: "3d",        label: "3D-рельеф",       icon: "Box" },
  { id: "fabric",    label: "Тканевая",        icon: "Shirt" },
  { id: "linen",     label: "Лён",             icon: "Shirt" },
  { id: "silk",      label: "Шёлк",            icon: "Sparkle" },
  { id: "velvet",    label: "Бархат",          icon: "Heart" },
  { id: "leather",   label: "Кожа",            icon: "Wallet" },
  { id: "wood",      label: "Дерево",          icon: "TreePine" },
  { id: "stone",     label: "Камень",          icon: "Mountain" },
  { id: "brick",     label: "Кирпич",          icon: "Blocks" },
  { id: "marble",    label: "Мрамор",          icon: "Gem" },
  { id: "concrete",  label: "Бетон",           icon: "Square" },
  { id: "venetian",  label: "Венецианка",      icon: "Star" },
  { id: "metallic",  label: "Металлик",        icon: "Sparkles" },
  { id: "cork",      label: "Пробка",          icon: "Cylinder" },
  { id: "rough",     label: "Шероховатая",     icon: "MousePointer2" },
  { id: "geometric", label: "Геометрия",       icon: "Triangle" },
  { id: "stripe",    label: "Полоска",         icon: "AlignJustify" },
  { id: "floral",    label: "Цветочный",       icon: "Flower2" },
  { id: "damask",    label: "Дамаск",          icon: "Crown" },
  { id: "graphite",  label: "Графит",          icon: "Pencil" },
];

export const WALL_COLOR_FAMILIES: Array<{ id: ColorFamily; label: string; sample: string }> = [
  { id: "white",      label: "Белый",       sample: "#F5F1EA" },
  { id: "beige",      label: "Бежевый",     sample: "#D8C5A7" },
  { id: "grey",       label: "Серый",       sample: "#9A9A9A" },
  { id: "black",      label: "Чёрный",      sample: "#2A2A2C" },
  { id: "brown",      label: "Коричневый",  sample: "#7A5236" },
  { id: "wood",       label: "Дерево",      sample: "#A87547" },
  { id: "terracotta", label: "Терракота",   sample: "#C26A45" },
  { id: "red",        label: "Красный",     sample: "#B23A48" },
  { id: "yellow",     label: "Жёлтый",      sample: "#E5C25C" },
  { id: "green",      label: "Зелёный",     sample: "#6F8F6E" },
  { id: "blue",       label: "Синий",       sample: "#3F6A8A" },
  { id: "pink",       label: "Розовый",     sample: "#E8B5B0" },
  { id: "purple",     label: "Сиреневый",   sample: "#8F6FA3" },
  { id: "metallic",   label: "Металлик",    sample: "#B8B0A0" },
];

export const WALL_ROOMS: Array<{ id: WallItem["rooms"][number]; label: string; icon: string }> = [
  { id: "kitchen", label: "Кухня",    icon: "ChefHat" },
  { id: "bath",    label: "Ванная",   icon: "Bath" },
  { id: "living",  label: "Гостиная", icon: "Sofa" },
  { id: "bedroom", label: "Спальня",  icon: "Bed" },
  { id: "hall",    label: "Прихожая", icon: "DoorOpen" },
  { id: "kids",    label: "Детская",  icon: "Baby" },
  { id: "office",  label: "Кабинет",  icon: "Briefcase" },
];

export const WALL_ITEMS: WallItem[] = [
  // ─── ОБОИ ──────────────────────────────────────────────────────────────────
  {
    id: "w-001", title: "Обои флизелиновые «Норд»", brand: "Loymina", collection: "Nordic",
    category: "wallpaper", styles: ["scandi", "minimal"], textures: ["smooth", "matte"],
    color: "#E8E2D5", colorFamily: "beige", colorName: "молочный",
    pricePerUnit: 4200, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: true, paintable: false, eco: true, hit: true,
    rooms: ["living", "bedroom", "hall"], tags: ["флизелин"],
  },
  {
    id: "w-007", title: "Обои виниловые тиснёные «Графит»", brand: "Палитра",
    category: "wallpaper", styles: ["modern", "loft", "industrial"], textures: ["embossed", "concrete", "graphite"],
    color: "#5C5C66", colorFamily: "grey", colorName: "графит",
    pricePerUnit: 2890, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: true, paintable: false, eco: false,
    rooms: ["living", "hall", "office"], tags: ["винил"],
  },
  {
    id: "w-012", title: "Обои бумажные детские «Зоопарк»", brand: "York Wallcoverings",
    category: "wallpaper", styles: ["scandi", "minimal"], textures: ["smooth", "matte"],
    color: "#F7C8A8", colorFamily: "pink", colorName: "персиковый",
    pricePerUnit: 3490, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: false, paintable: false, eco: true,
    rooms: ["kids", "bedroom"], tags: ["детская"],
  },
  {
    id: "w-013", title: "Обои «Дамаск Виктория»", brand: "Cole & Son", collection: "Heritage",
    category: "wallpaper", styles: ["classic", "artdeco", "glam"], textures: ["damask", "silk"],
    color: "#1F3A5F", colorFamily: "blue", colorName: "сапфир",
    pricePerUnit: 12900, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: false, paintable: false, eco: true, premium: true,
    rooms: ["living", "bedroom"], tags: ["шёлкография"],
  },
  {
    id: "w-014", title: "Обои «Тропики»", brand: "Rasch", collection: "Botanica",
    category: "wallpaper", styles: ["boho", "modern"], textures: ["floral", "smooth"],
    color: "#3F6A4A", colorFamily: "green", colorName: "тропическая зелень",
    pricePerUnit: 4690, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: true, paintable: false, eco: false, hit: true,
    rooms: ["living", "bedroom"], tags: ["флора"],
  },
  {
    id: "w-015", title: "Обои «Полоска Royal»", brand: "Erismann",
    category: "wallpaper", styles: ["classic", "provence"], textures: ["stripe", "satin"],
    color: "#EFE3CC", colorFamily: "beige", colorName: "ванильный",
    pricePerUnit: 2390, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: true, paintable: false, eco: true,
    rooms: ["living", "bedroom", "hall"], tags: ["полоска"],
  },
  {
    id: "w-016", title: "Обои геометрия «Соты»", brand: "Marburg",
    category: "wallpaper", styles: ["modern", "midcentury", "minimal"], textures: ["geometric", "matte"],
    color: "#D8A557", colorFamily: "yellow", colorName: "медовый",
    pricePerUnit: 3990, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: true, paintable: false, eco: true,
    rooms: ["living", "office", "kids"], tags: ["геометрия"],
  },
  {
    id: "w-017", title: "Обои бархатные «Эмеральд»", brand: "Hookedonwalls",
    category: "wallpaper", styles: ["glam", "artdeco"], textures: ["velvet", "smooth"],
    color: "#1E4A35", colorFamily: "green", colorName: "изумруд",
    pricePerUnit: 8900, unit: "рулон", coveragePerUnit: 5.3,
    moistureResistant: false, paintable: false, eco: true, premium: true,
    rooms: ["bedroom", "living"], tags: ["бархат"],
  },
  // ─── КРАСКА ────────────────────────────────────────────────────────────────
  {
    id: "w-002", title: "Краска интерьерная матовая", brand: "Tikkurila", collection: "Joker",
    category: "paint", styles: ["scandi", "minimal", "modern"], textures: ["smooth", "matte"],
    color: "#F4F1EC", colorFamily: "white", colorName: "белая ночь",
    pricePerUnit: 3890, unit: "л", coveragePerUnit: 8,
    moistureResistant: true, paintable: false, eco: true, hit: true,
    rooms: ["living", "bedroom", "kids", "hall"], tags: ["матовая"],
  },
  {
    id: "w-008", title: "Краска для кухни и ванной", brand: "Dulux", collection: "Kitchen & Bath",
    category: "paint", styles: ["minimal", "modern", "scandi"], textures: ["smooth", "satin"],
    color: "#DCE7E2", colorFamily: "green", colorName: "мятный",
    pricePerUnit: 5290, unit: "л", coveragePerUnit: 10,
    moistureResistant: true, paintable: false, eco: true, hit: true,
    rooms: ["kitchen", "bath"], tags: ["устойчивая к мытью"],
  },
  {
    id: "w-018", title: "Краска «Сажа»", brand: "Farrow & Ball", collection: "Estate",
    category: "paint", styles: ["modern", "industrial", "minimal"], textures: ["matte", "smooth"],
    color: "#1F1F22", colorFamily: "black", colorName: "сажа",
    pricePerUnit: 8900, unit: "л", coveragePerUnit: 9,
    moistureResistant: true, paintable: false, eco: true, premium: true,
    rooms: ["living", "office", "hall"], tags: ["глубокий чёрный"],
  },
  {
    id: "w-019", title: "Краска «Терракотовое солнце»", brand: "Little Greene",
    category: "paint", styles: ["boho", "wabi-sabi", "provence"], textures: ["matte"],
    color: "#C26A45", colorFamily: "terracotta", colorName: "терракотовый",
    pricePerUnit: 7490, unit: "л", coveragePerUnit: 8,
    moistureResistant: true, paintable: false, eco: true, premium: true,
    rooms: ["living", "bedroom"], tags: ["благородная матовость"],
  },
  {
    id: "w-020", title: "Краска «Шалфей»", brand: "Manders", collection: "Heritage",
    category: "paint", styles: ["scandi", "japandi", "provence"], textures: ["matte", "satin"],
    color: "#9DA88E", colorFamily: "green", colorName: "шалфей",
    pricePerUnit: 4690, unit: "л", coveragePerUnit: 8,
    moistureResistant: true, paintable: false, eco: true,
    rooms: ["bedroom", "living", "office"], tags: ["природные оттенки"],
  },
  {
    id: "w-021", title: "Краска с эффектом грифельной доски", brand: "Магия Цвета",
    category: "paint", styles: ["loft", "industrial"], textures: ["matte", "rough"],
    color: "#2D2D2F", colorFamily: "black", colorName: "графитовый",
    pricePerUnit: 1990, unit: "л", coveragePerUnit: 6,
    moistureResistant: true, paintable: false, eco: false,
    rooms: ["kitchen", "office", "kids"], tags: ["можно рисовать мелом"],
  },
  {
    id: "w-022", title: "Краска «Сапфировая глубина»", brand: "Benjamin Moore",
    category: "paint", styles: ["classic", "artdeco"], textures: ["satin", "smooth"],
    color: "#264965", colorFamily: "blue", colorName: "сапфир",
    pricePerUnit: 6990, unit: "л", coveragePerUnit: 9,
    moistureResistant: true, paintable: false, eco: true,
    rooms: ["bedroom", "living", "office"], tags: ["насыщенный синий"],
  },
  {
    id: "w-023", title: "Магнитная краска", brand: "MagPaint",
    category: "paint", styles: ["modern", "industrial"], textures: ["matte"],
    color: "#3A3A3F", colorFamily: "grey", colorName: "тёмно-серый",
    pricePerUnit: 3690, unit: "л", coveragePerUnit: 4,
    moistureResistant: false, paintable: true, eco: false,
    rooms: ["kids", "office", "kitchen"], tags: ["магниты держатся"],
  },
  // ─── ШТУКАТУРКА ────────────────────────────────────────────────────────────
  {
    id: "w-003", title: "Декоративная штукатурка «Травертино»", brand: "Bayramix",
    category: "plaster", styles: ["classic", "modern", "glam"], textures: ["stone", "embossed", "venetian"],
    color: "#D8C9A8", colorFamily: "beige", colorName: "травертин",
    pricePerUnit: 1450, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false,
    rooms: ["living", "hall"], tags: ["венецианка"],
  },
  {
    id: "w-011", title: "Микроцемент «Бетон»", brand: "Topciment",
    category: "plaster", styles: ["loft", "minimal", "modern", "industrial"], textures: ["concrete", "smooth", "matte"],
    color: "#A8A39A", colorFamily: "grey", colorName: "бетон серый",
    pricePerUnit: 2890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false, hit: true,
    rooms: ["bath", "kitchen", "living"], tags: ["микроцемент"],
  },
  {
    id: "w-024", title: "Венецианка «Кьяроскуро»", brand: "Oikos",
    category: "plaster", styles: ["classic", "artdeco", "glam"], textures: ["venetian", "marble", "glossy"],
    color: "#E8DCC4", colorFamily: "beige", colorName: "слоновая кость",
    pricePerUnit: 3490, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false, premium: true,
    rooms: ["living", "hall"], tags: ["мрамор", "глянец"],
  },
  {
    id: "w-025", title: "Штукатурка «Марокканский тадeлакт»", brand: "VGT",
    category: "plaster", styles: ["boho", "wabi-sabi", "provence"], textures: ["matte", "rough", "satin"],
    color: "#C28860", colorFamily: "terracotta", colorName: "охра",
    pricePerUnit: 1890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: true,
    rooms: ["bath", "living", "bedroom"], tags: ["тадeлакт", "ручная работа"],
  },
  {
    id: "w-026", title: "Микроцемент «Антрацит»", brand: "Topciment",
    category: "plaster", styles: ["loft", "industrial", "modern"], textures: ["concrete", "matte"],
    color: "#3F3F44", colorFamily: "grey", colorName: "антрацит",
    pricePerUnit: 3190, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false,
    rooms: ["bath", "kitchen", "office"], tags: ["тёмный"],
  },
  // ─── ЖИДКИЕ ОБОИ ───────────────────────────────────────────────────────────
  {
    id: "w-006", title: "Жидкие обои шёлковые «Прованс»", brand: "Silk Plaster",
    category: "liquid-wallpaper", styles: ["classic", "scandi", "provence"], textures: ["fabric", "silk"],
    color: "#E6D9C2", colorFamily: "beige", colorName: "капучино",
    pricePerUnit: 890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true,
    rooms: ["bedroom", "living", "kids"], tags: ["шёлк"],
  },
  {
    id: "w-027", title: "Жидкие обои «Магнолия»", brand: "Silk Plaster", collection: "Optima",
    category: "liquid-wallpaper", styles: ["scandi", "japandi"], textures: ["fabric", "matte"],
    color: "#F4E4DC", colorFamily: "pink", colorName: "пудровый",
    pricePerUnit: 590, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true, hit: true,
    rooms: ["bedroom", "kids", "living"], tags: ["эконом"],
  },
  {
    id: "w-028", title: "Жидкие обои «Северное сияние»", brand: "Bioplast",
    category: "liquid-wallpaper", styles: ["modern", "midcentury"], textures: ["fabric", "metallic"],
    color: "#7F92A6", colorFamily: "blue", colorName: "стальной синий",
    pricePerUnit: 1290, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true,
    rooms: ["living", "bedroom"], tags: ["с блёстками"],
  },
  // ─── ПАНЕЛИ ────────────────────────────────────────────────────────────────
  {
    id: "w-004", title: "Стеновые панели МДФ «Дуб»", brand: "Soundec", collection: "Wood Line",
    category: "panels", styles: ["loft", "midcentury", "modern", "japandi"], textures: ["wood", "matte"],
    color: "#8B6A45", colorFamily: "wood", colorName: "натуральный дуб",
    pricePerUnit: 2890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true, acoustic: true,
    rooms: ["living", "bedroom", "hall", "office"], tags: ["реечные", "акустические"],
  },
  {
    id: "w-009", title: "3D-панели гипсовые «Волна»", brand: "Artpole",
    category: "panels", styles: ["modern", "glam"], textures: ["embossed", "3d"],
    color: "#FAFAF7", colorFamily: "white", colorName: "белый матовый",
    pricePerUnit: 3200, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: true, eco: true,
    rooms: ["living", "bedroom"], tags: ["3D"],
  },
  {
    id: "w-029", title: "Реечные панели «Орех»", brand: "Soundec",
    category: "panels", styles: ["midcentury", "modern", "japandi"], textures: ["wood", "satin"],
    color: "#5A3A26", colorFamily: "wood", colorName: "американский орех",
    pricePerUnit: 3490, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true, acoustic: true,
    rooms: ["living", "office", "bedroom"], tags: ["рейки"],
  },
  {
    id: "w-030", title: "ПВХ панели «Мрамор каррара»", brand: "Vox",
    category: "panels", styles: ["classic", "modern", "glam"], textures: ["marble", "glossy"],
    color: "#EEEAE2", colorFamily: "white", colorName: "каррарский мрамор",
    pricePerUnit: 1290, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false,
    rooms: ["bath", "kitchen"], tags: ["ПВХ", "влагостойкие"],
  },
  {
    id: "w-031", title: "Гипсовые 3D-панели «Кирпич»", brand: "Artpole",
    category: "panels", styles: ["loft", "industrial"], textures: ["brick", "3d"],
    color: "#C0A48A", colorFamily: "beige", colorName: "песчаник",
    pricePerUnit: 2490, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: true, eco: true,
    rooms: ["living", "hall", "kitchen"], tags: ["кирпич", "3D"],
  },
  {
    id: "w-032", title: "Панели «Бамбук»", brand: "Bamboo Design",
    category: "panels", styles: ["japandi", "boho", "wabi-sabi"], textures: ["wood", "rough"],
    color: "#C8A06C", colorFamily: "wood", colorName: "бамбук натуральный",
    pricePerUnit: 1990, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: true,
    rooms: ["bath", "living", "bedroom"], tags: ["эко"],
  },
  // ─── КИРПИЧ И КАМЕНЬ ───────────────────────────────────────────────────────
  {
    id: "w-005", title: "Декоративный кирпич «Лофт»", brand: "White Hills",
    category: "brick-stone", styles: ["loft", "midcentury", "industrial"], textures: ["brick", "rough"],
    color: "#B85C3D", colorFamily: "terracotta", colorName: "красный кирпич",
    pricePerUnit: 1980, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: true, eco: false, hit: true,
    rooms: ["living", "kitchen", "hall"], tags: ["клинкер"],
  },
  {
    id: "w-033", title: "Кирпич белый «Лондон»", brand: "Касавага",
    category: "brick-stone", styles: ["scandi", "loft", "minimal"], textures: ["brick", "matte"],
    color: "#EFE9E0", colorFamily: "white", colorName: "белый винтаж",
    pricePerUnit: 2190, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: true, eco: false,
    rooms: ["living", "kitchen", "hall"], tags: ["белый кирпич"],
  },
  {
    id: "w-034", title: "Сланец «Норвежский»", brand: "Касавага", collection: "Slate",
    category: "brick-stone", styles: ["modern", "japandi", "wabi-sabi"], textures: ["stone", "rough"],
    color: "#4F5358", colorFamily: "grey", colorName: "графит мокрый",
    pricePerUnit: 3290, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false, premium: true,
    rooms: ["living", "bath", "hall"], tags: ["натуральный камень"],
  },
  {
    id: "w-035", title: "Песчаник «Терра»", brand: "Leonardo Stone",
    category: "brick-stone", styles: ["boho", "wabi-sabi", "classic"], textures: ["stone", "rough"],
    color: "#C99B6E", colorFamily: "terracotta", colorName: "охра песчаная",
    pricePerUnit: 2790, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: true,
    rooms: ["living", "hall"], tags: ["песчаник"],
  },
  // ─── МОЛДИНГИ ──────────────────────────────────────────────────────────────
  {
    id: "w-010", title: "Молдинг полиуретановый", brand: "Orac Decor", collection: "Luxxus",
    category: "molding", styles: ["classic", "glam", "artdeco"], textures: ["smooth", "matte"],
    color: "#FFFFFF", colorFamily: "white", colorName: "чистый белый",
    pricePerUnit: 1490, unit: "м", coveragePerUnit: 1,
    moistureResistant: true, paintable: true, eco: true,
    rooms: ["living", "bedroom", "hall"], tags: ["карниз"],
  },
  {
    id: "w-036", title: "Молдинг гипсовый резной", brand: "Европласт",
    category: "molding", styles: ["classic", "artdeco"], textures: ["smooth", "embossed"],
    color: "#FAF7F0", colorFamily: "white", colorName: "айвори",
    pricePerUnit: 2890, unit: "м", coveragePerUnit: 1,
    moistureResistant: false, paintable: true, eco: true, premium: true,
    rooms: ["living", "bedroom"], tags: ["резьба"],
  },
  // ─── НАСТЕННАЯ ПЛИТКА ──────────────────────────────────────────────────────
  {
    id: "w-037", title: "Кабанчик «Метро»", brand: "Kerama Marazzi",
    category: "tile", styles: ["scandi", "loft", "modern"], textures: ["glossy", "smooth"],
    color: "#F2EFE9", colorFamily: "white", colorName: "белый глянец",
    pricePerUnit: 1290, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: true, hit: true,
    rooms: ["kitchen", "bath", "hall"], tags: ["кабанчик", "metro"],
  },
  {
    id: "w-038", title: "Плитка «Зеллидж марокканский»", brand: "Equipe", collection: "Zellige",
    category: "tile", styles: ["boho", "wabi-sabi", "provence"], textures: ["rough", "satin"],
    color: "#5A8E96", colorFamily: "green", colorName: "морская волна",
    pricePerUnit: 4890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: true, premium: true,
    rooms: ["kitchen", "bath"], tags: ["zellige", "ручная"],
  },
  {
    id: "w-039", title: "Плитка «Шестигранник Hex»", brand: "Equipe",
    category: "tile", styles: ["scandi", "modern", "midcentury"], textures: ["matte", "geometric"],
    color: "#D9D2C5", colorFamily: "beige", colorName: "песочный матовый",
    pricePerUnit: 2390, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: true,
    rooms: ["bath", "kitchen"], tags: ["гексагон"],
  },
  // ─── ФОТООБОИ / ФРЕСКИ ─────────────────────────────────────────────────────
  {
    id: "w-040", title: "Фреска «Тосканский пейзаж»", brand: "Affresco",
    category: "mural", styles: ["classic", "provence"], textures: ["matte", "fabric"],
    color: "#B89A7C", colorFamily: "brown", colorName: "сепия",
    pricePerUnit: 6890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true, premium: true,
    rooms: ["living", "bedroom"], tags: ["фреска"],
  },
  {
    id: "w-041", title: "Фотообои «Нью-Йорк ночью»", brand: "Komar",
    category: "mural", styles: ["loft", "modern", "industrial"], textures: ["smooth", "matte"],
    color: "#2C3F55", colorFamily: "blue", colorName: "ночной город",
    pricePerUnit: 4590, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false,
    rooms: ["living", "office"], tags: ["мегаполис"],
  },
  {
    id: "w-042", title: "Фотообои «Японская сакура»", brand: "Pickawall",
    category: "mural", styles: ["japandi", "wabi-sabi", "boho"], textures: ["smooth", "floral"],
    color: "#F4D6D9", colorFamily: "pink", colorName: "сакура",
    pricePerUnit: 3990, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true, hit: true,
    rooms: ["bedroom", "living"], tags: ["цветы сакуры"],
  },
  // ─── ТКАНЕВЫЕ ──────────────────────────────────────────────────────────────
  {
    id: "w-043", title: "Лён натуральный «Бельгия»", brand: "Loymina", collection: "Linen",
    category: "fabric", styles: ["scandi", "japandi", "wabi-sabi"], textures: ["linen", "fabric", "rough"],
    color: "#D6CBB4", colorFamily: "beige", colorName: "натуральный лён",
    pricePerUnit: 5890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true, premium: true,
    rooms: ["bedroom", "living"], tags: ["лён"],
  },
  {
    id: "w-044", title: "Бархат настенный «Rouge»", brand: "Designers Guild",
    category: "fabric", styles: ["glam", "artdeco", "classic"], textures: ["velvet", "fabric"],
    color: "#7A2A33", colorFamily: "red", colorName: "винный",
    pricePerUnit: 12490, unit: "м²", coveragePerUnit: 1,
    moistureResistant: false, paintable: false, eco: true, premium: true, acoustic: true,
    rooms: ["bedroom", "living", "office"], tags: ["бархат", "звукопоглощение"],
  },
  // ─── ПРОБКА ────────────────────────────────────────────────────────────────
  {
    id: "w-045", title: "Пробка натуральная «Лиссабон»", brand: "Corkstyle",
    category: "cork", styles: ["scandi", "japandi", "wabi-sabi"], textures: ["cork", "rough", "matte"],
    color: "#B58860", colorFamily: "wood", colorName: "медовая пробка",
    pricePerUnit: 1890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: true, acoustic: true,
    rooms: ["office", "bedroom", "kids"], tags: ["пробка", "тёплая"],
  },
  {
    id: "w-046", title: "Пробка цветная «Графит»", brand: "Wicanders",
    category: "cork", styles: ["modern", "industrial"], textures: ["cork", "matte"],
    color: "#4A4642", colorFamily: "grey", colorName: "графит",
    pricePerUnit: 2490, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: true, acoustic: true,
    rooms: ["office", "living"], tags: ["акустика"],
  },
  // ─── МЕТАЛЛ / ЗЕРКАЛО ──────────────────────────────────────────────────────
  {
    id: "w-047", title: "Зеркальная плитка «Антик»", brand: "Saint-Gobain",
    category: "metallic", styles: ["artdeco", "glam", "classic"], textures: ["glossy", "metallic"],
    color: "#C4B89A", colorFamily: "metallic", colorName: "состаренное золото",
    pricePerUnit: 5990, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false, premium: true,
    rooms: ["living", "hall", "bedroom"], tags: ["зеркало"],
  },
  {
    id: "w-048", title: "Панели медные «Patina»", brand: "Aksor Style",
    category: "metallic", styles: ["industrial", "loft", "artdeco"], textures: ["metallic", "rough"],
    color: "#8A6A48", colorFamily: "metallic", colorName: "состаренная медь",
    pricePerUnit: 7890, unit: "м²", coveragePerUnit: 1,
    moistureResistant: true, paintable: false, eco: false, premium: true,
    rooms: ["kitchen", "living", "hall"], tags: ["медь", "патина"],
  },
];
