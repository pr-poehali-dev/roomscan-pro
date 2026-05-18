/**
 * AI-подбор готового комплекта материалов и мебели под выбранный стиль интерьера.
 *
 * Логика:
 *  - На вход — id стиля (scandi / loft / japandi / classic …) и геометрия комнаты.
 *  - Из каждого каталога (стены, плитка, мебель) выбираются позиции,
 *    у которых указанный стиль есть в массиве styles / styleTags / altStyles.
 *  - Из каждой группы берётся 1-2 «лучших» по hit/popular/premium.
 *  - Считается смета: стены и пол по м², мебель — поштучно, тёплый пол VALTEC
 *    как дополнительная опция (при бюджете «Стандарт» и «Премиум»).
 *  - Возвращается единый Bundle с суммой и списком позиций.
 */

import { WALL_ITEMS as WALLS, type WallItem } from "@/components/walls/wallsData";
import { TILE_LIBRARY, type TileItem } from "@/lib/tile-library";
import { FURNITURE_CATALOG, type FurnitureItem } from "@/lib/furnitureCatalog";

export type BundleStyle =
  | "scandi" | "loft" | "japandi" | "classic" | "minimal"
  | "modern" | "midcentury" | "glam" | "industrial"
  | "boho" | "artdeco" | "provence" | "wabi-sabi";

export type BundleTier = "econom" | "standard" | "premium";

export interface BundleRoom {
  /** Площадь пола, м² (если есть скан — реальная) */
  area: number;
  /** Периметр × высота стен, м² */
  wallsArea: number;
  /** Включать тёплый пол VALTEC */
  withFloorHeating: boolean;
}

export interface BundleLine {
  source: "wall" | "tile" | "furniture" | "floor-heating";
  id: string;
  title: string;
  brand?: string;
  unit: string;
  qty: number;
  pricePerUnit: number;
  total: number;
  imageUrl?: string;
  color?: string;
  /** Краткое объяснение, почему ИИ выбрал именно это */
  reason: string;
}

export interface StyleBundle {
  style: BundleStyle;
  tier: BundleTier;
  room: BundleRoom;
  lines: BundleLine[];
  totals: {
    walls: number;
    floor: number;
    furniture: number;
    floorHeating: number;
    grand: number;
  };
  palette: string[];
}

/* ─────────── Палитра под стиль ─────────── */
const PALETTES: Record<BundleStyle, string[]> = {
  scandi:      ["#F5F1EA", "#E2DACC", "#A8B5A0", "#3C4A3E"],
  japandi:     ["#EDE6D9", "#C9B79C", "#7A6E5D", "#2E2A24"],
  loft:        ["#3D3D3D", "#8B5A2B", "#C0392B", "#F5F1EA"],
  industrial:  ["#2A2A2A", "#595959", "#A87E55", "#E6E6E6"],
  classic:     ["#F4E4BC", "#8B7355", "#704214", "#2F1B0C"],
  artdeco:     ["#1A1A2E", "#D4AF37", "#722F37", "#F5F1EA"],
  glam:        ["#F8E8F0", "#D4AF37", "#3A0E2D", "#FAFAFA"],
  midcentury:  ["#E8C39E", "#A0522D", "#3A6B5C", "#F5EBD7"],
  modern:      ["#FAFAFA", "#1F2937", "#3B82F6", "#94A3B8"],
  minimal:     ["#FFFFFF", "#F5F5F5", "#D4D4D4", "#262626"],
  boho:        ["#E8C39E", "#C68B65", "#7A4E2D", "#3A6B5C"],
  provence:    ["#F0E6D2", "#B8C5D6", "#A8B5A0", "#7A6B5D"],
  "wabi-sabi": ["#E8DDC9", "#B8A992", "#7A6E5D", "#3A332C"],
};

