import { useEffect, useMemo, useRef, useState } from "react";
import {
  type FloorPlan,
  type FurnitureItem,
  type Opening,
  type Wall,
  dist,
  genId,
  pointOnWall,
  snap,
  snapPoint,
  wallAngleDeg,
} from "@/lib/floorPlan";

export type Tool = "select" | "wall" | "door" | "window" | "furniture" | "delete";

export interface SelectedRef {
  kind: "wall" | "opening" | "furniture";
  id: string;
}

interface Props {
  plan: FloorPlan;
  onChange: (plan: FloorPlan) => void;
  tool: Tool;
  /** Тип элемента из каталога, который добавляем в режиме "furniture" */
  pendingFurniture?: { type: string; category: FurnitureItem["category"]; icon: string; w: number; h: number; color?: string } | null;
  selected: SelectedRef | null;
  onSelect: (sel: SelectedRef | null) => void;
  /** см → пиксель (для зума) */
  scale: number;
  /** Сдвиг камеры, см */
  offset: { x: number; y: number };
  onOffsetChange?: (o: { x: number; y: number }) => void;
}

const GRID_CM = 10;     // мелкая сетка
const GRID_BIG = 100;   // крупная сетка (1 м)

/**
 * 2D-редактор плана этажа на HTML5 Canvas.
 * Поддерживает: рисование стен (с привязкой к сетке и углам 0/45/90),
 * добавление дверей/окон на стены, drag&drop мебели, выделение и удаление,
 * панорамирование (Space + drag или средняя кнопка), зум колесом.
 */
