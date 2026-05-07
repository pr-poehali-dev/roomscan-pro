import { useEffect, useMemo, useRef, useState } from "react";
import { type FloorPlan, type FurnitureItem } from "@/lib/floorPlan";
import { type Pt } from "./planCanvasGeom";
import { renderPlan } from "./planCanvasRenderer";
import { usePlanCanvasInteractions } from "./usePlanCanvasInteractions";

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
    () => (p: Pt) => ({
      x: (p.x - offset.x) * scale,
      y: (p.y - offset.y) * scale,
    }),
    [offset.x, offset.y, scale],
  );

  /* ---------- интерактив (вынесен в хук) ---------- */
  const {
    drawingWall,
    hoverPos,
    panning,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
  } = usePlanCanvasInteractions({
    plan,
    onChange,
    tool,
    pendingFurniture,
    onSelect,
    scale,
    offset,
    onOffsetChange,
  });

  /* ---------- отрисовка (вынесена в renderer) ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderPlan({
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
    });
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
