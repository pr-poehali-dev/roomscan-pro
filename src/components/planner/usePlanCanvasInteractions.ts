import { useState } from "react";
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
} from "@/lib/floorPlan";
import type { SelectedRef, Tool } from "./PlanCanvas";
import {
  GRID_CM,
  findClosestWall,
  findFurnAt,
  projectToWall,
  type DrawingWall,
  type Pt,
} from "./planCanvasGeom";

interface Params {
  plan: FloorPlan;
  onChange: (plan: FloorPlan) => void;
  tool: Tool;
  pendingFurniture?: { type: string; category: FurnitureItem["category"]; icon: string; w: number; h: number; color?: string } | null;
  onSelect: (sel: SelectedRef | null) => void;
  scale: number;
  offset: Pt;
  onOffsetChange?: (o: Pt) => void;
}

/**
 * Хук со всем интерактивом 2D-редактора плана: рисование стен, добавление/перетаскивание
 * проёмов и мебели, выделение/удаление, панорамирование. Логика 1:1 перенесена
 * из PlanCanvas.tsx без изменений.
 */
export function usePlanCanvasInteractions({
  plan,
  onChange,
  tool,
  pendingFurniture,
  onSelect,
  scale,
  offset,
  onOffsetChange,
}: Params) {
  // Состояние интерактивных операций
  const [drawingWall, setDrawingWall] = useState<DrawingWall | null>(null);
  const [draggingFurn, setDraggingFurn] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [draggingOpening, setDraggingOpening] = useState<string | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; baseOffX: number; baseOffY: number } | null>(null);
  const [hoverPos, setHoverPos] = useState<Pt | null>(null);

  const toWorld = (sx: number, sy: number) => ({
    x: sx / scale + offset.x,
    y: sy / scale + offset.y,
  });

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
      const closest = findClosestWall(plan, world, 40 / scale);
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
    const f = findFurnAt(plan, world.x, world.y);
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

    const closeWall = findClosestWall(plan, world, 20 / scale);
    if (closeWall) {
      if (tool === "delete") {
        onChange({
          ...plan,
          walls: plan.walls.filter((w: Wall) => w.id !== closeWall.wall.id),
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

  return {
    drawingWall,
    hoverPos,
    panning,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
  };
}