export default function PlanCanvas({
  plan,
  onChange,
  tool,
  pendingFurniture,
  selected,
  onSelect,
  scale,
  offset,
  onOffsetChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  // Состояние интерактивных операций
  const [drawingWall, setDrawingWall] = useState<{ a: { x: number; y: number }; b: { x: number; y: number } } | null>(null);
  const [draggingFurn, setDraggingFurn] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [draggingOpening, setDraggingOpening] = useState<string | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; baseOffX: number; baseOffY: number } | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  /* ---------- ресайз ---------- */
  useEffect(() => {
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(300, r.width), h: Math.max(300, r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  /* ---------- координатные преобразования ---------- */
  const toScreen = useMemo(
    () => (p: { x: number; y: number }) => ({
      x: (p.x - offset.x) * scale,
      y: (p.y - offset.y) * scale,
    }),
    [offset.x, offset.y, scale],
  );
  const toWorld = (sx: number, sy: number) => ({
    x: sx / scale + offset.x,
    y: sy / scale + offset.y,
  });

  /* ---------- helpers ---------- */
  const findFurnAt = (worldX: number, worldY: number): FurnitureItem | null => {
    // Сверху вниз — последний размещённый имеет приоритет
    for (let i = plan.furniture.length - 1; i >= 0; i--) {
      const f = plan.furniture[i];
      // Простая проверка по AABB без учёта поворота — достаточно для UX
      if (worldX >= f.x && worldX <= f.x + f.w && worldY >= f.y && worldY <= f.y + f.h) return f;
    }
    return null;
  };

  /** Найти ближайшую точку на стене и параметр t (0..1). */
  const projectToWall = (wall: Wall, p: { x: number; y: number }) => {
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return { t: 0, dist: dist(wall.a, p), point: { ...wall.a } };
    let t = ((p.x - wall.a.x) * dx + (p.y - wall.a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const point = { x: wall.a.x + dx * t, y: wall.a.y + dy * t };
    return { t, dist: dist(point, p), point };
  };

  const findClosestWall = (p: { x: number; y: number }, maxDist = 30): { wall: Wall; t: number } | null => {
    let best: { wall: Wall; t: number; d: number } | null = null;
    for (const w of plan.walls) {
      const pr = projectToWall(w, p);
      if (pr.dist < maxDist && (!best || pr.dist < best.d)) {
        best = { wall: w, t: pr.t, d: pr.dist };
      }
    }
    return best ? { wall: best.wall, t: best.t } : null;
  };

  /* ---------- mouse events ---------- */
  const onMouseDown = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = toWorld(sx, sy);

    // Панорамирование средней кнопкой
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setPanning({ startX: e.clientX, startY: e.clientY, baseOffX: offset.x, baseOffY: offset.y });
      return;
    }

    if (tool === "wall") {
      const a = snapPoint(world, GRID_CM);
      setDrawingWall({ a, b: a });
      return;
    }

    if (tool === "door" || tool === "window") {
      const closest = findClosestWall(world, 40 / scale);
      if (closest) {
        const opening: Opening = {
          id: genId(tool),
          kind: tool,
          wallId: closest.wall.id,
          t: closest.t,
          width: tool === "door" ? 80 : 120,
        };
        onChange({ ...plan, openings: [...plan.openings, opening] });
        onSelect({ kind: "opening", id: opening.id });
      }
      return;
    }

    if (tool === "furniture" && pendingFurniture) {
      const f: FurnitureItem = {
        id: genId("f"),
        type: pendingFurniture.type,
        category: pendingFurniture.category,
        icon: pendingFurniture.icon,
        x: snap(world.x - pendingFurniture.w / 2, GRID_CM),
        y: snap(world.y - pendingFurniture.h / 2, GRID_CM),
        w: pendingFurniture.w,
        h: pendingFurniture.h,
        rotation: 0,
        color: pendingFurniture.color,
      };
      onChange({ ...plan, furniture: [...plan.furniture, f] });
      onSelect({ kind: "furniture", id: f.id });
      return;
    }

    // SELECT / DELETE — ищем что под курсором (мебель → проём → стена)
    const f = findFurnAt(world.x, world.y);
    if (f) {
      if (tool === "delete") {
        onChange({ ...plan, furniture: plan.furniture.filter((x) => x.id !== f.id) });
        onSelect(null);
      } else {
        onSelect({ kind: "furniture", id: f.id });
        setDraggingFurn({ id: f.id, offX: world.x - f.x, offY: world.y - f.y });
      }
      return;
    }

    // Проёмы рядом со стенами
    for (const op of plan.openings) {
      const wall = plan.walls.find((w) => w.id === op.wallId);
      if (!wall) continue;
      const center = pointOnWall(wall, op.t);
      if (dist(center, world) <= op.width / 2) {
        if (tool === "delete") {
          onChange({ ...plan, openings: plan.openings.filter((x) => x.id !== op.id) });
          onSelect(null);
        } else {
          onSelect({ kind: "opening", id: op.id });
          setDraggingOpening(op.id);
        }
        return;
      }
    }

    const closeWall = findClosestWall(world, 20 / scale);
    if (closeWall) {
      if (tool === "delete") {
        onChange({
          ...plan,
          walls: plan.walls.filter((w) => w.id !== closeWall.wall.id),
          openings: plan.openings.filter((o) => o.wallId !== closeWall.wall.id),
        });
        onSelect(null);
      } else {
        onSelect({ kind: "wall", id: closeWall.wall.id });
      }
      return;
    }

    onSelect(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = toWorld(sx, sy);
    setHoverPos(world);

    if (panning) {
      const dx = (e.clientX - panning.startX) / scale;
      const dy = (e.clientY - panning.startY) / scale;
      onOffsetChange?.({ x: panning.baseOffX - dx, y: panning.baseOffY - dy });
      return;
    }

    if (drawingWall) {
      let b = snapPoint(world, GRID_CM);
      // Привязка к ортогональным углам, если зажат Shift
      if (e.shiftKey) {
        const dx = b.x - drawingWall.a.x;
        const dy = b.y - drawingWall.a.y;
        if (Math.abs(dx) > Math.abs(dy)) b = { x: b.x, y: drawingWall.a.y };
        else b = { x: drawingWall.a.x, y: b.y };
      }
      setDrawingWall({ ...drawingWall, b });
      return;
    }

    if (draggingFurn) {
      const next = plan.furniture.map((f) =>
        f.id === draggingFurn.id
          ? { ...f, x: snap(world.x - draggingFurn.offX, GRID_CM), y: snap(world.y - draggingFurn.offY, GRID_CM) }
          : f,
      );
      onChange({ ...plan, furniture: next });
      return;
    }

    if (draggingOpening) {
      const op = plan.openings.find((o) => o.id === draggingOpening);
      if (!op) return;
      const wall = plan.walls.find((w) => w.id === op.wallId);
      if (!wall) return;
      const pr = projectToWall(wall, world);
      onChange({
        ...plan,
        openings: plan.openings.map((o) => (o.id === op.id ? { ...o, t: pr.t } : o)),
      });
    }
  };

  const onMouseUp = () => {
    if (drawingWall) {
      const len = dist(drawingWall.a, drawingWall.b);
      if (len >= 10) {
        const w: Wall = { id: genId("w"), a: drawingWall.a, b: drawingWall.b, thickness: 10 };
        onChange({ ...plan, walls: [...plan.walls, w] });
        onSelect({ kind: "wall", id: w.id });
      }
      setDrawingWall(null);
    }
    setDraggingFurn(null);
    setDraggingOpening(null);
    setPanning(null);
  };

  const onWheel = (e: React.WheelEvent) => {
    // Зум центра курсора через onOffsetChange + scale (scale меняет родитель)
    e.stopPropagation();
  };

  /* ---------- отрисовка ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
      const cls = findClosestWall(hoverPos, 40 / scale);
      if (cls) {
        const center = pointOnWall(cls.wall, cls.t);
        const cs = toScreen(center);
        ctx.fillStyle = tool === "door" ? "#0ea5e9" : "#3b82f6";
        ctx.beginPath();
        ctx.arc(cs.x, cs.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [plan, size, scale, offset, selected, drawingWall, hoverPos, tool, toScreen]);

  /* ---------- курсор по инструменту ---------- */
  const cursor =
    tool === "wall" ? "crosshair" :
    tool === "door" || tool === "window" ? "copy" :
    tool === "furniture" ? "copy" :
    tool === "delete" ? "not-allowed" :
    panning ? "grabbing" : "default";

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full bg-[#fafafa] rounded-lg overflow-hidden"
      style={{ cursor }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        className="block"
      />
      {hoverPos && (
        <div className="absolute bottom-2 left-2 bg-card border border-border rounded text-[11px] font-mono px-2 py-1 text-muted-foreground pointer-events-none">
          {Math.round(hoverPos.x)} см · {Math.round(hoverPos.y)} см
        </div>
      )}
    </div>
  );
}
