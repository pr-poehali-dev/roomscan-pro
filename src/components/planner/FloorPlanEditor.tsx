import PlanCanvas from "./PlanCanvas";
import PlannerToolbar from "./PlannerToolbar";
import FurnitureCatalog from "./FurnitureCatalog";
import PropertiesPanel from "./PropertiesPanel";
import FloorPlanHeader from "./FloorPlanHeader";
import { FloorPlanStats, Hints } from "./FloorPlanStats";
import { useFloorPlanState } from "./useFloorPlanState";

/**
 * Полный редактор плана этажа в стиле Remplanner / Planner5D.
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

          <div className="h-[60vh] min-h-[460px] bg-white border border-border rounded-xl overflow-hidden">
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
          </div>

          <Hints tool={tool} />
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
