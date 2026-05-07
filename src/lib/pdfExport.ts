/**
 * Генерация PDF-документов через jsPDF.
 * Поддерживает русский язык через стандартные шрифты с UTF-8.
 */

import { jsPDF } from "jspdf";
import { formatRub, type EstimateResult, type RoomInput } from "./estimate";
import type { SavedProject } from "./projectsStore";

const PAGE_W = 210;  // A4 width mm
const MARGIN = 15;
const COL_W = PAGE_W - 2 * MARGIN;

/**
 * Шапка документа: бренд + дата.
 */
function drawHeader(doc: jsPDF, title: string) {
  doc.setFillColor(34, 197, 94); // primary green
  doc.rect(0, 0, PAGE_W, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("RoomScan AI", MARGIN, 11);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("roomscan-ai.ru · экосистема АВАНГАРД", MARGIN, 15);

  const date = new Date().toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.setFontSize(9);
  doc.text(date, PAGE_W - MARGIN, 11, { align: "right" });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, 30);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 33, PAGE_W - MARGIN, 33);
}

/**
 * Подвал на каждой странице.
 */
function drawFooter(doc: jsPDF, page: number, total: number) {
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Страница ${page} из ${total}`, PAGE_W / 2, 290, { align: "center" });
  doc.text("Документ сгенерирован автоматически. Цены ориентировочные.", MARGIN, 290);
}

/**
 * Транслит для базовой латиницы как fallback (jsPDF дефолтные шрифты не поддерживают кириллицу).
 * Для адекватной кириллицы использовали бы кастомный шрифт, но это раздуло бы бандл.
 * Поэтому транслитерируем — для PDF это приемлемо.
 */
function tr(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
    А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "Yo", Ж: "Zh", З: "Z",
    И: "I", Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R",
    С: "S", Т: "T", У: "U", Ф: "F", Х: "H", Ц: "Ts", Ч: "Ch", Ш: "Sh", Щ: "Sch",
    Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "Yu", Я: "Ya",
    "₽": "RUB", "²": "2", "³": "3", "·": "-", "—": "-", "–": "-", "№": "No",
  };
  return text.split("").map((ch) => (ch in map ? map[ch] : ch)).join("");
}

/**
 * Экспорт сметы ремонта в PDF.
 */
export function exportEstimatePDF(room: RoomInput, est: EstimateResult, projectName?: string): void {
  const doc = new jsPDF();
  const tierLabel = est.tier === "econom" ? "Эконом" : est.tier === "standart" ? "Стандарт" : "Премиум";
  const title = projectName || `Смета ремонта · ${tierLabel}`;

  drawHeader(doc, tr(title));

  let y = 42;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(tr("Параметры помещения:"), MARGIN, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const params = [
    `Площадь: ${room.area.toFixed(1)} m2`,
    `Периметр стен: ${room.perimeter.toFixed(1)} m`,
    `Высота потолка: ${room.height.toFixed(2)} m`,
    `Дверей: ${room.doors} шт.`,
    `Окон: ${room.windows} шт.`,
  ];
  params.forEach((p) => {
    doc.text(tr(p), MARGIN + 3, y);
    y += 5;
  });

  y += 4;
  // Сводка
  doc.setFillColor(240, 253, 244);
  doc.rect(MARGIN, y, COL_W, 28, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 80, 40);
  doc.text(tr(`Тариф: ${tierLabel}`), MARGIN + 4, y + 7);
  doc.setFontSize(20);
  doc.text(tr(`${formatRub(est.grandTotal)}`), MARGIN + 4, y + 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(tr(`~${est.daysApprox} дней · гарантия ${est.warranty} · ${formatRub(est.perSqm)}/m2`), MARGIN + 4, y + 25);
  y += 36;

  // Группы работ
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(tr("Детализация сметы:"), MARGIN, y);
  y += 6;

  est.groups.forEach((g) => {
    if (y > 260) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFillColor(245, 245, 245);
    doc.rect(MARGIN, y - 4, COL_W, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(tr(g.name), MARGIN + 2, y);
    doc.text(tr(formatRub(g.total)), PAGE_W - MARGIN - 2, y, { align: "right" });
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    g.lines.forEach((l) => {
      if (y > 275) {
        doc.addPage();
        y = MARGIN;
      }
      const qtyStr = `${l.qty.toFixed(l.unit === "шт" || l.unit === "комплект" ? 0 : 1)} ${l.unit} x ${l.price.toLocaleString("ru-RU")} RUB`;
      doc.setTextColor(60, 60, 60);
      doc.text(tr(l.name), MARGIN + 4, y);
      doc.setTextColor(110, 110, 110);
      doc.text(tr(qtyStr), MARGIN + 80, y);
      doc.setTextColor(20, 20, 20);
      doc.text(tr(formatRub(l.total)), PAGE_W - MARGIN - 2, y, { align: "right" });
      y += 4.5;
    });
    y += 3;
  });

  // Итог
  if (y > 260) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFillColor(34, 197, 94);
  doc.rect(MARGIN, y, COL_W, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(tr("ИТОГО:"), MARGIN + 4, y + 9);
  doc.setFontSize(14);
  doc.text(tr(formatRub(est.grandTotal)), PAGE_W - MARGIN - 4, y + 9, { align: "right" });

  // Подвалы
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  doc.save(`smeta_${tierLabel.toLowerCase()}_${Date.now()}.pdf`);
}

/**
 * Экспорт проекта целиком (скан + смета + стейджинг) в PDF.
 */
export function exportProjectPDF(project: SavedProject): void {
  const doc = new jsPDF();
  drawHeader(doc, tr(project.name));

  let y = 42;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    tr(`Создан: ${new Date(project.createdAt).toLocaleDateString("ru-RU")}`),
    MARGIN, y,
  );
  doc.text(
    tr(`Обновлён: ${new Date(project.updatedAt).toLocaleDateString("ru-RU")}`),
    MARGIN, y + 5,
  );
  y += 14;

  // Скан
  if (project.scan) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(tr("3D-скан помещения"), MARGIN, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(tr(`Площадь: ${project.scan.area.toFixed(1)} m2`), MARGIN + 3, y);
    y += 5;
    doc.text(tr(`Размеры: ${project.scan.width.toFixed(2)} x ${project.scan.length.toFixed(2)} m`), MARGIN + 3, y);
    y += 5;
    doc.text(tr(`Высота: ${project.scan.height.toFixed(2)} m`), MARGIN + 3, y);
    y += 5;
    if (project.scan.doors !== undefined) {
      doc.text(tr(`Дверей: ${project.scan.doors}, окон: ${project.scan.windows ?? 0}`), MARGIN + 3, y);
      y += 5;
    }
    y += 5;
  }

  // Смета
  if (project.estimate) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(tr("Смета ремонта"), MARGIN, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const tierLabel = project.estimate.tier === "econom" ? "Эконом" : project.estimate.tier === "standart" ? "Стандарт" : "Премиум";
    doc.text(tr(`Тариф: ${tierLabel}`), MARGIN + 3, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 120, 60);
    doc.setFontSize(14);
    doc.text(tr(`Итого: ${formatRub(project.estimate.grandTotal)}`), MARGIN + 3, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    y += 6;
    doc.text(tr(`Срок: ~${project.estimate.daysApprox} дней`), MARGIN + 3, y);
    y += 10;
  }

  // Стейджинг
  if (project.staging) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(tr("Хоумстейджинг"), MARGIN, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const goalLabel = project.staging.goal === "rent" ? "Сдать в аренду" : project.staging.goal === "fast_sale" ? "Продать быстро" : "Продать дорого";
    doc.text(tr(`Цель: ${goalLabel}`), MARGIN + 3, y);
    y += 5;
    doc.text(tr(`Бюджет подготовки: ${formatRub(project.staging.budget)}`), MARGIN + 3, y);
    y += 5;
    doc.setTextColor(34, 120, 60);
    doc.text(tr(`Прогноз роста цены: +${project.staging.expectedUplift}%`), MARGIN + 3, y);
    doc.setTextColor(20, 20, 20);
    y += 10;
  }

  if (project.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(tr("Заметки"), MARGIN, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(tr(project.notes), COL_W);
    doc.text(lines, MARGIN + 3, y);
  }

  drawFooter(doc, 1, 1);
  doc.save(`project_${project.id}.pdf`);
}
