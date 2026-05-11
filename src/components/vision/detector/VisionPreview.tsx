import Icon from "@/components/ui/icon";
import type { DetectedObject } from "@/lib/visionStore";
import { BBOX_COLORS, BBOX_FALLBACK } from "./constants";

/**
 * Превью загруженного фото с наложенными bbox-объектами.
 * Bbox можно «выключить» кликом (excluded), при ховере — подсветка.
 * Во время анализа показывается полупрозрачный оверлей.
 */
interface Props {
  imagePreview: string;
  objects: DetectedObject[] | undefined;
  excluded: Set<number>;
  hoverIdx: number | null;
  analyzing: boolean;
  onHover: (i: number | null) => void;
  onToggleExclude: (i: number) => void;
}

export default function VisionPreview({
  imagePreview,
  objects,
  excluded,
  hoverIdx,
  analyzing,
  onHover,
  onToggleExclude,
}: Props) {
  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-secondary">
      <img src={imagePreview} alt="Фото комнаты" className="w-full h-full object-contain" />

      {objects?.map((obj, i) => {
        const [x, y, w, h] = obj.bbox;
        const color = BBOX_COLORS[obj.type] || BBOX_FALLBACK;
        const isExcluded = excluded.has(i);
        const isHover = hoverIdx === i;
        return (
          <div
            key={i}
            onClick={() => onToggleExclude(i)}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            className="absolute border-2 rounded transition-all cursor-pointer"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: `${w * 100}%`,
              height: `${h * 100}%`,
              borderColor: isExcluded ? "#94a3b8" : color,
              backgroundColor: isHover
                ? `${color}30`
                : isExcluded
                  ? "rgba(148, 163, 184, 0.15)"
                  : "transparent",
              opacity: isExcluded ? 0.4 : 1,
            }}
            title={isExcluded ? "Кликните чтобы вернуть" : "Кликните чтобы исключить"}
          >
            <span
              className="absolute -top-5 left-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              {obj.label}
              <span className="ml-1 opacity-70">{Math.round(obj.confidence * 100)}%</span>
            </span>
          </div>
        );
      })}

      {analyzing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
          <Icon name="ScanSearch" size={28} className="text-primary animate-pulse" />
          <p className="text-sm font-bold text-foreground">Распознаю объекты…</p>
          <p className="text-xs text-muted-foreground">Обычно 5-10 секунд</p>
        </div>
      )}
    </div>
  );
}