/**
 * Экспорт плана комнаты в PDF/PNG.
 * Рендерится напрямую через Canvas — без зависимости от DOM/SVG.
 *
 * Используется в ExportSection и кнопкой быстрого экспорта в Planner.
 */
import jsPDF from "jspdf";
import { getLastScan, getCart, type LastScan, type CartItemRef, type DetectedOpening } from "./scanStore";

interface PlacedItem {
  id: number;
  name: string;
  x: number; y: number;  // в SVG-координатах планировщика (px)
  w: number; h: number;
}

interface ExportOptions {
  scan: LastScan | null;
  cart: CartItemRef[];
  placed?: PlacedItem[];
  title?: string;
}

const A4_W = 595; // pt at 72dpi
const A4_H = 842;

/**
 * Рисует план на Canvas-context: стены, проёмы, мебель, размеры.
 */
function drawPlan(
  ctx: CanvasRenderingContext2D,
  scan: LastScan,
  ox: number, oy: number,
  drawW: number, drawH: number,
) {
  const W = scan.width;
  const L = scan.length;
  const scale = Math.min(drawW / W, drawH / L);
  const roomW = W * scale;
  const roomL = L * scale;
  const px = ox + (drawW - roomW) / 2;
  const py = oy + (drawH - roomL) / 2;

  // Сетка
  ctx.strokeStyle = "rgba(120,120,120,0.15)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= drawW; i += 20) {
    ctx.beginPath();
    ctx.moveTo(ox + i, oy);
    ctx.lineTo(ox + i, oy + drawH);
    ctx.stroke();
  }
  for (let i = 0; i <= drawH; i += 20) {
    ctx.beginPath();
    ctx.moveTo(ox, oy + i);
    ctx.lineTo(ox + drawW, oy + i);
    ctx.stroke();
  }

  // Стены
  ctx.fillStyle = "rgba(34,197,94,0.05)";
  ctx.fillRect(px, py, roomW, roomL);
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 3;
  ctx.strokeRect(px, py, roomW, roomL);

  // Размеры
  ctx.fillStyle = "#16a34a";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${W} м`, px + roomW / 2, py - 8);
  ctx.save();
  ctx.translate(px - 12, py + roomL / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${L} м`, 0, 0);
  ctx.restore();

  // Проёмы (двери оранж, окна голубые)
  const openings: DetectedOpening[] = scan.openings ?? [];
  const byWall: Record<number, DetectedOpening[]> = { 0: [], 1: [], 2: [], 3: [] };
  openings.forEach((o) => {
    const side = (o.wall_idx % 4) as 0 | 1 | 2 | 3;
    byWall[side].push(o);
  });

  ([0, 1, 2, 3] as const).forEach((side) => {
    const list = byWall[side];
    list.forEach((o, idx) => {
      const t = (idx + 0.5) / list.length;
      const segLen = o.width * scale;
      const STROKE = 6;
      let x = 0, y = 0, w = 0, h = 0;
      if (side === 0) {
        x = px + t * roomW - segLen / 2; y = py + roomL - STROKE / 2;
        w = segLen; h = STROKE;
      } else if (side === 2) {
        x = px + t * roomW - segLen / 2; y = py - STROKE / 2;
        w = segLen; h = STROKE;
      } else if (side === 1) {
        x = px + roomW - STROKE / 2; y = py + t * roomL - segLen / 2;
        w = STROKE; h = segLen;
      } else {
        x = px - STROKE / 2; y = py + t * roomL - segLen / 2;
        w = STROKE; h = segLen;
      }
      ctx.fillStyle = o.type === "door" ? "#f97316" : "#38bdf8";
      ctx.fillRect(x, y, w, h);
      // маркер
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(o.type === "door" ? "Д" : "О", x + w / 2, y + h / 2);
    });
  });

  return { px, py, roomW, roomL, scale };
}

/**
 * Создаёт canvas с готовым изображением плана.
 */
