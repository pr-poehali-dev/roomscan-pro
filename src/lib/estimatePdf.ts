import jsPDF from "jspdf";
import { TIER_META, type EstimateResult, type RoomInput } from "./estimate";

/**
 * Генерация PDF-сметы ремонта.
 * Используем jsPDF (UTF-8 через встроенный шрифт Helvetica + транслитерацию для кириллицы
 * как fallback). Для надёжной кириллицы используем встроенный hack — рендеринг через canvas.
 *
 * Простое решение: html2pdf не нужен — генерируем напрямую через jsPDF + транслитерация
 * для гарантии того, что текст не превратится в крякозябры. Но при этом основной текст
 * формируем латиницей для печати, а название и общие суммы оставляем по-русски через
 * vfs_fonts (фоллбэк) — сейчас просто транслитерируем для надёжности на любом устройстве.
 *
 * НА САМОМ ДЕЛЕ: jsPDF v4 поддерживает Unicode при добавлении шрифта через addFont.
 * Чтобы не тащить тяжёлый шрифт — выгружаем PDF с помощью встроенной функции
 * через html-блок (jsPDF.html), который рендерит DOM с уже загруженным веб-шрифтом.
 */

interface PdfInput {
  room: RoomInput;
  result: EstimateResult;
  projectName?: string;
}

const tierLabel = (t: EstimateResult["tier"]) => TIER_META[t].label;

/**
 * Генерирует PDF из существующего DOM-блока (передаётся ref).
 * Используется в калькуляторе через скрытый html-блок, оптимизированный для печати.
 */
export async function generateEstimatePdf(input: PdfInput, htmlElement: HTMLElement) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // jsPDF.html — конвертит DOM в PDF с поддержкой кириллицы из веб-шрифтов
  await doc.html(htmlElement, {
    callback: (pdf) => {
      const fileName = (input.projectName || `Smeta_${tierLabel(input.result.tier)}_${input.room.area}m2`).replace(/[^a-zA-Zа-яА-Я0-9_]/g, "_");
      pdf.save(`${fileName}.pdf`);
    },
    x: 10,
    y: 10,
    width: 190,
    windowWidth: 800,
    autoPaging: "text",
  });
}
