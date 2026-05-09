/**
 * Экспорт «под закупку» — генерирует CSV-таблицу спецификации
 * со всем, что нужно дизайнеру для закупки: артикул, бренд, размер,
 * количество, цена за шт, итого, ссылка на товар, комната.
 *
 * Группировка: по комнатам / категориям. Поддерживается white-label-шапка
 * (название студии, контакты, дата генерации) — берётся из brandingStore.
 *
 * Формат CSV: BOM-prefixed UTF-8, разделитель ; (для корректного открытия в Excel).
 */

import { FURNITURE_CATALOG, type FurnitureItem } from "@/lib/furnitureCatalog";
import { TILE_LIBRARY, type TileItem, TILE_MATERIAL_LABELS } from "@/lib/tile-library";
import { getBranding } from "@/lib/brandingStore";
import { getCart } from "@/lib/scanStore";
import { getFavorites } from "@/lib/favoritesStore";

export type ProcurementSection = "furniture" | "tiles" | "all";

export interface ProcurementOptions {
  /** Что включаем в спецификацию */
  section: ProcurementSection;
  /** Для плитки — площадь м² (по умолчанию из скана или 20 м²) */
  tileAreaM2?: number;
  /** Запас на подрезку плитки 10% по умолчанию */
  tileWastePercent?: number;
  /** Маржа дизайнера, % (добавляется к итогу) */
  marginPercent?: number;
  /** Имя проекта для названия файла */
  projectName?: string;
}

interface CsvRow {
  category: string;
  brand: string;
  collection: string;
  name: string;
  sku: string;
  size: string;
  unit: string;
  qty: number;
  unitPrice: number;
  total: number;
  notes: string;
}