/* ─────────── Маппинг стилей между каталогами ─────────── */
function styleMatches(item: { styles?: string[] }, style: BundleStyle): boolean {
  if (!item.styles?.length) return false;
  if (item.styles.includes(style)) return true;
  // близкие стили
  const close: Record<string, string[]> = {
    scandi: ["minimal", "japandi"],
    japandi: ["scandi", "wabi-sabi", "minimal"],
    loft: ["industrial", "modern"],
    industrial: ["loft", "modern"],
    classic: ["artdeco", "glam"],
    artdeco: ["classic", "glam"],
    glam: ["artdeco", "classic"],
    midcentury: ["modern", "scandi"],
    minimal: ["scandi", "modern"],
    modern: ["minimal", "midcentury"],
    boho: ["midcentury", "provence"],
    provence: ["classic", "boho"],
    "wabi-sabi": ["japandi", "scandi"],
  };
  return (close[style] ?? []).some((s) => item.styles!.includes(s));
}

function tileStyleMatches(t: TileItem, style: BundleStyle): boolean {
  if (t.style === style) return true;
  if (t.altStyles?.includes(style as TileItem["style"])) return true;
  return styleMatches({ styles: [t.style, ...(t.altStyles ?? [])] }, style);
}

function furnitureStyleMatches(f: FurnitureItem, style: BundleStyle): boolean {
  if (!f.styleTags?.length) return false;
  return styleMatches({ styles: f.styleTags }, style);
}

/* ─────────── Скоринг под уровень бюджета ─────────── */
function tierFilter<T extends { pricePerUnit?: number; pricePerM2?: number; priceNum?: number }>(
  items: T[],
  tier: BundleTier,
): T[] {
  const prices = items
    .map((i) => i.pricePerUnit ?? i.pricePerM2 ?? i.priceNum ?? 0)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);
  if (!prices.length) return items;
  const p33 = prices[Math.floor(prices.length * 0.33)];
  const p66 = prices[Math.floor(prices.length * 0.66)];
  return items.filter((i) => {
    const p = i.pricePerUnit ?? i.pricePerM2 ?? i.priceNum ?? 0;
    if (tier === "econom") return p <= p66;
    if (tier === "premium") return p >= p33;
    return true; // standard
  });
}

/* ─────────── Главная функция ─────────── */
export function buildStyleBundle(
  style: BundleStyle,
  room: BundleRoom,
  tier: BundleTier = "standard",
): StyleBundle {
  const lines: BundleLine[] = [];

  /* ── Стены ── */
  const wallCandidates = WALLS.filter((w) => styleMatches({ styles: w.styles }, style));
  const wallsPool = tierFilter(wallCandidates, tier);
  const bestWall = pickBest(wallsPool, (w) => scoreWall(w));
  if (bestWall) {
    const qty = Math.ceil(room.wallsArea / bestWall.coveragePerUnit);
    lines.push({
      source: "wall",
      id: bestWall.id,
      title: bestWall.title,
      brand: bestWall.brand,
      unit: bestWall.unit,
      qty,
      pricePerUnit: bestWall.pricePerUnit,
      total: qty * bestWall.pricePerUnit,
      color: bestWall.color,
      reason: explainWall(bestWall, style),
    });
  }

  /* ── Пол (плитка / керамогранит) ── */
  const tileCandidates = TILE_LIBRARY.filter(
    (t) => (t.surface === "floor" || t.surface === "both") && tileStyleMatches(t, style),
  );
  const tilesPool = tierFilter(tileCandidates, tier);
  const bestTile = pickBest(tilesPool, (t) => (t.popular ? 2 : 1));
  if (bestTile) {
    const qty = Math.ceil(room.area * 1.07); // +7% запас на подрезку
    lines.push({
      source: "tile",
      id: bestTile.id,
      title: bestTile.name,
      brand: bestTile.brand,
      unit: "м²",
      qty,
      pricePerUnit: bestTile.pricePerM2,
      total: qty * bestTile.pricePerM2,
      imageUrl: bestTile.preview,
      color: bestTile.accent,
      reason: `${bestTile.material === "porcelain" ? "Керамогранит" : "Плитка"} ${bestTile.size[0]}×${bestTile.size[1]} — характерно для стиля «${styleLabel(style)}».`,
    });
  }

  /* ── Тёплый пол VALTEC (только Standard/Premium и если выбран) ── */
  if (room.withFloorHeating && tier !== "econom") {
    // VALTEC PEX-EVOH ≈ 89 ₽/м; шаг 15 см → ~7 м трубы на 1 м².
    const pipeLen = Math.ceil(room.area * 7 * 1.12);
    const pipe = { qty: pipeLen, price: 89 };
    // Combimix 28 500 ₽ + коллектор 24 500 + шкаф 6 800 ≈ 59 800 за узел.
    const unit = 59800;
    lines.push({
      source: "floor-heating",
      id: "valtec-floor-bundle",
      title: "Водяной тёплый пол VALTEC под ключ (труба PEX-EVOH + узел Combimix + коллектор)",
      brand: "VALTEC",
      unit: "комплект",
      qty: 1,
      pricePerUnit: pipe.qty * pipe.price + unit,
      total: pipe.qty * pipe.price + unit,
      reason: "Дополняет интерьер премиум-комфортом: тёплое покрытие и экономия отопления до 20%.",
    });
  }

  /* ── Мебель: до 4 ключевых позиций ── */
  const furnCandidates = FURNITURE_CATALOG.filter((f) => furnitureStyleMatches(f, style));
  const furnPool = tierFilter(furnCandidates, tier);
  const byCategory = new Map<string, FurnitureItem>();
  for (const f of furnPool) {
    if (!byCategory.has(f.category)) byCategory.set(f.category, f);
  }
  const pickedFurn = Array.from(byCategory.values()).slice(0, 4);
  for (const f of pickedFurn) {
    lines.push({
      source: "furniture",
      id: String(f.id),
      title: f.name,
      brand: f.brand,
      unit: "шт",
      qty: 1,
      pricePerUnit: f.priceNum,
      total: f.priceNum,
      color: f.color,
      reason: `Подходит под стиль «${styleLabel(style)}» (${(f.styleTags ?? []).join(", ")}).`,
    });
  }

  /* ── Итоги ── */
  const totals = {
    walls: sum(lines, "wall"),
    floor: sum(lines, "tile"),
    furniture: sum(lines, "furniture"),
    floorHeating: sum(lines, "floor-heating"),
    grand: lines.reduce((s, l) => s + l.total, 0),
  };

  return {
    style,
    tier,
    room,
    lines,
    totals,
    palette: PALETTES[style] ?? PALETTES.modern,
  };
}

