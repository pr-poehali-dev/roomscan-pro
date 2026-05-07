import { type FloorPlan, dist, pointOnWall, wallAngleDeg } from "@/lib/floorPlan";
import type { SelectedRef, Tool } from "./PlanCanvas";
import { GRID_CM, GRID_BIG, findClosestWall, type DrawingWall, type Pt } from "./planCanvasGeom";

/**
 * Полная функция отрисовки плана на 2D-Canvas.
 * Рисует фон, сетку, полигон комнаты, мебель, стены, проёмы, превью рисуемой стены
 * и индикатор-курсор для проёмов. Логика и стили 1:1 перенесены из PlanCanvas.tsx.
 */

interface RenderParams {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  size: { w: number; h: number };
  plan: FloorPlan;
  scale: number;
  offset: Pt;
  selected: SelectedRef | null;
  drawingWall: DrawingWall | null;
  hoverPos: Pt | null;
  tool: Tool;
  toScreen: (p: Pt) => Pt;
}

export function renderPlan({
  ctx,
  canvas,
  size,
  plan,
  scale,
  offset,
  selected,
  drawingWall,
  hoverPos,
  tool,
  toScreen,
}: RenderParams) {
  canvas.width = size.w * window.devicePixelRatio;
  canvas.height = size.h * window.devicePixelRatio;
  canvas.style.width = `${size.w}px`;
  canvas.style.height = `${size.h}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

  // Фон
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, size.w, size.h);

  // Сетка (мелкая 10см, крупная 1м)
  const stepSmall = GRID_CM * scale;
  const stepBig = GRID_BIG * scale;
  if (stepSmall > 4) {
    ctx.strokeStyle = "#ececec";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const startX = -((offset.x * scale) % stepSmall);
    const startY = -((offset.y * scale) % stepSmall);
    for (let x = startX; x < size.w; x += stepSmall) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, size.h);
    }
    for (let y = startY; y < size.h; y += stepSmall) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(size.w, y + 0.5);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = "#d4d4d4";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const startBigX = -((offset.x * scale) % stepBig);
  const startBigY = -((offset.y * scale) % stepBig);
  for (let x = startBigX; x < size.w; x += stepBig) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, size.h);
  }
  for (let y = startBigY; y < size.h; y += stepBig) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(size.w, y + 0.5);
  }
  ctx.stroke();

  // Заполнение полигона комнаты (если стены образуют замкнутый контур — приближённо)
  if (plan.walls.length >= 3) {
    ctx.fillStyle = "rgba(34,197,94,0.04)";
    ctx.beginPath();
    const first = toScreen(plan.walls[0].a);
    ctx.moveTo(first.x, first.y);
    for (const w of plan.walls) {
      const b = toScreen(w.b);
      ctx.lineTo(b.x, b.y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Мебель
  for (const f of plan.furniture) {
    const tl = toScreen({ x: f.x, y: f.y });
    const w = f.w * scale;
    const h = f.h * scale;
    const isSel = selected?.kind === "furniture" && selected.id === f.id;
    ctx.save();
    ctx.translate(tl.x + w / 2, tl.y + h / 2);
    ctx.rotate((f.rotation * Math.PI) / 180);
    ctx.fillStyle = f.color || "#cbd5e1";
    ctx.strokeStyle = isSel ? "#22c55e" : "#475569";
    ctx.lineWidth = isSel ? 2.5 : 1;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    // Подпись
    if (w > 50 && h > 25) {
      ctx.fillStyle = "#1f2937";
      ctx.font = "11px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(f.type, 0, 0);
    }
    ctx.restore();
  }

  // Стены
  for (const w of plan.walls) {
    const a = toScreen(w.a);
    const b = toScreen(w.b);
    const isSel = selected?.kind === "wall" && selected.id === w.id;
    ctx.strokeStyle = isSel ? "#22c55e" : "#1f2937";
    ctx.lineWidth = Math.max(2, w.thickness * scale * 0.5);
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    // Подпись длины
    const lenCm = dist(w.a, w.b);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    ctx.save();
    ctx.fillStyle = "#374151";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lenText = lenCm >= 100 ? `${(lenCm / 100).toFixed(2)} м` : `${Math.round(lenCm)} см`;
    // Белая обводка для читаемости
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 3;
    ctx.strokeText(lenText, mx, my - 12);
    ctx.fillText(lenText, mx, my - 12);
    ctx.restore();
  }

  // Проёмы (двери/окна) — поверх стен
  for (const op of plan.openings) {
    const wall = plan.walls.find((w) => w.id === op.wallId);
    if (!wall) continue;
    const wlen = dist(wall.a, wall.b);
    const center = pointOnWall(wall, op.t);
    const cs = toScreen(center);
    const angle = wallAngleDeg(wall);
    const wPx = op.width * scale;
    const tPx = Math.max(2, wall.thickness * scale * 0.7);
    const isSel = selected?.kind === "opening" && selected.id === op.id;

    ctx.save();
    ctx.translate(cs.x, cs.y);
    ctx.rotate((angle * Math.PI) / 180);

    // Перекрываем стену под проёмом (фон)
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(-wPx / 2, -tPx / 2, wPx, tPx);

    if (op.kind === "door") {
      // Дверь: дуга открывания
      ctx.strokeStyle = isSel ? "#22c55e" : "#0ea5e9";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-wPx / 2, 0);
      ctx.arc(-wPx / 2, 0, wPx, 0, -Math.PI / 2, true);
      ctx.stroke();
      // Полотно двери
      ctx.beginPath();
      ctx.moveTo(-wPx / 2, 0);
      ctx.lineTo(-wPx / 2, -wPx);
      ctx.stroke();
    } else {
      // Окно: двойная линия
      ctx.strokeStyle = isSel ? "#22c55e" : "#3b82f6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-wPx / 2, -tPx / 4);
      ctx.lineTo(wPx / 2, -tPx / 4);
      ctx.moveTo(-wPx / 2, tPx / 4);
      ctx.lineTo(wPx / 2, tPx / 4);
      ctx.stroke();
    }

    ctx.restore();
    // Защита от выхода за пределы стены
    if (op.t * wlen + op.width / 2 > wlen || op.t * wlen - op.width / 2 < 0) {
      // визуально не страшно — пользователь может переместить
    }
  }

  // Превью текущей рисуемой стены
  if (drawingWall) {
    const a = toScreen(drawingWall.a);
    const b = toScreen(drawingWall.b);
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    // Длина
    const lenCm = dist(drawingWall.a, drawingWall.b);
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`${(lenCm / 100).toFixed(2)} м`, (a.x + b.x) / 2, (a.y + b.y) / 2 - 14);
  }

  // Курсор-индикатор для проёмов: подсветка ближайшей стены
  if ((tool === "door" || tool === "window") && hoverPos) {
    const cls = findClosestWall(plan, hoverPos, 40 / scale);
    if (cls) {
      const center = pointOnWall(cls.wall, cls.t);
      const cs = toScreen(center);
      ctx.fillStyle = tool === "door" ? "#0ea5e9" : "#3b82f6";
      ctx.beginPath();
      ctx.arc(cs.x, cs.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