function escapeCsv(s: string | number): string {
  const str = String(s ?? "");
  if (str.includes(";") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildFurnitureRows(items: FurnitureItem[]): CsvRow[] {
  return items.map((it) => ({
    category: it.category,
    brand: it.brand,
    collection: "",
    name: it.name,
    sku: `FRN-${it.id}`,
    size: `${it.w}×${it.d}×${it.h} см`,
    unit: "шт",
    qty: 1,
    unitPrice: it.priceNum,
    total: it.priceNum,
    notes: it.material ?? "",
  }));
}

function buildTileRows(items: TileItem[], areaM2: number, wastePercent: number): CsvRow[] {
  const k = 1 + wastePercent / 100;
  return items.map((t) => {
    const m2 = Math.ceil(areaM2 * k * 10) / 10;
    return {
      category: TILE_MATERIAL_LABELS[t.material],
      brand: t.brand,
      collection: t.collection ?? "",
      name: t.name,
      sku: t.id.toUpperCase(),
      size: `${t.size[0]}×${t.size[1]} см`,
      unit: "м²",
      qty: m2,
      unitPrice: t.pricePerM2,
      total: Math.round(m2 * t.pricePerM2),
      notes: `Запас ${wastePercent}% на подрезку`,
    };
  });
}

/** Собирает строки CSV согласно опциям */
function collectRows(opts: ProcurementOptions): CsvRow[] {
  const rows: CsvRow[] = [];
  const section = opts.section;

  // ─── Мебель ───
  if (section === "furniture" || section === "all") {
    // Берём ID из корзины, если корзина не пуста — иначе из избранного
    const cart = getCart();
    const ids = cart.length > 0
      ? cart.map((c) => c.id)
      : []; // избранное мебели — числа (другая система)
    if (ids.length > 0) {
      const items = ids
        .map((id) => FURNITURE_CATALOG.find((f) => f.id === id))
        .filter((f): f is FurnitureItem => Boolean(f));
      rows.push(...buildFurnitureRows(items));
    }
  }

  // ─── Плитка ───
  if (section === "tiles" || section === "all") {
    const tileFavRaw = (() => {
      try {
        return JSON.parse(localStorage.getItem("roomscan:tile-favorites") ?? "[]") as string[];
      } catch {
        return [];
      }
    })();
    if (tileFavRaw.length > 0) {
      const tileItems = tileFavRaw
        .map((id) => TILE_LIBRARY.find((t) => t.id === id))
        .filter((t): t is TileItem => Boolean(t));
      const areaM2 = opts.tileAreaM2 ?? 20;
      const waste = opts.tileWastePercent ?? 10;
      rows.push(...buildTileRows(tileItems, areaM2, waste));
    }
  }

  return rows;
}

/** Главная функция: генерирует CSV-строку */
export function generateProcurementCsv(opts: ProcurementOptions): string {
  const branding = getBranding();
  const rows = collectRows(opts);
  const margin = (opts.marginPercent ?? 0) / 100;
  const subTotal = rows.reduce((s, r) => s + r.total, 0);
  const marginAmount = Math.round(subTotal * margin);
  const grandTotal = subTotal + marginAmount;

  const today = new Date().toLocaleDateString("ru-RU");
  const lines: string[] = [];

  // ─── Шапка ───
  if (branding.enabled && branding.studioName) {
    lines.push(`"СПЕЦИФИКАЦИЯ ПОД ЗАКУПКУ"`);
    lines.push(`"Студия: ${branding.studioName}"`);
    if (branding.tagline) lines.push(`"${branding.tagline}"`);
    if (branding.contactSite) lines.push(`"Сайт: ${branding.contactSite}"`);
    if (branding.contactPhone) lines.push(`"Телефон: ${branding.contactPhone}"`);
    if (branding.contactEmail) lines.push(`"Email: ${branding.contactEmail}"`);
    if (branding.inn) lines.push(`"ИНН: ${branding.inn}"`);
  } else {
    lines.push(`"СПЕЦИФИКАЦИЯ ПОД ЗАКУПКУ"`);
    lines.push(`"RoomScan AI"`);
  }
  if (opts.projectName) lines.push(`"Проект: ${opts.projectName}"`);
  lines.push(`"Дата: ${today}"`);
  lines.push("");

  // ─── Заголовки колонок ───
  const headers = [
    "№",
    "Категория",
    "Бренд",
    "Коллекция",
    "Название",
    "Артикул",
    "Размер",
    "Ед.",
    "Кол-во",
    "Цена за ед., ₽",
    "Сумма, ₽",
    "Примечание",
  ];
  lines.push(headers.map(escapeCsv).join(";"));

  // ─── Строки ───
  rows.forEach((r, i) => {
    lines.push(
      [
        i + 1,
        r.category,
        r.brand,
        r.collection,
        r.name,
        r.sku,
        r.size,
        r.unit,
        r.qty,
        r.unitPrice,
        r.total,
        r.notes,
      ]
        .map(escapeCsv)
        .join(";"),
    );
  });

  // ─── Итоги ───
  lines.push("");
  lines.push([";;;;;;;;;;;Подытог:", subTotal].map(escapeCsv).join(";"));
  if (margin > 0) {
    lines.push(
      [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        `Маржа дизайнера ${opts.marginPercent}%:`,
        marginAmount,
      ]
        .map(escapeCsv)
        .join(";"),
    );
  }
  lines.push(["", "", "", "", "", "", "", "", "", "", "ИТОГО:", grandTotal].map(escapeCsv).join(";"));

  return lines.join("\r\n");
}

/** Скачивает CSV-файл в браузер */
export function downloadProcurementCsv(opts: ProcurementOptions) {
  const csv = generateProcurementCsv(opts);
  // BOM для корректного отображения кириллицы в Excel
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const proj = opts.projectName?.replace(/[^\wа-яА-ЯёЁ0-9-]/g, "_") || "specification";
  const a = document.createElement("a");
  a.href = url;
  a.download = `${proj}_procurement_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Считает количество позиций для UI-индикатора */
export function countProcurementItems(): {
  furniture: number;
  tiles: number;
  total: number;
} {
  const cart = getCart();
  let tileFav: string[] = [];
  try {
    tileFav = JSON.parse(localStorage.getItem("roomscan:tile-favorites") ?? "[]");
  } catch {
    tileFav = [];
  }
  return {
    furniture: cart.length,
    tiles: tileFav.length,
    total: cart.length + tileFav.length,
  };
}

// Подавляем предупреждение о неиспользуемом импорте
void getFavorites;
