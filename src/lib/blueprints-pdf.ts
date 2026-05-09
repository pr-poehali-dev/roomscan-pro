/**
 * Экспорт комплекта архитектурных чертежей в PDF.
 * Берёт SVG-элементы из DOM, рендерит каждый на canvas → PNG → PDF.
 */
import jsPDF from "jspdf";
import {
  HousePlacement,
  ModularHouseProject,
  getModule,
  MODULE_TYPE_LABELS,
} from "./modular-houses";

const FONT = "helvetica";
const COLOR_TEXT = "#1a2530";
const COLOR_MUTED = "#6b7785";
const COLOR_PRIMARY = "#1ea54a";

/** SVG → dataURL PNG через временный canvas */
async function svgToPngDataUrl(svg: SVGSVGElement, scale = 2): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!clone.getAttribute("width")) clone.setAttribute("width", "1200");
  if (!clone.getAttribute("height")) clone.setAttribute("height", "800");
  const xml = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width * scale;
      const h = img.height * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

interface ExportOpts {
  project: ModularHouseProject;
  layout: HousePlacement[];
  variantName?: string;
  /** SVG-элементы в порядке: план, фасад главный, фасад боковой, разрез */
  svgs: { title: string; el: SVGSVGElement }[];
}

/** Заголовочный штамп на каждой странице */
function drawTitleBlock(
  doc: jsPDF,
  project: ModularHouseProject,
  pageTitle: string,
  pageNum: number,
  totalPages: number,
  variantName?: string,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Верхняя плашка
  doc.setDrawColor(COLOR_TEXT);
  doc.setLineWidth(0.3);
  doc.line(15, 18, pageW - 15, 18);

  doc.setFont(FONT, "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR_TEXT);
  doc.text(project.name.toUpperCase(), 15, 14);

  doc.setFont(FONT, "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED);
  doc.text(
    `${project.area} m2 | ${project.bedrooms} bedrooms | ${project.daysToBuild} days`,
    pageW - 15,
    14,
    { align: "right" },
  );

  // Нижний штамп — левая часть
  doc.setDrawColor(COLOR_TEXT);
  doc.setLineWidth(0.3);
  doc.line(15, pageH - 22, pageW - 15, pageH - 22);
  doc.line(15, pageH - 14, pageW - 15, pageH - 14);

  doc.setFont(FONT, "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLOR_TEXT);
  doc.text(pageTitle, 15, pageH - 17);

  doc.setFont(FONT, "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED);
  doc.text(
    `Variant: ${variantName ?? "A"}  |  Scale 1:100  |  Sheet ${pageNum} of ${totalPages}`,
    15,
    pageH - 9,
  );

  doc.text(
    `Generated: ${new Date().toLocaleDateString("ru-RU")}`,
    pageW - 15,
    pageH - 9,
    { align: "right" },
  );
}

export async function exportBlueprintsPdf(opts: ExportOpts): Promise<void> {
  const { project, layout, variantName, svgs } = opts;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Доступная область чертежа
  const drawX = 18;
  const drawY = 22;
  const drawW = pageW - 36;
  const drawH = pageH - 48;

  const totalPages = svgs.length + 1; // +1 — титул

  /* ─────────── СТРАНИЦА 1: ТИТУЛ ─────────── */
  doc.setFillColor(245, 245, 240);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.setTextColor(COLOR_PRIMARY);
  doc.text("ARCHITECTURAL DRAWINGS", 18, 25);

  doc.setFont(FONT, "bold");
  doc.setFontSize(36);
  doc.setTextColor(COLOR_TEXT);
  doc.text(project.name, 18, 50);

  doc.setFont(FONT, "normal");
  doc.setFontSize(12);
  doc.setTextColor(COLOR_MUTED);
  const taglineLines = doc.splitTextToSize(project.tagline, pageW - 36);
  doc.text(taglineLines, 18, 62);

  // Параметры
  const stats: [string, string][] = [
    ["AREA", `${project.area} m2`],
    ["BEDROOMS", String(project.bedrooms)],
    ["BUILD TIME", `${project.daysToBuild} days`],
    ["CONSTRUCTION", project.construction],
    ["BASE PRICE", `${new Intl.NumberFormat("ru-RU").format(project.basePrice)} RUB`],
    ["VARIANT", variantName ?? "A"],
  ];
  const sx = 18;
  const sy = 95;
  doc.setFontSize(8);
  stats.forEach(([k, v], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = sx + col * 90;
    const y = sy + row * 22;
    doc.setFont(FONT, "normal");
    doc.setTextColor(COLOR_MUTED);
    doc.text(k, x, y);
    doc.setFont(FONT, "bold");
    doc.setFontSize(13);
    doc.setTextColor(COLOR_TEXT);
    doc.text(v, x, y + 7);
    doc.setFontSize(8);
  });

  // Список модулей в проекте
  const modules = layout
    .map((p) => getModule(p.moduleId))
    .filter((m): m is NonNullable<ReturnType<typeof getModule>> => !!m);

  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT);
  doc.text("CONTENTS", 18, pageH - 70);

  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLOR_MUTED);
  svgs.forEach((s, i) => {
    doc.text(`${String(i + 2).padStart(2, "0")}.  ${s.title}`, 18, pageH - 60 + i * 6);
  });

  // Список помещений (правая колонка)
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT);
  doc.text("ROOMS SCHEDULE", pageW / 2 + 10, pageH - 70);

  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLOR_MUTED);
  modules.slice(0, 8).forEach((m, i) => {
    const label = MODULE_TYPE_LABELS[m.type] ?? m.type;
    doc.text(
      `${String(i + 1).padStart(2, "0")}.  ${label.padEnd(12, " ")}  ${m.area} m2`,
      pageW / 2 + 10,
      pageH - 60 + i * 6,
    );
  });

  drawTitleBlock(doc, project, "TITLE / SUMMARY", 1, totalPages, variantName);

  /* ─────────── СТРАНИЦЫ 2..N: ЧЕРТЕЖИ ─────────── */
  for (let i = 0; i < svgs.length; i++) {
    doc.addPage("a4", "landscape");
    const { title, el } = svgs[i];

    try {
      const png = await svgToPngDataUrl(el, 2);
      // Соблюдаем пропорции
      const bbox = el.getBoundingClientRect();
      const ratio = bbox.width / bbox.height || 1.6;
      let w = drawW;
      let h = drawW / ratio;
      if (h > drawH) {
        h = drawH;
        w = drawH * ratio;
      }
      const x = drawX + (drawW - w) / 2;
      const y = drawY + (drawH - h) / 2;
      doc.addImage(png, "PNG", x, y, w, h, undefined, "FAST");
    } catch {
      doc.setFont(FONT, "normal");
      doc.setFontSize(11);
      doc.setTextColor(COLOR_MUTED);
      doc.text("[Drawing could not be rendered]", drawX, drawY + 20);
    }

    drawTitleBlock(doc, project, title.toUpperCase(), i + 2, totalPages, variantName);
  }

  doc.save(`${project.id}_blueprints_${variantName ?? "A"}.pdf`);
}
