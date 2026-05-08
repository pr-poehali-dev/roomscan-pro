/**
 * Каталог плитки и напольных покрытий — для дизайнеров.
 * Реальные ходовые модели: имитация мрамора, дерева, бетона, метро,
 * марокканская плитка, terrazzo, herringbone, brick.
 *
 * Используется в разделах ПЛАНИРОВЩИК (отделка пола/стен), КАТАЛОГ.
 */

export type TileSurface = "floor" | "wall" | "both";
export type TileMaterial =
  | "porcelain"   // керамогранит
  | "ceramic"     // керамика
  | "marble"      // мрамор натуральный/имитация
  | "stone"       // камень
  | "wood-look"   // дерево-имитация
  | "concrete"    // бетон
  | "mosaic"      // мозаика
  | "brick";      // кирпич декоративный

export type TileStyle =
  | "scandi"
  | "loft"
  | "classic"
  | "minimal"
  | "modern"
  | "japandi"
  | "glamour"
  | "midcentury";

export interface TileItem {
  id: string;
  name: string;
  brand: string;
  collection?: string;
  /** Превью образца — top-view */
  preview: string;
  /** Цвет акцент для UI карточки */
  accent: string;
  /** Размеры одной плитки в см: ширина × высота */
  size: [number, number];
  material: TileMaterial;
  surface: TileSurface;
  style: TileStyle;
  altStyles?: TileStyle[];
  /** Цена за 1 м² в ₽ */
  pricePerM2: number;
  /** Где применяется (комнаты) */
  rooms: ("kitchen" | "bath" | "living" | "bed" | "hall" | "outdoor")[];
  description: string;
  tags: string[];
  popular?: boolean;
}

const TILE_IMG = {
  subwayWhite:   "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/176da2ca-9517-4357-8523-281b17d0a60d.jpg",
  carraraMarble: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/12e9e709-6d82-4fc8-97ad-dfa45ede8f50.jpg",
  concreteGrey:  "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/65ee7582-289d-4104-b1b4-f62fe15218b5.jpg",
  oakPlank:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/247216d0-42ee-478a-8cbc-9a4b7cbeba3b.jpg",
  moroccan:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/819c86f5-2d0e-4fe1-9e98-741eeb6441e2.jpg",
  hexBlack:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/1511ba69-be90-4b09-b7d6-edeaa8b1ad86.jpg",
  emeraldGloss:  "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/11f59d0c-97c7-4aa4-8a14-5a4ba941a57f.jpg",
  travertine:    "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/26228219-014a-412c-ad12-0ef09692774b.jpg",
  terrazzo:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/3e4d7565-6455-4416-94b2-0eb684cb6c1f.jpg",
  calacatta:     "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/cbba665a-8222-4667-9fbb-9656f495d20a.jpg",
  walnutHerring: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/59c62af5-81f1-4651-af3b-be7f36185c69.jpg",
  brickRed:      "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/b1fd4aa7-fcc2-4d24-a440-5d107ac2520b.jpg",
};

