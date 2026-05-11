import Icon from "@/components/ui/icon";
import type { PoseResponse } from "@/lib/poseToFloorPlan";
import PoseTopView from "./PoseTopView";
import { sideRu, labelRoomType } from "./labels";

/**
 * Блок результата распознавания: шапка с габаритами/кнопкой «Применить»,
 * SVG-вид сверху, легенда и сворачиваемый список объектов.
 */
interface Props {
  pose: PoseResponse;
  onApply: () => void;
}

export default function PoseResult({ pose, onApply }: Props) {
  const { room, openings, furniture } = pose;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Распознанная планировка
          </p>
          <p className="text-sm text-foreground mt-1">
            <span className="font-bold">{room.width_cm}</span> × <span className="font-bold">{room.depth_cm}</span> см
            <span className="text-muted-foreground"> · потолок {room.height_cm} см</span>
            <span className="text-muted-foreground"> · {labelRoomType(pose.room_type)}</span>
          </p>
        </div>
        <button
          onClick={onApply}
          className="bg-primary text-primary-foreground font-bold text-sm py-2.5 px-5 rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <Icon name="LayoutGrid" size={15} />
          Применить в Планировщик
        </button>
      </div>

      <PoseTopView pose={pose} />

      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-blue-500 rounded" /> Окно
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-emerald-500 rounded" /> Дверь
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-primary/20 border border-primary rounded-sm" /> Мебель
        </span>
      </div>

      <details className="bg-card border border-border rounded-xl group">
        <summary className="cursor-pointer p-3 flex items-center gap-2 list-none">
          <Icon name="ChevronRight" size={14} className="text-muted-foreground transition-transform group-open:rotate-90" />
          <span className="font-bold text-foreground text-sm">
            Найдено объектов: {furniture.length} мебель + {openings.length} проёмы
          </span>
        </summary>
        <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {furniture.map((f) => (
            <div key={f.id} className="flex items-center gap-2 text-xs bg-secondary/40 rounded-lg p-2">
              <Icon name={f.icon} size={14} className="text-primary shrink-0" />
              <span className="font-bold text-foreground">{f.label}</span>
              <span className="text-muted-foreground font-mono ml-auto">
                {f.width_cm}×{f.depth_cm}
                {f.against_wall ? " · у " + sideRu(f.against_wall) + " стены" : ""}
              </span>
            </div>
          ))}
          {openings.map((op) => (
            <div key={op.id} className="flex items-center gap-2 text-xs bg-secondary/40 rounded-lg p-2">
              <Icon
                name={op.kind === "window" ? "AppWindow" : "DoorOpen"}
                size={14}
                className={op.kind === "window" ? "text-blue-500" : "text-emerald-500"}
              />
              <span className="font-bold text-foreground">
                {op.kind === "window" ? "Окно" : "Дверь"}
              </span>
              <span className="text-muted-foreground font-mono ml-auto">
                {op.width_cm} см · {sideRu(op.wall_side)}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
