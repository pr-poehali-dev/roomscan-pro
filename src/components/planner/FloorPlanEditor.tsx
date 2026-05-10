import { Suspense, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import PlanCanvas from "./PlanCanvas";
import PlannerToolbar from "./PlannerToolbar";
import FurnitureCatalog from "./FurnitureCatalog";
import PropertiesPanel from "./PropertiesPanel";
import FloorPlanHeader from "./FloorPlanHeader";
import { FloorPlanStats, Hints } from "./FloorPlanStats";
import CatalogLinkBanner from "./CatalogLinkBanner";
import { useFloorPlanState } from "./useFloorPlanState";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

// Three.js — тяжёлая зависимость, грузим лениво только при включении 3D
const PlanScene3D = lazyWithRetry(() => import("./PlanScene3D"));

/**
 * Полный профессиональный редактор плана этажа.
 * - Слева: каталог мебели
 * - В центре: 2D-canvas с панелью инструментов сверху
 * - Справа: свойства выделенного элемента + сводка по плану
 *
 * Все изменения автоматически сохраняются в localStorage.
 */
interface Props {
  /** Внешний обработчик перехода в раздел каталога (опционально). */
  onNavigateCatalog?: () => void;
}

export default function FloorPlanEditor({ onNavigateCatalog }: Props = {}) {
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

  const [view, setView] = useState<"2d" | "3d" | "split">("2d");
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [mobilePropsOpen, setMobilePropsOpen] = useState(false);

  // Когда выбрали элемент на мобиле — авто-открыть панель свойств
  useEffect(() => {
    if (selected && typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobilePropsOpen(true);
    }
  }, [selected]);

  // После выбора мебели в каталоге на мобиле — закрыть drawer, чтобы видеть холст
  useEffect(() => {
    if (pendingFurn && mobileCatalogOpen) {
      setMobileCatalogOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFurn]);

  return (
    <div className="space-y-3">
      {/* Связка с каталогом мебели */}
      <CatalogLinkBanner
        furnitureCount={stats.furniture}
        onNavigateCatalog={onNavigateCatalog}
      />

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
        {/* Левая колонка — каталог (только десктоп) */}
        <div className="hidden lg:block space-y-3 lg:order-1">
          <FurnitureCatalog selected={pendingFurn} onSelect={setPendingFurn} />
        </div>

        {/* Мобильные быстрые действия (только < lg) */}
        <div className="flex lg:hidden gap-2 order-1">
          <button
            type="button"
            onClick={() => setMobileCatalogOpen(true)}
            aria-label="Открыть каталог мебели"
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-3 py-2.5 rounded-lg text-sm font-bold shadow"
          >
            <Icon name="Sofa" size={14} aria-hidden="true" />
            Каталог
          </button>
          <button
            type="button"
            onClick={() => setMobilePropsOpen(true)}
            aria-label="Открыть свойства и статистику плана"
            className="flex-1 flex items-center justify-center gap-2 bg-card border border-border text-foreground px-3 py-2.5 rounded-lg text-sm font-bold"
          >
            <Icon name="SlidersHorizontal" size={14} aria-hidden="true" />
            Свойства
          </button>
        </div>

        {/* Центр — холст */}
        <div className="space-y-2 order-2 lg:order-2">
          <div className="flex items-center gap-2 flex-wrap">
            {(view === "2d" || view === "split") && (
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
            <div className="ml-auto inline-flex bg-secondary rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setView("2d")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  view === "2d" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Только 2D-план"
              >
                <Icon name="LayoutGrid" size={13} />
                2D
              </button>
              <button
                onClick={() => setView("split")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  view === "split" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Split-view: 2D-план и 3D-превью одновременно"
              >
                <Icon name="Columns2" size={13} />
                Split
              </button>
              <button
                onClick={() => setView("3d")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  view === "3d" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Только 3D-вид"
              >
                <Icon name="Box" size={13} />
                3D
              </button>
            </div>
          </div>

          {view === "split" ? (
            <div className="h-[65vh] min-h-[500px] grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-white border border-border rounded-xl overflow-hidden">
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
              <div className="bg-white border border-border rounded-xl overflow-hidden relative">
                <span className="absolute top-2 left-2 z-10 bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-sm shadow">
                  Live 3D
                </span>
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-muted-foreground">
                    <Icon name="Loader2" size={28} className="animate-spin text-primary" />
                    <p className="text-sm">Загружаю 3D-движок…</p>
                  </div>
                }>
                  <PlanScene3D plan={plan} />
                </Suspense>
              </div>
            </div>
          ) : (
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
          )}

          {view === "2d" && <Hints tool={tool} />}
          {view === "split" && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 flex items-start gap-2">
              <Icon name="Columns2" size={13} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-foreground leading-relaxed">
                <strong>Split-view:</strong> рисуете слева — мгновенно видите справа в 3D.
                Идеально для презентации клиенту: «вот так это будет выглядеть».
              </p>
            </div>
          )}
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

        {/* Правая колонка — свойства + статистика (только десктоп) */}
        <div className="hidden lg:block space-y-3 lg:order-3">
          <PropertiesPanel
            plan={plan}
            selected={selected}
            onChange={handleChange}
            onDeselect={() => setSelected(null)}
          />

          <FloorPlanStats stats={stats} />
        </div>
      </div>

      {/* Мобильный drawer: Каталог */}
      {mobileCatalogOpen && (
        <MobileBottomDrawer
          title="Каталог мебели"
          onClose={() => setMobileCatalogOpen(false)}
        >
          <FurnitureCatalog selected={pendingFurn} onSelect={setPendingFurn} />
        </MobileBottomDrawer>
      )}

      {/* Мобильный drawer: Свойства + Статистика */}
      {mobilePropsOpen && (
        <MobileBottomDrawer
          title={selected ? "Свойства элемента" : "Статистика плана"}
          onClose={() => setMobilePropsOpen(false)}
        >
          <div className="space-y-3">
            <PropertiesPanel
              plan={plan}
              selected={selected}
              onChange={handleChange}
              onDeselect={() => setSelected(null)}
            />
            <FloorPlanStats stats={stats} />
          </div>
        </MobileBottomDrawer>
      )}
    </div>
  );
}

/** Лёгкий нижний drawer для мобильных без зависимостей. */
function MobileBottomDrawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Блокируем body scroll, пока drawer открыт
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Закрыть панель"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
      />
      <div className="absolute inset-x-0 bottom-0 bg-card border-t border-border rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-in-up">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-10 h-1 bg-border rounded-full" />
          <h3 className="font-bold text-foreground text-sm mt-2">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="text-muted-foreground hover:text-foreground p-1 -mr-1 mt-2"
          >
            <Icon name="X" size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">{children}</div>
      </div>
    </div>
  );
}