export const TILE_LIBRARY: TileItem[] = [
  {
    id: "tile-subway-white",
    name: "Метро Белая глянец",
    brand: "Kerama Marazzi",
    collection: "Metro",
    preview: TILE_IMG.subwayWhite,
    accent: "#fafafa",
    size: [10, 30],
    material: "ceramic",
    surface: "wall",
    style: "scandi",
    altStyles: ["minimal", "loft", "modern"],
    pricePerM2: 1450,
    rooms: ["kitchen", "bath"],
    description: "Классическая «метро» 10×30 см, белый глянец. Кладётся вразбежку или ёлочкой.",
    tags: ["метро", "subway", "белая", "кухня", "фартук"],
    popular: true,
  },
  {
    id: "tile-carrara",
    name: "Carrara Marble",
    brand: "Italon",
    collection: "Charme",
    preview: TILE_IMG.carraraMarble,
    accent: "#f5f5f4",
    size: [60, 60],
    material: "marble",
    surface: "both",
    style: "classic",
    altStyles: ["glamour", "modern"],
    pricePerM2: 4280,
    rooms: ["bath", "kitchen", "living"],
    description: "Имитация мрамора Каррара 60×60. Полированный керамогранит, серые прожилки.",
    tags: ["мрамор", "carrara", "ванная", "белый"],
    popular: true,
  },
  {
    id: "tile-concrete",
    name: "Concrete Dark",
    brand: "Estima",
    collection: "Loft",
    preview: TILE_IMG.concreteGrey,
    accent: "#52525b",
    size: [60, 60],
    material: "concrete",
    surface: "floor",
    style: "loft",
    altStyles: ["minimal", "modern"],
    pricePerM2: 2150,
    rooms: ["living", "kitchen", "hall", "outdoor"],
    description: "Под бетон 60×60, тёмно-серый. Ректифицированный, минимальный шов.",
    tags: ["бетон", "лофт", "тёмная", "пол"],
  },
  {
    id: "tile-oak-plank",
    name: "Oak Natural Plank",
    brand: "Kerranova",
    collection: "Wood",
    preview: TILE_IMG.oakPlank,
    accent: "#d6c5a8",
    size: [20, 120],
    material: "wood-look",
    surface: "floor",
    style: "scandi",
    altStyles: ["japandi", "modern"],
    pricePerM2: 2680,
    rooms: ["living", "bed", "kitchen", "hall"],
    description: "Под дуб 20×120. Тёплый рельеф, матовая поверхность.",
    tags: ["дерево", "дуб", "доска", "пол"],
    popular: true,
  },
  {
    id: "tile-moroccan",
    name: "Moroccan Pattern",
    brand: "Equipe",
    collection: "Caprice",
    preview: TILE_IMG.moroccan,
    accent: "#1e40af",
    size: [20, 20],
    material: "ceramic",
    surface: "both",
    style: "classic",
    altStyles: ["glamour"],
    pricePerM2: 3850,
    rooms: ["kitchen", "bath", "hall"],
    description: "Марокканский узор 20×20, синий + белый. Смешивается с однотонной.",
    tags: ["узор", "марокко", "синяя"],
  },
  {
    id: "tile-hex-black",
    name: "Hex Black Matt",
    brand: "Equipe",
    collection: "Hexa",
    preview: TILE_IMG.hexBlack,
    accent: "#0a0a0a",
    size: [15, 17],
    material: "porcelain",
    surface: "both",
    style: "minimal",
    altStyles: ["modern", "loft"],
    pricePerM2: 3450,
    rooms: ["bath", "kitchen"],
    description: "Шестигранник 15×17, чёрная матовая. Современный геометричный декор.",
    tags: ["шестигранник", "чёрная", "матовая"],
    popular: true,
  },
  {
    id: "tile-emerald",
    name: "Emerald Gloss",
    brand: "Equipe",
    collection: "Splendours",
    preview: TILE_IMG.emeraldGloss,
    accent: "#047857",
    size: [7, 30],
    material: "ceramic",
    surface: "wall",
    style: "glamour",
    altStyles: ["classic", "modern"],
    pricePerM2: 4150,
    rooms: ["bath", "kitchen"],
    description: "Изумрудно-зелёная глянцевая «соломка» 7×30. Эффект ручной работы.",
    tags: ["зелёная", "глянец", "ванная"],
  },
  {
    id: "tile-travertine",
    name: "Travertino Beige",
    brand: "Italon",
    collection: "Travertine",
    preview: TILE_IMG.travertine,
    accent: "#d6b88c",
    size: [60, 60],
    material: "stone",
    surface: "both",
    style: "classic",
    altStyles: ["modern", "minimal"],
    pricePerM2: 3780,
    rooms: ["bath", "living", "outdoor"],
    description: "Под травертин 60×60, тёплый бежевый. Натуральная фактура.",
    tags: ["травертин", "камень", "бежевая"],
  },
  {
    id: "tile-terrazzo",
    name: "Terrazzo Mix",
    brand: "Marca Corona",
    collection: "Terra",
    preview: TILE_IMG.terrazzo,
    accent: "#e7e5e4",
    size: [60, 60],
    material: "porcelain",
    surface: "floor",
    style: "midcentury",
    altStyles: ["modern", "scandi"],
    pricePerM2: 4250,
    rooms: ["living", "kitchen", "bath", "hall"],
    description: "Терраццо с разноцветной мраморной крошкой на белом фоне.",
    tags: ["terrazzo", "винтаж", "крошка"],
    popular: true,
  },
  {
    id: "tile-calacatta",
    name: "Calacatta Black Gold",
    brand: "Italon",
    collection: "Charme Extra",
    preview: TILE_IMG.calacatta,
    accent: "#171717",
    size: [60, 120],
    material: "marble",
    surface: "both",
    style: "glamour",
    altStyles: ["classic", "modern"],
    pricePerM2: 6850,
    rooms: ["bath", "living", "kitchen"],
    description: "Чёрный мрамор Calacatta с золотыми прожилками 60×120. Премиум.",
    tags: ["мрамор", "чёрный", "золото", "премиум"],
  },
  {
    id: "tile-walnut-herring",
    name: "Walnut Herringbone",
    brand: "Kerranova",
    collection: "Wood Premium",
    preview: TILE_IMG.walnutHerring,
    accent: "#78350f",
    size: [15, 90],
    material: "wood-look",
    surface: "floor",
    style: "classic",
    altStyles: ["midcentury", "modern"],
    pricePerM2: 3650,
    rooms: ["living", "bed", "hall"],
    description: "Под орех «ёлочкой» 15×90. Классический паркет в керамограните.",
    tags: ["дерево", "ёлочка", "herringbone"],
  },
  {
    id: "tile-brick-red",
    name: "Brick Red Loft",
    brand: "Cersanit",
    collection: "Loft",
    preview: TILE_IMG.brickRed,
    accent: "#991b1b",
    size: [6, 25],
    material: "brick",
    surface: "wall",
    style: "loft",
    altStyles: ["midcentury"],
    pricePerM2: 1850,
    rooms: ["living", "kitchen", "hall"],
    description: "Декоративный кирпич 6×25, состаренный красный. Имитация старой кладки.",
    tags: ["кирпич", "лофт", "красный"],
  },
];