/* ─────────── Helpers ─────────── */
function pickBest<T>(items: T[], scoreFn: (it: T) => number): T | undefined {
  if (!items.length) return undefined;
  let best = items[0];
  let bestScore = scoreFn(best);
  for (let i = 1; i < items.length; i++) {
    const s = scoreFn(items[i]);
    if (s > bestScore) {
      best = items[i];
      bestScore = s;
    }
  }
  return best;
}
function scoreWall(w: WallItem): number {
  let s = 0;
  if (w.hit) s += 3;
  if (w.premium) s += 1;
  if (w.eco) s += 1;
  return s;
}
function sum(lines: BundleLine[], src: BundleLine["source"]): number {
  return lines.filter((l) => l.source === src).reduce((s, l) => s + l.total, 0);
}
function explainWall(w: WallItem, style: BundleStyle): string {
  const tex = w.textures[0];
  const map: Record<string, string> = {
    smooth: "гладкая фактура",
    matte: "матовая поверхность",
    embossed: "тиснёная фактура",
    wood: "под дерево",
    stone: "под камень",
    concrete: "бетонная фактура",
    fabric: "тканевая фактура",
    brick: "кирпичная кладка",
    marble: "под мрамор",
    velvet: "бархат",
    silk: "шёлк",
    venetian: "венецианская штукатурка",
  };
  return `${w.brand} · ${map[tex] ?? tex} · ${w.colorName ?? ""} тон — каноничный выбор для стиля «${styleLabel(style)}».`;
}

export function styleLabel(s: BundleStyle): string {
  const m: Record<BundleStyle, string> = {
    scandi: "Сканди",
    loft: "Лофт",
    japandi: "Японди",
    classic: "Классика",
    minimal: "Минимализм",
    modern: "Модерн",
    midcentury: "Mid-century",
    glam: "Гламур",
    industrial: "Индастриал",
    boho: "Бохо",
    artdeco: "Ар-деко",
    provence: "Прованс",
    "wabi-sabi": "Wabi-sabi",
  };
  return m[s];
}

export function tierLabel(t: BundleTier): string {
  return t === "econom" ? "Эконом" : t === "premium" ? "Премиум" : "Стандарт";
}