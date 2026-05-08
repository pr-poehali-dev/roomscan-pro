/**
 * Генерация PDF-спецификаций для модулей «Инженерные узлы» и «Модульные дома».
 * Используется jsPDF (уже в зависимостях).
 */
import jsPDF from "jspdf";
import { BomRow, NodeTemplate, CATEGORY_LABELS } from "./engineering";
import {
  HousePlacement,
  HouseSpec,
  ModularHouseProject,
  MODULE_TYPE_LABELS,
  getModule,
} from "./modular-houses";

const FONT_PRIMARY = "helvetica";
const COLOR_PRIMARY = "#1ea54a";
const COLOR_TEXT = "#1a2530";
const COLOR_MUTED = "#6b7785";

function fmt(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n) + " RUB";
}

/* ────────────────── ENGINEERING PDF ────────────────── */

export function exportEngineeringPdf(opts: {
  template: NodeTemplate;
  bom: BomRow[];
  total: number;
  /** PNG-снимок 3D-сцены (dataUrl), опционально */
  sceneImage?: string;
  title?: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  // Заголовок
  doc.setFont(FONT_PRIMARY, "bold");
  doc.setFontSize(20);
  doc.setTextColor(COLOR_TEXT);
  doc.text("Specification: Engineering Node", 15, y);
  y += 8;

  doc.setFont(FONT_PRIMARY, "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_MUTED);
  doc.text(opts.title || opts.template.name, 15, y);
  y += 5;
  doc.text(
    `${opts.template.purpose} | ${opts.template.power} | ${opts.template.forArea}`,
    15,
    y,
  );
  y += 4;
  doc.text(`Date: ${new Date().toLocaleDateString("ru-RU")}`, 15, y);
  y += 8;

  // 3D-снимок (если есть)
  if (opts.sceneImage) {
    try {
      const imgW = pageW - 30;
      const imgH = imgW * 0.5;
      doc.addImage(opts.sceneImage, "PNG", 15, y, imgW, imgH);
      y += imgH + 6;
    } catch {
      /* skip */
    }
  }

  // Линия-разделитель
  doc.setDrawColor(COLOR_PRIMARY);
  doc.setLineWidth(0.6);
  doc.line(15, y, pageW - 15, y);
  y += 6;

  // Шапка таблицы
  doc.setFont(FONT_PRIMARY, "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLOR_TEXT);
  doc.text("#", 15, y);
  doc.text("Category", 22, y);
  doc.text("Item / Brand", 55, y);
  doc.text("Qty", 145, y);
  doc.text("Price", 165, y);
  doc.text("Total", 185, y);
  y += 2;
  doc.setDrawColor("#cccccc");
  doc.setLineWidth(0.2);
  doc.line(15, y, pageW - 15, y);
  y += 4;

  // Строки BOM
  doc.setFont(FONT_PRIMARY, "normal");
  doc.setFontSize(8);
  let i = 1;
  for (const row of opts.bom) {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    doc.setTextColor(COLOR_TEXT);
    doc.text(String(i++), 15, y);
    doc.setTextColor(COLOR_MUTED);
    doc.text(transliterate(CATEGORY_LABELS[row.item.category]).slice(0, 18), 22, y);
    doc.setTextColor(COLOR_TEXT);
    const name = transliterate(
      `${row.item.brand ? row.item.brand + " " : ""}${row.item.name}`,
    ).slice(0, 50);
    doc.text(name, 55, y);
    doc.text(`${row.quantity} ${transliterate(row.item.unit)}`, 145, y);
    doc.text(fmt(row.item.price), 165, y);
    doc.setFont(FONT_PRIMARY, "bold");
    doc.text(fmt(row.total), 185, y);
    doc.setFont(FONT_PRIMARY, "normal");
    y += 5;
  }

  // Итог
  y += 4;
  doc.setDrawColor(COLOR_PRIMARY);
  doc.setLineWidth(0.6);
  doc.line(15, y, pageW - 15, y);
  y += 6;

  doc.setFont(FONT_PRIMARY, "bold");
  doc.setFontSize(13);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text("TOTAL:", 145, y);
  doc.text(fmt(opts.total), 175, y);

  // Подвал
  y = 285;
  doc.setFont(FONT_PRIMARY, "italic");
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED);
  doc.text(
    "Specification generated automatically. Prices are indicative, valid 14 days.",
    15,
    y,
  );

  doc.save(`engineering-${opts.template.id}-${Date.now()}.pdf`);
}

/* ────────────────── HOUSE PDF ────────────────── */

export function exportHousePdf(opts: {
  project: ModularHouseProject;
  layout: HousePlacement[];
  spec: HouseSpec;
  sceneImage?: string;
  title?: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  doc.setFont(FONT_PRIMARY, "bold");
  doc.setFontSize(20);
  doc.setTextColor(COLOR_TEXT);
  doc.text("Modular House Specification", 15, y);
  y += 8;

  doc.setFont(FONT_PRIMARY, "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_MUTED);
  doc.text(opts.title || transliterate(opts.project.name), 15, y);
  y += 5;
  doc.text(
    `Area: ${opts.spec.totalArea} sq.m | Modules: ${opts.layout.length} | Date: ${new Date().toLocaleDateString("ru-RU")}`,
    15,
    y,
  );
  y += 8;

  if (opts.sceneImage) {
    try {
      const imgW = pageW - 30;
      const imgH = imgW * 0.55;
      doc.addImage(opts.sceneImage, "PNG", 15, y, imgW, imgH);
      y += imgH + 6;
    } catch {
      /* skip */
    }
  }

  doc.setDrawColor(COLOR_PRIMARY);
  doc.setLineWidth(0.6);
  doc.line(15, y, pageW - 15, y);
  y += 6;

  // Список модулей
  doc.setFont(FONT_PRIMARY, "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR_TEXT);
  doc.text("Modules:", 15, y);
  y += 6;

  doc.setFont(FONT_PRIMARY, "normal");
  doc.setFontSize(9);

  let i = 1;
  for (const row of opts.spec.modules) {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    doc.setTextColor(COLOR_TEXT);
    doc.text(`${i}.`, 15, y);
    const label = transliterate(MODULE_TYPE_LABELS[row.module.type]);
    const name = transliterate(row.module.name);
    doc.text(`${label} - ${name}`, 22, y);
    doc.text(`${row.quantity} pcs`, 130, y);
    doc.text(`${row.module.area} sqm`, 150, y);
    doc.setFont(FONT_PRIMARY, "bold");
    doc.text(fmt(row.total), 175, y);
    doc.setFont(FONT_PRIMARY, "normal");
    y += 5;
    i++;
  }

  y += 3;
  doc.setDrawColor("#cccccc");
  doc.setLineWidth(0.2);
  doc.line(15, y, pageW - 15, y);
  y += 6;

  // Структура цены
  doc.setFont(FONT_PRIMARY, "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR_TEXT);
  doc.text("Cost breakdown:", 15, y);
  y += 6;

  doc.setFont(FONT_PRIMARY, "normal");
  doc.setFontSize(9);
  const rows: [string, number][] = [
    ["Modules total", opts.spec.modulesPrice],
    ["Delivery & installation", opts.spec.delivery],
    [`Foundation (${opts.spec.totalArea} sqm)`, opts.spec.foundation],
    ["Utilities connection", opts.spec.utilities],
  ];
  for (const [label, val] of rows) {
    doc.setTextColor(COLOR_MUTED);
    doc.text(label, 22, y);
    doc.setTextColor(COLOR_TEXT);
    doc.text(fmt(val), 175, y);
    y += 5;
  }

  y += 3;
  doc.setDrawColor(COLOR_PRIMARY);
  doc.setLineWidth(0.6);
  doc.line(15, y, pageW - 15, y);
  y += 7;

  doc.setFont(FONT_PRIMARY, "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text("GRAND TOTAL (turnkey):", 15, y);
  doc.text(fmt(opts.spec.grandTotal), 145, y);

  if (opts.spec.totalArea > 0) {
    y += 6;
    doc.setFont(FONT_PRIMARY, "italic");
    doc.setFontSize(9);
    doc.setTextColor(COLOR_MUTED);
    doc.text(
      `~ ${fmt(Math.round(opts.spec.grandTotal / opts.spec.totalArea))} per sqm`,
      15,
      y,
    );
  }

  // Описание состава layout (для тех у кого нет 3D-снимка)
  y += 8;
  if (y < 250) {
    doc.setFont(FONT_PRIMARY, "bold");
    doc.setFontSize(10);
    doc.setTextColor(COLOR_TEXT);
    doc.text("Module placement:", 15, y);
    y += 5;
    doc.setFont(FONT_PRIMARY, "normal");
    doc.setFontSize(8);
    for (const p of opts.layout) {
      if (y > 280) break;
      const m = getModule(p.moduleId);
      if (!m) continue;
      doc.setTextColor(COLOR_MUTED);
      doc.text(
        `* ${transliterate(m.name)} at [${p.position[0]}, ${p.position[1]}] m`,
        20,
        y,
      );
      y += 4;
    }
  }

  doc.save(`house-${opts.project.id}-${Date.now()}.pdf`);
}

/* ────────────────── Helpers ────────────────── */

/**
 * jsPDF плохо работает с кириллицей в стандартных шрифтах.
 * Транслитерируем имена в латиницу для надёжного PDF.
 * Для серьёзного продакшна — подключить шрифт PT Sans Cyrillic, но это +200 КБ.
 */
function transliterate(s: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
    А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "E", Ж: "Zh", З: "Z",
    И: "I", Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R",
    С: "S", Т: "T", У: "U", Ф: "F", Х: "H", Ц: "C", Ч: "Ch", Ш: "Sh", Щ: "Sch",
    Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "Yu", Я: "Ya",
    "·": "-", "—": "-", "–": "-", "«": '"', "»": '"',
    "₽": "RUB", "²": "2", "³": "3", "°": "deg",
  };
  let out = "";
  for (const ch of s) out += map[ch] ?? ch;
  return out;
}

/**
 * Снимает PNG-снимок 3D-канваса.
 */
export async function captureCanvas(canvasEl: HTMLCanvasElement | null): Promise<string | undefined> {
  if (!canvasEl) return undefined;
  try {
    return canvasEl.toDataURL("image/png");
  } catch {
    return undefined;
  }
}