function renderPlanToCanvas(opts: ExportOptions, width = 1200, height = 850): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  // Фон
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Шапка
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(opts.title || "RoomScan AI · План помещения", 40, 40);

  ctx.fillStyle = "#64748b";
  ctx.font = "12px monospace";
  ctx.fillText(new Date().toLocaleString("ru-RU"), 40, 60);

  if (!opts.scan) {
    ctx.fillStyle = "#dc2626";
    ctx.font = "16px sans-serif";
    ctx.fillText("Нет данных скана. Сначала отсканируйте помещение.", 40, 120);
    return canvas;
  }

  // Метрики
  const metrics = [
    { l: "Ширина",  v: `${opts.scan.width} м` },
    { l: "Длина",   v: `${opts.scan.length} м` },
    { l: "Высота",  v: `${opts.scan.height} м` },
    { l: "Площадь", v: `${opts.scan.area} м²` },
    { l: "Дверей",  v: `${opts.scan.doors ?? 0}` },
    { l: "Окон",    v: `${opts.scan.windows ?? 0}` },
  ];
  metrics.forEach((m, i) => {
    const x = 40 + i * 170;
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x, 80, 155, 50);
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(x, 80, 155, 50);
    ctx.fillStyle = "#16a34a";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "left";
    ctx.fillText(m.v, x + 10, 110);
    ctx.fillStyle = "#64748b";
    ctx.font = "11px sans-serif";
    ctx.fillText(m.l, x + 10, 124);
  });

  // План
  const { px, py, roomW, roomL, scale } = drawPlan(ctx, opts.scan, 40, 160, 720, 500);

  // Мебель (если placed передан)
  if (opts.placed && opts.placed.length > 0) {
    // в planner координатах SVG viewBox 280×250 → пересчитать
    const PLAN_VB_W = 280;
    const PLAN_VB_L = 250;
    const sx = roomW / PLAN_VB_W;
    const sy = roomL / PLAN_VB_L;
    opts.placed.forEach((p) => {
      const x = px + p.x * sx;
      const y = py + p.y * sy;
      const w = p.w * sx;
      const h = p.h * sy;
      ctx.fillStyle = "rgba(34,197,94,0.20)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(34,197,94,0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      ctx.fillStyle = "#16a34a";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.name.split(" ")[0], x + w / 2, y + h / 2 + 3);
    });
  }

  // Список мебели справа
  if (opts.cart.length > 0) {
    const lx = 800;
    let ly = 180;
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Мебель в плане", lx, ly);
    ly += 20;
    ctx.font = "11px sans-serif";
    let total = 0;
    opts.cart.forEach((c) => {
      ctx.fillStyle = "#0f172a";
      ctx.fillText(`• ${c.name}`, lx, ly);
      ctx.fillStyle = "#64748b";
      ctx.fillText(`  ${c.w}×${c.d} см · ${c.priceNum.toLocaleString("ru-RU")} ₽`, lx, ly + 13);
      ly += 30;
      total += c.priceNum;
    });
    ctx.fillStyle = "#16a34a";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`Итого: ${total.toLocaleString("ru-RU")} ₽`, lx, ly + 10);
  }

  // Легенда
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Легенда:", 40, 700);
  ctx.fillStyle = "#f97316"; ctx.fillRect(110, 692, 12, 12);
  ctx.fillStyle = "#0f172a"; ctx.fillText("дверь", 128, 700);
  ctx.fillStyle = "#38bdf8"; ctx.fillRect(180, 692, 12, 12);
  ctx.fillStyle = "#0f172a"; ctx.fillText("окно", 198, 700);

  // Footer
  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText("Сгенерировано RoomScan AI · roomscan-ai.ru", width - 40, height - 20);

  // используем scale, чтобы линтер был доволен
  void scale;

  return canvas;
}

export function exportPlanToPNG(opts: ExportOptions, filename = "roomscan-plan.png") {
  const canvas = renderPlanToCanvas(opts);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

export function exportPlanToPDF(opts: ExportOptions, filename = "roomscan-plan.pdf") {
  const canvas = renderPlanToCanvas(opts, 1200, 850);
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  // a4 landscape = 842 × 595 pt
  const pdfW = A4_H;  // landscape ширина
  const pdfH = A4_W;
  // Вписываем картинку с сохранением пропорций
  const imgRatio = canvas.width / canvas.height;
  const pageRatio = pdfW / pdfH;
  let imgW = pdfW - 40;
  let imgH = imgW / imgRatio;
  if (imgH > pdfH - 40) {
    imgH = pdfH - 40;
    imgW = imgH * imgRatio;
  }
  pdf.addImage(imgData, "PNG", (pdfW - imgW) / 2, (pdfH - imgH) / 2, imgW, imgH);
  void pageRatio;
  pdf.save(filename);
}
