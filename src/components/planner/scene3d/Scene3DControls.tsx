import Icon from "@/components/ui/icon";
import type { FloorStyle, WallStyle } from "./textures";

interface Props {
  wallStyle: WallStyle;
  setWallStyle: (s: WallStyle) => void;
  floorStyle: FloorStyle;
  setFloorStyle: (s: FloorStyle) => void;
  showShadows: boolean;
  setShowShadows: (v: boolean | ((prev: boolean) => boolean)) => void;
  resetCamera: () => void;
  screenshot: () => void;
}

/**
 * Плавающие UI-контролы 3D-сцены: переключатели стилей стен/пола, теней,
 * кнопки сброса камеры, скриншота PNG, и подсказка с управлением мышью.
 * Логика и стили 1:1 перенесены из PlanScene3D.tsx без изменений.
 */
export default function Scene3DControls({
  wallStyle, setWallStyle,
  floorStyle, setFloorStyle,
  showShadows, setShowShadows,
  resetCamera, screenshot,
}: Props) {
  return (
    <>
      {/* Плавающая панель управления */}
      <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-md border border-border rounded-xl p-2 flex items-center gap-1.5 flex-wrap text-xs shadow-lg">
        <select value={wallStyle} onChange={(e) => setWallStyle(e.target.value as WallStyle)}
                className="bg-secondary border border-border rounded px-2 py-1 text-xs">
          <option value="white">Стены: белые</option>
          <option value="warm">Стены: тёплые</option>
          <option value="concrete">Стены: бетон</option>
        </select>
        <select value={floorStyle} onChange={(e) => setFloorStyle(e.target.value as FloorStyle)}
                className="bg-secondary border border-border rounded px-2 py-1 text-xs">
          <option value="parquet">Пол: паркет</option>
          <option value="tile">Пол: плитка</option>
          <option value="concrete">Пол: бетон</option>
        </select>
        <button onClick={() => setShowShadows((v) => !v)} title="Тени"
                className={`p-1.5 rounded ${showShadows ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
          <Icon name="Moon" size={12} />
        </button>
        <button onClick={resetCamera} title="Сбросить камеру"
                className="p-1.5 rounded bg-secondary hover:bg-secondary/70">
          <Icon name="RotateCcw" size={12} />
        </button>
        <button onClick={screenshot} title="Скриншот PNG"
                className="p-1.5 rounded bg-secondary hover:bg-secondary/70">
          <Icon name="Camera" size={12} />
        </button>
      </div>

      {/* Подсказка */}
      <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-[11px] text-white pointer-events-none flex items-center gap-3 flex-wrap">
        <span><b>ЛКМ</b> — поворот</span>
        <span><b>ПКМ</b> — пан</span>
        <span><b>Колесо</b> — зум</span>
      </div>
    </>
  );
}
