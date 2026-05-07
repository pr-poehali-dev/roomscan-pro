import { Suspense, lazy, useState } from "react";
import Icon from "@/components/ui/icon";
import PlanCanvas from "./PlanCanvas";
import PlannerToolbar from "./PlannerToolbar";
import FurnitureCatalog from "./FurnitureCatalog";
import PropertiesPanel from "./PropertiesPanel";
import FloorPlanHeader from "./FloorPlanHeader";
import { FloorPlanStats, Hints } from "./FloorPlanStats";
import { useFloorPlanState } from "./useFloorPlanState";

// Three.js — тяжёлая зависимость, грузим лениво только при включении 3D
const PlanScene3D = lazy(() => import("./PlanScene3D"));

/**
 * Полный профессиональный редактор плана этажа.
 * - Слева: каталог мебели
 * - В центре: 2D-canvas с панелью инструментов сверху
 * - Справа: свойства выделенного элемента + сводка по плану
 *
 * Все изменения автоматически сохраняются в localStorage.
 */
export default function FloorPlanEditor() {
  const {
    plan, setPlan,
    tool, setTool,
    pendingFurn, setPendingFurn,
    selected, setSelected,
    scale,
    offset, setOffset,
    canUndo,
    stats,
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
  } = useFloorPlanState();

  const [view, setView] = useState<"2d" | "3d">("2d");

  return (
    <div className="space-y-3">
      {/* Шапка: имя плана и быстрые действия */}
      <FloorPlanHeader
        plan={plan}
        setPlan={setPlan}
        stats={stats}
        loadFromScan={loadFromScan}
        newRect={newRect}
        importPlanJson={importPlanJson}
        exportPlanJson={exportPlanJson}
        clearAll={clearAll}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-3">
        {/* Левая колонка — каталог */}
        <div className="space-y-3 order-2 lg:order-1">
          <FurnitureCatalog selected={pendingFurn} onSelect={setPendingFurn} />
        </div>

        {/* Центр — холст */}
        <div className="space-y-2 order-1 lg:order-2">
          <div className="flex items-center gap-2 flex-wrap">
            {view === "2d" && (
              <PlannerToolbar
                tool={tool}
                onToolChange={(t) => {
                  setTool(t);
                  if (t !== "furniture") setPendingFurn(null);
                }}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onZoomFit={zoomFit}
                onUndo={handleUndo}
                canUndo={canUndo}
              />
            )}
            <div className="ml-auto inline-flex bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => setView("2d")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  view === "2d" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon name="LayoutGrid" size={13} />
                2D
              </button>
              <button
                onClick={() => setView("3d")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  view === "3d" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon name="Box" size={13} />
                3D-вид
              </button>
            </div>
          </div>

          <div className="h-[65vh] min-h-[500px] bg-white border border-border rounded-xl overflow-hidden">
            {view === "2d" ? (
              <PlanCanvas
                plan={plan}
                onChange={handleChange}
                tool={tool}
                pendingFurniture={pendingFurn}
                selected={selected}
                onSelect={setSelected}
                scale={scale}
                offset={offset}
                onOffsetChange={setOffset}
              />
            ) : (
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-muted-foreground">
                  <Icon name="Loader2" size={28} className="animate-spin text-primary" />
                  <p className="text-sm">Загружаю 3D-движок…</p>
                </div>
              }>
                <PlanScene3D plan={plan} />
              </Suspense>
            )}
          </div>

          {view === "2d" && <Hints tool={tool} />}
          {view === "3d" && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 flex items-start gap-2">
              <Icon name="Sparkles" size={13} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-foreground leading-relaxed">
                Полноценная 3D-визуализация плана. Стены строятся с проёмами для дверей и окон,
                мебель отображается в объёме. Управление мышью: ЛКМ — поворот, ПКМ — пан, колесо — зум.
              </p>
            </div>
          )}
        </div>

        {/* Правая колонка — свойства + статистика */}
        <div className="space-y-3 order-3">
          <PropertiesPanel
            plan={plan}
            selected={selected}
            onChange={handleChange}
            onDeselect={() => setSelected(null)}
          />

          <FloorPlanStats stats={stats} />
        </div>
      </div>
    </div>
  );
}