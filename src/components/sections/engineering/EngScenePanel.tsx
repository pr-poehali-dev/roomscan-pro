import Icon from "@/components/ui/icon";
import EngineeringScene from "@/components/3d/EngineeringScene";
import {
  CATEGORY_LABELS,
  EquipmentItem,
  NodePlacement,
  NodeTemplate,
  formatRub,
  getEquipment,
} from "@/lib/engineering";

interface Props {
  baseTpl: NodeTemplate;
  tplWithLayout: NodeTemplate;
  customLayout: NodePlacement[];
  selectedEqId: string | null;
  setSelectedEqId: (id: string | null) => void;
  loadedId: number | null;
  editorOpen: boolean;
  setEditorOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  setProjectsOpen: (v: boolean) => void;
  setPicker: (v: boolean) => void;
  resetLayout: () => void;
  removeEquipment: (idx: number) => void;
  onMove: (eqId: string, newPos: [number, number, number]) => void;
  onCanvasReady: (c: HTMLCanvasElement) => void;
  projectsCount: number;
}

/**
 * Левая колонка: тулбар (3D + кнопки), 3D-сцена, info-bar редактора,
 * карточка выбранного оборудования и список размещения.
 * Логика 1:1 перенесена из EngineeringSection.tsx без изменений.
 */
export default function EngScenePanel({
  baseTpl,
  tplWithLayout,
  customLayout,
  selectedEqId,
  setSelectedEqId,
  loadedId,
  editorOpen,
  setEditorOpen,
  setProjectsOpen,
  setPicker,
  resetLayout,
  removeEquipment,
  onMove,
  onCanvasReady,
  projectsCount,
}: Props) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            3D-модель котельной
            {loadedId && <span className="ml-1 text-primary">· #{loadedId}</span>}
          </p>
          <p className="text-base font-bold text-foreground">
            {baseTpl.name} · {baseTpl.power} · {baseTpl.forArea}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setProjectsOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground flex items-center gap-1.5"
          >
            <Icon name="FolderOpen" size={12} />
            Мои проекты
            {projectsCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[9px]">
                {projectsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setEditorOpen((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              editorOpen ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}
          >
            <Icon name="Wrench" size={12} />
            {editorOpen ? "Скрыть" : "Редактор"}
          </button>
          <button
            onClick={resetLayout}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground flex items-center gap-1.5"
            title="Вернуть базовую комплектацию"
          >
            <Icon name="RotateCcw" size={12} />
          </button>
        </div>
      </div>

      {editorOpen && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
          <Icon name="Move" size={13} className="text-primary" />
          <span className="text-foreground font-medium">
            Режим редактирования: захвати оборудование мышкой и перетащи в нужное место.
          </span>
        </div>
      )}

      <EngineeringScene
        template={tplWithLayout}
        selectedId={selectedEqId}
        onSelect={(id) => setSelectedEqId(id)}
        onMove={editorOpen ? onMove : undefined}
        onCanvasReady={onCanvasReady}
        height={520}
      />

      {selectedEqId && (
        <SelectedEquipmentCard
          item={getEquipment(selectedEqId)!}
          onClose={() => setSelectedEqId(null)}
        />
      )}

      {editorOpen && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="font-bold text-foreground flex items-center gap-2">
              <Icon name="LayoutList" size={15} className="text-primary" />
              Размещение оборудования ({customLayout.length})
            </p>
            <button
              onClick={() => setPicker(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground flex items-center gap-1.5"
            >
              <Icon name="Plus" size={12} />
              Добавить
            </button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {customLayout.map((p, idx) => {
              const it = getEquipment(p.equipmentId);
              if (!it) return null;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                    selectedEqId === it.id ? "bg-primary/10" : "hover:bg-secondary"
                  }`}
                  onClick={() => setSelectedEqId(it.id)}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-border"
                    style={{ background: it.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{it.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {CATEGORY_LABELS[it.category]} · {formatRub(it.price)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEquipment(idx);
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

/* ───────── Локальный хелпер ───────── */

function SelectedEquipmentCard({ item, onClose }: { item: EquipmentItem; onClose: () => void }) {
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
          style={{ background: item.color }}
        >
          <Icon name="Package" size={20} className="text-foreground/40" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
            {CATEGORY_LABELS[item.category]} {item.brand && `· ${item.brand}`}
          </p>
          <p className="font-bold text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Параметры</p>
              <p className="text-[11px] font-bold">{item.specs}</p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Габариты</p>
              <p className="text-[11px] font-bold font-mono">
                {item.size[0]}×{item.size[1]}×{item.size[2]} м
              </p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Цена</p>
              <p className="text-[11px] font-bold text-primary">{formatRub(item.price)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
