import Icon from "@/components/ui/icon";
import type { DetectedObject } from "@/lib/visionStore";
import { BBOX_COLORS, BBOX_FALLBACK } from "./constants";

/**
 * Список найденных объектов. Клик — toggleExclude, ховер — подсветка bbox на превью.
 */
interface Props {
  objects: DetectedObject[];
  excluded: Set<number>;
  onHover: (i: number | null) => void;
  onToggleExclude: (i: number) => void;
}

export default function VisionObjectList({
  objects,
  excluded,
  onHover,
  onToggleExclude,
}: Props) {
  if (objects.length === 0) return null;
  return (
    <div className="card-base p-3 max-h-60 overflow-y-auto">
      <p className="t-meta mb-2">Найденные объекты · клик чтобы исключить</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {objects.map((obj, i) => {
          const isOff = excluded.has(i);
          const color = BBOX_COLORS[obj.type] || BBOX_FALLBACK;
          return (
            <button
              key={i}
              onClick={() => onToggleExclude(i)}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                isOff
                  ? "bg-secondary/30 text-muted-foreground line-through"
                  : "bg-secondary text-foreground hover:bg-secondary/70"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <Icon name={obj.icon} size={12} className="shrink-0" />
              <span className="flex-1 truncate font-bold">{obj.label}</span>
              <span className="text-[10px] font-mono opacity-70">
                {Math.round(obj.confidence * 100)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
