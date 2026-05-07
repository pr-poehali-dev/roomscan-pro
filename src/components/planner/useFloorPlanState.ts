import { useEffect, useMemo, useRef, useState } from "react";
import {
  emptyPlan,
  loadFloorPlan,
  planAreaM2,
  planPerimeterM,
  rectRoomPlan,
  saveFloorPlan,
  type CatalogItem,
  type FloorPlan,
} from "@/lib/floorPlan";
import { getLastScan } from "@/lib/scanStore";
import type { SelectedRef, Tool } from "./PlanCanvas";

/**
 * Хук со всем состоянием и операциями редактора плана:
 * - текущий план + история (Undo)
 * - инструмент, выбранная мебель из каталога, выделение элемента
 * - масштаб и сдвиг камеры
 * - операции: handleChange, handleUndo, zoomIn/Out/Fit, loadFromScan,
 *   newRect, clearAll, exportPlanJson, importPlanJson
 * - вычисленная статистика плана
 *
 * Логика 1:1 перенесена из FloorPlanEditor.tsx без изменений.
 */
export function useFloorPlanState() {
  const [plan, setPlan] = useState<FloorPlan>(() => loadFloorPlan() || emptyPlan("Мой план"));
  const [tool, setTool] = useState<Tool>("select");
  const [pendingFurn, setPendingFurn] = useState<CatalogItem | null>(null);
  const [selected, setSelected] = useState<SelectedRef | null>(null);
  const [scale, setScale] = useState(0.6); // 1 см = 0.6 пикселя по умолчанию
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // История для Undo
  const historyRef = useRef<FloorPlan[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Сохраняем план в localStorage при каждом изменении (с debounce)
  useEffect(() => {
    const t = setTimeout(() => saveFloorPlan(plan), 400);
    return () => clearTimeout(t);
  }, [plan]);

  // Если выбрали мебель — переключаем инструмент в режим размещения
  useEffect(() => {
    if (pendingFurn) setTool("furniture");
    else if (tool === "furniture") setTool("select");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFurn]);

  const handleChange = (next: FloorPlan) => {
    historyRef.current.push(plan);
    if (historyRef.current.length > 50) historyRef.current.shift();
    setCanUndo(true);
    setPlan(next);
  };

  const handleUndo = () => {
    const prev = historyRef.current.pop();
    if (prev) {
      setPlan(prev);
      setCanUndo(historyRef.current.length > 0);
    }
  };

  const zoomIn = () => setScale((s) => Math.min(3, s * 1.2));
  const zoomOut = () => setScale((s) => Math.max(0.1, s / 1.2));
  const zoomFit = () => {
    if (plan.walls.length === 0) {
      setScale(0.6);
      setOffset({ x: 0, y: 0 });
      return;
    }
    const xs = plan.walls.flatMap((w) => [w.a.x, w.b.x]);
    const ys = plan.walls.flatMap((w) => [w.a.y, w.b.y]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = maxX - minX, h = maxY - minY;
    if (w === 0 || h === 0) return;
    // подгоняем масштаб под примерно 700×500 пикселей
    const sx = 700 / (w + 200);
    const sy = 500 / (h + 200);
    const newScale = Math.min(sx, sy);
    setScale(newScale);
    setOffset({ x: minX - 100, y: minY - 100 });
  };

  const loadFromScan = () => {
    const s = getLastScan();
    if (!s) {
      alert("Нет сохранённого скана. Сначала отсканируйте комнату на вкладке «Сканирование».");
      return;
    }
    if (!confirm("Создать прямоугольный план из последнего скана? Текущий план будет заменён.")) return;
    const next = rectRoomPlan(s.width, s.length, "План из скана");
    historyRef.current.push(plan);
    setCanUndo(true);
    setPlan(next);
    setSelected(null);
    setTimeout(zoomFit, 50);
  };

  const newRect = (preset: { w: number; h: number; name: string }) => {
    if (plan.walls.length > 0 && !confirm("Заменить текущий план?")) return;
    const next = rectRoomPlan(preset.w, preset.h, preset.name);
    historyRef.current.push(plan);
    setCanUndo(true);
    setPlan(next);
    setSelected(null);
    setTimeout(zoomFit, 50);
  };

  const clearAll = () => {
    if (!confirm("Очистить весь план?")) return;
    historyRef.current.push(plan);
    setCanUndo(true);
    setPlan(emptyPlan(plan.name));
    setSelected(null);
  };

  const exportPlanJson = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPlanJson = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json";
    inp.onchange = async () => {
      const file = inp.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as FloorPlan;
        if (data?.version !== 1) throw new Error("Несовместимый формат");
        historyRef.current.push(plan);
        setCanUndo(true);
        setPlan(data);
        setTimeout(zoomFit, 50);
      } catch (e) {
        alert("Не удалось загрузить файл: " + (e as Error).message);
      }
    };
    inp.click();
  };

  const stats = useMemo(
    () => ({
      area: planAreaM2(plan),
      perimeter: planPerimeterM(plan),
      walls: plan.walls.length,
      doors: plan.openings.filter((o) => o.kind === "door").length,
      windows: plan.openings.filter((o) => o.kind === "window").length,
      furniture: plan.furniture.length,
    }),
    [plan],
  );

  return {
    // state
    plan, setPlan,
    tool, setTool,
    pendingFurn, setPendingFurn,
    selected, setSelected,
    scale,
    offset, setOffset,
    canUndo,
    stats,
    // actions
    handleChange,
    handleUndo,
    zoomIn,
    zoomOut,
    zoomFit,
    loadFromScan,
    newRect,
    clearAll,
    exportPlanJson,
    importPlanJson,
  };
}