/* ─────────────────── HELPERS ─────────────────── */

export const TILE_MATERIAL_LABELS: Record<TileMaterial, string> = {
  porcelain:  "Керамогранит",
  ceramic:    "Керамика",
  marble:     "Мрамор",
  stone:      "Камень",
  "wood-look": "Под дерево",
  concrete:   "Бетон",
  mosaic:     "Мозаика",
  brick:      "Кирпич",
};

export const TILE_SURFACE_LABELS: Record<TileSurface, string> = {
  floor: "Пол",
  wall:  "Стены",
  both:  "Универсальная",
};

export const TILE_ROOM_LABELS: Record<TileItem["rooms"][number], string> = {
  kitchen: "Кухня",
  bath:    "Ванная",
  living:  "Гостиная",
  bed:     "Спальня",
  hall:    "Прихожая",
  outdoor: "Улица",
};

export function searchTiles(items: TileItem[], query: string): TileItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((it) => {
    const hay = [
      it.name,
      it.brand,
      it.collection ?? "",
      it.description,
      ...it.tags,
    ].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

export function filterTilesByStyle(items: TileItem[], style: TileStyle | "all"): TileItem[] {
  if (style === "all") return items;
  return items.filter((it) => it.style === style || (it.altStyles ?? []).includes(style));
}

export function filterTilesBySurface(items: TileItem[], surface: TileSurface | "all"): TileItem[] {
  if (surface === "all") return items;
  return items.filter((it) => it.surface === surface || it.surface === "both");
}

export function filterTilesByRoom(items: TileItem[], room: TileItem["rooms"][number] | "all"): TileItem[] {
  if (room === "all") return items;
  return items.filter((it) => it.rooms.includes(room));
}

export function formatTilePrice(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽/м²";
}
