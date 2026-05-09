import Icon from "@/components/ui/icon";
import ModularHouseScene from "@/components/3d/ModularHouseScene";
import {
  BlockModule,
  HousePlacement,
  HouseSpec,
  MODULE_TYPE_LABELS,
  ModularHouseProject,
  getModule,
} from "@/lib/modular-houses";
import { formatRub } from "@/lib/engineering";
import LayoutVariantPicker from "./LayoutVariantPicker";
import HouseProjectTabs from "./HouseProjectTabs";

type Mode = "catalog" | "constructor";

interface Props {
  mode: Mode;
  loadedId: number | null;
  activeProject: ModularHouseProject;
  project: ModularHouseProject;
  spec: HouseSpec;
  activeLayout: HousePlacement[];
  customLayout: HousePlacement[];
  selectedModuleIndex: number | null;
  setSelectedModuleIndex: (i: number | null) => void;
  onMoveModule: (idx: number, newPos: [number, number]) => void;
  onCanvasReady: (c: HTMLCanvasElement) => void;
  setPicker: (v: boolean) => void;
  removeModule: (idx: number) => void;
  variantId: string;
  onSelectVariant: (id: string) => void;
}

/**
 * Левая колонка раздела: тулбар с заголовком, 3D-сцена,
 * подсказка по drag-and-drop, карточка выбранного модуля,
 * описание проекта (catalog), список модулей (constructor).
 * Логика 1:1 перенесена из ModularHousesSection.tsx без изменений.
 */
export default function HousesScenePanel({
  mode,
  loadedId,
  activeProject,
  project,
  spec,
  activeLayout,
  customLayout,
  selectedModuleIndex,
  setSelectedModuleIndex,
  onMoveModule,
  onCanvasReady,
  setPicker,
  removeModule,
  variantId,
  onSelectVariant,
}: Props) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            3D-сборка дома
            {loadedId && <span className="ml-1 text-primary">· #{loadedId}</span>}
          </p>
          <p className="text-base font-bold text-foreground">
            {activeProject.name}
            {mode === "catalog" && ` · ${project.area} м²`}
            {mode === "constructor" && ` · ${spec.totalArea} м²`}
          </p>
        </div>
        {mode === "constructor" && (
          <button
            onClick={() => setPicker(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground flex items-center gap-1.5"
          >
            <Icon name="Plus" size={12} />
            Добавить модуль
          </button>
        )}
      </div>

      {mode === "catalog" && project.variants && project.variants.length > 1 && (
        <LayoutVariantPicker
          variants={project.variants}
          selectedId={variantId}
          onSelect={(id) => {
            onSelectVariant(id);
            setSelectedModuleIndex(null);
          }}
        />
      )}

      {mode === "constructor" && customLayout.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
          <Icon name="Move" size={13} className="text-primary" />
          <span className="text-foreground font-medium">
            Перетаскивай модули мышкой по участку. Шаг сетки — 0.5 м.
          </span>
        </div>
      )}

      {activeLayout.length > 0 ? (
        <ModularHouseScene
          project={activeProject}
          selectedIndex={selectedModuleIndex}
          onSelectModule={setSelectedModuleIndex}
          onMoveModule={mode === "constructor" ? onMoveModule : undefined}
          onCanvasReady={onCanvasReady}
          height={540}
        />
      ) : (
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center bg-card">
          <Icon name="Boxes" size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Пустая площадка. Добавь первый модуль.
          </p>
          <button
            onClick={() => setPicker(true)}
            className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
          >
            Добавить модуль
          </button>
        </div>
      )}

      {selectedModuleIndex !== null && activeLayout[selectedModuleIndex] && (
        <SelectedModuleCard
          module={getModule(activeLayout[selectedModuleIndex].moduleId)!}
          onClose={() => setSelectedModuleIndex(null)}
        />
      )}

      {mode === "catalog" && (
        <HouseProjectTabs
          project={project}
          layout={activeLayout}
          spec={spec}
          variantName={
            project.variants?.find((v) => v.id === variantId)?.name ?? variantId
          }
        />
      )}

      {mode === "constructor" && customLayout.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="font-bold text-foreground flex items-center gap-2 mb-3">
            <Icon name="LayoutList" size={15} className="text-primary" />
            Состав проекта ({customLayout.length} модулей · {spec.totalArea} м²)
          </p>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {customLayout.map((p, idx) => {
              const m = getModule(p.moduleId);
              if (!m) return null;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                    selectedModuleIndex === idx ? "bg-primary/10" : "hover:bg-secondary"
                  }`}
                  onClick={() => setSelectedModuleIndex(idx)}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-border"
                    style={{ background: m.color }}
                  />
                  <Icon name={m.icon} size={14} className="text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{m.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {MODULE_TYPE_LABELS[m.type]} · {m.area} м² · {formatRub(m.price)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeModule(idx);
                    }}
                    className="text-muted-foreground hover:text-destructive p-1"
                    aria-label="Удалить"
                  >
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Локальные хелперы ───────── */

function SelectedModuleCard({ module: m, onClose }: { module: BlockModule; onClose: () => void }) {
  return (
    <div className="bg-card border-2 border-primary/40 rounded-xl p-4 relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Закрыть"
      >
        <Icon name="X" size={14} />
      </button>
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center border border-border"
          style={{ background: m.color }}
        >
          <Icon name={m.icon} size={20} className="text-foreground/60" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
            {MODULE_TYPE_LABELS[m.type]}
          </p>
          <p className="font-bold text-foreground">{m.name}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Габариты</p>
              <p className="text-[11px] font-bold font-mono">
                {m.size[0]}×{m.size[2]} м
              </p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Площадь</p>
              <p className="text-[11px] font-bold">{m.area} м²</p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Цена</p>
              <p className="text-[11px] font-bold text-primary">{formatRub(m.price)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}